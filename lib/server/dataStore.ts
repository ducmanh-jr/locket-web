import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// In-Memory Fallback Cache for local dev without Docker Services
let localMemoryMoments: any[] = [];
let localMemoryProfiles: any[] = [];
const localDeletedMemberIds = new Set<string>();
const localDeletedMomentIds = new Set<string>();

// Dynamic imports / lazy initialization for pg & ioredis
let redisClient: any = null;
let pgPoolClient: any = null;

// Safe runtime require helper that prevents Webpack static resolution warnings
function dynamicRequire(moduleName: string) {
  try {
    const reqFunc = eval('require');
    return reqFunc(moduleName);
  } catch (e) {
    return null;
  }
}

async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redisClient) {
    try {
      const Redis = dynamicRequire('ioredis');
      if (!Redis) return null;
      const RedisClass = Redis.default || Redis;
      redisClient = new RedisClass(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
      await redisClient.connect();
    } catch (e) {
      console.warn('[DataStore] Redis connection failed, falling back to database/memory:', e);
      redisClient = null;
    }
  }
  return redisClient;
}

async function getPgPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pgPoolClient) {
    try {
      const pgModule = dynamicRequire('pg');
      if (!pgModule || !pgModule.Pool) return null;
      const { Pool } = pgModule;
      pgPoolClient = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
      });
    } catch (e) {
      console.warn('[DataStore] PostgreSQL connection failed, falling back to Supabase/memory:', e);
      pgPoolClient = null;
    }
  }
  return pgPoolClient;
}

export interface DataStoreFeedResult {
  moments: any[];
  profiles: any[];
  deleted_member_ids: string[];
  deleted_moment_ids: string[];
}

export async function getActiveFeed(limit: number = 300): Promise<DataStoreFeedResult> {
  const pool = await getPgPool();
  const redis = await getRedis();

  // Option 1: Docker PostgreSQL & Redis Stack
  if (pool) {
    try {
      // 1. Try Redis Cache first (< 2ms)
      if (redis) {
        try {
          const cachedRaw = await redis.zrevrange('locket:feed', 0, limit - 1);
          const cachedDeletedMoments = await redis.smembers('locket:deleted_moments');
          const cachedDeletedMembers = await redis.smembers('locket:deleted_members');

          if (cachedRaw && cachedRaw.length > 0) {
            const moments = cachedRaw.map((item: string) => JSON.parse(item));
            return {
              moments,
              profiles: [],
              deleted_member_ids: cachedDeletedMembers || [],
              deleted_moment_ids: cachedDeletedMoments || [],
            };
          }
        } catch (e) {}
      }

      // 2. Query PostgreSQL with Soft Delete filter
      const client = await pool.connect();
      try {
        const deletedLedgerRes = await client.query('SELECT entity_type, entity_id FROM deleted_ledger');
        const deletedMoments = new Set<string>();
        const deletedMembers = new Set<string>();
        deletedLedgerRes.rows.forEach((row: any) => {
          if (row.entity_type === 'moment') deletedMoments.add(row.entity_id);
          if (row.entity_type === 'member') deletedMembers.add(row.entity_id);
        });

        const profsRes = await client.query(
          'SELECT id, username, display_name, avatar_url FROM profiles LIMIT 200'
        );
        const profilesMap = new Map();
        profsRes.rows.forEach((p: any) => {
          if (!deletedMembers.has(p.id)) profilesMap.set(p.id, p);
        });

        const momentsRes = await client.query(
          `SELECT m.*, row_to_json(p.*) as sender 
           FROM moments m 
           LEFT JOIN profiles p ON m.sender_id = p.id 
           WHERE m.deleted_at IS NULL 
           ORDER BY m.created_at DESC 
           LIMIT $1`,
          [limit]
        );

        const moments = momentsRes.rows.filter(
          (m: any) => m && m.id && !deletedMoments.has(m.id) && !deletedMembers.has(m.sender_id)
        );

        // Warm Redis Cache
        if (redis && moments.length > 0) {
          try {
            const pipeline = redis.pipeline();
            moments.forEach((m: any) => {
              const score = new Date(m.created_at || Date.now()).getTime();
              pipeline.zadd('locket:feed', score, JSON.stringify(m));
            });
            await pipeline.exec();
          } catch (e) {}
        }

        return {
          moments,
          profiles: Array.from(profilesMap.values()),
          deleted_member_ids: Array.from(deletedMembers),
          deleted_moment_ids: Array.from(deletedMoments),
        };
      } finally {
        client.release();
      }
    } catch (dbErr) {
      console.warn('[DataStore] PostgreSQL query error, falling back:', dbErr);
    }
  }

  // Option 2: Supabase Live Fallback
  if (isSupabaseConfigured()) {
    try {
      const { data: dbProfiles } = await supabase.from('profiles').select('*').limit(200);
      const { data: rawMoments } = await supabase
        .from('moments')
        .select('id, sender_id, caption, media_url, media_type, created_at, thumbnail_url')
        .order('created_at', { ascending: false })
        .limit(limit);

      const profilesMap = new Map();
      (dbProfiles || []).forEach((p: any) => {
        if (p && p.id && !localDeletedMemberIds.has(p.id) && p.display_name !== '__DELETED_MEMBER__') {
          profilesMap.set(p.id, p);
        }
      });

      const sanitizedMoments = (rawMoments || [])
        .filter(
          (m: any) =>
            m &&
            m.id &&
            Boolean(m.media_url || m.thumbnail_url) &&
            !localDeletedMomentIds.has(m.id) &&
            !localDeletedMemberIds.has(m.sender_id) &&
            m.caption !== '__DELETED_MOMENT__'
        )
        .map((m: any) => ({
          ...m,
          media_url: m.media_url || m.thumbnail_url,
          sender: m.sender || profilesMap.get(m.sender_id) || {
            id: m.sender_id,
            username: `user_${String(m.sender_id).substring(0, 6)}`,
            display_name: 'Thành viên Locket',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.sender_id}`,
          },
        }));

      return {
        moments: sanitizedMoments,
        profiles: Array.from(profilesMap.values()),
        deleted_member_ids: Array.from(localDeletedMemberIds),
        deleted_moment_ids: Array.from(localDeletedMomentIds),
      };
    } catch (sbErr) {}
  }

  // Option 3: In-Memory Fallback
  return {
    moments: localMemoryMoments.filter(
      (m) => !localDeletedMomentIds.has(m.id) && !localDeletedMemberIds.has(m.sender_id)
    ),
    profiles: localMemoryProfiles.filter((p) => !localDeletedMemberIds.has(p.id)),
    deleted_member_ids: Array.from(localDeletedMemberIds),
    deleted_moment_ids: Array.from(localDeletedMomentIds),
  };
}

export async function pushProfileToStore(profile: any, isFreshLogin: boolean = false): Promise<boolean> {
  if (!profile || !profile.id) return false;

  const pool = await getPgPool();
  const redis = await getRedis();

  if (isFreshLogin) {
    localDeletedMemberIds.delete(profile.id);
    if (redis) {
      try {
        await redis.srem('locket:deleted_members', profile.id);
      } catch (e) {}
    }
  }

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (isFreshLogin) {
        await client.query("DELETE FROM deleted_ledger WHERE entity_id = $1 AND entity_type = 'member'", [profile.id]);
      } else {
        const checkLedger = await client.query(
          "SELECT entity_id FROM deleted_ledger WHERE entity_id = $1 AND entity_type = 'member'",
          [profile.id]
        );
        if (checkLedger.rows.length > 0) {
          await client.query('ROLLBACK');
          return false;
        }
      }

      await client.query(
        `INSERT INTO profiles (id, username, display_name, avatar_url, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET
           username = EXCLUDED.username,
           display_name = EXCLUDED.display_name,
           avatar_url = EXCLUDED.avatar_url,
           updated_at = NOW()`,
        [profile.id, profile.username || `user_${profile.id.substring(0, 6)}`, profile.display_name || 'Thành viên Locket', profile.avatar_url || '']
      );

      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('profiles').upsert({
        id: profile.id,
        username: profile.username || `user_${profile.id.substring(0, 6)}`,
        display_name: profile.display_name || 'Thành viên Locket',
        avatar_url: profile.avatar_url || '',
      });
    } catch (e) {}
  }

  localMemoryProfiles = [profile, ...localMemoryProfiles.filter((p) => p.id !== profile.id)];
  return true;
}

export async function pushMomentToStore(moment: any): Promise<boolean> {
  if (!moment || !moment.id) return false;

  const senderId = moment.sender_id || moment.sender?.id;
  const pool = await getPgPool();
  const redis = await getRedis();

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ANTI-RESURRECTION CHECK: Block if moment or sender in deleted_ledger
      const checkLedger = await client.query(
        `SELECT entity_id FROM deleted_ledger WHERE entity_id IN ($1, $2)`,
        [moment.id, senderId]
      );
      if (checkLedger.rows.length > 0) {
        await client.query('ROLLBACK');
        return false;
      }

      // Upsert sender profile if provided
      if (senderId && moment.sender) {
        await client.query(
          `INSERT INTO profiles (id, username, display_name, avatar_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             display_name = EXCLUDED.display_name,
             avatar_url = EXCLUDED.avatar_url`,
          [
            senderId,
            moment.sender.username || `user_${senderId.substring(0, 6)}`,
            moment.sender.display_name || 'Thành viên Locket',
            moment.sender.avatar_url || '',
          ]
        );
      }

      await client.query(
        `INSERT INTO moments (id, sender_id, media_url, media_type, caption, thumbnail_url, audio_option, music_json, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           media_url = EXCLUDED.media_url,
           caption = EXCLUDED.caption,
           thumbnail_url = EXCLUDED.thumbnail_url`,
        [
          moment.id,
          senderId,
          moment.media_url,
          moment.media_type || 'photo',
          moment.caption || '',
          moment.thumbnail_url || null,
          moment.audio_option || 'original',
          moment.music ? JSON.stringify(moment.music) : null,
          moment.created_at || new Date().toISOString(),
        ]
      );

      await client.query('COMMIT');

      // Update Redis Cache & Publish Event for WebSockets
      if (redis) {
        try {
          const score = new Date(moment.created_at || Date.now()).getTime();
          await redis.zadd('locket:feed', score, JSON.stringify(moment));
          await redis.publish('locket:events', JSON.stringify({ type: 'MOMENT_CREATED', payload: moment }));
        } catch (e) {}
      }

      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      return false;
    } finally {
      client.release();
    }
  }

  if (isSupabaseConfigured() && senderId && !localDeletedMemberIds.has(senderId) && !localDeletedMomentIds.has(moment.id)) {
    try {
      const senderObj: any = moment.sender || {};
      await supabase.from('profiles').upsert({
        id: senderId,
        username: senderObj.username || `user_${senderId.substring(0, 6)}`,
        display_name: senderObj.display_name || 'Thành viên Locket',
        avatar_url: senderObj.avatar_url || '',
      });

      await supabase.from('moments').upsert({
        id: moment.id,
        sender_id: senderId,
        media_url: moment.media_url,
        thumbnail_url: moment.thumbnail_url || null,
        media_type: moment.media_type || 'photo',
        audio_option: moment.audio_option || null,
        caption: moment.caption || '',
        music: moment.music || null,
        created_at: moment.created_at || new Date().toISOString(),
      });

      if (redis) {
        try { await redis.del('locket:feed'); } catch (e) {}
      }
      return true;
    } catch (e) {}
  }

  localMemoryMoments = [moment, ...localMemoryMoments.filter((m) => m.id !== moment.id)];
  if (redis) {
    try { await redis.del('locket:feed'); } catch (e) {}
  }
  return true;
}

export async function deleteMomentFromStore(momentId: string): Promise<boolean> {
  if (!momentId) return false;

  localDeletedMomentIds.add(momentId);
  localDeletedMomentIds.add(`del_moment_${momentId}`);

  const pool = await getPgPool();
  const redis = await getRedis();

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE moments SET deleted_at = NOW() WHERE id = $1`, [momentId]);
      await client.query(
        `INSERT INTO deleted_ledger (entity_type, entity_id) VALUES ('moment', $1) ON CONFLICT DO NOTHING`,
        [momentId]
      );
      await client.query('COMMIT');

      if (redis) {
        try {
          await redis.sadd('locket:deleted_moments', momentId);
          await redis.del('locket:feed');
          await redis.publish('locket:events', JSON.stringify({ type: 'MOMENT_DELETED', payload: { id: momentId } }));
        } catch (e) {}
      }

      return true;
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('moments').delete().eq('id', momentId);
      await supabase.from('moments').upsert({
        id: `del_moment_${momentId}`,
        sender_id: 'deleted',
        caption: '__DELETED_MOMENT__',
        media_url: 'https://deleted.invalid/placeholder.png',
        created_at: new Date().toISOString(),
      });
      if (redis) {
        try { await redis.del('locket:feed'); } catch (e) {}
      }
    } catch (e) {}
  }

  localMemoryMoments = localMemoryMoments.filter((m) => m.id !== momentId);
  if (redis) {
    try { await redis.del('locket:feed'); } catch (e) {}
  }
  return true;
}

export async function deleteMemberFromStore(memberId: string): Promise<boolean> {
  if (!memberId) return false;

  localDeletedMemberIds.add(memberId);

  const pool = await getPgPool();
  const redis = await getRedis();

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE moments SET deleted_at = NOW() WHERE sender_id = $1`, [memberId]);
      await client.query(`DELETE FROM profiles WHERE id = $1`, [memberId]);
      await client.query(
        `INSERT INTO deleted_ledger (entity_type, entity_id) VALUES ('member', $1) ON CONFLICT DO NOTHING`,
        [memberId]
      );
      await client.query('COMMIT');

      if (redis) {
        try {
          await redis.sadd('locket:deleted_members', memberId);
        } catch (e) {}
      }

      return true;
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('reactions').delete().eq('user_id', memberId);
      await supabase.from('moments').delete().eq('sender_id', memberId);
      await supabase.from('profiles').delete().eq('id', memberId);
    } catch (e) {}
  }

  localMemoryProfiles = localMemoryProfiles.filter((p) => p.id !== memberId);
  localMemoryMoments = localMemoryMoments.filter((m) => m.sender_id !== memberId && m.sender?.id !== memberId);

  return true;
}

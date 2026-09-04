'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface DiagCheck {
  status: 'ok' | 'error' | 'warn' | 'skip';
  latencyMs?: number;
  message: string;
  data?: any;
}

interface DebugReport {
  generatedAt: string;
  totalDiagTime: string;
  checks: {
    supabaseConnection: DiagCheck;
    momentsStats: DiagCheck;
    profilesStats: DiagCheck;
    storageBucket: DiagCheck;
    environment: DiagCheck;
  };
}

type LogLine = { text: string; color?: string; bold?: boolean; indent?: number };

type ActivityLog = {
  time: string;
  type: 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR';
  text: string;
  durationMs?: number;
};

export default function DebugTerminal() {
  const [mounted, setMounted] = useState(false);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [cmdInput, setCmdInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [autoScan, setAutoScan] = useState(false);
  const [lastReport, setLastReport] = useState<DebugReport | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    { time: '03:20:00.120', type: 'SYS', text: '▲ Next.js 14.2.35' },
    { time: '03:20:00.125', type: 'SYS', text: '- Local: http://localhost:3000' },
    { time: '03:20:00.130', type: 'SYS', text: '- Environment: .env.local' },
    { time: '03:20:00.135', type: 'SYS', text: '✓ Ready in 2.6s', durationMs: 2600 },
    { time: '03:20:00.316', type: 'HTTP', text: 'GET /debug 200', durationMs: 181 },
    { time: '03:20:00.653', type: 'HTTP', text: 'GET /api/debug 200', durationMs: 337 },
  ]);

  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addActivityLog = useCallback((type: 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR', text: string, durationMs?: number) => {
    const now = new Date();
    const time = now.toLocaleTimeString('vi-VN', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
    setActivityLogs(prev => [
      ...prev.slice(-150),
      { time, type, text, durationMs }
    ]);
    setTimeout(() => {
      if (activityRef.current) {
        activityRef.current.scrollTop = activityRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
    }, 50);
  };

  const pushLines = useCallback((newLines: LogLine[]) => {
    setLines(prev => [...prev, ...newLines]);
    scrollToBottom();
  }, []);

  const pushLine = useCallback((text: string, color?: string, bold?: boolean, indent?: number) => {
    setLines(prev => [...prev, { text, color, bold, indent }]);
    scrollToBottom();
  }, []);

  const clearTerminal = useCallback(() => {
    setLines([]);
  }, []);

  // Boot sequence
  useEffect(() => {
    if (!mounted) return;
    const boot: LogLine[] = [
      { text: '', color: '#34D399' },
      { text: '  ██╗      ██████╗  ██████╗██╗  ██╗███████╗████████╗', color: '#D9266E', bold: true },
      { text: '  ██║     ██╔═══██╗██╔════╝██║ ██╔╝██╔════╝╚══██╔══╝', color: '#D9266E', bold: true },
      { text: '  ██║     ██║   ██║██║     █████╔╝ █████╗     ██║', color: '#E84393', bold: true },
      { text: '  ██║     ██║   ██║██║     ██╔═██╗ ██╔══╝     ██║', color: '#E84393', bold: true },
      { text: '  ███████╗╚██████╔╝╚██████╗██║  ██╗███████╗   ██║', color: '#FF6B9D', bold: true },
      { text: '  ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝', color: '#FF6B9D', bold: true },
      { text: '' },
      { text: '  LOCKETWEB CLI CHẨN ĐOÁN HỆ THỐNG v3.0', color: '#D9266E', bold: true },
      { text: '  ─────────────────────────────────────────────────────────', color: '#333' },
      { text: `  Hệ thống khởi tạo lúc: ${new Date().toLocaleString('vi-VN')}`, color: '#666' },
      { text: '  Gõ "help" hoặc nhấp các nút lệnh phía dưới để thao tác', color: '#666' },
      { text: '' },
    ];
    setLines(boot);
    // Auto-run scan on load
    setTimeout(() => runScan(pushLine, pushLines, setLoading, setLastReport, addActivityLog), 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Continuous Auto-Scan (Live Monitor)
  useEffect(() => {
    if (!autoScan || !mounted) return;
    pushLine('  [THÔNG TIN] Chế độ Live Monitor đang hoạt động (tự động quét 10s/lần)...', '#34D399');
    addActivityLog('SYS', 'Chế độ Live Monitor đang hoạt động (tự động quét 10s/lần)');
    const interval = setInterval(() => {
      runScan(pushLine, pushLines, setLoading, setLastReport, addActivityLog);
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScan, mounted]);

  const copyAiReport = async () => {
    addActivityLog('CMD', '> Thực thi: Sao chép báo cáo AI (copy)');
    let report = lastReport;
    if (!report) {
      pushLine('  [THÔNG TIN] Đang lấy dữ liệu chẩn đoán mới nhất cho báo cáo AI...', '#FBBF24');
      report = await fetchReport(addActivityLog);
      if (report) setLastReport(report);
    }

    if (!report) {
      addActivityLog('ERR', 'Sao chép thất bại: Không lấy được báo cáo từ /api/debug');
      pushLine('  [LỖI] Không thể kết nối đến API /api/debug', '#F87171');
      return;
    }

    const checks = report.checks;
    const errors: string[] = [];
    Object.entries(checks).forEach(([key, val]) => {
      if (val.status === 'error' || val.status === 'warn') {
        errors.push(`- [${key.toUpperCase()}]: ${val.message}`);
      }
    });

    const aiMarkdown = `# BÁO CÁO CHẨN ĐOÁN LỖI LOCKETWEB (AI BUG REPORT)
> Dán báo cáo này vào khung chat với AI để được hỗ trợ tự động tìm nguyên nhân và sửa lỗi.

- Thời gian tạo: ${new Date(report.generatedAt).toLocaleString('vi-VN')}
- Thời gian phản hồi: ${report.totalDiagTime}
- Trạng thái hệ thống: ${errors.length > 0 ? 'LỖI NGHIÊM TRỌNG / DỊCH VỤ NGHẼN' : 'KHỎE MẠNH'}
- Môi trường Server: Node ${checks.environment?.data?.nodeVersion} | Hệ điều hành: ${checks.environment?.data?.platform} | RAM RSS: ${checks.environment?.data?.memoryUsage?.rss} | Thời gian chạy: ${checks.environment?.data?.uptime}

---

## BẢNG CHẨN ĐOÁN SỨC KHỎE DỊCH VỤ
| Dịch vụ | Trạng thái | Độ trễ | Chi tiết thông báo / Lỗi |
|---|---|---|---|
| Supabase DB | ${checks.supabaseConnection?.status === 'ok' ? 'THÀNH CÔNG' : 'LỖI'} | ${checks.supabaseConnection?.latencyMs || 0}ms | ${checks.supabaseConnection?.message} |
| Storage Bucket | ${checks.storageBucket?.status === 'ok' ? 'THÀNH CÔNG' : 'LỖI'} | ${checks.storageBucket?.latencyMs || 0}ms | ${checks.storageBucket?.message} |
| Bảng Moments | ${checks.momentsStats?.status === 'ok' ? 'THÀNH CÔNG' : 'LỖI'} | ${checks.momentsStats?.latencyMs || 0}ms | ${checks.momentsStats?.message} |
| Bảng Profiles | ${checks.profilesStats?.status === 'ok' ? 'THÀNH CÔNG' : 'LỖI'} | ${checks.profilesStats?.latencyMs || 0}ms | ${checks.profilesStats?.message} |
| Môi trường Server | ${checks.environment?.status === 'ok' ? 'THÀNH CÔNG' : 'LỖI'} | 0ms | Supabase URL: ${checks.environment?.data?.supabaseUrl} |

---

## DANH SÁCH LỖI VÀ CẢNH BÁO PHÁT HIỆN (${errors.length})
${errors.length > 0 ? errors.join('\n') : 'Không có lỗi.'}

---

## THÔNG SỐ DỮ LIỆU KHOẢNH KHẮC (MOMENTS)
\`\`\`json
${JSON.stringify(checks.momentsStats?.data || {}, null, 2)}
\`\`\`

---

## BIẾN MÔI TRƯỜNG (ENV)
- Supabase URL: \`${checks.environment?.data?.supabaseUrl}\`
- Anon Key: \`${checks.environment?.data?.hasAnonKey}\`
- Redis URL: \`${checks.environment?.data?.hasRedisUrl}\`

---

YÊU CẦU CHO AI ASSISTANT:
Dựa trên báo cáo chẩn đoán ở trên, hãy:
1. Phân tích nguyên nhân gốc rễ (Root Cause) giải thích tại sao dịch vụ bị lỗi/timeout.
2. Đưa ra hướng giải quyết cụ thể (viết code chỉnh sửa hoặc lệnh cấu hình Supabase SQL/Indexes).`;

    try {
      await navigator.clipboard.writeText(aiMarkdown);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
      addActivityLog('SYS', 'Đã sao chép Báo cáo Bug AI vào Clipboard!');
      pushLine('  [THÀNH CÔNG] Đã sao chép Báo cáo Bug AI vào Clipboard!', '#34D399', true);
      pushLine('  [THÔNG TIN] Nhấn Ctrl+V trong khung chat với AI để dán báo cáo.', '#FBBF24');
      pushLine('');
    } catch (e: any) {
      addActivityLog('ERR', `Sao chép thất bại: ${e?.message}`);
      pushLine(`  [LỖI] Sao chép thất bại: ${e?.message}`, '#F87171');
    }
  };

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    setCmdHistory(prev => [cmd, ...prev.slice(0, 50)]);
    setHistoryIdx(-1);
    pushLine(`$ ${cmd}`, '#A78BFA');
    addActivityLog('CMD', `> Gõ lệnh: ${cmd}`);

    switch (trimmed) {
      case 'help':
        addActivityLog('SYS', 'Hiển thị trợ giúp danh sách câu lệnh');
        printHelp(pushLines);
        break;
      case 'scan':
      case 'health':
      case 'check':
        await runScan(pushLine, pushLines, setLoading, setLastReport, addActivityLog);
        break;
      case 'moments':
        await runMomentsDetail(pushLine, pushLines, setLoading, addActivityLog);
        break;
      case 'profiles':
        await runProfilesDetail(pushLine, pushLines, setLoading, addActivityLog);
        break;
      case 'purge':
        await runPurge(pushLine, pushLines, setLoading, addActivityLog);
        break;
      case 'env':
        await runEnvCheck(pushLine, pushLines, setLoading, addActivityLog);
        break;
      case 'copy':
      case 'ai':
        await copyAiReport();
        break;
      case 'live':
      case 'monitor':
        setAutoScan(prev => {
          const next = !prev;
          pushLine(`  📡 Chế độ Live Monitor: ${next ? 'ĐÃ BẬT (10s/lần)' : 'ĐÃ TẮT'}`, next ? '#34D399' : '#F87171', true);
          addActivityLog('SYS', `Chế độ Live Monitor: ${next ? 'ĐÃ BẬT (10s/lần)' : 'ĐÃ TẮT'}`);
          return next;
        });
        break;
      case 'clear':
      case 'cls':
        addActivityLog('SYS', 'Đã xóa màn hình dòng lệnh');
        clearTerminal();
        break;
      case 'export':
        await runExport(pushLine, pushLines, setLoading, addActivityLog);
        break;
      case 'backup':
        await runBackup(pushLine, pushLines, setLoading, addActivityLog);
        break;
      case 'supabase':
        addActivityLog('SYS', 'Mở Supabase Dashboard trong tab mới');
        pushLine('  ↗ Đang mở Supabase Dashboard...', '#34D399');
        window.open('https://supabase.com/dashboard/project/zrvoevcwnrdegbwzaexc', '_blank');
        pushLine('');
        break;
      default:
        addActivityLog('ERR', `Lệnh không hợp lệ: "${trimmed}"`);
        pushLine(`  ✗ Lệnh không hợp lệ: "${trimmed}"`, '#F87171');
        pushLine('  Gõ "help" để xem danh sách lệnh', '#666');
        pushLine('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(cmdInput);
      setCmdInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
        setHistoryIdx(newIdx);
        setCmdInput(cmdHistory[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setCmdInput(cmdHistory[newIdx]);
      } else {
        setHistoryIdx(-1);
        setCmdInput('');
      }
    }
  };

  if (!mounted) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0c0c0c' }} />
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0c0c0c',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
        overflow: 'hidden',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div style={{
        height: '36px',
        background: '#1a1a2e',
        borderBottom: '1px solid #D9266E44',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: '8px',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        <div style={{ display: 'flex', gap: '7px' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
        </div>
        <span style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: '#888', letterSpacing: '1px' }}>
          locket-debug — bash — DUAL PANE REALTIME LOGS
        </span>
        <a href="/" style={{ fontSize: '11px', color: '#D9266E', textDecoration: 'none' }}>← App</a>
      </div>

      {/* DUAL PANE MAIN CONTAINER */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT PANE: Terminal output */}
        <div
          ref={termRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '12px 16px',
            lineHeight: '1.65',
            fontSize: '13px',
          }}
        >
          {lines.map((line, i) => (
            <div key={i} style={{
              color: line.color || '#ccc',
              fontWeight: line.bold ? 700 : 400,
              paddingLeft: line.indent ? `${line.indent * 16}px` : undefined,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {line.text || '\u00A0'}
            </div>
          ))}
          {loading && (
            <div style={{ color: '#FBBF24' }}>
              <span className="blink">⣾</span> Đang xử lý...
            </div>
          )}
        </div>

        {/* RIGHT PANE: Live Execution Log Stream */}
        <div
          style={{
            width: '380px',
            borderLeft: '1px solid #ffffff15',
            background: '#09080e',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {/* Right Header */}
          <div style={{
            height: '32px',
            background: '#120e1c',
            borderBottom: '1px solid #ffffff10',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: '#A78BFA',
            userSelect: 'none',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              LOG TIẾN TRÌNH THỰC THI (REALTIME)
            </span>
            <span style={{ color: '#34D399', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
              LIVE
            </span>
          </div>

          {/* Logs Stream */}
          <div
            ref={activityRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 12px',
              fontSize: '11px',
              fontFamily: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {activityLogs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: '1.45' }}>
                <span style={{ color: '#666', fontSize: '10px', flexShrink: 0, paddingTop: '1px', fontFamily: 'monospace' }}>{log.time}</span>
                <span style={{
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: 700,
                  flexShrink: 0,
                  background: log.type === 'CMD' ? '#8B5CF622' : log.type === 'HTTP' ? '#3B82F622' : log.type === 'DB' ? '#10B98122' : log.type === 'ERR' ? '#EF444422' : '#F59E0B22',
                  color: log.type === 'CMD' ? '#C084FC' : log.type === 'HTTP' ? '#60A5FA' : log.type === 'DB' ? '#34D399' : log.type === 'ERR' ? '#F87171' : '#FBBF24',
                  border: `1px solid ${log.type === 'CMD' ? '#8B5CF644' : log.type === 'HTTP' ? '#3B82F644' : log.type === 'DB' ? '#10B98144' : log.type === 'ERR' ? '#EF444444' : '#F59E0B44'}`,
                }}>
                  {log.type}
                </span>
                <span style={{
                  color: log.type === 'ERR' ? '#F87171' : log.type === 'CMD' ? '#E9D5FF' : '#D1D5DB',
                  wordBreak: 'break-word',
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}>
                  <span>{log.text}</span>
                  {log.durationMs !== undefined && (
                    <span style={{
                      padding: '0 4px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontWeight: 600,
                      background: '#ffffff0d',
                      color: log.durationMs > 1000 ? '#FBBF24' : '#34D399',
                      border: '1px solid #ffffff18',
                      fontFamily: 'monospace',
                    }}>
                      {log.durationMs < 1000 ? `${log.durationMs}ms` : `${(log.durationMs / 1000).toFixed(2)}s`}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Toolbar */}
      <div style={{
        borderTop: '1px solid #D9266E33',
        background: '#161224',
        padding: '8px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        alignItems: 'center',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        <span style={{ fontSize: '11px', color: '#888', fontWeight: 600, marginRight: '4px' }}>THAO TÁC:</span>
        
        {/* Compact SVG Copy Icon Button */}
        <button
          title="Sao chép Báo cáo Bug cho AI"
          disabled={loading}
          onClick={(e) => {
            e.stopPropagation();
            copyAiReport();
          }}
          style={{
            background: '#D9266E22',
            color: '#FF6B9D',
            border: '1px solid #D9266E88',
            borderRadius: '4px',
            padding: '5px 9px',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            if (!loading) e.currentTarget.style.background = '#D9266E44';
          }}
          onMouseOut={(e) => {
            if (!loading) e.currentTarget.style.background = '#D9266E22';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>

        {/* Live Monitor Toggle Button */}
        <button
          disabled={loading}
          onClick={(e) => {
            e.stopPropagation();
            handleCommand('live');
          }}
          style={{
            background: autoScan ? '#064E3B44' : '#1F293744',
            color: autoScan ? '#34D399' : '#9CA3AF',
            border: `1px solid ${autoScan ? '#10B98166' : '#4B556366'}`,
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease',
          }}
        >
          {autoScan ? '[ LIVE: BẬT ]' : '[ LIVE: TẮT ]'}
        </button>

        {[
          { label: '[ QUÉT ]', cmd: 'scan', color: '#34D399', bg: '#064E3B44', border: '#10B98166' },
          { label: '[ KHOẢNH KHẮC ]', cmd: 'moments', color: '#60A5FA', bg: '#1E3A8A44', border: '#3B82F666' },
          { label: '[ TÀI KHOẢN ]', cmd: 'profiles', color: '#A78BFA', bg: '#4C1D9544', border: '#8B5CF666' },
          { label: '[ DỌN RÁC ]', cmd: 'purge', color: '#F87171', bg: '#7F1D1D44', border: '#EF444466' },
          { label: '[ SAO LƯU ]', cmd: 'backup', color: '#FBBF24', bg: '#78350F44', border: '#F59E0B66' },
          { label: '[ MÔI TRƯỜNG ]', cmd: 'env', color: '#C084FC', bg: '#581C8744', border: '#A855F766' },
          { label: '[ SUPABASE ]', cmd: 'supabase', color: '#38BDF8', bg: '#0C4A6E44', border: '#0EA5E966' },
          { label: '[ XUẤT JSON ]', cmd: 'export', color: '#F472B6', bg: '#83184344', border: '#EC489966' },
          { label: '[ XÓA MÀN HÌNH ]', cmd: 'clear', color: '#9CA3AF', bg: '#1F293744', border: '#4B556366' },
          { label: '[ TRỢ GIÚP ]', cmd: 'help', color: '#E5E7EB', bg: '#37415144', border: '#6B728066' },
        ].map((btn) => (
          <button
            key={btn.cmd}
            disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              handleCommand(btn.cmd);
            }}
            style={{
              background: btn.bg,
              color: btn.color,
              border: `1px solid ${btn.border}`,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
              opacity: loading ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${btn.border}`;
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Copied Toast Notification */}
      {copiedToast && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          right: '24px',
          background: '#10B981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '13px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>📋</span> Đã sao chép báo cáo Bug chuẩn định dạng AI vào Clipboard!
        </div>
      )}

      {/* Command input */}
      <div style={{
        borderTop: '1px solid #ffffff10',
        background: '#0d0d12',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
      }}>
        <span style={{ color: '#D9266E', fontWeight: 700, fontSize: '13px' }}>❯</span>
        <input
          ref={inputRef}
          value={cmdInput}
          onChange={(e) => setCmdInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder={loading ? 'Đang xử lý...' : 'Nhấp nút phía trên hoặc gõ lệnh... (help để xem danh sách)'}
          autoFocus
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#e0e0e0',
            fontSize: '13px',
            fontFamily: 'inherit',
            caretColor: '#D9266E',
          }}
        />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #D9266E44; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #D9266E88; }
          .blink { animation: blink-anim 0.8s linear infinite; }
          @keyframes blink-anim {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
        `
      }} />
    </div>
  );
}

/* ===================== COMMAND HANDLERS ===================== */

function printHelp(pushLines: (lines: LogLine[]) => void) {
  pushLines([
    { text: '' },
    { text: '  ╔════════════════════════════════════════════════════════╗', color: '#D9266E' },
    { text: '  ║        LOCKETWEB DEBUG TERMINAL - DANH SÁCH LỆNH       ║', color: '#D9266E', bold: true },
    { text: '  ╠════════════════════════════════════════════════════════╣', color: '#D9266E' },
    { text: '  ║                                                        ║', color: '#333' },
    { text: '  ║  scan      Quét kiểm tra toàn bộ hệ thống             ║', color: '#34D399' },
    { text: '  ║  moments   Xem chi tiết bảng Khoảnh khắc (Moments)    ║', color: '#34D399' },
    { text: '  ║  profiles  Xem chi tiết bảng Tài khoản (Profiles)      ║', color: '#34D399' },
    { text: '  ║  env       Thông số Server & Biến môi trường           ║', color: '#60A5FA' },
    { text: '  ║  purge     Thực hiện dọn dữ liệu rác trên Supabase     ║', color: '#F87171' },
    { text: '  ║  export    Tải file báo cáo JSON chẩn đoán             ║', color: '#A78BFA' },
    { text: '  ║  backup    Hướng dẫn sao lưu ảnh về máy local         ║', color: '#A78BFA' },
    { text: '  ║  supabase  Mở nhanh Supabase Dashboard                 ║', color: '#FBBF24' },
    { text: '  ║  copy      Sao chép báo cáo bug tối ưu cho AI         ║', color: '#F472B6' },
    { text: '  ║  live      Bật/Tắt chế độ tự động quét (10s/lần)       ║', color: '#34D399' },
    { text: '  ║  clear     Làm sạch màn hình dòng lệnh                ║', color: '#888' },
    { text: '  ║  help      Hiển thị bảng hướng dẫn này                 ║', color: '#888' },
    { text: '  ║                                                        ║', color: '#333' },
    { text: '  ╚════════════════════════════════════════════════════════╝', color: '#D9266E' },
    { text: '' },
  ]);
}

async function fetchReport(addActivityLog?: (type: 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR', text: string, durationMs?: number) => void): Promise<DebugReport | null> {
  const startTime = Date.now();
  if (addActivityLog) addActivityLog('HTTP', 'Gửi request GET /api/debug');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('/api/debug', { cache: 'no-store', signal: controller.signal });
    clearTimeout(timer);
    const elapsed = Date.now() - startTime;
    if (!res.ok) {
      if (addActivityLog) addActivityLog('ERR', `GET /api/debug HTTP ${res.status}`, elapsed);
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (addActivityLog) {
      addActivityLog('HTTP', `GET /api/debug 200 OK`, elapsed);
      addActivityLog('DB', `Supabase Ping: ${data.checks?.supabaseConnection?.status?.toUpperCase()}`, data.checks?.supabaseConnection?.latencyMs || 0);
      addActivityLog('DB', `Storage Bucket: ${data.checks?.storageBucket?.status?.toUpperCase()}`, data.checks?.storageBucket?.latencyMs || 0);
      addActivityLog('DB', `Moments Stats: ${data.checks?.momentsStats?.status?.toUpperCase()}`, data.checks?.momentsStats?.latencyMs || 0);
      addActivityLog('DB', `Profiles Stats: ${data.checks?.profilesStats?.status?.toUpperCase()}`, data.checks?.profilesStats?.latencyMs || 0);
    }
    return data;
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    if (addActivityLog) addActivityLog('ERR', `GET /api/debug thất bại: ${err?.message}`, elapsed);
    return null;
  }
}

function statusIcon(s: string): string {
  return s === 'ok' ? '[OK]' : s === 'error' ? '[LỖI]' : s === 'warn' ? '[CẢNH BÁO]' : '[BỎ QUA]';
}

function statusColor(s: string): string {
  return s === 'ok' ? '#34D399' : s === 'error' ? '#F87171' : s === 'warn' ? '#FBBF24' : '#666';
}

async function runScan(
  pushLine: (t: string, c?: string, b?: boolean) => void,
  pushLines: (l: LogLine[]) => void,
  setLoading: (v: boolean) => void,
  setLastReport?: (r: DebugReport) => void,
  addActivityLog?: (type: 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR', text: string) => void,
) {
  setLoading(true);
  pushLine('  [THÔNG TIN] Đang quét kiểm tra sức khỏe hệ thống...', '#FBBF24');
  pushLine('');
  if (addActivityLog) addActivityLog('SYS', 'Đang thực hiện quét kiểm tra sức khỏe hệ thống...');

  const report = await fetchReport(addActivityLog);

  if (!report) {
    pushLine('  [LỖI] KHÔNG THỂ KẾT NỐI ĐẾN API /api/debug', '#F87171', true);
    pushLine('        Máy chủ có thể đang tắt hoặc không phản hồi.', '#F87171');
    pushLine('');
    if (addActivityLog) addActivityLog('ERR', 'Quét kiểm tra hệ thống thất bại: Không phản hồi');
    setLoading(false);
    return;
  }

  if (setLastReport) setLastReport(report);

  const checks = report.checks;
  const bar = '  ─────────────────────────────────────────────────────────';

  // Overall health
  const hasErr = Object.values(checks).some(c => c.status === 'error');
  const hasWarn = Object.values(checks).some(c => c.status === 'warn');
  const healthLabel = hasErr ? '[TRẠNG THÁI: CÓ LỖI NGHIÊM TRỌNG / DỊCH VỤ NGHẼN]' : hasWarn ? '[TRẠNG THÁI: CÓ CẢNH BÁO]' : '[TRẠNG THÁI: HỆ THỐNG KHỎE MẠNH]';
  const healthColor = hasErr ? '#F87171' : hasWarn ? '#FBBF24' : '#34D399';

  pushLines([
    { text: bar, color: '#333' },
    { text: `  ${healthLabel}`, color: healthColor, bold: true },
    { text: `  Thời gian quét: ${report.totalDiagTime} | Lúc: ${new Date(report.generatedAt).toLocaleString('vi-VN')}`, color: '#666' },
    { text: bar, color: '#333' },
    { text: '' },
  ]);

  // Connection
  const conn = checks.supabaseConnection;
  pushLine(`  ${statusIcon(conn.status)} [Supabase DB]  ${conn.message}${conn.latencyMs ? ` (${conn.latencyMs}ms)` : ''}`, statusColor(conn.status));

  // Storage
  const stor = checks.storageBucket;
  pushLine(`  ${statusIcon(stor.status)} [Storage]      ${stor.message}${stor.latencyMs ? ` (${stor.latencyMs}ms)` : ''}`, statusColor(stor.status));

  // Moments summary
  const mom = checks.momentsStats;
  if (mom.status === 'ok' && mom.data) {
    pushLine(`  ${statusIcon(mom.status)} [Khoảnh khắc]   ${mom.data.totalValid} hợp lệ (${mom.data.validPhotos} ảnh, ${mom.data.validVideos} video) | ${mom.data.junk?.totalJunk || 0} rác | Dòng DB: ${mom.data.totalDbRows}`, statusColor(mom.status));
  } else {
    pushLine(`  ${statusIcon(mom.status)} [Khoảnh khắc]   ${mom.message}`, statusColor(mom.status));
  }

  // Profiles summary
  const prof = checks.profilesStats;
  if (prof.status === 'ok' && prof.data) {
    pushLine(`  ${statusIcon(prof.status)} [Tài khoản]    ${prof.data.activeMembers} hoạt động | ${prof.data.deletedMembers} đã xóa | ${prof.data.withAvatar} có avatar`, statusColor(prof.status));
  } else {
    pushLine(`  ${statusIcon(prof.status)} [Tài khoản]    ${prof.message}`, statusColor(prof.status));
  }

  // Env summary
  const env = checks.environment;
  if (env.data) {
    pushLine(`  ${statusIcon(env.status)} [Máy chủ]       ${env.data.nodeEnv} | Node ${env.data.nodeVersion} | RAM ${env.data.memoryUsage?.heapUsed}/${env.data.memoryUsage?.heapTotal} | Uptime ${env.data.uptime}`, statusColor(env.status));
  }

  pushLines([
    { text: '' },
    { text: '  Gõ "moments", "profiles", "env" để xem chi tiết', color: '#555' },
    { text: '' },
  ]);

  if (addActivityLog) addActivityLog('SYS', `Hoàn thành quét sức khỏe hệ thống trong ${report.totalDiagTime}`);
  setLoading(false);
}

async function runMomentsDetail(
  pushLine: (t: string, c?: string, b?: boolean) => void,
  pushLines: (l: LogLine[]) => void,
  setLoading: (v: boolean) => void,
  addActivityLog?: (type: 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR', text: string) => void,
) {
  setLoading(true);
  pushLine('  ⟳ Đang truy vấn chi tiết bảng Moments...', '#FBBF24');
  if (addActivityLog) addActivityLog('SYS', 'Bắt đầu truy vấn dữ liệu chi tiết bảng Moments...');

  const report = await fetchReport(addActivityLog);
  if (!report || report.checks.momentsStats.status === 'error') {
    pushLine(`  ✗ Lỗi: ${report?.checks.momentsStats.message || 'Không kết nối được'}`, '#F87171');
    pushLine('');
    if (addActivityLog) addActivityLog('ERR', 'Lỗi khi tải chi tiết bảng Moments');
    setLoading(false);
    return;
  }

  const d = report.checks.momentsStats.data;
  if (!d) { pushLine('  ✗ Không có dữ liệu', '#F87171'); pushLine(''); setLoading(false); return; }

  pushLines([
    { text: '' },
    { text: '  ┌─────────────────────────────────────────┐', color: '#D9266E' },
    { text: '  │         📸 BÁO CÁO BẢNG MOMENTS         │', color: '#D9266E', bold: true },
    { text: '  ├─────────────────────────────────────────┤', color: '#D9266E' },
    { text: `  │  Tổng DB Rows:      ${String(d.totalDbRows).padStart(8)}          │`, color: '#ccc' },
    { text: `  │  Ảnh hợp lệ:        ${String(d.validPhotos).padStart(8)}    🖼️    │`, color: '#34D399' },
    { text: `  │  Video hợp lệ:      ${String(d.validVideos).padStart(8)}    🎥    │`, color: '#60A5FA' },
    { text: `  │  TỔNG HỢP LỆ:       ${String(d.totalValid).padStart(8)}    ✅    │`, color: '#34D399', bold: true },
    { text: '  ├─────────────────────────────────────────┤', color: '#555' },
    { text: `  │  Deleted Markers:    ${String(d.junk?.deletedMarkers || 0).padStart(8)}    🗑️    │`, color: '#F87171' },
    { text: `  │  Empty Media:        ${String(d.junk?.emptyMedia || 0).padStart(8)}    🚫    │`, color: '#F87171' },
    { text: `  │  Unsplash Demo:      ${String(d.junk?.unsplashDemo || 0).padStart(8)}    🧹    │`, color: '#F87171' },
    { text: `  │  TỔNG RÁC:           ${String(d.junk?.totalJunk || 0).padStart(8)}    ❌    │`, color: '#F87171', bold: true },
    { text: '  └─────────────────────────────────────────┘', color: '#D9266E' },
    { text: '' },
  ]);

  if (d.recentMoments?.length > 0) {
    pushLine('  5 khoảnh khắc mới nhất:', '#888');
    pushLine('  ──────────────────────────────────────────', '#333');
    d.recentMoments.forEach((m: any, i: number) => {
      const typeTag = m.type === 'video' ? '\x1b[34m🎥 VID' : '🖼️ IMG';
      const date = m.created_at ? new Date(m.created_at).toLocaleString('vi-VN') : '—';
      pushLine(`  ${i + 1}. ${typeTag}  ${String(m.id).substring(0, 20)}...  "${m.caption || '—'}"  ${date}`, m.type === 'video' ? '#60A5FA' : '#34D399');
    });
    pushLine('');
  }
  if (addActivityLog) addActivityLog('SYS', `Đã hiển thị xong báo cáo Moments (${d.totalValid} hợp lệ, ${d.junk?.totalJunk || 0} rác)`);
  setLoading(false);
}

async function runProfilesDetail(
  pushLine: (t: string, c?: string, b?: boolean) => void,
  pushLines: (l: LogLine[]) => void,
  setLoading: (v: boolean) => void,
  addActivityLog?: (type: 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR', text: string) => void,
) {
  setLoading(true);
  pushLine('  ⟳ Đang truy vấn chi tiết bảng Profiles...', '#FBBF24');
  if (addActivityLog) addActivityLog('SYS', 'Bắt đầu truy vấn dữ liệu chi tiết bảng Profiles...');

  const report = await fetchReport(addActivityLog);
  if (!report || report.checks.profilesStats.status === 'error') {
    pushLine(`  ✗ Lỗi: ${report?.checks.profilesStats.message || 'Không kết nối được'}`, '#F87171');
    pushLine('');
    if (addActivityLog) addActivityLog('ERR', 'Lỗi khi tải chi tiết bảng Profiles');
    setLoading(false);
    return;
  }

  const d = report.checks.profilesStats.data;
  if (!d) { pushLine('  ✗ Không có dữ liệu', '#F87171'); pushLine(''); setLoading(false); return; }

  pushLines([
    { text: '' },
    { text: '  ┌─────────────────────────────────────────┐', color: '#D9266E' },
    { text: '  │        👤 BÁO CÁO BẢNG PROFILES         │', color: '#D9266E', bold: true },
    { text: '  ├─────────────────────────────────────────┤', color: '#D9266E' },
    { text: `  │  Tổng Profiles:     ${String(d.totalProfiles).padStart(8)}          │`, color: '#ccc' },
    { text: `  │  Active Members:    ${String(d.activeMembers).padStart(8)}    ✅    │`, color: '#34D399' },
    { text: `  │  Deleted Members:   ${String(d.deletedMembers).padStart(8)}    ❌    │`, color: '#F87171' },
    { text: `  │  Có Avatar:         ${String(d.withAvatar).padStart(8)}    🖼️    │`, color: '#A78BFA' },
    { text: '  └─────────────────────────────────────────┘', color: '#D9266E' },
    { text: '' },
  ]);

  if (d.profiles?.length > 0) {
    pushLine('  Danh sách thành viên:', '#888');
    pushLine('  ──────────────────────────────────────────', '#333');
    d.profiles.forEach((p: any, i: number) => {
      const avatar = p.has_avatar ? '✓' : '✗';
      const updated = p.updated_at ? new Date(p.updated_at).toLocaleDateString('vi-VN') : '—';
      pushLine(`  ${String(i + 1).padStart(2)}. ${p.id}  ${(p.display_name || '—').padEnd(20)}  Avatar: ${avatar}  Updated: ${updated}`, p.has_avatar ? '#ccc' : '#888');
    });
    pushLine('');
  }
  if (addActivityLog) addActivityLog('SYS', `Đã hiển thị xong báo cáo Profiles (${d.totalProfiles} thành viên)`);
  setLoading(false);
}

async function runPurge(
  pushLine: (t: string, c?: string, b?: boolean) => void,
  pushLines: (l: LogLine[]) => void,
  setLoading: (v: boolean) => void,
  addActivityLog?: (type: 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR', text: string) => void,
) {
  setLoading(true);
  pushLine('  ⚠ CẢNH BÁO: Sẽ xóa vĩnh viễn dữ liệu rác trên Supabase!', '#FBBF24', true);
  pushLine('  ⟳ Đang thực hiện purge...', '#FBBF24');
  if (addActivityLog) addActivityLog('SYS', 'Bắt đầu gửi yêu cầu xóa rác dữ liệu Supabase...');

  const startTime = Date.now();
  if (addActivityLog) addActivityLog('HTTP', 'POST /api/debug/purge');

  try {
    const res = await fetch('/api/debug/purge', { method: 'POST' });
    const elapsed = Date.now() - startTime;
    const data = await res.json();
    if (addActivityLog) {
      addActivityLog('HTTP', `POST /api/debug/purge ${res.status} (${elapsed}ms)`);
      addActivityLog('DB', `Đã dọn dẹp ${data.deleted || 0} dòng bản ghi rác khỏi Supabase DB`);
      addActivityLog('SYS', `Dọn rác hoàn tất: ${data.message}`);
    }
    pushLine('');
    pushLine(`  ${data.message}`, data.deleted > 0 ? '#34D399' : '#60A5FA', true);
    if (data.remaining !== undefined) {
      pushLine(`  Số dòng còn lại trong DB: ${data.remaining}`, '#ccc');
    }
  } catch (e: any) {
    if (addActivityLog) addActivityLog('ERR', `Lỗi dọn rác DB: ${e?.message || 'Unknown'}`);
    pushLine(`  ✗ Lỗi purge: ${e?.message || 'Unknown'}`, '#F87171');
  }
  pushLine('');
  setLoading(false);
}

async function runEnvCheck(
  pushLine: (t: string, c?: string, b?: boolean) => void,
  pushLines: (l: LogLine[]) => void,
  setLoading: (v: boolean) => void,
  addActivityLog?: (type: 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR', text: string) => void,
) {
  setLoading(true);
  pushLine('  ⟳ Đang thu thập thông số server...', '#FBBF24');
  if (addActivityLog) addActivityLog('SYS', 'Thu thập thông số môi trường máy chủ và Node process...');

  const report = await fetchReport(addActivityLog);
  const env = report?.checks.environment?.data;

  if (!env) {
    pushLine('  ✗ Không lấy được thông số server', '#F87171');
    pushLine('');
    if (addActivityLog) addActivityLog('ERR', 'Không thể thu thập thông số server');
    setLoading(false);
    return;
  }

  pushLines([
    { text: '' },
    { text: '  ┌─────────────────────────────────────────┐', color: '#60A5FA' },
    { text: '  │        ⚙️  THÔNG SỐ MÔI TRƯỜNG           │', color: '#60A5FA', bold: true },
    { text: '  ├─────────────────────────────────────────┤', color: '#60A5FA' },
    { text: `  │  Node ENV:         ${(env.nodeEnv || '—').padEnd(22)}│`, color: '#ccc' },
    { text: `  │  Node Version:     ${(env.nodeVersion || '—').padEnd(22)}│`, color: '#ccc' },
    { text: `  │  Platform:         ${(env.platform || '—').padEnd(22)}│`, color: '#ccc' },
    { text: `  │  Uptime:           ${(env.uptime || '—').padEnd(22)}│`, color: '#ccc' },
    { text: '  ├─────────────────────────────────────────┤', color: '#444' },
    { text: `  │  Supabase URL:     ${env.supabaseUrl ? '✅ Configured' : '❌ Missing'}${' '.repeat(9)}│`, color: env.supabaseUrl ? '#34D399' : '#F87171' },
    { text: `  │  Anon Key:         ${env.hasAnonKey ? '✅ Configured' : '❌ Missing'}${' '.repeat(9)}│`, color: env.hasAnonKey ? '#34D399' : '#F87171' },
    { text: `  │  Redis URL:        ${env.hasRedisUrl ? '✅ Configured' : '○  Not used'}${' '.repeat(9)}│`, color: env.hasRedisUrl ? '#34D399' : '#666' },
    { text: `  │  Database URL:     ${env.hasDatabaseUrl ? '✅ Configured' : '○  Not used'}${' '.repeat(9)}│`, color: env.hasDatabaseUrl ? '#34D399' : '#666' },
    { text: '  ├─────────────────────────────────────────┤', color: '#444' },
    { text: `  │  RAM RSS:          ${(env.memoryUsage?.rss || '—').padEnd(22)}│`, color: '#FBBF24' },
    { text: `  │  Heap Used:        ${(env.memoryUsage?.heapUsed || '—').padEnd(22)}│`, color: '#FBBF24' },
    { text: `  │  Heap Total:       ${(env.memoryUsage?.heapTotal || '—').padEnd(22)}│`, color: '#FBBF24' },
    { text: '  └─────────────────────────────────────────┘', color: '#60A5FA' },
    { text: '' },
  ]);
  if (addActivityLog) addActivityLog('SYS', `Đã hiển thị thông số Server (Node ${env.nodeVersion}, RAM RSS ${env.memoryUsage?.rss})`);
  setLoading(false);
}

async function runExport(
  pushLine: (t: string, c?: string, b?: boolean) => void,
  pushLines: (l: LogLine[]) => void,
  setLoading: (v: boolean) => void,
  addActivityLog?: (type: 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR', text: string) => void,
) {
  setLoading(true);
  pushLine('  ⟳ Đang tạo file báo cáo JSON...', '#FBBF24');
  if (addActivityLog) addActivityLog('SYS', 'Đang đóng gói dữ liệu JSON báo cáo chẩn đoán...');

  const report = await fetchReport(addActivityLog);
  if (!report) {
    pushLine('  ✗ Không tạo được báo cáo', '#F87171');
    pushLine('');
    if (addActivityLog) addActivityLog('ERR', 'Không thể tạo file báo cáo JSON');
    setLoading(false);
    return;
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `locket_debug_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  if (addActivityLog) addActivityLog('SYS', 'Đã tạo và tải file locket_debug.json');
  pushLine('  ✓ Đã tải xuống file báo cáo JSON!', '#34D399', true);
  pushLine('');
  setLoading(false);
}

async function runBackup(
  pushLine: (t: string, c?: string, b?: boolean) => void,
  pushLines: (l: LogLine[]) => void,
  setLoading: (v: boolean) => void,
  addActivityLog?: (type: 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR', text: string, durationMs?: number) => void,
) {
  setLoading(true);
  pushLine('  ⟳ Đang kết nối server và phát luồng sao lưu dữ liệu...', '#FBBF24', true);
  if (addActivityLog) addActivityLog('SYS', 'Bắt đầu luồng Sao Lưu Dữ Liệu Realtime (Streaming)...');

  const startTime = Date.now();
  if (addActivityLog) addActivityLog('HTTP', 'POST /api/debug/backup');

  try {
    const res = await fetch('/api/debug/backup', { method: 'POST' });
    const elapsed = Date.now() - startTime;

    if (!res.ok || !res.body) {
      if (addActivityLog) addActivityLog('ERR', `Sao lưu thất bại: HTTP ${res.status}`, elapsed);
      pushLine(`  ✗ Lỗi kết nối HTTP ${res.status}`, '#F87171');
      pushLine('');
      setLoading(false);
      return;
    }

    if (addActivityLog) addActivityLog('HTTP', 'POST /api/debug/backup (Luồng dữ liệu đã mở)', elapsed);

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line);
          const type = evt.type as 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR';
          const text = evt.text as string;

          // Push to right sidebar log stream
          if (addActivityLog) addActivityLog(type, text);

          // Push to left terminal screen
          if (type === 'ERR') {
            pushLine(`  ${text}`, '#F87171');
          } else if (type === 'DB') {
            pushLine(`  ${text}`, '#34D399');
          } else {
            pushLine(`  ${text}`, '#ccc');
          }

          // If event has final summary payload, render final ASCII table
          if (evt.data?.summary) {
            const s = evt.data.summary;
            pushLines([
              { text: '' },
              { text: '  ┌─────────────────────────────────────────────────────────┐', color: '#FBBF24' },
              { text: '  │         🎉 BÁO CÁO SAO LƯU DỮ LIỆU HOÀN TẤT            │', color: '#FBBF24', bold: true },
              { text: '  ├─────────────────────────────────────────────────────────┤', color: '#FBBF24' },
              { text: `  │  Thư mục lưu trữ:   /backup_img                           │`, color: '#34D399', bold: true },
              { text: `  │  Dòng DB thô:       ${String(s.rawDbRows).padStart(8)} dòng                     │`, color: '#ccc' },
              { text: `  │  Khoảnh khắc hợp lệ: ${String(s.validMoments).padStart(7)} item                     │`, color: '#34D399' },
              { text: `  │  Tài khoản lưu:     ${String(s.profilesCount).padStart(8)} user                     │`, color: '#A78BFA' },
              { text: '  ├─────────────────────────────────────────────────────────┤', color: '#444' },
              { text: `  │  🖼️ Ảnh mới tải về:  ${String(s.photoCount).padStart(8)} file (backup_img/photos)  │`, color: '#34D399', bold: true },
              { text: `  │  🎥 Video mới tải về: ${String(s.videoCount).padStart(8)} file (backup_img/videos)  │`, color: '#60A5FA', bold: true },
              { text: `  │  👤 Avatars tải về:  ${String(s.avatarCount).padStart(8)} file (backup_img/avatars) │`, color: '#A78BFA', bold: true },
              { text: `  │  ⏭️ Bỏ qua (đã có):  ${String(s.skipCount).padStart(8)} file                     │`, color: '#888' },
              { text: '  ├─────────────────────────────────────────────────────────┤', color: '#444' },
              { text: `  │  📄 File Metadata:   moments_data.json & profiles_data.json│`, color: '#F472B6' },
              { text: '  └─────────────────────────────────────────────────────────┘', color: '#FBBF24' },
              { text: '' },
            ]);
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  } catch (e: any) {
    if (addActivityLog) addActivityLog('ERR', `Lỗi kết nối luồng sao lưu: ${e?.message || 'Unknown'}`);
    pushLine(`  ✗ Lỗi kết nối sao lưu: ${e?.message || 'Unknown'}`, '#F87171');
    pushLine('');
  }

  setLoading(false);
}

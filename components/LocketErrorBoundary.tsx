"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LocketErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LocketErrorBoundary] Uncaught client error:', error, errorInfo);
  }

  private handleReset = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('locket_moments_shared_cache_v9');
        localStorage.removeItem('locket_local_moments_v1');
        localStorage.removeItem('locket_deleted_moments_v1');
        localStorage.removeItem('locket_deleted_members_v1');
      } catch (e) {}
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-screen bg-[#10091D] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-full bg-[#D9266E]/20 text-[#D9266E] border border-[#D9266E]/40 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(217,38,110,0.3)] animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-white text-lg font-bold mb-2">Đã xảy ra sự cố giao diện</h2>
          <p className="text-zinc-400 text-xs max-w-xs mb-3 leading-relaxed">
            Hệ thống đã tự động khoanh vùng sự cố. Nhấn nút bên dưới để khôi phục khoảnh khắc và làm mới ứng dụng.
          </p>
          {this.state.error && (
            <div className="max-w-md w-full bg-red-950/40 border border-red-500/30 rounded-xl p-3 mb-5 text-left overflow-auto max-h-36">
              <p className="text-red-300 font-mono text-[11px] font-semibold break-all">
                {this.state.error.name}: {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <pre className="text-zinc-400 font-mono text-[9px] mt-1 whitespace-pre-wrap break-all">
                  {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                </pre>
              )}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#D9266E] to-[#BE185D] hover:from-[#BE185D] hover:to-[#9F1239] text-white text-xs font-bold px-6 py-3 rounded-full shadow-[0_8px_25px_rgba(217,38,110,0.5)] active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>Khôi phục & Làm mới</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

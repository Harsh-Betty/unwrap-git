"use client";
import { ReactNode } from "react";

interface TerminalLayoutProps {
  children: ReactNode;
}

export function TerminalLayout({ children }: TerminalLayoutProps) {
  return (
    <div className="terminal-container min-h-screen bg-[#0a0a0a] text-[#00ff00] font-mono relative overflow-hidden">
      <div className="scanlines pointer-events-none fixed inset-0 z-50" />

      <div className="crt-flicker pointer-events-none fixed inset-0 z-40" />

      <div className="terminal-window mx-auto max-w-5xl min-h-screen flex flex-col">
        <div className="terminal-header flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border-b border-[#333]">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_8px_#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_8px_#27c93f]" />
          </div>
          <div className="flex-1 text-center text-[#666] text-sm tracking-wider">
            <span className="text-[#00ff00]/60">~/</span>
            <span className="text-[#00ff00]">unwrap-git</span>
            <span className="text-[#00ff00]/60"> — bash</span>
          </div>
          <div className="w-16" />
        </div>

        <div className="terminal-content flex-1 p-6 overflow-auto">
          {children}
        </div>
      </div>

      <div
        className="fixed inset-0 pointer-events-none opacity-5 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />
    </div>
  );
}

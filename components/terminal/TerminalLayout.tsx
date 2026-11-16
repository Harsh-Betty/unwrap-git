import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TerminalLayoutProps {
  childClassName?: string;
  children: ReactNode;
}

export function TerminalLayout({
  children,
  childClassName,
}: TerminalLayoutProps) {
  return (
    <div className="terminal-container min-h-screen bg-terminal-bg text-terminal font-mono relative overflow-hidden">
      <div className="scanlines pointer-events-none fixed inset-0 z-50" />

      <div className="crt-flicker pointer-events-none fixed inset-0 z-40" />

      <div className="terminal-window mx-auto max-w-5xl min-h-screen flex flex-col">
        <div className="terminal-header flex items-center gap-2 px-4 py-3 bg-terminal-surface border-b border-terminal/20">
          <div className="flex gap-2" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_8px_#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-terminal shadow-[0_0_8px_#ffb000]" />
          </div>
          <div className="flex-1 text-center text-terminal-dim text-sm tracking-wider">
            <span className="text-terminal/70">~/</span>
            <span className="text-terminal">unwrap-git</span>
            <span className="text-terminal/70"> — bash</span>
          </div>
          <div className="w-16" />
        </div>

        <div
          className={cn(
            "terminal-content flex-1 p-6 overflow-auto",
            childClassName
          )}
        >
          {children}
        </div>
      </div>

      <div
        className="fixed inset-0 pointer-events-none opacity-5 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 176, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 176, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />
    </div>
  );
}

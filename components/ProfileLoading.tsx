import { Loader2 } from "lucide-react";
import { TerminalLayout } from "@/components/terminal";

const STEPS = [
  "Connecting to the GitHub API",
  "Reading the contribution calendar",
  "Weighing languages by repository",
  "Sampling commits for time-of-day patterns",
  "Computing streaks and insights",
];

export function ProfileLoading() {
  return (
    <TerminalLayout>
      <div
        role="status"
        className="mt-6 p-4 bg-terminal-surface rounded border border-terminal/20"
      >
        <p className="text-terminal/70 text-xs uppercase tracking-widest mb-4 pb-2 border-b border-terminal/20">
          Unwrapping
        </p>
        <ul className="space-y-2 text-sm md:text-base">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className="log-line flex items-center gap-3 text-terminal/80"
              style={{ "--line": index } as React.CSSProperties}
            >
              <Loader2
                className="w-4 h-4 shrink-0 text-terminal animate-spin"
                aria-hidden="true"
              />
              {step}
            </li>
          ))}
        </ul>
      </div>
    </TerminalLayout>
  );
}

"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { setLeaderboardVisibility } from "@/app/leaderboard/actions";

interface Props {
  login: string;
  hidden: boolean;
}

export function LeaderboardVisibilityToggle({ login, hidden }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const Icon = hidden ? Eye : EyeOff;

  function toggle() {
    setFailed(false);
    startTransition(async () => {
      const result = await setLeaderboardVisibility(!hidden);
      if (result.success) router.refresh();
      else setFailed(true);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 text-sm bg-terminal-surface border border-terminal/20 rounded">
      <p className="text-terminal/80">
        {hidden
          ? `@${login} is hidden from every year's leaderboard.`
          : `@${login} is listed on the leaderboard.`}
      </p>
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className="focus-ring inline-flex items-center gap-2 min-h-11 px-3 rounded border border-terminal/40 text-terminal hover:bg-terminal/10 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-wait"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Icon className="w-4 h-4" aria-hidden="true" />
        )}
        {hidden ? "Show me again" : "Hide me"}
      </button>
      {failed && (
        <p role="alert" className="text-red-400">
          That did not save. Try again.
        </p>
      )}
    </div>
  );
}

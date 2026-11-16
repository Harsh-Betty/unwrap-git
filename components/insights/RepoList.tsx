import { Lock, Star } from "lucide-react";
import { compact } from "@/lib/archetype";
import type { RepoActivity } from "@/lib/github";

const MAX_ROWS = 6;

function count(value: number, one: string, many = `${one}s`): string | null {
  return value > 0 ? `${compact(value)} ${value === 1 ? one : many}` : null;
}

function breakdown(repo: RepoActivity): string {
  return [
    count(repo.commits, "commit"),
    count(repo.pullRequests, "PR"),
    count(repo.reviews, "review"),
    count(repo.issues, "issue"),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function RepoList({ repos, login }: { repos: RepoActivity[]; login: string }) {
  const shown = repos.slice(0, MAX_ROWS);
  if (shown.length === 0) return null;
  const others = repos.filter((repo) => !repo.isOwn).length;

  return (
    <section
      aria-labelledby="repos-title"
      className="p-4 bg-terminal-bg rounded border border-terminal/15"
    >
      <h3 id="repos-title" className="text-terminal font-bold">
        Where you worked
      </h3>
      {others > 0 && (
        <p className="text-terminal/70 text-sm mt-1">
          {others} of these {repos.length} repositories belong to someone else.
        </p>
      )}
      <ol className="mt-3 divide-y divide-terminal/10">
        {shown.map((repo) => (
          <li key={repo.nameWithOwner} className="py-2 flex items-start justify-between gap-4 text-sm">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-terminal truncate">
                {repo.isPrivate && <Lock className="w-3.5 h-3.5 shrink-0" aria-label="Private" />}
                <span className="truncate">
                  {repo.owner.toLowerCase() === login.toLowerCase() ? repo.name : repo.nameWithOwner}
                </span>
              </p>
              <p className="text-terminal/70 text-xs mt-0.5">{breakdown(repo)}</p>
            </div>
            {repo.stars > 0 && (
              <span className="shrink-0 inline-flex items-center gap-1 text-terminal/70 text-xs tabular-nums">
                <Star className="w-3.5 h-3.5" aria-hidden="true" />
                {compact(repo.stars)}
                <span className="sr-only">stars</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

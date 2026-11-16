"use client";
import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { normalizeUsername } from "@/lib/username";
import { profilePath } from "@/lib/year";

interface SearchFormProps {
  years: number[];
  defaultYear: number;
}

export function SearchForm({ years, defaultYear }: SearchFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [username, setUsername] = useState("");
  const [year, setYear] = useState(defaultYear);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const usernameId = useId();
  const yearId = useId();
  const errorId = useId();

  const ownLogin = session?.user.name;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim()) {
      setError("Enter a GitHub username.");
      return;
    }
    const login = normalizeUsername(username);
    if (!login) {
      setError(
        "GitHub usernames use letters, numbers and single hyphens, up to 39 characters."
      );
      return;
    }
    setError(null);
    startTransition(() => router.push(profilePath(login, year)));
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="p-4 bg-terminal-surface rounded border border-terminal/20"
    >
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1 min-w-0">
          <label
            htmlFor={usernameId}
            className="block text-xs uppercase tracking-wider text-terminal/70 mb-2"
          >
            GitHub username
          </label>
          <div className="terminal-input-wrapper flex items-center gap-2 h-11 px-3 bg-terminal-bg rounded border border-terminal/30 focus-within:border-terminal">
            <span aria-hidden="true" className="text-terminal font-bold">
              &gt;
            </span>
            <input
              id={usernameId}
              name="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={ownLogin ?? "torvalds"}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="flex-1 min-w-0 bg-transparent outline-none text-terminal placeholder:text-terminal/40 caret-terminal"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={yearId}
            className="block text-xs uppercase tracking-wider text-terminal/70 mb-2"
          >
            Year
          </label>
          <select
            id={yearId}
            name="year"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="focus-ring h-11 w-full sm:w-32 px-3 bg-terminal-bg text-terminal rounded border border-terminal/30 cursor-pointer"
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option === defaultYear ? `${option} so far` : option}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="focus-ring h-11 px-5 rounded bg-terminal text-terminal-bg font-bold hover:bg-terminal-bright transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
        >
          {isPending && (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          )}
          Unwrap
        </button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {ownLogin && (
        <p className="mt-3 text-sm text-terminal/70">
          Signed in as @{ownLogin}.{" "}
          <button
            type="button"
            onClick={() =>
              startTransition(() => router.push(profilePath(ownLogin, year)))
            }
            className="focus-ring underline underline-offset-4 text-terminal hover:text-terminal-bright cursor-pointer"
          >
            Unwrap my {year}
          </button>
        </p>
      )}
    </form>
  );
}

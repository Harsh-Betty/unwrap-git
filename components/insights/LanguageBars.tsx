import type { LanguageStat } from "@/lib/github";

const MAX_ROWS = 6;

// Ranked horizontal bars in one hue: the parts are compared with each other,
// and each row is named in text, so the GitHub language colour is only a
// small swatch beside the name.
export function LanguageBars({
  languages,
  restricted,
}: {
  languages: LanguageStat[];
  restricted: number;
}) {
  const shown = languages.slice(0, MAX_ROWS);
  const rest = languages.slice(MAX_ROWS);
  const restShare = rest.reduce((sum, language) => sum + language.share, 0);
  const rows =
    restShare > 0
      ? [...shown, { name: `Other (${rest.length})`, share: restShare, color: null }]
      : shown;
  const top = rows[0]?.share ?? 1;

  return (
    <section
      aria-labelledby="languages-title"
      className="p-4 bg-terminal-bg rounded border border-terminal/15"
    >
      <h2 id="languages-title" className="text-terminal font-bold">
        Languages
      </h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-terminal/70">
          No commits in public repositories to read languages from.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((language) => {
            const percent = Math.round(language.share * 100);
            return (
              <li
                key={language.name}
                className="grid grid-cols-[minmax(6rem,9rem)_1fr_3rem] items-center gap-3 text-sm"
              >
                <span className="flex items-center gap-2 min-w-0 text-terminal/90">
                  <span
                    aria-hidden="true"
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: language.color ?? "#6b4600" }}
                  />
                  <span className="truncate">{language.name}</span>
                </span>
                <span aria-hidden="true" className="h-2 rounded-full bg-terminal/10">
                  <span
                    className="block h-full rounded-full bg-terminal"
                    style={{ width: `${Math.max(2, (language.share / top) * 100)}%` }}
                  />
                </span>
                <span className="text-right tabular-nums text-terminal/80">
                  {percent < 1 ? "<1" : percent}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-terminal/70">
        Each repository&apos;s commits are split across its languages by code
        size.
        {restricted > 0 &&
          ` ${restricted.toLocaleString("en-US")} private contributions are counted in your totals but can't be matched to a language.`}
      </p>
    </section>
  );
}

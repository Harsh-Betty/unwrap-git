import Link from "next/link";
import { BookOpen, Trophy } from "lucide-react";
import { SearchForm } from "@/components/SearchForm";
import { AuthButtons, TerminalLayout } from "@/components/terminal";
import { currentYear, selectableYears } from "@/lib/year";
import packageJson from "@/package.json";

const ASCII_HEADER = `
 ██████╗ ██╗████████╗██╗  ██╗██╗   ██╗██████╗     
██╔════╝ ██║╚══██╔══╝██║  ██║██║   ██║██╔══██╗    
██║  ███╗██║   ██║   ███████║██║   ██║██████╔╝    
██║   ██║██║   ██║   ██╔══██║██║   ██║██╔══██╗    
╚██████╔╝██║   ██║   ██║  ██║╚██████╔╝██████╔╝    
 ╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝     
                                                   
██╗   ██╗███╗   ██╗██╗    ██╗██████╗  █████╗ ██████╗ ██████╗ ███████╗██████╗ 
██║   ██║████╗  ██║██║    ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
██║   ██║██╔██╗ ██║██║ █╗ ██║██████╔╝███████║██████╔╝██████╔╝█████╗  ██║  ██║
██║   ██║██║╚██╗██║██║███╗██║██╔══██╗██╔══██║██╔═══╝ ██╔═══╝ ██╔══╝  ██║  ██║
╚██████╔╝██║ ╚████║╚███╔███╔╝██║  ██║██║  ██║██║     ██║     ███████╗██████╔╝
 ╚═════╝ ╚═╝  ╚═══╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═════╝ 
`.trim();

const EXAMPLES = ["torvalds", "gaearon", "sindresorhus"];

// The year list depends on today's date, so refresh the page daily instead
// of freezing it at build time.
export const revalidate = 86400;

export default function Home() {
  const year = currentYear();

  return (
    <TerminalLayout>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="sr-only">GitHub Unwrapped: your year in code</h1>
          <pre
            aria-hidden="true"
            className="ascii-art text-terminal glow-text overflow-x-auto"
          >
            {ASCII_HEADER}
          </pre>
          <p className="mt-4 text-terminal/70 text-sm">
            v{packageJson.version} · Your year in code
          </p>
        </div>
        <div className="shrink-0">
          <AuthButtons />
        </div>
      </div>

      <p className="mb-6 text-terminal/80 max-w-2xl">
        Pick a GitHub user and a year to see their contributions, languages
        and streaks.
      </p>

      <SearchForm years={selectableYears()} defaultYear={year} />

      <div className="mt-8 text-sm text-terminal/70">
        <p>
          Try{" "}
          {EXAMPLES.map((login, index) => (
            <span key={login}>
              <Link
                href={`/${login}`}
                className="focus-ring underline underline-offset-4 text-terminal hover:text-terminal-bright"
              >
                {login}
              </Link>
              {index < EXAMPLES.length - 2
                ? ", "
                : index === EXAMPLES.length - 2
                  ? " or "
                  : "."}
            </span>
          ))}
        </p>
      </div>

      <nav
        aria-label="More"
        className="mt-12 pt-6 border-t border-terminal/20 flex flex-wrap justify-center gap-6 text-sm"
      >
        <Link
          href="/leaderboard"
          className="focus-ring text-terminal/70 hover:text-terminal transition-colors flex items-center gap-1"
        >
          <Trophy className="w-4 h-4" aria-hidden="true" />
          Leaderboard
        </Link>
        <Link
          href="/how-it-works"
          className="focus-ring text-terminal/70 hover:text-terminal transition-colors flex items-center gap-1"
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          How It Works
        </Link>
      </nav>
    </TerminalLayout>
  );
}

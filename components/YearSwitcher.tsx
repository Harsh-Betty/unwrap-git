import Link from "next/link";
import { profilePath } from "@/lib/year";

interface YearSwitcherProps {
  login: string;
  years: number[];
  activeYear: number;
}

// Links to every year the user has contributions in. Plain links, so each
// year is its own crawlable, shareable page.
export function YearSwitcher({ login, years, activeYear }: YearSwitcherProps) {
  const options = years.includes(activeYear)
    ? years
    : [...years, activeYear].sort((a, b) => b - a);
  if (options.length < 2) return null;

  return (
    <nav aria-label="Year" className="overflow-x-auto">
      <ul className="flex gap-2 pb-1">
        {options.map((year) => {
          const isActive = year === activeYear;
          return (
            <li key={year}>
              <Link
                href={profilePath(login, year)}
                aria-current={isActive ? "page" : undefined}
                className={`focus-ring flex items-center min-h-11 px-3 text-sm rounded border transition-colors ${
                  isActive
                    ? "bg-terminal text-terminal-bg border-terminal font-bold"
                    : "text-terminal/70 border-terminal/20 hover:text-terminal hover:border-terminal/50"
                }`}
              >
                {year}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

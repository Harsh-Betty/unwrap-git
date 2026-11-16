import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CircleHelp,
  Clock,
  Flame,
  Lock,
  Search,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { TerminalLayout } from "@/components/terminal";
import { jsonLd, REPO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Unwrap Git builds a GitHub Wrapped for any year: where the data comes from, how streaks, languages and coding personalities are calculated, how the leaderboard works and what happens to your data.",
  alternates: { canonical: "/how-it-works" },
};

const FAQ: { question: string; answer: string }[] = [
  {
    question: "What is Unwrap Git?",
    answer:
      "A free GitHub Wrapped: a year-in-review of any GitHub user's contributions, languages, streaks and coding habits, with a recap story and a shareable card.",
  },
  {
    question: "Which years can I see?",
    answer:
      "Any year from 2008, when GitHub launched, to now. Past years cover January 1 to December 31 (UTC). The current year covers January 1 to today.",
  },
  {
    question: "Do I need to sign in?",
    answer:
      "No. Anyone's public stats can be looked up without an account. Signing in with GitHub adds your private contribution counts to your own stats.",
  },
  {
    question: "Does signing in give access to my private code?",
    answer:
      "No. Unwrap Git only asks for the read:user permission. It can count private contributions, but cannot see private repository names, code or languages.",
  },
  {
    question: "Why are my private repository languages missing?",
    answer:
      "Reading the languages of private repositories needs GitHub's full repo permission, which also grants write access. Private contributions are still counted in your totals.",
  },
  {
    question: "How do I get on the leaderboard, or off it?",
    answer:
      "Everyone whose stats are looked up is added to that year's leaderboard automatically. Sign in and open the leaderboard to hide yourself from every year.",
  },
  {
    question: "Why don't my numbers match my GitHub profile exactly?",
    answer:
      "GitHub's profile counts days in your own timezone, while Unwrap Git uses UTC year boundaries. Stats are also cached for up to 2 hours for the current year.",
  },
];

const METRICS: { icon: typeof Flame; title: string; body: string }[] = [
  {
    icon: Flame,
    title: "Streaks and breaks",
    body: "Consecutive days with at least one contribution. The current streak only shows for the year in progress. The longest break is the longest run of days with none.",
  },
  {
    icon: Target,
    title: "Dedication",
    body: "The share of days in the period with at least one contribution: active days ÷ days × 100.",
  },
  {
    icon: BarChart3,
    title: "Languages",
    body: "Each repository's commits are split across its languages by code size, then added up. A repository that is 70% TypeScript and 30% CSS gives 70% of its commits to TypeScript.",
  },
  {
    icon: Clock,
    title: "Commit hours",
    body: "Up to 100 of your commits from each of your 6 busiest public repositories are read to see what time they were written, in the committer's own timezone.",
  },
  {
    icon: Sparkles,
    title: "Coding personality",
    body: "Picked from your habits: Night Owl or Early Bird from commit hours, Weekend Warrior, The Reviewer, Open Sourcerer for work in other people's repositories, Marathoner for long streaks, Sprinter for short bursts, Polyglot for many languages.",
  },
];

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Flame;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="p-4 bg-terminal-surface border border-terminal/20 rounded">
      <h2 className="text-lg text-terminal font-bold mb-3 flex items-center gap-2">
        <Icon className="w-5 h-5" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function HowItWorksPage() {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <TerminalLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqStructuredData) }}
      />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl text-terminal font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" aria-hidden="true" />
          How it works
        </h1>
        <Link
          href="/"
          className="focus-ring inline-flex items-center gap-2 min-h-11 text-sm text-terminal/70 hover:text-terminal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Home
        </Link>
      </div>

      <div className="space-y-6 text-terminal/80">
        <Section icon={Search} title="Where the data comes from">
          <p>
            Everything comes from the GitHub GraphQL API: the contribution
            calendar, commits, pull requests, reviews and issues, and the
            repositories they were made in.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <strong className="text-terminal">Without signing in:</strong>{" "}
              public contributions only.
            </li>
            <li>
              <strong className="text-terminal">Signed in, on your own page:</strong>{" "}
              your private contribution counts are added too. Only you see that
              version.
            </li>
          </ul>
        </Section>

        <Section icon={BarChart3} title="How the numbers are worked out">
          <dl className="space-y-4 text-sm">
            {METRICS.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <dt className="text-terminal font-bold flex items-center gap-1">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {title}
                </dt>
                <dd className="mt-1">{body}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section icon={Trophy} title="Leaderboard">
          <p>
            Everyone whose stats are looked up is added to that year&apos;s
            leaderboard, ranked by total contributions. It shows only public
            profile details and totals.{" "}
            <Link
              href="/leaderboard"
              className="focus-ring underline underline-offset-4 text-terminal hover:text-terminal-bright"
            >
              Sign in on the leaderboard
            </Link>{" "}
            to hide yourself from every year.
          </p>
        </Section>

        <Section icon={Lock} title="Privacy">
          <ul className="space-y-2 text-sm list-disc pl-5">
            <li>
              We only ask GitHub for the{" "}
              <code className="text-terminal">read:user</code> permission.
            </li>
            <li>
              Your GitHub token is stored encrypted and only used to load your
              own stats.
            </li>
            <li>
              Stats are cached to keep GitHub API use low: 2 hours for the
              current year, 14 days for past years.
            </li>
            <li>
              The code is open source on{" "}
              <Link
                href={REPO_URL}
                className="focus-ring underline underline-offset-4 text-terminal hover:text-terminal-bright"
              >
                GitHub
              </Link>
              .
            </li>
          </ul>
        </Section>

        <Section icon={CircleHelp} title="Questions">
          <dl className="space-y-4 text-sm">
            {FAQ.map((item) => (
              <div key={item.question}>
                <dt className="text-terminal font-bold">{item.question}</dt>
                <dd className="mt-1">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </TerminalLayout>
  );
}

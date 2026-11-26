import Link from "next/link";
import { LottieAnimation } from "@/components/ui/LottieAnimation";
import { TerminalLayout } from "@/components/terminal";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <TerminalLayout childClassName="flex justify-center items-center">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-64 h-64 mb-6">
          <LottieAnimation
            src="/animations/404-cat.lottie"
            loop={true}
            autoplay={true}
          />
        </div>

        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          <h1 className="font-mono text-sm">Page not found</h1>
        </div>
        <p className="text-terminal/80 mb-6 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved
          to another dimension.
        </p>

        <Link
          href="/"
          className="px-4 py-2 bg-terminal/10 hover:bg-terminal/20 border border-terminal/30 rounded text-terminal transition-colors flex items-center gap-2"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          <span>Return to Terminal</span>
        </Link>
      </div>
    </TerminalLayout>
  );
}

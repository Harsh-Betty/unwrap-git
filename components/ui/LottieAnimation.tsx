"use client";
import { useSyncExternalStore } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LottieAnimationProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  className?: string;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// Decorative only, so it is hidden from screen readers, and it holds still
// for people who ask their system for less motion.
export function LottieAnimation({
  src,
  loop = true,
  autoplay = true,
  speed = 1,
  className = "",
}: LottieAnimationProps) {
  const reducedMotion = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );

  return (
    <div aria-hidden="true" className={className}>
      <DotLottieReact
        src={src}
        loop={loop && !reducedMotion}
        autoplay={autoplay && !reducedMotion}
        speed={speed}
      />
    </div>
  );
}

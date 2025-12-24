"use client";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LottieAnimationProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  className?: string;
}

export function LottieAnimation({
  src,
  loop = true,
  autoplay = true,
  speed = 1,
  className = "",
}: LottieAnimationProps) {
  return (
    <DotLottieReact
      src={src}
      loop={loop}
      autoplay={autoplay}
      speed={speed}
      className={className}
    />
  );
}

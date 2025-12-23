"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface TerminalInputProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  prompt?: string;
}

export function TerminalInput({
  onSubmit,
  disabled = false,
  placeholder = "Enter GitHub username...",
  prompt = ">",
}: TerminalInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <div className="terminal-input-wrapper flex items-center gap-2 group">
      <span className="text-terminal text-lg font-bold animate-pulse">
        {prompt}
      </span>

      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none text-terminal 
                     placeholder-terminal/30 text-lg tracking-wide
                     caret-terminal font-mono
                     disabled:opacity-50 disabled:cursor-not-allowed"
          autoComplete="off"
          spellCheck={false}
        />

        {/* blinking cursor */}
        {value === "" && !disabled && (
          <span className="absolute left-0 top-0 text-lg animate-blink pointer-events-none">
            ▊
          </span>
        )}
      </div>

      {value.trim() && !disabled && (
        <span className="text-terminal/50 text-sm hidden sm:inline">
          [ENTER]
        </span>
      )}
    </div>
  );
}

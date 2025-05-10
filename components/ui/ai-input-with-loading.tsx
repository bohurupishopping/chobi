"use client";

import { Loader2 } from "lucide-react";
import { useState, useEffect, ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea";

interface AIInputWithLoadingProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  loadingDuration?: number;
  thinkingDuration?: number;
  onSubmit?: (value: string) => void | Promise<void>;
  className?: string;
  autoAnimate?: boolean;
  settingsButton?: ReactNode;
}

export function AIInputWithLoading({
  id = "ai-input-with-loading",
  placeholder = "Ask me anything!",
  minHeight = 56,
  maxHeight = 200,
  loadingDuration = 3000,
  thinkingDuration = 1000,
  onSubmit,
  className,
  autoAnimate = false,
  settingsButton
}: AIInputWithLoadingProps) {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(autoAnimate);
  const [isAnimating, setIsAnimating] = useState(autoAnimate);
  const [isFocused, setIsFocused] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const runAnimation = () => {
      if (!isAnimating) return;
      setSubmitted(true);
      setProgress(0);
      
      // Start progress animation
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          const increment = 100 / (loadingDuration / 30); // Calculate increment to finish in loadingDuration
          const newValue = prev + increment;
          return newValue >= 100 ? 100 : newValue;
        });
      }, 30);
      
      timeoutId = setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(0);
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, thinkingDuration);
      }, loadingDuration);
    };

    if (isAnimating) {
      runAnimation();
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
    };
  }, [isAnimating, loadingDuration, thinkingDuration]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || submitted) return;
    
    setSubmitted(true);
    setProgress(0);
    
    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = 100 / (loadingDuration / 30);
        const newValue = prev + increment;
        return newValue >= 100 ? 100 : newValue;
      });
    }, 30);
    
    await onSubmit?.(inputValue);
    setInputValue("");
    adjustHeight(true);
    
    clearInterval(progressInterval);
    setTimeout(() => {
      setProgress(0);
      setSubmitted(false);
    }, loadingDuration);
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative w-full flex items-start flex-col gap-2">
        <div 
          className={cn(
            "relative w-full rounded-xl overflow-hidden",
            "transition-all duration-200",
            "bg-zinc-50 dark:bg-zinc-800",
            "border border-zinc-200 dark:border-zinc-700",
            "shadow-sm",
            isFocused && "ring-1 ring-zinc-400 dark:ring-zinc-500"
          )}
        >
          {settingsButton && (
            <div className="absolute left-3 bottom-3 z-20">
              {settingsButton}
            </div>
          )}
          
          <Textarea
            id={id}
            placeholder={placeholder}
            className={cn(
              "bg-transparent w-full px-6 py-4",
              settingsButton && "pl-14",
              "placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
              "border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
              "text-zinc-900 dark:text-zinc-100 resize-none text-wrap leading-[1.2]",
              "z-10 relative",
              `min-h-[${minHeight}px]`
            )}
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={submitted}
          />
        </div>
        
        {submitted && (
          <div className="w-full mt-2 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
              <span>Generating...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all duration-300 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingAnimationProps {
  progress: number;
  text: string;
  subText?: string;
  className?: string;
}

export function LoadingAnimation({ progress, text, subText, className }: LoadingAnimationProps) {
  // Animation variants for the loading circle
  const circleVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        ease: "linear",
        repeat: Infinity
      }
    }
  };

  // Animation variants for the gradient overlay
  const gradientVariants = {
    initial: { rotate: 0, scale: 0.8 },
    animate: {
      rotate: -360,
      scale: 1.2,
      transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  // Animation variants for the text
  const textVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center bg-zinc-900/20 dark:bg-zinc-900/60 backdrop-blur-sm",
      className
    )}>
      <Card className="w-full max-w-md border-0 bg-transparent">
        <CardContent className="flex flex-col items-center gap-6 p-6">
          <div className="relative">
            {/* Main spinning circle */}
            <motion.div
              className="w-20 h-20 rounded-full border-4 border-transparent border-t-fuchsia-500 border-r-violet-500"
              variants={circleVariants}
              initial="initial"
              animate="animate"
            />
            
            {/* Gradient overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/20 via-transparent to-violet-500/20 rounded-full blur-sm"
              variants={gradientVariants}
              initial="initial"
              animate="animate"
            />
            
            {/* Progress circle */}
            <svg
              className="absolute inset-0 w-20 h-20 rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                className="text-zinc-200 dark:text-zinc-700 stroke-current"
                strokeWidth="4"
                fill="transparent"
                r="38"
                cx="50"
                cy="50"
              />
              <motion.circle
                className="text-fuchsia-500 stroke-current"
                strokeWidth="4"
                fill="transparent"
                r="38"
                cx="50"
                cy="50"
                strokeDasharray={`${progress * 2.38}, 238`}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            </svg>
          </div>
          
          {/* Loading text */}
          <motion.div
            className="space-y-2 text-center"
            variants={textVariants}
            initial="initial"
            animate="animate"
          >
            <motion.p
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              key={text} // Force animation to restart when text changes
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {text}
            </motion.p>
            {subText && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {subText}
              </p>
            )}
          </motion.div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
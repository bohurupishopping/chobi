import { useRef, useCallback } from "react";

interface UseAutoResizeTextareaProps {
  minHeight?: number;
  maxHeight?: number;
}

export function useAutoResizeTextarea({ 
  minHeight = 56, 
  maxHeight = 200 
}: UseAutoResizeTextareaProps = {}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = useCallback((reset = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (reset) {
      textarea.style.height = `${minHeight}px`;
      return;
    }

    textarea.style.height = "0";
    const scrollHeight = textarea.scrollHeight;
    
    const newHeight = Math.max(
      minHeight,
      Math.min(maxHeight, scrollHeight)
    );
    
    textarea.style.height = `${newHeight}px`;
  }, [minHeight, maxHeight]);

  return { textareaRef, adjustHeight };
} 
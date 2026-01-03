import { useEffect, useRef, useState, useCallback } from "react";

export function useAutoScroll<T>(dependency: T) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastScrollHeight = useRef(0);

  // Detect if user is near bottom
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Consider "at bottom" if within 50px
    setShouldAutoScroll(distanceFromBottom < 50);
  }, []);

  // Auto-scroll when content changes (only if user was already at bottom)
  useEffect(() => {
    if (!scrollRef.current) return;

    const { scrollHeight } = scrollRef.current;

    // Only auto-scroll if:
    // 1. User was already at bottom (shouldAutoScroll is true)
    // 2. Content actually increased (new message)
    if (shouldAutoScroll && scrollHeight > lastScrollHeight.current) {
      scrollRef.current.scrollTop = scrollHeight;
    }

    lastScrollHeight.current = scrollHeight;
  }, [dependency, shouldAutoScroll]);

  // Force scroll to bottom (for when user sends a message)
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setShouldAutoScroll(true);
    }
  }, []);

  return { scrollRef, handleScroll, scrollToBottom };
}

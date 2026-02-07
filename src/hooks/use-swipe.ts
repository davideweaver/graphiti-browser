import { useEffect, useRef } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface UseSwipeOptions {
  threshold?: number; // Minimum distance for swipe (default: 50px)
  edgeThreshold?: number; // Distance from edge to trigger edge swipe (default: 50px)
  preventScroll?: boolean; // Prevent scroll during swipe (default: false)
  shouldHandleSwipe?: (direction: 'left' | 'right' | 'up' | 'down', startX: number, startY: number) => boolean;
}

export function useSwipe(
  handlers: SwipeHandlers,
  options: UseSwipeOptions = {}
) {
  const {
    threshold = 50,
    edgeThreshold = 50,
    preventScroll = false,
    shouldHandleSwipe,
  } = options;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);
  const shouldPreventDefaultRef = useRef<boolean>(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwipingRef.current = true;
      // Don't prevent default here - wait to see if it's actually a swipe
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipingRef.current) return;

      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;

      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = touchEndY.current - touchStartY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // If we already determined we should prevent default, do it
      if (shouldPreventDefaultRef.current) {
        e.preventDefault();
        return;
      }

      // Only start preventing once we detect clear horizontal movement (5px threshold)
      // This allows taps and vertical scrolls to work normally
      if (absDeltaX > 5 || absDeltaY > 5) {
        // Determine if this is a horizontal swipe that we should handle
        if (absDeltaX > absDeltaY) {
          const direction = deltaX > 0 ? 'right' : 'left';

          // Check if we should handle this swipe
          if (shouldHandleSwipe) {
            const shouldHandle = shouldHandleSwipe(
              direction,
              touchStartX.current,
              touchStartY.current
            );
            if (shouldHandle) {
              shouldPreventDefaultRef.current = true;
              e.preventDefault();
            }
          } else if (preventScroll) {
            e.preventDefault();
          }
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isSwipingRef.current) return;

      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = touchEndY.current - touchStartY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Only process if horizontal swipe is more significant than vertical
      if (absDeltaX > absDeltaY && absDeltaX > threshold) {
        if (deltaX > 0) {
          // Swipe right
          if (handlers.onSwipeRight) {
            // Check if swipe started from left edge for edge swipes
            if (touchStartX.current <= edgeThreshold) {
              handlers.onSwipeRight();
            }
          }
        } else {
          // Swipe left
          if (handlers.onSwipeLeft) {
            handlers.onSwipeLeft();
          }
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }

      isSwipingRef.current = false;
      shouldPreventDefaultRef.current = false;
      touchStartX.current = 0;
      touchStartY.current = 0;
      touchEndX.current = 0;
      touchEndY.current = 0;
    };

    // Add event listeners
    // touchstart must be non-passive to allow preventDefault for browser gestures
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handlers, threshold, edgeThreshold, preventScroll]);
}

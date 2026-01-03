import { useEffect } from "react";

export default function useScrollToTop(shouldScroll = true) {
  useEffect(() => {
    if (shouldScroll) {
      window.scrollTo(0, 0);
    }
  }, [shouldScroll]);
}

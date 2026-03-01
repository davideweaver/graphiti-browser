import { useState, useEffect } from "react";

export function useWidthBreakpoint(breakpoint: number) {
  const [isBelow, setIsBelow] = useState<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => {
      setIsBelow(mql.matches);
    };

    // Set initial value
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsBelow(mql.matches);

    // Listen for changes
    mql.addEventListener("change", onChange);

    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isBelow;
}

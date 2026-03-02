import * as ReactDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export type BaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  footer?: React.ReactNode;
  footerHeight?: number;
  children: React.ReactNode;
};

export function BaseDialog({
  open,
  onOpenChange,
  title,
  footer,
  footerHeight = 64,
  children,
}: BaseDialogProps) {
  const headerHeight = 64;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const prevBodyStyle = useRef<{
    overflow?: string;
    position?: string;
    top?: string;
  } | null>(null);
  const savedScrollY = useRef<number>(0);

  // Pin the dialog to the visual viewport.
  //
  // On iOS, position:fixed elements are anchored to the layout viewport, not the
  // visual viewport. When the keyboard appears and iOS pans the visual viewport to
  // keep a focused input visible, fixed elements shift visually off-screen.
  //
  // The fix: directly set the dialog content's `top` and `height` to match the
  // visual viewport on every resize/scroll event. The inner layout is a simple
  // flex column — header and footer are flex children that naturally stay at the
  // visible edges; the scroll area fills whatever space remains.
  //
  // visualViewport.resize fires when the keyboard appears/disappears.
  // visualViewport.scroll fires when iOS pans the viewport (offsetTop changes).
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;

    function layout() {
      const el = contentRef.current;
      if (!el) return;
      const top = vv ? Math.round(vv.offsetTop) : 0;
      const height = vv ? Math.round(vv.height) : window.innerHeight;
      el.style.top = `${top}px`;
      el.style.height = `${height}px`;

      // Apply negative margin only when the keyboard is visible (visual viewport
      // is meaningfully shorter than the layout viewport).
      const keyboardVisible = vv ? window.innerHeight - vv.height > 150 : false;
      if (footerRef.current) {
        footerRef.current.style.marginBottom = keyboardVisible ? "-40px" : "0px";
      }
    }

    vv?.addEventListener("resize", layout);
    vv?.addEventListener("scroll", layout);
    window.addEventListener("orientationchange", layout);
    layout();

    return () => {
      vv?.removeEventListener("resize", layout);
      vv?.removeEventListener("scroll", layout);
      window.removeEventListener("orientationchange", layout);
    };
  }, [open]);

  // lock background scroll while dialog is open (and restore on close)
  useEffect(() => {
    if (!open) {
      // restore
      if (prevBodyStyle.current) {
        document.body.style.overflow = prevBodyStyle.current.overflow ?? "";
        document.body.style.position = prevBodyStyle.current.position ?? "";
        document.body.style.top = prevBodyStyle.current.top ?? "";
        const y = savedScrollY.current;
        if (typeof y === "number") window.scrollTo(0, y);
      }
      prevBodyStyle.current = null;
      return;
    }

    // save and lock
    prevBodyStyle.current = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
    };
    savedScrollY.current = window.scrollY;
    // freeze page behind dialog (prevents iOS from moving the page)
    document.body.style.overflow = "hidden";
    // use fixed positioning to freeze the scroll location
    document.body.style.position = "fixed";
    document.body.style.top = `-${window.scrollY}px`;

    return () => {
      // cleanup will be handled by the open=false branch above
    };
  }, [open]);

  // ensure focused inputs scroll into the dialog's scroll container (not the page)
  useEffect(() => {
    function onFocusIn(e: FocusEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (
        !(
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          (target as HTMLElement).isContentEditable
        )
      )
        return;

      // nearest scrollable ancestor should be our scrollRef; ensure it scrolls if needed
      const scroller = scrollRef.current;
      if (!scroller) return;

      // wait for keyboard to fully settle before adjusting scroll
      setTimeout(() => {
        try {
          const rect = target.getBoundingClientRect();
          const scRect = scroller.getBoundingClientRect();
          if (rect.bottom > scRect.bottom) {
            scroller.scrollTop += rect.bottom - scRect.bottom + 8;
          } else if (rect.top < scRect.top) {
            scroller.scrollTop -= scRect.top - rect.top + 8;
          }
        } catch {
          /* ignore */
        }
      }, 150);
    }

    window.addEventListener("focusin", onFocusIn, true);
    return () => window.removeEventListener("focusin", onFocusIn, true);
  }, []);

  if (!open) return null;

  return (
    <ReactDialog.Root open={open} onOpenChange={onOpenChange}>
      <ReactDialog.Portal>
        <ReactDialog.Overlay className="fixed inset-0 z-[1000] bg-black/50" />

        {/*
         * ReactDialog.Content covers the full screen (inset-0) so its bg-background
         * fills the gap behind the keyboard. The inner wrapper is sized to the visual
         * viewport via JS (top/height) so the flex layout stays within the visible area.
         */}
        <ReactDialog.Content
          aria-label="dialog-content"
          className="fixed inset-0 z-[1001] bg-background max-w-4xl mx-auto overflow-hidden"
        >
          <div
            ref={contentRef}
            className="absolute inset-x-0 flex flex-col overflow-hidden"
            style={{ top: 0, height: "100dvh" }}
          >
            {/* header */}
            <div
              aria-label="dialog-header"
              className="bg-background shrink-0"
              style={{
                height: `calc(${headerHeight}px + env(safe-area-inset-top))`,
                paddingTop: `calc(12px + env(safe-area-inset-top))`,
                paddingLeft: "16px",
                paddingRight: "16px",
                paddingBottom: "24px",
                zIndex: 1002,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <ReactDialog.Title className="text-2xl font-bold">
                    {title}
                  </ReactDialog.Title>
                </div>
                <ReactDialog.Close className="rounded hover:bg-muted-foreground/30">
                  <X className="h-8 w-8" />
                </ReactDialog.Close>
              </div>
            </div>

            {/* scroll area: fills remaining space between header and footer */}
            <div
              ref={scrollRef}
              aria-label="dialog-scroll"
              className="flex-1 overflow-y-auto"
              style={{
                WebkitOverflowScrolling: "touch",
                padding: "12px 16px",
              }}
            >
              {children}
            </div>

            {/* footer */}
            <div
              ref={footerRef}
              aria-label="dialog-footer"
              className="bg-background shrink-0"
              style={{
                height: `calc(${footerHeight}px + env(safe-area-inset-bottom))`,
                padding: `12px 16px env(safe-area-inset-bottom)`,
                zIndex: 1003,
              }}
            >
              {footer}
            </div>
          </div>
        </ReactDialog.Content>
      </ReactDialog.Portal>
    </ReactDialog.Root>
  );
}

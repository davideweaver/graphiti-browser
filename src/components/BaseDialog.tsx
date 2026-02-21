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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevBodyStyle = useRef<{
    overflow?: string;
    position?: string;
    top?: string;
  } | null>(null);
  const savedScrollY = useRef<number>(0);

  // compute keyboard height via visualViewport (clamped) and set --keyboard-offset
  useEffect(() => {
    const viewport = window.visualViewport;
    let raf = 0;

    function update() {
      if (!viewport) {
        document.documentElement.style.setProperty("--keyboard-offset", "0px");
        return;
      }
      // keyboard height = difference between layout viewport (window.innerHeight) and visual viewport height
      const raw = Math.max(0, window.innerHeight - viewport.height);
      // clamp so garbage/floaty values don't blow things up
      const clamped = Math.min(raw, Math.floor(window.innerHeight / 2));
      document.documentElement.style.setProperty(
        "--keyboard-offset",
        `${clamped}px`
      );
    }

    function schedule() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }

    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule); // some browsers change offset on scroll
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    // clear keyboard offset when focus leaves inputs (keyboard closed)
    function onFocusOut() {
      setTimeout(() => {
        const a = document.activeElement;
        if (
          !(
            a &&
            (a.tagName === "INPUT" ||
              a.tagName === "TEXTAREA" ||
              (a as HTMLElement).isContentEditable)
          )
        ) {
          document.documentElement.style.setProperty(
            "--keyboard-offset",
            "0px"
          );
        } else {
          schedule();
        }
      }, 50);
    }
    window.addEventListener("focusout", onFocusOut);
    window.addEventListener("focusin", schedule);

    update();
    return () => {
      cancelAnimationFrame(raf);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("focusin", schedule);
      document.documentElement.style.removeProperty("--keyboard-offset");
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

      // small delay so browser has updated visualViewport
      setTimeout(() => {
        // scroll the input into view within the scroller
        // block: 'nearest' avoids moving header
        try {
          (target as HTMLElement).scrollIntoView({
            block: "nearest",
            inline: "nearest",
            behavior: "auto",
          });
          // as a fallback, ensure scroller scrollTop ensures target is visible
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
      }, 50);
    }

    window.addEventListener("focusin", onFocusIn, true);
    return () => window.removeEventListener("focusin", onFocusIn, true);
  }, []);

  if (!open) return null;

  // CSS helper — we use CSS vars: --keyboard-offset
  // layout:
  // - ReactDialog.Content fills viewport (fixed)
  // - header fixed top: 0
  // - footer fixed bottom: calc(env(safe-area-inset-bottom) + var(--keyboard-offset))
  // - scroll area absolute between header and footer and scrolls with webkit momentum
  return (
    <ReactDialog.Root open={open} onOpenChange={onOpenChange}>
      <ReactDialog.Portal>
        <ReactDialog.Overlay className="fixed inset-0 z-[1000] bg-black/50" />

        <ReactDialog.Content
          aria-label="dialog-content"
          className="fixed inset-0 z-[1001] bg-background max-w-4xl mx-auto"
        >
          {/* header: fixed so it never scrolls away */}
          <div
            aria-label="dialog-header"
            className="bg-background max-w-4xl mx-auto"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              top: 0,
              height: `${headerHeight}px`,
              zIndex: 1002,
              padding: "12px 16px 24px",
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

          {/* scroll area: positioned between header & footer */}
          <div
            ref={scrollRef}
            aria-label="dialog-scroll"
            style={{
              position: "absolute",
              top: `${headerHeight}px`,
              left: 0,
              right: 0,
              bottom: `calc((${footerHeight}px + env(safe-area-inset-bottom) + var(--keyboard-offset, 0px)))`,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: "12px 16px",
            }}
          >
            {children}
          </div>

          {/* footer: fixed bottom and moved up by keyboard offset + safe area */}
          <div
            aria-label="dialog-footer"
            className="bg-background max-w-4xl mx-auto"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              top: `calc(100dvh - (${footerHeight}px + env(safe-area-inset-bottom) + var(--keyboard-offset, 0px)))`,
              bottom: 0,
              zIndex: 1003,
              padding: "12px 16px",
              transition: "bottom 150ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            {footer}
          </div>
        </ReactDialog.Content>
      </ReactDialog.Portal>
    </ReactDialog.Root>
  );
}

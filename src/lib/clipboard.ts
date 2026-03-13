/**
 * Cross-browser clipboard utility with fallback for mobile Safari.
 *
 * Key iOS Safari gotchas:
 * - navigator.clipboard.writeText() can fail inside modals
 * - execCommand('copy') requires the element to be focused
 * - focus() must happen inside the dialog's focus-trap container
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Modern clipboard API (desktop Safari, Chrome, Firefox)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to legacy approach
    }
  }

  // Fallback: input + execCommand
  // Use <input readonly> — more reliable than <textarea> on iOS Safari
  const el = document.createElement("input");
  el.value = text;
  el.setAttribute("readonly", "");

  // Position off-screen but not display:none (needs to be in layout for focus to work)
  el.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.0001;pointer-events:none;";

  // Append inside the active dialog so Radix focus-trap doesn't block focus()
  const container =
    (document.querySelector('[role="dialog"]') as HTMLElement) ?? document.body;
  container.appendChild(el);

  // iOS Safari requires focus() before setSelectionRange
  el.focus({ preventScroll: true });
  el.setSelectionRange(0, text.length);

  document.execCommand("copy");
  container.removeChild(el);
}

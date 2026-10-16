// Copies text, falling back to the older copy command where browsers hide
// the Clipboard API. They only expose it on https and localhost, so it's
// missing when the dev server is opened at a plain-http LAN address.
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Permission denied; try the fallback below.
    }
  }

  const previousFocus = document.activeElement as HTMLElement | null;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";

  // While a modal <dialog> is open, everything outside it can't be focused,
  // so the hidden textarea has to go inside the dialog.
  const container = previousFocus?.closest("dialog") ?? document.body;
  container.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  previousFocus?.focus();

  if (!copied) throw new Error("The browser refused to copy.");
}

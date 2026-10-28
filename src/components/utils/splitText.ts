/**
 * Arabic-safe text splitting.
 *
 * Arabic letters must stay joined, so Arabic text is split into WORDS.
 * Latin display text (like "SADOK") may be split into characters.
 * Every unit is wrapped in an inline-block with overflow hidden, which keeps
 * line wrapping correct and never alters the source text permanently.
 */

export type SplitMode = "auto" | "words" | "chars";

const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

export function splitText(
  element: HTMLElement | null,
  mode: SplitMode = "auto"
): HTMLElement[] {
  if (!element || element.dataset.split === "done") return [];

  const text = element.textContent ?? "";
  if (!text.trim()) return [];

  // Never destroy nested markup (links, spans, icons).
  if (element.children.length > 0) return [];

  const resolved: SplitMode =
    mode === "auto" ? (ARABIC.test(text) ? "words" : "chars") : mode;

  const tokens =
    resolved === "words" ? text.split(/(\s+)/) : Array.from(text);

  const fragment = document.createDocumentFragment();
  const units: HTMLElement[] = [];

  for (const token of tokens) {
    if (!token) continue;

    if (/^\s+$/.test(token)) {
      fragment.appendChild(document.createTextNode(" "));
      continue;
    }

    const outer = document.createElement("span");
    outer.className = "split-word";

    const inner = document.createElement("span");
    inner.textContent = token;

    outer.appendChild(inner);
    fragment.appendChild(outer);
    units.push(inner);
  }

  element.textContent = "";
  element.appendChild(fragment);
  element.dataset.split = "done";

  return units;
}

export function resetSplit(element: HTMLElement | null) {
  if (!element || element.dataset.split !== "done") return;
  const text = element.textContent ?? "";
  element.textContent = text;
  delete element.dataset.split;
}

export default splitText;

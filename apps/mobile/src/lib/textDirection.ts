export type TextDirection = "ltr" | "rtl";

const LETTER_CHARACTER = /^\p{Letter}$/u;
const RTL_SCRIPT_CHARACTER =
  /^[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff\u{10800}-\u{10fff}\u{1e800}-\u{1eeff}]$/u;
const INLINE_MARKDOWN_CODE = /`[^`\n]*`/g;

function stripFencedMarkdownCode(markdown: string): string {
  let fence: { character: "`" | "~"; length: number } | undefined;
  const proseLines: string[] = [];

  for (const line of markdown.split(/\r?\n/)) {
    const fenceLine = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);

    if (!fence) {
      const marker = fenceLine?.[1];
      const suffix = fenceLine?.[2] ?? "";
      if (marker && (marker[0] === "~" || !suffix.includes("`"))) {
        fence = { character: marker[0] as "`" | "~", length: marker.length };
        continue;
      }

      proseLines.push(line);
      continue;
    }

    const marker = fenceLine?.[1];
    const suffix = fenceLine?.[2] ?? "";
    if (
      marker?.[0] === fence.character &&
      marker.length >= fence.length &&
      /^[\t ]*$/.test(suffix)
    ) {
      fence = undefined;
    }
  }

  return proseLines.join("\n");
}

export function resolveTextDirection(text: string): TextDirection {
  for (const character of text) {
    if (!LETTER_CHARACTER.test(character)) continue;
    return RTL_SCRIPT_CHARACTER.test(character) ? "rtl" : "ltr";
  }
  return "ltr";
}

export function resolveMarkdownTextDirection(markdown: string): TextDirection {
  return resolveTextDirection(stripFencedMarkdownCode(markdown).replace(INLINE_MARKDOWN_CODE, ""));
}

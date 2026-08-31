export type TextDirection = "ltr" | "rtl";

const LETTER_CHARACTER = /^\p{Letter}$/u;
const RTL_SCRIPT_CHARACTER =
  /^[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff\u{10800}-\u{10fff}\u{1e800}-\u{1eeff}]$/u;
const GITHUB_ALERT_MARKER =
  /^ {0,3}(?:> {0,3})+\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][\t ]*$/gimu;
const INDENTED_CODE_LINE = /^(?: {4}|\t| {0,3}(?:> ?)+(?: {4}|\t))/;

function stripFencedMarkdownCode(markdown: string): string {
  let fence: { character: "`" | "~"; length: number } | undefined;
  const proseLines: string[] = [];

  for (const line of markdown.split(/\r\n|\r|\n/)) {
    const fenceLine = line.match(/^ {0,3}(?:> {0,3})*(`{3,}|~{3,})(.*)$/);

    if (!fence) {
      const marker = fenceLine?.[1];
      const suffix = fenceLine?.[2] ?? "";
      if (marker && (marker[0] === "~" || !suffix.includes("`"))) {
        fence = { character: marker[0] as "`" | "~", length: marker.length };
        continue;
      }

      if (!INDENTED_CODE_LINE.test(line)) proseLines.push(line);
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

function stripInlineMarkdownCode(markdown: string): string {
  let prose = "";
  let index = 0;

  while (index < markdown.length) {
    if (markdown[index] !== "`") {
      prose += markdown[index];
      index += 1;
      continue;
    }

    const openingStart = index;
    while (markdown[index] === "`") index += 1;
    const delimiterLength = index - openingStart;
    let searchIndex = index;
    let closingEnd: number | undefined;

    while (searchIndex < markdown.length) {
      const closingStart = markdown.indexOf("`", searchIndex);
      if (closingStart === -1) break;

      let runEnd = closingStart;
      while (markdown[runEnd] === "`") runEnd += 1;
      if (runEnd - closingStart === delimiterLength) {
        closingEnd = runEnd;
        break;
      }
      searchIndex = runEnd;
    }

    if (closingEnd !== undefined) {
      index = closingEnd;
      continue;
    }

    prose += markdown.slice(openingStart, index);
  }

  return prose;
}

export function resolveTextDirection(text: string): TextDirection {
  for (const character of text) {
    if (!LETTER_CHARACTER.test(character)) continue;
    return RTL_SCRIPT_CHARACTER.test(character) ? "rtl" : "ltr";
  }
  return "ltr";
}

export function resolveMarkdownTextDirection(markdown: string): TextDirection {
  return resolveTextDirection(
    stripInlineMarkdownCode(stripFencedMarkdownCode(markdown).replace(GITHUB_ALERT_MARKER, "")),
  );
}

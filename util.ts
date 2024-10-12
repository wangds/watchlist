import { ElementHandle } from "puppeteer";

type TextTransform = (text: string) => string;

/**
 * Find the first ancestor of a HTML element with the given HTML tag.
 */
function findAncestor(
  el: HTMLElement | null,
  tagName: string,
): HTMLElement | null {
  // tagName has the value "elementExample". Note that this is case-preserving
  // in XML, as are all of the operations of the DOM. The HTML DOM returns the
  // tagName of an HTML element in the canonical uppercase form, regardless of
  // the case in the source HTML document.
  //
  //  https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-745549614
  tagName = tagName.toUpperCase();
  while (el && el.tagName !== tagName) {
    el = el.parentElement;
  }
  return el;
}

/**
 * Return the date in YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  function zeroPad(num: number): string {
    return num.toString().padStart(2, "0");
  }

  const year = date.getFullYear().toString();
  const month = zeroPad(date.getMonth() + 1);
  const day = zeroPad(date.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Return the minimum value, ignoring undefined values.
 * Return undefined if all arguments are undefined.
 */
function minCoalesce(...args: (number | undefined)[]): number | undefined {
  const nums = args.filter(Number.isFinite) as number[];
  return nums.length > 0 ? Math.min(...nums) : undefined;
}

/**
 * Parse the price in cents, stripping out common patterns (e.g. dollar signs).
 * Return undefined on error.
 */
function parsePrice(str: string | undefined): number | undefined {
  str = str?.replaceAll("$", " ");
  const num = Math.round(Number(str) * 100);
  return Number.isInteger(num) ? num : undefined;
}

/**
 * Extract the text content from the selector and optionally transform it.
 *
 * Differs from Puppeteer ElementHandle.$eval() in that it doesn't throw if the
 * selector doesn't find a node.
 */
async function selectTextContent(
  selector: Promise<ElementHandle | null>,
  transform: TextTransform | null = null,
): Promise<string | undefined> {
  const node = await selector;
  let text = await node?.evaluate((node) => node.textContent);
  if (text && transform) text = transform(text);
  return text ?? undefined;
}

export default {
  findAncestor,
  formatDate,
  minCoalesce,
  parsePrice,
  selectTextContent,
};

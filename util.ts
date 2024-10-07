import { ElementHandle } from "puppeteer";

type TextTransform = (text: string) => string;

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
  formatDate,
  minCoalesce,
  parsePrice,
  selectTextContent,
};

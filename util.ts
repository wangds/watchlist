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

export default {
  formatDate,
  minCoalesce,
};

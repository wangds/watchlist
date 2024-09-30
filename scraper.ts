import puppeteer from "puppeteer";
import util from "./util";

// Shim for allowing async function creation via new Function
//  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction
// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = async function () {}.constructor;

interface ScrapeResult {
  price: number | undefined;
  discount: number | undefined;
}

/**
 * Evaluate a script on this page to extract information.
 * The "script" parameter is the body of a JavaScript async function.
 * It should return a ScrapeResult object.
 *
 *  async function(page, util) {
 *    const price = util.parsePrice(await page.$eval(".Price", node => node.textContent));
 *    const discount = ...
 *    return { price, discount };
 *  }
 */
async function scrape(
  url: URL,
  script: string,
): Promise<ScrapeResult | undefined> {
  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Setting the default timeout to 10 seconds (10000 milliseconds)
    page.setDefaultTimeout(10000);

    await page.goto(url.href);
    await page.setViewport({ width: 1080, height: 1024 });

    // eslint-disable-next-line
    const result = await AsyncFunction("page", "util", script)(page, util);

    if ("price" in result && "discount" in result) {
      return result as ScrapeResult;
    } else {
      throw new Error(`Invalid ScrapeResult, was ${JSON.stringify(result)}`);
    }
  } catch (err: unknown) {
    console.error(`Error in ${url.hostname} script:\n${script}`);
    console.error(err);
    return undefined;
  } finally {
    await browser?.close();
  }
}

export default scrape;

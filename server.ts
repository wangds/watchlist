import express, { Express, Request, Response } from "express";
import { Database, DatabaseReadOnly } from "./database";
import scrape from "./scraper";
import util from "./util";

const app: Express = express();
app.use(express.json());

Database.create();

/**
 * Insert a new item (description and url) into the watchlist.
 * Returns the new WatchlistItem.
 */
interface PutItemInterface {
  description: string;
  url: string;
}

app.put("/api/item", async (req: Request, res: Response) => {
  let db;
  try {
    const body = req.body as PutItemInterface;
    if (
      req.body === undefined ||
      !("description" in req.body) ||
      !("url" in req.body) ||
      !URL.canParse(body.url)
    ) {
      // Data validation failed.
      // return: 400 bad request.
      res.status(400).send();
      return;
    }

    const url = new URL(body.url);

    db = Database.open();
    const id = await db.insertItem(body.description, url);
    const insertedItem = await db.getItem(id);
    await db.insertScriptIfNotExist(url);

    // Everything went smoothly.
    // return 200 ok and new WatchlistItem.
    res.status(200).send(insertedItem);
  } catch (err: unknown) {
    // Unknown exception.
    // return: 500 internal server error.
    console.error(err);
    res.status(500).send(err);
  } finally {
    db?.close();
  }
});

/**
 * Get the list of WatchlistItems from the database.
 */
app.get("/api/items", async (_req: Request, res: Response) => {
  let db;
  try {
    db = DatabaseReadOnly.open();
    const items = await db.getItems();
    res.send(items);
  } catch (err: unknown) {
    // Unknown exception.
    // return: 500 internal server error.
    console.error(err);
    res.status(500).send(err);
  } finally {
    db?.close();
  }
});

/**
 * Sync price information from upstream for the given WatchlistItem.
 * Returns the updated WatchlistItem.
 */
app.post("/api/update-item/:id", async (req: Request, res: Response) => {
  let db;
  try {
    const id = Number(req.params.id);

    db = DatabaseReadOnly.open();
    const item = await db.getItem(id);
    if (!item) {
      // Item not found, so nothing to update!
      // return: 204 no content.
      res.status(204).send();
      return;
    }

    const url = new URL(item.url);
    const script = await db.getScript(url);
    if (!script) {
      // Script not found, can't proceed.
      // return: 501 not implemented.
      res.status(501).send(`Missing script for ${url.hostname}`);
      return;
    }

    const result = await scrape(url, script);
    if (!result) {
      // Error while processing the script.
      // return: 422 unprocessable content
      res.status(422).send(`Error evaluating script for ${url.hostname}`);
      return;
    }

    const now = new Date();
    const lowestPrice = util.minCoalesce(item.lowestPrice, result.price);

    db.close();
    db = Database.open();
    await db.updateItemPrice(
      item.id,
      now,
      lowestPrice,
      result.price,
      result.discount,
    );
    const updatedItem = await db.getItem(id);

    // Everything went smoothly.
    // return 200 ok and updated WatchlistItem.
    res.status(200).send(updatedItem);
  } catch (err: unknown) {
    // Unknown exception.
    // return: 500 internal server error.
    console.error(err);
    res.status(500).send(err);
  } finally {
    db?.close();
  }
});

export default app as unknown as () => void;

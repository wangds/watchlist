import express, { Express, Request, Response } from "express";
import { Database, DatabaseReadOnly } from "./database";

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

export default app as unknown as () => void;

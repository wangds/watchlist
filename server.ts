import express, { Express, Request, Response } from "express";
import { Database, DatabaseReadOnly } from "./database";

const app: Express = express();

Database.create();

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

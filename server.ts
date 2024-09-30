import express, { Express, Request, Response } from "express";
import { Database } from "./database";

const app: Express = express();

Database.create();

app.get("/api/hello", (_req: Request, res: Response) => {
  res.send("hello").end();
});

app.get("/api/world", (_req: Request, res: Response) => {
  res.send("world").end();
});

export default app as unknown as () => void;

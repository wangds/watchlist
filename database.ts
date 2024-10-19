import sqlite3 from "sqlite3";
import util from "./util";

const DatabaseFilePath = "./watchlist.db";

const DatabaseSchema = `
  CREATE TABLE IF NOT EXISTS "watchlist" (
    id INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    keepMonitoring INTEGER DEFAULT 1,
    dateUpdated TEXT,
    lowestPrice INTEGER,
    currentPrice INTEGER,
    currentDiscount INTEGER
  );

  CREATE TABLE IF NOT EXISTS "scripts" (
    domainName TEXT PRIMARY KEY,
    javascript TEXT NOT NULL
  );
`;

type SqlDataType = boolean | number | string | null;

export interface WatchlistDbItem {
  id: number;
  description: string;
  url: string;
  keepMonitoring: boolean;
  dateUpdated?: string;
  lowestPrice?: number;
  currentPrice?: number;
  currentDiscount?: number;
}

interface ScriptsDbItem {
  domainName: string;
  javascript: string;
}

export class DatabaseReadOnly {
  constructor(db: sqlite3.Database) {
    this.db = db;
  }

  db: sqlite3.Database;

  static open(): DatabaseReadOnly {
    const db = new sqlite3.Database(DatabaseFilePath, sqlite3.OPEN_READONLY);
    return new DatabaseReadOnly(db);
  }

  close(): void {
    this.db.close();
  }

  /**
   * Watchlist table
   */
  getItem(id: number): Promise<WatchlistDbItem | undefined> {
    const sql = `
      SELECT
        id, description, url, keepMonitoring,
        dateUpdated, lowestPrice, currentPrice, currentDiscount
      FROM watchlist
      WHERE id=?;
    `;

    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row: WatchlistDbItem | undefined) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  getItems(): Promise<WatchlistDbItem[]> {
    const sql = `
      SELECT
        id, description, url, keepMonitoring,
        dateUpdated, lowestPrice, currentPrice, currentDiscount
      FROM watchlist;
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows: WatchlistDbItem[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Scripts table
   */
  getScript(url: URL): Promise<string | undefined> {
    const sql = `
      SELECT javascript FROM scripts WHERE domainName=?;
    `;

    return new Promise((resolve, reject) => {
      this.db.get(
        sql,
        [url.hostname],
        (err, row: ScriptsDbItem | undefined) => {
          if (err) {
            reject(err);
          } else {
            resolve(row?.javascript);
          }
        },
      );
    });
  }
}

export class Database extends DatabaseReadOnly {
  static create(): void {
    const db = new sqlite3.Database(DatabaseFilePath);
    db.exec(DatabaseSchema);
    db.close();
  }

  static open(): Database {
    const db = new sqlite3.Database(DatabaseFilePath);
    return new Database(db);
  }

  /**
   * Watchlist table
   */
  insertItem(description: string, url: URL): Promise<number> {
    const sql = `
      INSERT INTO watchlist(description, url) VALUES (?,?)
      RETURNING id;
    `;

    return new Promise((resolve, reject) => {
      this.db.each(
        sql,
        [description, url.href],
        (err, row: WatchlistDbItem) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.id);
          }
        },
      );
    });
  }

  #updateItem(id: number, map: Map<string, SqlDataType>): Promise<void> {
    const entries = Array.from(map.entries());
    const keys = entries.map((kvp) => `${kvp[0]}=?`).join(", ");
    const vals = entries.map((kvp) => kvp[1]);

    const sql = `UPDATE watchlist SET ${keys} WHERE id=?`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [...vals, id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  updateItemMonitoring(id: number, keepMonitoring: boolean): Promise<void> {
    const map = new Map<string, SqlDataType>();
    map.set("keepMonitoring", keepMonitoring);
    return this.#updateItem(id, map);
  }

  updateItemPrice(
    id: number,
    date: Date,
    lowestPrice: number | undefined,
    currentPrice: number | undefined,
    currentDiscount: number | undefined,
  ): Promise<void> {
    const map = new Map<string, SqlDataType>();
    map.set("dateUpdated", util.formatDate(date));
    map.set("lowestPrice", lowestPrice ?? null);
    map.set("currentPrice", currentPrice ?? null);
    map.set("currentDiscount", currentDiscount ?? null);
    return this.#updateItem(id, map);
  }

  /**
   * Scripts table
   */
  insertScriptIfNotExist(url: URL): Promise<void> {
    const sql = `
      INSERT OR IGNORE INTO scripts(domainName, javascript) VALUES (?,?);
    `;

    const template = `
      const price = undefined;
      const discount = undefined;
      return { price, discount };
    `;
    const script = template.replace(/\n\s{6}/g, "\n").trim();

    return new Promise((resolve, reject) => {
      this.db.run(sql, [url.hostname, script], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  insertOrUpdateScript(url: URL, script: string): Promise<void> {
    const sql = `
      INSERT INTO scripts(domainName, javascript) VALUES (?,?)
      ON CONFLICT DO UPDATE SET javascript=?2;
    `;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [url.hostname, script], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

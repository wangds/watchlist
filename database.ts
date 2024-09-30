import sqlite3 from "sqlite3";

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

interface WatchlistDbItem {
  id: number;
  description: string;
  url: string;
  keepMonitoring: boolean;
  dateUpdated?: string;
  lowestPrice?: number;
  currentPrice?: number;
  currentDiscount?: number;
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
}

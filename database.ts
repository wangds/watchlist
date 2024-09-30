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
}

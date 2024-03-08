from collections.abc import Iterator
from contextlib import contextmanager
from sqlite3 import Connection, connect


class Database:
    def __init__(self, conn: Connection) -> None:
        self.conn = conn

    conn: Connection

    def create_tables(self) -> None:
        cur = self.conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS "watchlist" (
                id INTEGER PRIMARY KEY,
                description TEXT NOT NULL,
                url TEXT NOT NULL UNIQUE,
                date TEXT,
                price INTEGER,
                discount INTEGER
            );
            """)

    def insert_watchlist(self, description: str, url: str) -> None:
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO watchlist(description, url) VALUES (?, ?)",
            (description, url))
        self.conn.commit()


def open_database_unmanaged() -> Database:
    filename = "watchlist.db"
    conn = connect(filename)
    db = Database(conn)
    db.create_tables()
    return db


@contextmanager
def open_database() -> Iterator[Database]:
    try:
        db = open_database_unmanaged()
        yield db
    finally:
        db.conn.close()

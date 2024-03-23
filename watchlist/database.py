from collections.abc import Iterator
from contextlib import contextmanager
from sqlite3 import Connection, connect

from watchlist.items import WatchlistItem


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

    def select_watchlist(self) -> list[WatchlistItem]:
        cur = self.conn.cursor()
        cur.execute("""
            SELECT id, description, url, date, price, discount
            FROM watchlist ORDER BY description, price NULLS LAST, url
            """)
        return [WatchlistItem(*x) for x in cur.fetchall()]

    def select_outdated_watchlist(self, today: str) -> list[WatchlistItem]:
        cur = self.conn.cursor()
        cur.execute("""
            SELECT id, description, url, date, price, discount
            FROM watchlist WHERE date IS NULL OR date<>?
            """, (today,))
        return [WatchlistItem(*x) for x in cur.fetchall()]

    def update_watchlist(self, item: WatchlistItem) -> None:
        cur = self.conn.cursor()
        cur.execute(
            "UPDATE watchlist SET date=?, price=?, discount=? WHERE id=?",
            (item.date, item.price, item.discount, item.id))
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

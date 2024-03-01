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


def open_database() -> Database:
    filename = "watchlist.db"
    conn = connect(filename)
    db = Database(conn)
    db.create_tables()
    return db

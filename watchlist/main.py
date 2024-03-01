from watchlist.database import open_database


def main() -> None:
    db = open_database()
    print(db)

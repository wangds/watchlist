from argparse import ArgumentParser, Namespace

from watchlist.database import open_database
from watchlist.util import domain_name


def main_insert(args: Namespace) -> None:
    # Extract the domain name before insertion to avoid inserting bad urls
    domain = domain_name(args.url)
    with open_database() as db:
        db.insert_watchlist(args.desc, args.url)
    print(f"Inserted: {args.desc} ({domain})")


def main() -> None:
    parser = ArgumentParser(prog="watchlist")
    subparsers = parser.add_subparsers(required=True)

    insert_parser = subparsers.add_parser(
        "insert",
        help="add an item to the watchlist")
    insert_parser.set_defaults(func=main_insert)
    insert_parser.add_argument("-d", "--desc", required=True)
    insert_parser.add_argument("-u", "--url", required=True)

    args = parser.parse_args()
    args.func(args)

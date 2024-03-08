from argparse import ArgumentParser, Namespace

from watchlist.database import open_database
from watchlist.util import domain_name, format_price


def main_insert(args: Namespace) -> None:
    # Extract the domain name before insertion to avoid inserting bad urls
    domain = domain_name(args.url)
    with open_database() as db:
        db.insert_watchlist(args.desc, args.url)
    print(f"Inserted: {args.desc} ({domain})")


def main_list(_args: Namespace) -> None:
    with open_database() as db:
        items = db.select_watchlist()
    desc_width = max((len(item.description) for item in items), default=0)
    for item in items:
        price = format_price(item.price)
        discount = format_price(item.discount)
        print(
            f"| {item.description:{desc_width}}"
            f" | {price:>6}"
            f" | {discount:>6}"
            f" | {item.url}")


def main() -> None:
    parser = ArgumentParser(prog="watchlist")
    subparsers = parser.add_subparsers(required=True)

    insert_parser = subparsers.add_parser(
        "insert",
        help="add an item to the watchlist")
    insert_parser.set_defaults(func=main_insert)
    insert_parser.add_argument("-d", "--desc", required=True)
    insert_parser.add_argument("-u", "--url", required=True)

    list_parser = subparsers.add_parser(
        "list",
        help="list items in the watchlist")
    list_parser.set_defaults(func=main_list)

    args = parser.parse_args()
    args.func(args)

import itertools
from argparse import ArgumentParser, Namespace

from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

from watchlist.database import open_database
from watchlist.spider import Spider
from watchlist.util import domain_name, format_price, today


def get_spider(domain: str) -> type[Spider]:
    match domain:
        case domain:
            raise NotImplementedError(domain)


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


def main_update(args: Namespace) -> None:
    with open_database() as db:
        items = db.select_outdated_watchlist(today())
    item_groups = itertools.groupby(
        sorted(items, key=lambda item: item.url),
        lambda item: domain_name(item.url))

    settings = get_project_settings()
    settings.set(
        "ITEM_PIPELINES",
        {"watchlist.pipelines.DatabaseWriterPipeline": 300})
    process = CrawlerProcess(settings)

    for domain, group in item_groups:
        if spider := get_spider(domain):
            process.crawl(spider, start_items=list(group))

    process.start()
    main_list(args)


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

    update_parser = subparsers.add_parser(
        "update",
        help="update items in the watchlist")
    update_parser.set_defaults(func=main_update)

    args = parser.parse_args()
    args.func(args)

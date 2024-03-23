# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html

import scrapy

from watchlist.database import Database, open_database_unmanaged
from watchlist.items import WatchlistItem


class DatabaseWriterPipeline:
    db: Database

    def open_spider(self, _spider: scrapy.Spider) -> None:
        self.db = open_database_unmanaged()

    def close_spider(self, _spider: scrapy.Spider) -> None:
        self.db.conn.close()

    def process_item(self, item: WatchlistItem, _spider: scrapy.Spider) -> WatchlistItem:
        self.db.update_watchlist(item)
        return item

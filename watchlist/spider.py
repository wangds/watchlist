from collections.abc import Iterator

import scrapy
from scrapy.http import Response

from watchlist.items import WatchlistItem
from watchlist.util import today


class Spider(scrapy.Spider):
    start_items: list[WatchlistItem] = []

    def start_requests(self) -> Iterator[scrapy.Request]:
        for item in self.start_items:
            yield scrapy.Request(
                self.backend_url(item.url),
                callback=self.parse,
                cb_kwargs={"item": item})

    def parse(self, response: Response, **kwargs) -> WatchlistItem:
        item: WatchlistItem = kwargs["item"]
        self.update(response, item)
        item.date = today()
        return item

    def backend_url(self, url: str) -> str:
        return url

    def update(self, response: Response, item: WatchlistItem) -> None:
        raise NotImplementedError(item.url)

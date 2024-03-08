from dataclasses import dataclass


@dataclass
class WatchlistItem:
    id: int
    description: str
    url: str
    date: None | str = None
    price: None | int = None
    discount: None | int = None

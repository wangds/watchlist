def domain_name(url: str) -> str:
    # https://www.foo.com/bar/baz -> www.foo.com
    return url.split("/", 3)[2]


def format_price(price: None | int) -> str:
    return f"${price // 100}.{price % 100:02d}" if price else "-"

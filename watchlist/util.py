from datetime import date


def domain_name(url: str) -> str:
    # https://www.foo.com/bar/baz -> www.foo.com
    return url.split("/", 3)[2]


def format_price(price: None | int) -> str:
    return f"${price // 100}.{price % 100:02d}" if price else "-"


def parse_price(
    line: None | str,
    remove_prefix: str = "$",
    remove_suffix: str = "",
    value_if_not_found: None | int = None
) -> int:
    if line:
        if remove_prefix:
            line = line.removeprefix(remove_prefix)
        if remove_suffix:
            line = line.removesuffix(remove_suffix)

        # Expect dd or dd.c or dd.cc
        split = line.split(".", 1)
        cents = 0
        if len(split) == 2:
            if len(split[1]) == 1:
                cents = int(split[1]) * 10
            else:
                cents = int(split[1])
        return 100 * int(split[0]) + cents
    if value_if_not_found is not None:
        return value_if_not_found
    raise RuntimeError(f"No price: {line}")


def today() -> str:
    return date.today().isoformat()

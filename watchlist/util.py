def domain_name(url: str) -> str:
    # https://www.foo.com/bar/baz -> www.foo.com
    return url.split("/", 3)[2]

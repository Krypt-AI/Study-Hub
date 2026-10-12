---
id: ai-01-python.l01
title: Values, types and variables
summary: Numbers, strings, booleans and None; how names refer to values; formatting output with f-strings.
objectives:
  - Name Python's basic built-in types and predict the type of an expression
  - Explain the difference between `/` and `//`, and why `0.1 + 0.2 != 0.3`
  - Build readable output with f-strings
estimatedMinutes: 35
topics: [py.values]
resources:
  - { title: "Python tutorial: An informal introduction", url: "https://docs.python.org/3/tutorial/introduction.html", free: true, official: true }
  - { title: "Built-in types", url: "https://docs.python.org/3/library/stdtypes.html", free: true, official: true }
---

## Values have types

Every value in Python has a **type**, and the type decides what you can do with it. You can ask for it with `type()`:

```python
type(42)        # <class 'int'>
type(3.14)      # <class 'float'>
type("hi")      # <class 'str'>
type(True)      # <class 'bool'>
type(None)      # <class 'NoneType'>
```

| Type | Examples | Notes |
|---|---|---|
| `int` | `0`, `-7`, `10_000` | Whole numbers of any size (no overflow) |
| `float` | `3.14`, `1e-3` | Binary floating point, so some decimals are approximate |
| `str` | `"hello"`, `'日本語'` | Unicode text, immutable |
| `bool` | `True`, `False` | A subclass of `int` (`True + True == 2`) |
| `NoneType` | `None` | "No value": the result of a function that returns nothing |

## Variables are names

A variable is a **name bound to a value**, not a box. Assignment makes the name point at the value:

```python
score = 90
total = score          # both names refer to the same int object
score = score + 5      # rebinds `score`; `total` is still 90
```

Python is **dynamically typed**: a name can be rebound to a value of a different type. That is flexible, but it is why type hints (`score: int = 90`) and tests matter in larger programs.

## Arithmetic

```python
7 / 2    # 3.5   true division always returns a float
7 // 2   # 3     floor division
7 % 2    # 1     remainder
2 ** 10  # 1024  power
```

Floats are stored in binary, so `0.1 + 0.2` is `0.30000000000000004`. Compare floats with a tolerance, for example `math.isclose(a, b)`, never with `==` after arithmetic.

## Strings and f-strings

Strings are sequences of characters: you can index (`"python"[0] == "p"`), slice (`"python"[1:4] == "yth"`) and measure them (`len("python") == 6`). They are **immutable**: methods such as `.upper()` return a new string.

An **f-string** evaluates expressions inside braces:

```python
name, hours = "Aiko", 2.5
print(f"{name} studied for {hours:.1f} h")   # Aiko studied for 2.5 h
print(f"{hours * 60:.0f} minutes")           # 150 minutes
```

The part after `:` is a format spec: `.1f` means one decimal place.

## Truthiness

In a condition, Python treats `0`, `0.0`, `""`, `[]`, `{}`, `set()` and `None` as **falsy**; almost everything else is truthy. `if items:` is the idiomatic way to ask "is this list non-empty?".

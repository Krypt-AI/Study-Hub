---
id: ai-01-python.l03
title: Functions
summary: Defining functions, parameters and defaults, return values, scope, docstrings and type hints.
objectives:
  - Define functions with positional, keyword and default parameters
  - Explain local scope and why mutable default arguments are a trap
  - Document a function with a docstring and type hints
estimatedMinutes: 40
topics: [py.functions]
resources:
  - { title: "Defining functions", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions", free: true, official: true }
  - { title: "typing: support for type hints", url: "https://docs.python.org/3/library/typing.html", free: true, official: true }
---

## Defining and calling

```python
def accuracy(correct: int, total: int) -> float:
    """Return the share of correct answers, between 0 and 1."""
    if total == 0:
        return 0.0
    return correct / total

accuracy(8, 10)                 # positional arguments
accuracy(total=10, correct=8)   # keyword arguments, any order
```

- The text in triple quotes is the **docstring**; tools and `help()` show it.
- `correct: int` and `-> float` are **type hints**. Python does not enforce them at run time, but editors and checkers such as mypy use them to catch mistakes.
- A function without `return` (or with a bare `return`) returns `None`.

## Parameters

```python
def schedule(item, days=1, *, label="review"):
    return f"{label}: {item} in {days} day(s)"

schedule("猫")                     # 'review: 猫 in 1 day(s)'
schedule("猫", 3, label="new")     # parameters after * are keyword-only
```

`*args` collects extra positional arguments into a tuple and `**kwargs` collects extra keyword arguments into a dict. Use them sparingly; explicit parameters document themselves.

### The mutable default trap

Default values are evaluated **once**, when the function is defined:

```python
def add_tag(tag, tags=[]):        # bug: one list shared by every call
    tags.append(tag)
    return tags

add_tag("a")   # ['a']
add_tag("b")   # ['a', 'b']  surprise
```

Use `None` as the default and create the list inside: `tags = [] if tags is None else tags`.

## Scope

Names assigned inside a function are **local** to it. A function can read names from the enclosing module, but assigning to them creates a new local name unless you declare `global` (rarely a good idea; return a value instead).

## Functions are values

Functions can be passed around like any other value, which is how `sorted` takes a `key`:

```python
words = ["banana", "kiwi", "apple"]
sorted(words, key=len)              # ['kiwi', 'apple', 'banana']
sorted(words, key=lambda w: w[-1])  # sort by last letter
```

A `lambda` is a small anonymous function limited to one expression.

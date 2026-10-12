---
id: ai-01-python.l02
title: Control flow
summary: Branching with if/elif/else, looping with for and while, and comprehensions.
objectives:
  - Write conditions with comparison and boolean operators
  - Loop over sequences and ranges, and use break and continue correctly
  - Rewrite a simple loop as a list comprehension
estimatedMinutes: 40
topics: [py.control]
resources:
  - { title: "More control flow tools", url: "https://docs.python.org/3/tutorial/controlflow.html", free: true, official: true }
  - { title: "List comprehensions", url: "https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions", free: true, official: true }
---

## Branching

```python
def grade(score: int) -> str:
    if score >= 80:
        return "A"
    elif score >= 65:
        return "B"
    else:
        return "C"
```

Python checks the conditions **top to bottom** and runs only the first branch that is true, so order matters: testing `score >= 65` first would give every A student a B.

Comparisons chain naturally: `0 <= x < 10`. Combine conditions with `and`, `or` and `not`; they **short-circuit**, so in `items and items[0] > 0` the indexing never runs on an empty list.

## `for` loops iterate over things

A `for` loop walks any **iterable**: lists, strings, ranges, dictionaries, files.

```python
for ch in "日本":
    print(ch)

for i in range(3):          # 0, 1, 2  (the stop value is excluded)
    print(i)

for i, word in enumerate(["ni", "hao"], start=1):
    print(i, word)          # 1 ni / 2 hao

for zh, en in zip(["猫", "狗"], ["cat", "dog"]):
    print(zh, en)
```

`range(start, stop, step)` produces numbers lazily; `range(2, 11, 2)` gives 2, 4, 6, 8, 10.

## `while` loops repeat until a condition fails

```python
attempts = 0
while attempts < 3:
    attempts += 1
```

Use `while` when you do not know in advance how many iterations you need. Make sure something in the body moves the loop towards ending, or it runs forever (the sandbox stops it after a time limit).

- `break` leaves the innermost loop immediately.
- `continue` skips to the next iteration.

## Comprehensions

A **list comprehension** builds a list from an iterable in one expression:

```python
squares = [n * n for n in range(5)]                 # [0, 1, 4, 9, 16]
evens   = [n for n in range(10) if n % 2 == 0]      # [0, 2, 4, 6, 8]
lengths = {word: len(word) for word in ["ni", "hao"]}  # dict comprehension
```

Read it left to right as "the expression, for each item, if the condition holds". Prefer a plain loop when the logic needs several statements: comprehensions are for simple transformations.

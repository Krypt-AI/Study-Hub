---
id: ai-01-python.l04
title: Lists, tuples, dictionaries and sets
summary: Choosing the right built-in collection, mutability, and the operations you will use every day.
objectives:
  - Choose between list, tuple, dict and set for a task
  - Use indexing, slicing, membership tests and the common methods
  - Explain mutability and copying
estimatedMinutes: 45
topics: [py.collections]
resources:
  - { title: "Data structures", url: "https://docs.python.org/3/tutorial/datastructures.html", free: true, official: true }
  - { title: "TimeComplexity (Python wiki)", url: "https://wiki.python.org/moin/TimeComplexity", free: true, official: true }
---

## The four workhorses

| Type | Literal | Ordered | Mutable | Typical use |
|---|---|---|---|---|
| `list` | `[1, 2, 3]` | yes | yes | A sequence you append to and change |
| `tuple` | `(1, 2)` | yes | no | A fixed group of values, e.g. a record `(word, reading)` |
| `dict` | `{"猫": "cat"}` | insertion order | yes | Look up a value by key |
| `set` | `{"a", "b"}` | no | yes | Unique items, fast membership tests |

## Lists

```python
words = ["ni", "hao", "ma"]
words.append("ne")       # add to the end
words[0]                 # 'ni'
words[-1]                # 'ne'   negative indexes count from the end
words[1:3]               # ['hao', 'ma']  slicing returns a new list
"hao" in words           # True  (a linear scan)
```

## Dictionaries

```python
meaning = {"猫": "cat", "狗": "dog"}
meaning["鱼"] = "fish"             # insert or overwrite
meaning.get("鸟", "unknown")       # 'unknown' instead of a KeyError
for word, gloss in meaning.items():
    print(word, gloss)
```

Keys must be **hashable** (strings, numbers, tuples of those); lists cannot be keys. Lookups by key take about the same time however large the dict grows.

## Sets

```python
seen = {"猫", "狗"}
seen.add("猫")                   # no effect: already present
{"猫", "狗"} & {"狗", "鱼"}      # intersection {'狗'}
```

Use a set when the question is "have I seen this?". Membership in a set is fast; in a list it scans every element.

## Mutability and copies

Assigning a list to a new name does **not** copy it:

```python
a = [1, 2]
b = a          # same list
b.append(3)    # a is now [1, 2, 3] too
c = a.copy()   # a shallow copy; c.append(4) leaves a alone
```

A shallow copy copies the outer container only; nested lists inside are still shared. Use `copy.deepcopy` when you need fully independent nested data.

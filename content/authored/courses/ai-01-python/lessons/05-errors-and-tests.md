---
id: ai-01-python.l05
title: Exceptions and tests
summary: Reading tracebacks, raising and handling exceptions, and writing assertions and small tests.
objectives:
  - Read a traceback from the bottom up to find the cause
  - Catch specific exceptions and raise informative ones
  - Write assert-based tests for edge cases
estimatedMinutes: 40
topics: [py.errors]
resources:
  - { title: "Errors and exceptions", url: "https://docs.python.org/3/tutorial/errors.html", free: true, official: true }
  - { title: "pytest: getting started", url: "https://docs.pytest.org/en/stable/getting-started.html", free: true, official: true }
---

## Reading a traceback

```text
Traceback (most recent call last):
  File "<your code>", line 4, in <module>
    print(average([]))
  File "<your code>", line 2, in average
    return sum(values) / len(values)
ZeroDivisionError: division by zero
```

Read from the **bottom**: the last line names the exception type and message; the frames above show the call path, with the innermost call last.

## Handling exceptions

```python
def parse_score(text: str) -> int | None:
    try:
        return int(text)
    except ValueError:
        return None          # not a number: report "no score" instead of crashing
```

- Catch the **specific** exception you expect. A bare `except:` also swallows typos and `KeyboardInterrupt`.
- `else` runs when no exception occurred; `finally` always runs (cleanup).

## Raising exceptions

Fail early with a clear message when input is invalid:

```python
def average(values: list[float]) -> float:
    if not values:
        raise ValueError("average() needs at least one value")
    return sum(values) / len(values)
```

## Tests are executable examples

An `assert` raises `AssertionError` when its condition is false, optionally with a message:

```python
assert average([2, 4]) == 3, "average of 2 and 4 should be 3"
```

Test the **edges**, not just the happy path: empty input, a single item, very large values, invalid types. In real projects you would put these in test functions run by `pytest`; in Study Hub every code exercise is checked by tests like these.

---
id: ai-02-dev-tools.l04
title: From notebooks to scripts
summary: When to use Jupyter, how to move code into modules and a command-line script, and logging instead of print.
objectives:
  - Use notebooks for exploration and avoid hidden-state bugs
  - Turn notebook code into functions, a module and an argparse CLI
  - Configure the logging module with levels
estimatedMinutes: 40
topics: [ai02.scripts]
resources:
  - { title: "Project Jupyter documentation", url: "https://docs.jupyter.org/en/latest/", free: true, official: true }
  - { title: "argparse tutorial", url: "https://docs.python.org/3/howto/argparse.html", free: true, official: true }
  - { title: "Logging HOWTO", url: "https://docs.python.org/3/howto/logging.html", free: true, official: true }
---

## Notebooks: great for exploring, risky for shipping

Jupyter notebooks mix code, output, charts and notes, which makes them ideal for exploring a dataset or explaining a
result. Their risks:

- **Hidden state**: cells can run in any order, so a variable may hold a value from a cell you since deleted.
  Before trusting a notebook, use *Restart kernel and run all*.
- **Hard to review and test**: diffs of `.ipynb` JSON are noisy, and functions inside notebooks are not imported by tests.
- **Secrets and data in outputs**: printed keys or private rows are saved into the file. Clear outputs before committing.

## Refactoring a notebook

1. Group cells into **functions** with parameters instead of global variables.
2. Move the functions into the package (`src/project/features.py`) and import them back into the notebook.
3. Add tests for them (lesson 3).
4. Write a **script** that runs the whole pipeline with no manual steps.

```python
# src/spam_classifier/cli.py
import argparse
import logging

from spam_classifier.model import train

log = logging.getLogger(__name__)

def main(argv=None):
    parser = argparse.ArgumentParser(description="Train the spam classifier")
    parser.add_argument("data", help="path to the training CSV")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO,
                        format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    log.info("training on %s for %d epochs", args.data, args.epochs)
    metrics = train(args.data, epochs=args.epochs, seed=args.seed)
    log.info("done: %s", metrics)

if __name__ == "__main__":
    main()
```

`main(argv=None)` lets a test call `main(["data.csv", "--epochs", "1"])` directly.

## Logging levels

| Level | Use for |
|---|---|
| DEBUG | Detail for diagnosing problems (batch shapes, intermediate values) |
| INFO | Normal progress (epoch finished, model saved) |
| WARNING | Something unexpected, the program continues (missing optional column) |
| ERROR | An operation failed |
| CRITICAL | The program cannot continue |

Library code creates a logger with `logging.getLogger(__name__)` and never calls `basicConfig`; the application
(script) decides where logs go and which level shows. Pass values as arguments (`log.info("loss %.3f", loss)`) so
formatting only happens when the message is emitted.

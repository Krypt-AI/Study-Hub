---
{
  "id": "fs-08-databases.l02",
  "title": "Transactions, indexes and query performance",
  "summary": "Keeping data correct when several things change at once, and making queries fast without guessing.",
  "objectives": [
    "Explain ACID and use transactions",
    "Choose columns to index and read a query plan",
    "Recognise and avoid the N+1 query problem"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-08-databases.transactions-and-indexes"
  ],
  "resources": [
    {
      "title": "SQLite: query planner",
      "url": "https://www.sqlite.org/queryplanner.html",
      "free": true,
      "official": true
    },
    {
      "title": "Use The Index, Luke",
      "url": "https://use-the-index-luke.com/",
      "free": true,
      "official": true
    }
  ]
}
---

## Transactions

A **transaction** groups statements so they all happen or none do:

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;      -- or ROLLBACK; if anything failed
```

**ACID**: *Atomic* (all or nothing), *Consistent* (constraints hold), *Isolated* (concurrent transactions do not see each other's half-finished work), *Durable* (committed data survives a crash).

Anything where two writes must agree (transfers, creating an order with its lines, decrementing stock) belongs in a transaction.

## Indexes

An **index** is a sorted structure that lets the database find rows without scanning the whole table.

```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

- Index columns used in `WHERE`, `JOIN ... ON` and `ORDER BY` of **frequent or slow** queries. Primary and unique keys are indexed already.
- Indexes cost disk space and **slow writes**, so do not index everything.
- A composite index `(customer_id, status)` serves queries filtering by `customer_id`, or by both, but not by `status` alone.
- Wrapping an indexed column in a function (`WHERE lower(email) = ...`) usually prevents its use.

Check with the planner: `EXPLAIN QUERY PLAN SELECT ...` (SQLite) or `EXPLAIN ANALYZE` (PostgreSQL). Look for a full-table scan on a big table.

## The N+1 problem

```ts
const orders = await db.orders.findAll();            // 1 query
for (const order of orders) {
  order.customer = await db.customers.find(order.customerId); // N more queries
}
```

Fix it with one **join** or one `WHERE id IN (...)` query. ORMs call this "eager loading" or `include`.

## Practical rules

Select only the columns you need, always limit large results, use parameters never string concatenation, and measure before and after changing anything.

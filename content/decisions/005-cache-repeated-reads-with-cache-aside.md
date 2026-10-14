---
number: 5
title: Cache repeated reads with cache-aside and a TTL
slug: cache-repeated-reads-with-cache-aside
status: approved
outcome: accepted
chapters: [query-optimization, cache-aside, ttl-expiration, cache-invalidation, cache-stampede]
summary: After fixing the slowest queries, cache product and category reads in Redis with cache-aside, a 5-minute TTL, and deletion on write.
tags: [performance, caching]
---

## Context

At 100,000 users, database CPU reaches 80% at peak. Measurements show that 70% of query time comes from product and category pages, which read the same rows thousands of times per minute. Two queries were missing indexes; fixing them cut database CPU by a quarter, but load keeps growing.

## Problem

How do we keep repeated catalogue reads off the database without showing customers wrong data?

## Options

| Option | Database load | Staleness | Complexity |
| --- | --- | --- | --- |
| Read replica | Moves reads, does not reduce them | Replication lag | Another database |
| Cache in each instance's memory | Reduced | Instances can disagree | Low |
| Shared cache, cache-aside | Reduced | Bounded by TTL and invalidation | Moderate |
| Shared cache, write-through | Reduced | Lowest | Every write path changes |

## Decision

Use cache-aside in the existing Redis: read from the cache, and on a miss read from the database and store the result for 5 minutes. When a product changes, delete its cache entry. Prices and stock at checkout are always read from the database, never from the cache.

## Reasoning

- The data is read far more often than it changes, which is where caching pays off.
- Cache-aside keeps the database as the source of truth, and a cache failure only makes reads slower.
- The TTL limits how stale data can get even if a deletion is missed; checkout's direct reads keep orders correct.

## Consequences

- Product pages can be up to 5 minutes out of date in rare cases.
- Every code path that changes catalogue data must delete the right cache keys.
- Redis memory now needs monitoring and a limit with an eviction policy.

## Failure Considerations

> [!WARNING]
> When a popular entry expires, many requests can miss at once and query the database together (a cache stampede). Add a small random offset to TTLs and let only one request rebuild a missing entry. If Redis fails, every read goes to the database, so the database must still handle peak load without the cache for a short time.

## Reversal Plan

Turn the cache off with a configuration flag; reads go straight to the database. Keep the flag for as long as the cache exists.

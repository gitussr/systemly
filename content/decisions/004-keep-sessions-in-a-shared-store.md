---
number: 4
title: Keep sessions in a shared Redis store
slug: keep-sessions-in-a-shared-store
status: approved
outcome: accepted
supersedes: [3]
chapters: [sessions-cookies, stateless-application-design, redis, jwt]
summary: Store sessions in a managed Redis instance that every application instance reads, and turn off sticky sessions.
tags: [sessions, scaling]
---

## Context

Sticky sessions ([ADR-003](/decisions/use-sticky-sessions-as-a-stopgap)) let the application run on several instances, but every deploy logs out a share of users, and one instance regularly carries twice the load of the other.

## Problem

Where should sessions live so that any instance can serve any request?

## Options

| Option | Lookup per request | Logout and revocation | New infrastructure |
| --- | --- | --- | --- |
| Sessions table in the main database | One database query | Immediate | None |
| Shared Redis store | One fast in-memory lookup | Immediate | A managed Redis |
| Stateless tokens (JWT) | None | Only at expiry, unless a deny list is added | None |

## Decision

Store sessions in a managed Redis instance with a 14-day expiry. The session cookie carries only a random ID. Sticky sessions are turned off.

## Reasoning

- A sessions table would add a query to every request on the database that is already the busiest component.
- Tokens would make immediate logout and "sign out everywhere" hard, which the admin area needs.
- Redis will also be useful for caching ([ADR-005](/decisions/cache-repeated-reads-with-cache-aside)), so it is not a single-purpose system.

## Consequences

- Any instance can serve any request; deploys no longer log anyone out.
- Redis is now on the path of every logged-in request.
- Sessions survive application restarts but would be lost if Redis lost its data, logging everyone out.

## Failure Considerations

> [!WARNING]
> If Redis is unreachable, nobody can be logged in. Use a managed Redis with a replica and automatic failover, set short connection timeouts, and alert on its error rate. Losing sessions is an inconvenience, not data loss, so persistence to disk is not required.

## Reversal Plan

Switch the session middleware to a database-backed store with the same session IDs. Users with existing sessions log in again once; no data is lost.

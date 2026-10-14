---
number: 7
title: Split the application into microservices
slug: split-into-microservices
status: approved
outcome: rejected
chapters: [microservices, when-microservices-make-sense, when-microservices-don-t, service-boundaries, modular-monolith]
summary: Rejected. Splitting into services would not fix the measured problems; keep the modular monolith and extract a service only for a specific need.
tags: [architecture]
---

## Context

With a million users and a team of twelve, several engineers proposed splitting the monolith ([ADR-001](/decisions/start-with-a-modular-monolith)) into services for accounts, catalogue, orders and notifications. Deploys take 25 minutes, and teams sometimes block each other's releases.

## Problem

Would splitting into microservices solve the problems the team actually has?

## Options

| Option | Fixes slow deploys | Fixes team blocking | Cost |
| --- | --- | --- | --- |
| Microservices for every module | Yes, per service | Yes, if boundaries are right | Many pipelines, network failures, distributed data, months of migration |
| Faster pipeline and module ownership | Mostly | Mostly | A few weeks of build work |
| Extract one service with a clear need | For that service | For that team | One service to run |

## Decision

Do not split into microservices now. Speed up the build (parallel tests, cached dependencies), give each module a clear owner, and extract a single service only when one module has a distinct need, such as very different scaling or release cadence.

## Reasoning

- Measurements show the scaling problems were solved by caching and queues ([ADR-005](/decisions/cache-repeated-reads-with-cache-aside), [ADR-006](/decisions/process-slow-work-with-a-queue)); no module needs to scale separately.
- Orders and stock rely on one database transaction. Across services this becomes a saga with compensation, which adds failure modes.
- Twelve engineers would spend months on migration and then on running many services, instead of on the product.

## Consequences

- The team keeps one deployable; build time must be brought under 10 minutes.
- Module boundaries are enforced in code review and by import rules.
- The proposal can return with evidence: a specific module whose scaling or release needs differ.

## Failure Considerations

> [!WARNING]
> Rejecting the split does not fix team blocking by itself. If deploys stay slow or teams keep colliding after the pipeline work, this decision should be revisited rather than worked around.

## Reversal Plan

Nothing is built, so there is nothing to undo. If a later record accepts extracting a service, it will supersede this one.

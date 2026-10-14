---
number: 2
title: Run several stateless instances behind a load balancer
slug: run-stateless-instances-behind-a-load-balancer
status: approved
outcome: accepted
chapters: [horizontal-scaling, load-balancer, stateless-application-design, health-checks]
summary: Run at least two identical application instances behind a load balancer with health checks, and keep no user state on any instance.
tags: [scaling, reliability]
---

## Context

The application has about 10,000 users. At peak, the single instance runs at 90% CPU and p95 latency doubles. Each deploy causes about a minute of errors, and a crash last month took the site down for 20 minutes.

## Problem

How do we add capacity and stop single-instance failures and deploys from taking the site down?

## Options

| Option | Capacity | Availability | Changes needed |
| --- | --- | --- | --- |
| Larger server | Grows to the largest machine | Still one instance | None |
| Several instances behind a load balancer | Grows by adding instances | Survives one instance failing | Instances must be stateless |
| Autoscaling group from the start | Grows automatically | Same as above | Stateless, plus scaling rules to tune |

## Decision

Run two instances (three at peak) behind a managed load balancer. The load balancer uses a health check endpoint to stop sending traffic to unhealthy instances. Deploys replace instances one at a time.

## Reasoning

- A larger server would fix CPU for a while but not crashes or deploys.
- Two instances cover both capacity and availability for little extra cost.
- Autoscaling can be added later on the same setup, once traffic patterns are known.

## Consequences

- No state may live on an instance: sessions ([ADR-003](/decisions/use-sticky-sessions-as-a-stopgap)) and uploaded files must move to shared storage.
- The database now receives connections from every instance, so connection pool sizes must be set per instance.
- The load balancer is one more component to configure and pay for.

## Failure Considerations

> [!WARNING]
> A health check that only says "the process is running" will keep sending traffic to an instance whose database connection is broken. The check must cover what a request needs, but not so much that one slow dependency marks every instance unhealthy at once.

## Reversal Plan

Scale back to one instance behind the same load balancer. Being stateless costs nothing on one instance, so the code needs no change.

---
number: 3
title: Use sticky sessions as a stopgap
slug: use-sticky-sessions-as-a-stopgap
status: approved
outcome: accepted
chapters: [sessions-cookies, load-balancer]
summary: Turn on load balancer session affinity so in-memory sessions keep working while a shared session store is built.
tags: [sessions, scaling]
---

## Context

[ADR-002](/decisions/run-stateless-instances-behind-a-load-balancer) adds a second instance, but sessions are stored in each instance's memory. In testing, users were logged out whenever a request reached the other instance. The capacity problem is urgent; moving sessions will take about two weeks.

## Problem

How do we run two instances now, without logging users out, before sessions are moved out of instance memory?

## Options

| Option | Time to ship | Effect on users |
| --- | --- | --- |
| Wait for a shared session store | About two weeks | Capacity problem continues |
| Sticky sessions (session affinity) | One configuration change | Users logged out only if their instance fails |

## Decision

Enable cookie-based session affinity on the load balancer for now. Each user's requests return to the instance that created their session.

## Reasoning

The change is one setting and fixes the visible bug immediately. Its weaknesses (uneven load, lost sessions on failure) are acceptable for a few weeks, as long as it is temporary.

## Consequences

- Load is uneven: a busy instance stays busy.
- Users on an instance that fails or is redeployed are logged out.
- Adding an instance does not move existing users onto it.

## Failure Considerations

> [!WARNING]
> Stopgaps tend to become permanent. This record is accepted only until a shared session store exists; it is expected to be superseded.

## Reversal Plan

Turn affinity off in the load balancer once sessions are in a shared store. No application change is needed.

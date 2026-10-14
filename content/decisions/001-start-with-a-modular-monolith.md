---
number: 1
title: Start with a modular monolith and one relational database
slug: start-with-a-modular-monolith
status: approved
outcome: accepted
chapters: [monolith, modular-monolith, relational-databases]
summary: Build the first version as one deployable application, split into modules, with one PostgreSQL database.
tags: [architecture, data]
---

## Context

A new web application: accounts, a catalogue, orders and an admin area. The team is three engineers, the first release is due in three months, and expected traffic is under 1,000 users. The requirements will change as real users arrive.

## Problem

How should the application and its data be structured so the team can ship quickly now, without making later growth unnecessarily hard?

## Options

| Option | Speed to first release | Operational cost | Later flexibility |
| --- | --- | --- | --- |
| Plain monolith | Fastest | Lowest | Boundaries erode over time |
| Modular monolith | Fast | Lowest | Modules can be extracted later |
| Microservices from day one | Slowest | High: many deploys, networks, databases | High, but boundaries are guessed before they are known |

## Decision

Build one application, deployed as a single unit, divided into modules (accounts, catalogue, orders, admin) that call each other only through defined interfaces. Store all data in one relational database, with each module owning its own tables.

## Reasoning

- A three-person team cannot run and monitor many services, and does not yet know where the real boundaries are.
- One database gives transactions across orders and stock for free.
- Module boundaries cost little now and are the seams along which a service could be extracted later, if measurements ever justify it.

## Consequences

- One deploy pipeline, one runtime, one database to back up.
- The whole application scales as one unit: a busy module cannot be scaled alone.
- Module boundaries need discipline (code review, import rules), or the monolith becomes tangled.

## Failure Considerations

> [!WARNING]
> One instance and one database are both single points of failure. That is accepted at this stage: a short outage costs little while users are few. Revisit when availability starts to matter ([ADR-002](/decisions/run-stateless-instances-behind-a-load-balancer)).

## Reversal Plan

Because modules already talk through interfaces, a module can be extracted into its own service later: put its interface behind a network API, move its tables to a separate database, and switch callers one at a time. Nothing in this decision is hard to undo.

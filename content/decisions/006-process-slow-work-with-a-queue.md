---
number: 6
title: Process slow work with a queue and background workers
slug: process-slow-work-with-a-queue
status: approved
outcome: accepted
chapters: [why-queues-exist, message-queue, worker, idempotency, dead-letter-queues, outbox-pattern]
summary: Send emails, image processing and invoice generation through a managed queue processed by separate workers.
tags: [async, reliability]
---

## Context

At about a million users, checkout takes 2–4 seconds. Traces show most of that time waiting for the email provider and for invoice PDF generation. Image uploads are resized during the request, which ties up instances. When the email provider had an outage, checkouts failed.

## Problem

How do we stop slow and unreliable follow-up work from slowing down or failing user requests?

## Options

| Option | Request time | Survives crashes | Retries and visibility |
| --- | --- | --- | --- |
| Optimize in place | Slightly better | Yes | Not needed |
| Background thread in the instance | Fast | No: work is lost on restart | None |
| Managed queue and workers | Fast | Yes | Built in, with a dead-letter queue |

## Decision

Use a managed message queue. Requests commit their database changes, then add a message (send email, resize image, generate invoice). A separate worker fleet processes messages, retries failures with backoff, and moves messages that keep failing to a dead-letter queue.

## Reasoning

- The slow work does not need to finish before the user sees a response.
- A managed queue avoids running a broker ourselves.
- Workers scale on their own, so a backlog of images does not slow down checkout.

## Consequences

- Emails and invoices arrive seconds later; the order page shows "invoice being prepared".
- Messages can be delivered more than once, so every handler must be idempotent (for example, keyed by order ID).
- Queue depth and the age of the oldest message need dashboards and alerts.

## Failure Considerations

> [!WARNING]
> If the database commit succeeds but adding the message fails, the order exists but the email is never sent. Write the message to an outbox table in the same transaction and publish it from there. Watch the dead-letter queue: messages there are work that has silently not happened.

## Reversal Plan

Handlers are plain functions, so they can be called inline again behind a flag. Drain the queue before switching, or process both ways for a short time, relying on idempotency.

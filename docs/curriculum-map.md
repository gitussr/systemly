# Systemly — Chapter 0: Complete Curriculum Map

The curriculum follows the Master Prompt's progression:

> **Understand → Model → Decide → Build → Measure → Scale → Recover → Evolve**

---

## LEVEL 0 — Foundations

### 00.01 — What Is a System?

* Application vs system
* Components
* Interactions
* Inputs and outputs
* State
* Dependencies
* Boundaries

### 00.02 — Computer Fundamentals

* CPU
* Memory
* Storage
* I/O
* Processes
* Threads
* Files

### 00.03 — Operating Systems

* Kernel
* Processes
* Threads
* Memory management
* Filesystems
* Scheduling
* System calls

### 00.04 — Networking Fundamentals

* Network
* IP addresses
* Ports
* Packets
* Routers
* TCP
* UDP

### 00.05 — DNS

* Domain names
* Resolution
* Recursive resolvers
* Authoritative servers
* TTL
* DNS caching

### 00.06 — HTTP

* Request
* Response
* Methods
* Headers
* Status codes
* Cookies
* HTTP versions

### 00.07 — HTTPS & TLS

* Encryption
* Certificates
* TLS handshake
* Authentication
* HTTPS request flow

### 00.08 — Client–Server Architecture

* Client
* Server
* Request lifecycle
* Statelessness
* Stateful systems

### 00.09 — Latency, Throughput & Bandwidth

* Latency
* Throughput
* Bandwidth
* Concurrency
* Response time
* Why these metrics matter

---

# LEVEL 1 — The Web Application

### 01.01 — Anatomy of a Web Application

### 01.02 — Web Server

### 01.03 — Application Server

### 01.04 — Request Lifecycle

### 01.05 — APIs

### 01.06 — REST

### 01.07 — Sessions & Cookies

### 01.08 — Authentication

### 01.09 — Authorization

### 01.10 — Databases

### 01.11 — Database Connections

### 01.12 — Connection Pooling

### 01.13 — Transactions

### 01.14 — Stateless Application Design

---

# LEVEL 2 — Scaling the Application

### 02.01 — Why Systems Need to Scale

### 02.02 — Vertical Scaling

### 02.03 — Horizontal Scaling

### 02.04 — Stateless Scaling

### 02.05 — Reverse Proxy

### 02.06 — Load Balancer

### 02.07 — Load Balancing Algorithms

### 02.08 — Health Checks

### 02.09 — Failover

### 02.10 — Timeouts

### 02.11 — Retries

### 02.12 — Retry Storms

### 02.13 — Circuit Breaker

### 02.14 — Rate Limiting

### 02.15 — Connection Limits

---

# LEVEL 3 — Making Systems Faster

### 03.01 — Where Does Performance Go?

### 03.02 — Database Indexes

### 03.03 — Query Optimization

### 03.04 — Caching

### 03.05 — Cache-Aside

### 03.06 — Write-Through Cache

### 03.07 — Write-Back Cache

### 03.08 — TTL & Expiration

### 03.09 — Cache Invalidation

### 03.10 — Cache Stampede

### 03.11 — Browser Cache

### 03.12 — HTTP Caching

### 03.13 — CDN

### 03.14 — Application-Level Caching

### 03.15 — Redis

---

# LEVEL 4 — Data Architecture

### 04.01 — How Applications Store Data

### 04.02 — Relational Databases

### 04.03 — SQL Databases

### 04.04 — NoSQL Databases

### 04.05 — SQL vs NoSQL

### 04.06 — Data Modeling

### 04.07 — Database Indexing

### 04.08 — Transactions & ACID

### 04.09 — Isolation Levels

### 04.10 — Database Replication

### 04.11 — Primary / Replica Architecture

### 04.12 — Read Replicas

### 04.13 — Database Partitioning

### 04.14 — Sharding

### 04.15 — Sharding Strategies

### 04.16 — Consistent Hashing

### 04.17 — Hot Partitions

### 04.18 — Data Consistency

### 04.19 — Eventual Consistency

### 04.20 — CAP Theorem

---

# LEVEL 5 — Asynchronous Systems

### 05.01 — Synchronous vs Asynchronous Work

### 05.02 — Why Queues Exist

### 05.03 — Message Queue

### 05.04 — Worker

### 05.05 — Message Broker

### 05.06 — Pub/Sub

### 05.07 — RabbitMQ

### 05.08 — Kafka

### 05.09 — Message Ordering

### 05.10 — Message Delivery Semantics

### 05.11 — Idempotency

### 05.12 — Retries

### 05.13 — Dead-Letter Queues

### 05.14 — Backpressure

### 05.15 — Asynchronous Architecture

---

# LEVEL 6 — Distributed Systems

### 06.01 — What Makes a System Distributed?

### 06.02 — Distributed State

### 06.03 — Partial Failure

### 06.04 — Network Partitions

### 06.05 — Replication

### 06.06 — Quorum

### 06.07 — Leader & Follower

### 06.08 — Leader Election

### 06.09 — Distributed Locks

### 06.10 — Consensus

### 06.11 — Consistency Models

### 06.12 — Eventual Consistency

### 06.13 — Split Brain

### 06.14 — Failure Domains

### 06.15 — Thundering Herd

### 06.16 — Distributed System Trade-offs

---

# LEVEL 7 — Service Architecture

### 07.01 — Monolith

### 07.02 — Modular Monolith

### 07.03 — Service-Oriented Architecture

### 07.04 — Microservices

### 07.05 — When Microservices Make Sense

### 07.06 — When Microservices Don't

### 07.07 — Service Boundaries

### 07.08 — Service Communication

### 07.09 — API Gateway

### 07.10 — Service Discovery

### 07.11 — Configuration Management

### 07.12 — Secrets Management

### 07.13 — Distributed Transactions

### 07.14 — Saga Pattern

### 07.15 — Outbox Pattern

### 07.16 — CQRS

### 07.17 — Event Sourcing

---

# LEVEL 8 — Cloud Architecture

### 08.01 — Why Cloud?

### 08.02 — Compute

### 08.03 — Virtual Machines

### 08.04 — Containers

### 08.05 — Serverless

### 08.06 — Storage

### 08.07 — Object Storage

### 08.08 — Cloud Networking

### 08.09 — Managed Databases

### 08.10 — Managed Caching

### 08.11 — Managed Messaging

### 08.12 — CDN & Edge

### 08.13 — IAM

### 08.14 — Infrastructure as Code

### 08.15 — AWS Architecture Mapping

The AWS section remains **concept-first → AWS implementation**, as specified in the Master Prompt.

---

# LEVEL 9 — Reliability

### 09.01 — Reliability

### 09.02 — Availability

### 09.03 — Redundancy

### 09.04 — Fault Tolerance

### 09.05 — Failover

### 09.06 — Health Checks

### 09.07 — Graceful Degradation

### 09.08 — Backups

### 09.09 — Disaster Recovery

### 09.10 — RPO

### 09.11 — RTO

### 09.12 — Multi-AZ

### 09.13 — Multi-Region

### 09.14 — Disaster Scenarios

### 09.15 — Chaos Engineering

---

# LEVEL 10 — Observability

### 10.01 — Why Observability Matters

### 10.02 — Logs

### 10.03 — Structured Logging

### 10.04 — Metrics

### 10.05 — Traces

### 10.06 — Correlation IDs

### 10.07 — Distributed Tracing

### 10.08 — Latency Percentiles

### 10.09 — p50 / p95 / p99

### 10.10 — SLI

### 10.11 — SLO

### 10.12 — SLA

### 10.13 — Error Budgets

### 10.14 — Monitoring & Alerting

---

# LEVEL 11 — Security

### 11.01 — Security as a System Property

### 11.02 — Authentication

### 11.03 — Authorization

### 11.04 — RBAC

### 11.05 — OAuth

### 11.06 — JWT

### 11.07 — Sessions

### 11.08 — API Keys

### 11.09 — Encryption

### 11.10 — TLS

### 11.11 — Secrets

### 11.12 — Least Privilege

### 11.13 — Network Segmentation

### 11.14 — WAF

### 11.15 — DDoS Protection

### 11.16 — Audit Logging

### 11.17 — Threat Modeling

---

# LEVEL 12 — Real-World System Design

Each case study follows the same reasoning framework.

### 12.01 — URL Shortener

### 12.02 — E-Commerce Platform

### 12.03 — Social Feed

### 12.04 — Chat System

### 12.05 — Notification System

### 12.06 — File Storage System

### 12.07 — Video Platform

### 12.08 — Search System

### 12.09 — Payment System

### 12.10 — Analytics System

### 12.11 — SaaS Platform

### 12.12 — Food Delivery System

### 12.13 — Ride-Hailing System

Every case study:

```text
Requirements
     ↓
Constraints
     ↓
Traffic Estimation
     ↓
Data Estimation
     ↓
Initial Architecture
     ↓
Bottlenecks
     ↓
Architectural Decisions
     ↓
Scaling
     ↓
Failure Scenarios
     ↓
Recovery
     ↓
Evolution
     ↓
Trade-offs
```

---

# CROSS-CURRICULUM SYSTEMLY FEATURES

These are **not additional chapters**. They are capabilities that operate across the curriculum.

### Architecture Advisor

Requirements → constraints → architecture → reasoning → alternatives → scaling path → lock-in.

### Architecture Evolution Simulator

```text
V1 → V2 → V3 → V4
```

Show **why** the architecture changes.

### Architecture Playground

Build architectures visually and receive educational warnings.

### Why?

Explain why a component exists.

### Why Not?

Explain alternatives and their trade-offs.

### Technology Lock-In

Explain:

* coupling
* migration difficulty
* vendor dependency
* data migration
* API dependency
* operational dependency

### ADR

Record architectural decisions and reversal plans.

### Related Topics

Connect concepts into a knowledge graph.

### Search

Search the complete Markdown knowledge base.

---

## One deliberate P0 check

There is **one foundational topic I would flag before we freeze Chapter 0**:

### **Capacity & Back-of-the-Envelope Estimation**

This is P0 for Systemly.

It is the bridge between:

> “I have 100,000 users”

and:

> “What does that actually mean for requests/second, storage, bandwidth, database load and infrastructure?”

Without it, the Architecture Advisor and the case studies cannot properly teach *why* an architecture changes.

I would therefore place it at the beginning of the scaling/data reasoning portion, rather than treating it as an optional interview-prep topic.

**Everything else above follows the Master Prompt without adding new curriculum directions.**

And from here onward, we can lock this map and proceed **one chapter at a time**. I will not spontaneously redesign the curriculum halfway through.

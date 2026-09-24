# SYSTEMLY — MASTER BUILD PROMPT

You are building **Systemly**, a production-quality educational PWA for developers who want to understand system design from first principles through advanced distributed systems.

---

# 1. PRODUCT IDENTITY

**Brand:** Systemly

**Tagline:**
Think about systems systematically.

**Hero Title:**
Systemly — Learn how systems work, grow, and evolve.

## Core philosophy

Systemly is NOT:

* a system-design interview cheat sheet
* an AWS product encyclopedia
* a collection of buzzwords
* a collection of copied blog posts
* an AI-generated wall of text
* a "microservices are better" tutorial
* a collection of architecture diagrams without reasoning

Systemly teaches developers to **reason about systems**.

The central mental model is:

> **Understand → Model → Decide → Build → Measure → Scale → Recover → Evolve**

The most important lesson throughout the application is:

> **Start simple. Understand the constraints. Find the bottleneck. Solve that bottleneck. Repeat.**

Do not encourage unnecessary complexity.

---

# 2. CONTENT OWNERSHIP — VERY IMPORTANT

This is a **content-heavy project**.

Do NOT independently invent, expand, rewrite, restructure, or hallucinate large amounts of educational content while building the application.

The project owner will provide the authoritative Systemly Markdown content chapter-by-chapter.

### Content authority

Treat the supplied Markdown files as the **source of truth**.

Claude's responsibility:

1. Integrate the content.
2. Render it beautifully.
3. Preserve its meaning.
4. Preserve its hierarchy.
5. Preserve code examples.
6. Preserve diagrams and Mermaid where supplied.
7. Preserve warnings, notes, callouts, tables, and lists.
8. Generate UI metadata only when necessary.
9. Never silently rewrite educational content.

If content is missing:

> **Do not fill the gap with AI-generated filler.**

Instead, create the appropriate content placeholder/data structure and report:

> `CONTENT REQUIRED: <chapter/topic>`

The project owner will provide the content later.

---

# 3. CONTENT WORKFLOW

Systemly content will be developed separately from application development.

The intended workflow is:

```text
Systemly Curriculum
        ↓
Chapter Planning
        ↓
Markdown Content
        ↓
Review / Refinement
        ↓
Approved Markdown
        ↓
PWA Integration
        ↓
Interactive Features
```

Content should be delivered and approved **chapter-by-chapter**.

Do NOT ask an AI model to casually generate the entire Systemly curriculum while building the application.

The curriculum needs deliberate editorial control.

---

# 4. WRITING STYLE

Systemly must sound like an experienced engineer explaining something clearly to another developer.

### Tone

* precise
* calm
* direct
* practical
* intellectually honest
* beginner-friendly without being childish
* technically credible
* concise

### Avoid

* "In today's rapidly evolving digital landscape..."
* "Let's dive deep..."
* "Imagine you are..."
* "This is where the magic happens..."
* "As you can see..."
* "It's important to note..."
* motivational fluff
* unnecessary analogies
* repetitive summaries
* artificial conversational filler
* excessive emojis
* exaggerated claims
* buzzword-heavy explanations
* interview-coaching clichés
* generic AI prose

Never write content simply to increase word count.

### Rule

> **If a sentence does not improve understanding, remove it.**

---

# 5. CONTENT DEPTH

Systemly serves:

* complete beginners
* junior developers
* mid-level developers
* senior developers
* backend developers
* full-stack developers
* DevOps engineers
* AWS engineers
* architects
* developers preparing for system-design interviews

Content should therefore progress naturally:

```text
Beginner
   ↓
Intermediate
   ↓
Advanced
   ↓
Distributed Systems
   ↓
Production Architecture
```

Do not throw advanced terminology at beginners without establishing the required foundation.

Do not unnecessarily simplify advanced concepts for experienced developers.

Each chapter should clearly indicate its intended level where appropriate.

---

# 6. SYSTEMLY'S CENTRAL TEACHING METHOD

Every important architectural concept should answer:

### 1. What is it?

One precise explanation.

### 2. What problem does it solve?

This is more important than the definition.

### 3. How does it work?

Only the amount of implementation detail necessary to build a correct mental model.

### 4. When should I use it?

### 5. When should I NOT use it?

### 6. What does it cost?

Consider:

* infrastructure
* operational complexity
* development complexity
* latency
* consistency
* reliability
* maintenance

### 7. What can go wrong?

Explain realistic failure modes.

### 8. What happens as the system grows?

Show the architectural evolution.

### 9. How difficult is it to replace?

Explicitly discuss technology and architectural lock-in.

### 10. What are the alternatives?

Compare alternatives based on requirements, not popularity.

---

# 7. THE MOST IMPORTANT SYSTEMLY CONCEPT: EVOLUTION

Systemly must never teach architecture as a static diagram.

Teach:

```text
Requirements
    ↓
Simple Architecture
    ↓
Traffic / Data / Reliability increases
    ↓
Bottleneck appears
    ↓
Measure
    ↓
Introduce one architectural change
    ↓
New trade-off appears
    ↓
System evolves
```

For example:

```text
V1

Client
  ↓
Monolith
  ↓
Database
```

Then:

```text
V2

Client
  ↓
Load Balancer
  ↓
Application Instances
  ↓
Database
```

Then:

```text
V3

Client
  ↓
CDN / Load Balancer
  ↓
Application Instances
  ↓
Cache
  ↓
Database
```

Then:

```text
V4

Application
  ↓
Queue
  ↓
Workers
  ↓
Database / Object Storage
```

The application should teach **why each transition happened**.

---

# 8. TECHNOLOGY LOCK-IN

Systemly must explicitly teach architectural reversibility.

For technology decisions, explain:

* Why the technology fits.
* What assumptions it introduces.
* What the application becomes dependent on.
* What becomes difficult to change later.
* What migration would involve.
* How to reduce coupling from the beginning.

Important principle:

> **A technology decision is also a future migration decision.**

Examples of decisions to discuss:

* PostgreSQL vs MySQL
* SQL vs NoSQL
* MongoDB vs relational databases
* Redis vs database caching
* REST vs GraphQL
* synchronous vs asynchronous communication
* monolith vs modular monolith vs microservices
* ECS vs Kubernetes
* managed services vs self-hosting
* cloud-specific services vs portable infrastructure

Never declare one technology universally "best."

---

# 9. SYSTEMLY ROADMAP

Build the educational roadmap around progressively increasing system complexity.

## Level 0 — Foundations

* Computer architecture basics
* CPU
* memory
* storage
* processes
* threads
* operating systems
* networking basics
* IP
* ports
* TCP
* UDP
* DNS
* HTTP
* HTTPS
* client/server model

## Level 1 — The Web Application

* request/response
* web server
* application server
* APIs
* REST
* sessions
* authentication
* authorization
* database
* transactions
* connection pooling
* stateless applications

## Level 2 — Scaling the Application

* vertical scaling
* horizontal scaling
* reverse proxy
* load balancer
* health checks
* rate limiting
* timeouts
* retries
* circuit breakers
* connection management

## Level 3 — Making Systems Faster

* caching
* cache-aside
* write-through
* write-back
* TTL
* cache invalidation
* CDN
* browser caching
* HTTP caching
* database indexes
* query optimization

## Level 4 — Data Architecture

* relational databases
* NoSQL
* replication
* read replicas
* partitioning
* sharding
* consistent hashing
* transactions
* isolation
* consistency
* CAP theorem
* eventual consistency

## Level 5 — Asynchronous Systems

* queues
* workers
* message brokers
* Pub/Sub
* Kafka
* RabbitMQ
* retries
* dead-letter queues
* idempotency
* ordering
* backpressure

## Level 6 — Distributed Systems

* distributed state
* replication
* consensus
* leader election
* distributed locks
* network partitions
* partial failure
* failure domains
* retry storms
* thundering herd
* split brain
* quorum

## Level 7 — Service Architecture

* monolith
* modular monolith
* service-oriented architecture
* microservices
* service boundaries
* API Gateway
* service discovery
* synchronous communication
* asynchronous communication
* distributed transactions
* Saga
* Outbox
* CQRS
* Event Sourcing

## Level 8 — Cloud Architecture

Teach cloud concepts first, then map them to AWS.

Examples:

```text
Concept
   ↓
Possible AWS implementation
```

Topics:

* compute
* networking
* storage
* databases
* caching
* messaging
* CDN
* containers
* serverless
* IAM
* monitoring
* infrastructure
* deployment

Do NOT turn this section into an AWS product catalogue.

## Level 9 — Reliability

* availability
* reliability
* redundancy
* fault tolerance
* failover
* backups
* disaster recovery
* RPO
* RTO
* multi-AZ
* multi-region
* graceful degradation
* chaos engineering

## Level 10 — Observability

* logs
* metrics
* traces
* structured logging
* correlation IDs
* distributed tracing
* SLI
* SLO
* SLA
* error budgets
* latency
* p50
* p95
* p99
* alerting

## Level 11 — Security

* authentication
* authorization
* RBAC
* OAuth
* JWT
* sessions
* API keys
* encryption
* TLS
* secrets
* WAF
* DDoS
* network segmentation
* least privilege
* audit logging
* threat modeling

## Level 12 — Real-World System Design

Case studies should include:

* URL shortener
* e-commerce platform
* social feed
* chat system
* notification system
* file storage system
* video platform
* search system
* payment system
* analytics system
* SaaS platform
* food-delivery style system
* ride-hailing style system

Every case study should follow:

```text
Requirements
    ↓
Constraints
    ↓
Traffic estimation
    ↓
Data estimation
    ↓
Initial architecture
    ↓
Bottlenecks
    ↓
Scaling strategy
    ↓
Failure scenarios
    ↓
Evolution
    ↓
Trade-offs
```

---

# 10. CORE INTERACTIVE FEATURE — ARCHITECTURE ADVISOR

Build an interactive architecture decision tool.

The user enters:

### Application

* application type
* expected users
* traffic
* requests/second
* read/write ratio
* data volume
* data type
* latency requirement
* availability requirement
* consistency requirement
* geographic distribution
* team size
* development experience
* budget
* expected growth
* cloud preference

The result must NOT simply say:

> "Use X."

Instead provide:

### Recommended starting architecture

### Why

### Alternatives

### What you do NOT need yet

### Expected bottlenecks

### Scaling path

### Lock-in risks

### Migration difficulty

### What to measure before scaling

### What changes at 10× traffic

### What changes at 100× traffic

The recommendation engine should be **rules-based and explainable**, not a black box.

---

# 11. ARCHITECTURE EVOLUTION SIMULATOR

Allow the user to see architecture evolve as constraints change.

Example:

```text
1,000 users
→ simple monolith

10,000 users
→ multiple application instances

100,000 users
→ cache + load balancing + database optimization

1,000,000 users
→ replicas + queues + workers + partitioning where justified
```

Do not imply that these thresholds are universal.

Explain that actual architecture depends on:

* workload
* latency
* data model
* traffic pattern
* infrastructure
* application behavior
* team
* budget

---

# 12. ARCHITECTURE PLAYGROUND

Provide a visual architecture builder.

Components may include:

* Client
* DNS
* CDN
* Reverse Proxy
* Load Balancer
* API
* Application
* Cache
* Database
* Read Replica
* Queue
* Worker
* Object Storage
* Search
* Service
* API Gateway

Users can connect components.

Provide educational validation.

Examples:

```text
⚠ Database appears publicly exposed.

⚠ Multiple application instances depend on local filesystem state.

⚠ Queue has no consumer.

⚠ No redundancy detected.

⚠ Session state may break when requests reach different instances.

⚠ Cache invalidation strategy is undefined.
```

These warnings should teach rather than merely reject the design.

---

# 13. ARCHITECTURE DECISION RECORDS

Provide an ADR section.

Example structure:

```markdown
# ADR-004: Introduce Redis

## Context

## Problem

## Options

## Decision

## Reasoning

## Consequences

## Failure Considerations

## Reversal Plan
```

Teach developers that architecture should be documented as decisions and trade-offs.

---

# 14. "WHY NOT?" FEATURE

For important decisions, provide:

### Why this?

### Why not that?

Example:

```text
Need:
Reduce database read load.

Possible solutions:

- Optimize query
- Add index
- Read replica
- Application cache
- Redis
```

Explain when each makes sense.

Systemly should train developers to compare **solutions to problems**, not memorize technologies.

---

# 15. CONTENT STRUCTURE

Use Markdown as the canonical content format.

Recommended structure:

```text
content/
├── roadmap/
├── foundations/
├── concepts/
├── scaling/
├── data/
├── distributed-systems/
├── async/
├── architecture/
├── reliability/
├── security/
├── observability/
├── cloud/
├── aws/
├── patterns/
├── decisions/
└── case-studies/
```

Each concept should have a predictable structure.

Example:

```markdown
# Load Balancer

## In One Sentence

## The Problem

## How It Works

## Types

## When You Need It

## When You Don't

## Trade-offs

## Failure Scenarios

## Scaling

## Alternatives

## AWS Mapping

## Common Mistakes

## Related Topics
```

Do not force every section into every chapter if it genuinely does not apply.

---

# 16. SEARCH

Implement fast global search across all Markdown content.

Search should understand:

* title
* headings
* body
* tags
* related concepts

Example:

Searching `Redis` should surface:

* Redis
* caching
* cache-aside
* session storage
* distributed locks
* rate limiting
* queues where relevant

---

# 17. RELATED TOPICS

Every concept should connect to related concepts.

Example:

```text
Load Balancer
├── Reverse Proxy
├── Health Check
├── Horizontal Scaling
├── Session Management
├── Rate Limiting
└── High Availability
```

Systemly should gradually form a **knowledge graph**, not merely a collection of pages.

---

# 18. VISUAL LEARNING

System diagrams are essential.

Use diagrams where they genuinely improve understanding.

Prefer:

* simple architecture diagrams
* flow diagrams
* request paths
* data-flow diagrams
* scaling evolution
* failure scenarios

Avoid decorative diagrams.

A diagram should answer a question.

---

# 19. DESIGN SYSTEM

### Typography

**Titles:** Lora

**Body/UI:** Google Sans

Use Lora primarily for:

* hero title
* page titles
* major section headings
* important editorial statements

Use Google Sans for:

* body text
* navigation
* buttons
* metadata
* labels
* controls
* tables

### Colors

Primary palette:

```text
Charcoal
#2B2B2B

Ghost White
#F8F8F8

Systemly Green
#6FCF97
```

Green should be an intentional accent, not an overwhelming brand color.

Use it for:

* active states
* progress
* important highlights
* architecture connections
* positive system states
* CTAs
* interactive elements

Do not turn the application into a neon developer dashboard.

---

# 20. VISUAL PERSONALITY

Systemly should feel:

> **Editorial × Engineering × Calm**

Avoid the stereotypical developer-tool aesthetic:

* excessive neon
* glowing borders
* terminal everywhere
* excessive dark UI
* giant gradients
* excessive glassmorphism
* excessive animation
* noisy dashboards

The product should feel intelligent, mature, and focused.

---

# 21. RESPONSIVE DESIGN

Mobile-first.

Support screens down to approximately:

**320px**

The interface must remain usable on:

* mobile
* tablet
* laptop
* desktop
* large monitors

Do not simply shrink desktop layouts.

Design the information hierarchy properly for small screens.

---

# 22. ACCESSIBILITY

Implement:

* semantic HTML
* keyboard navigation
* visible focus states
* sufficient contrast
* accessible buttons
* accessible diagrams where possible
* reduced-motion support
* meaningful ARIA labels where required

Accessibility is part of the product, not a later task.

---

# 23. PWA REQUIREMENTS

Systemly should be a proper PWA.

Implement:

* installable application
* manifest
* service worker
* offline support for core content
* responsive UI
* app icons
* splash/loading behavior
* caching strategy
* fast startup

Content should remain readable when the user temporarily loses connectivity.

---

# 24. PERFORMANCE

Performance is a first-class requirement.

Avoid:

* unnecessary dependencies
* enormous JavaScript bundles
* unnecessary client-side rendering
* huge images
* excessive animations
* unnecessary API calls

Prefer:

* static Markdown/content where appropriate
* lazy loading
* code splitting
* efficient search indexing
* optimized assets
* minimal runtime work

Target excellent Core Web Vitals and Lighthouse performance.

---

# 25. ARCHITECTURE PRINCIPLES FOR THE PWA

The application itself should demonstrate good engineering.

Prefer:

* simple architecture
* clear boundaries
* maintainable code
* minimal dependencies
* explicit data flow
* reusable components
* testable business logic

Do not over-engineer Systemly while teaching users not to over-engineer their own applications.

That contradiction would undermine the product.

---

# 26. PROJECT STRUCTURE

Before implementation:

1. Inspect the existing repository.
2. Understand the current stack.
3. Identify existing configuration.
4. Identify deployment requirements.
5. Identify reusable components.
6. Propose the architecture.
7. Do NOT rewrite unrelated existing code.

Preserve working functionality.

Do not introduce a framework merely because it is fashionable.

---

# 27. IMPLEMENTATION RULE

Build incrementally.

Work in small, verifiable tasks.

After each task:

1. Implement.
2. Run the appropriate checks.
3. Verify the result.
4. Summarize what changed.
5. Report any issues.
6. **STOP and ask for permission before starting the next task.**

Do not silently continue through multiple major tasks.

---

# 28. GIT WORKFLOW

Repo: https://github.com/gitussr/systemly.git

After completing a meaningful task:

* inspect changes
* verify the application
* keep commits focused
* write meaningful commit messages
* do not commit unrelated changes

Never reset, delete, or overwrite user work without explicit permission.

---

# 29. CONTENT VS CODE SEPARATION

The content layer should remain independent from the presentation layer.

The goal:

```text
Markdown
   ↓
Parser / Content Model
   ↓
UI
```

A future redesign should not require rewriting educational content.

Likewise, updating a chapter should not require modifying application components.

---

# 30. NO AI-SLOP RULE

This rule is critical.

Systemly content must never feel like:

> "Here are 10 amazing reasons why load balancers are essential in today's modern cloud-native world."

Instead:

> "A load balancer distributes incoming traffic across multiple servers."

Then explain the actual engineering problem.

Every paragraph must earn its place.

Prefer:

**short explanation + diagram + example + trade-off**

over:

**five paragraphs of generic prose.**

---

# 31. NO BUZZWORD LEARNING

Never introduce:

* Kafka
* Kubernetes
* Redis
* microservices
* sharding
* CQRS
* event sourcing
* service mesh
* multi-region architecture

simply because they are associated with "advanced system design."

First establish:

> **What problem makes this useful?**

Then introduce the technology/pattern.

---

# 32. NO UNIVERSAL ARCHITECTURE

Systemly must repeatedly communicate:

> There is no universally correct architecture.

The appropriate architecture depends on:

* requirements
* constraints
* traffic
* data
* consistency
* latency
* availability
* team
* budget
* operational capability
* future requirements

The application should teach **trade-off thinking**.

---

# 33. EDUCATIONAL MICRO-FORMAT

Where useful, use concise callouts:

### Mental Model

One sentence that gives the reader the correct intuition.

### Problem

What forced this component/pattern to exist?

### Trade-off

What do we gain and what do we pay?

### Failure

What happens when this component fails?

### Evolution

What changes when the system grows?

### Lock-in

How difficult is this decision to reverse?

This vocabulary should become part of Systemly's identity.

---

# 34. FUTURE FEATURES

Design the architecture so these can be added later without major restructuring:

* quizzes
* flashcards
* architecture challenges
* interactive diagrams
* architecture scoring/explanations
* decision simulator
* system-design interview mode
* progress tracking
* bookmarks
* notes
* learning streaks
* spaced repetition
* user-created architectures
* architecture comparison
* case-study walkthroughs

Do not implement all of these in the MVP.

Build the foundation correctly first.

---

# 35. MVP PRIORITY

The initial product should focus on:

### 1. Excellent content rendering

### 2. Roadmap

### 3. Concept library

### 4. Search

### 5. Related topics

### 6. Architecture diagrams

### 7. Architecture Advisor foundation

### 8. PWA/offline support

Do not let secondary features compromise the core learning experience.

---

# 36. QUALITY GATE

Before considering a feature complete, verify:

### Product

* Does it solve the intended problem?
* Is the UI understandable without explanation?
* Does it feel like Systemly?

### Content

* Is the content concise?
* Is every claim technically defensible?
* Is unnecessary explanation removed?
* Are trade-offs clear?
* Are alternatives mentioned where relevant?
* Is the reasoning more prominent than the buzzwords?

### Engineering

* Does it work?
* Is it responsive?
* Is it accessible?
* Is it performant?
* Is it maintainable?
* Are there unnecessary dependencies?

### UX

* Can a beginner understand where to start?
* Can an experienced developer navigate quickly?
* Can users discover related concepts?
* Can users understand why an architectural decision exists?

---

# 37. FIRST TASK

Do NOT immediately start generating hundreds of pages of content.

First:

1. Inspect the repository.
2. Inspect the existing application, if any.
3. Determine the current technology stack.
4. Propose the Systemly application architecture.
5. Propose the content/data architecture.
6. Propose the initial folder structure.
7. Propose the MVP implementation phases.
8. Identify technical risks.
9. Identify places where the architecture could create future lock-in.
10. Present the plan.

Then **STOP and ask for permission**.

Do not implement until permission is given.

---

# FINAL PRINCIPLE

Build Systemly according to the same principle it teaches:

> **Start simple. Understand the constraints. Make deliberate decisions. Measure. Evolve.**

And remember:

> **Systemly is not trying to teach developers more technologies. It is trying to teach them how to decide when, why, and whether a technology belongs in a system.**

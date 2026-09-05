# DealFlow360

An Intelligent, Self-Governing Sales Operations Platform — Odoo Hackathon 2026 Finals project.

Handles multi-tier discount governance with automated approval routing, live upsell/cross-sell recommendations, multi-warehouse fulfillment splitting with backorder handling, hybrid billing (one-time + recurring subscriptions on the same order), deal health monitoring, and customer-facing portal negotiation on live quotations.

## Tech Stack (finalized)

- Frontend: React (Vite) — `client/`
- Backend: Node.js + Express, MVC architecture — `server/`
- Validation: Zod
- ORM: Prisma
- Database: PostgreSQL
- Cache: Redis (used for caching live stock levels during warehouse-split calculation, and session/negotiation state)
- Containerization: Docker / docker-compose

WebSockets and AI API integration were considered but are **not** part of the core stack — the upsell/cross-sell logic is rule-based (co-purchase pairs, promoted-product flags, margin thresholds) rather than AI-driven, and dashboard/negotiation updates don't require a persistent socket connection for this scope. Not planned as stretch goals either.

## Structure

- `client/` — React frontend (components, pages, hooks, services, context, assets)
- `server/` — Express backend, MVC:
  - `controllers/` — request handlers
  - `services/` — business logic + DB/Redis access (Prisma client lives here; there's no separate `models/` folder since Prisma's schema + generated client already cover that role)
  - `routes/` — Express route definitions
  - `middleware/` — auth, error handling, etc.
  - `validators/` — Zod schemas for request validation
  - `config/` — app/env configuration
  - `utils/` — shared helpers
  - `sockets/` — reserved, unused unless real-time becomes necessary later
  - `prisma/` — Prisma schema & migrations
  - `logs/` — log output (optional, dev use)
- `docker/` — Dockerfiles for services
- `docker-compose.yml` — orchestrates postgres, redis, backend, frontend

## Core business logic notes

- **Discount approval routing:** every quotation line is checked against the stricter of (a) the customer's tier discount ceiling (Bronze/Silver/Gold) and (b) that product category's own discount ceiling. Any line exceeding its effective limit contributes to a blended, money-weighted risk score (`overage % × line amount`, summed across all lines) for the whole quotation. Configured thresholds on that score decide whether the quote needs Sales Manager approval only, or Sales Manager followed by Finance.
- **Warehouse fulfillment split:** for each order line, prefer a single warehouse that can cover the full quantity; when splitting is unavoidable, prefer warehouses already used elsewhere in the same order (to minimize total shipment count) before falling back to the next cheapest-by-shipping-weight warehouse. Unfulfillable quantity is recorded as backordered and later reconciled via a "Consolidate Remaining Backorder" step once stock replenishes. This is a shipment-minimizing heuristic, not a globally optimal solver — acceptable and expected scope for the hackathon.

## Status

No application logic yet beyond the above design decisions — folder structure and config only. Coding starts now that the PS (DealFlow360) has been assigned.

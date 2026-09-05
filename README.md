# Odoo Hackathon Finals — Project Scaffold

Temporary scaffold created the night before finals (Sep 4). Rename once we know the actual project name from the problem statement.

## Stack
- Frontend: React (client/)
- Backend: Node.js + Express, MVC architecture (server/)
- Validation: Zod
- ORM: Prisma
- DB: PostgreSQL
- Cache: Redis
- Containerization: Docker / docker-compose
- Optional (add if PS needs it): WebSockets, AI API integration

## Structure
- client/ — React frontend
- server/ — Express backend (MVC: controllers, models, routes, middleware, config, utils, validators)
- server/prisma/ — Prisma schema & migrations
- docker/ — Dockerfiles for services
- docker-compose.yml — orchestrates postgres, redis, backend, frontend

No application logic yet — folder structure and config only. Code starts once the PS is announced (Sep 5).

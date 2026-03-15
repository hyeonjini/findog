# ADR 0001: Service Boundaries

## Status
Accepted

## Context
FinDog consists of backend (Python), frontend (TypeScript), and chrome-extension (TypeScript).
All three share a single API surface but are built with different languages and runtimes.

## Decision
- The backend owns the API schema (OpenAPI) as the single source of truth.
- Frontend and Extension consume a generated TypeScript API client (`@findog/api-client`).
- Domain rules live exclusively in the backend domain layer; frontend/extension never duplicate business logic.

## Consequences
- Eliminates DTO drift between Python and TypeScript.
- Requires a client regeneration step whenever the API contract changes.
- Frontend/Extension teams depend on backend API stability; breaking changes must be coordinated.

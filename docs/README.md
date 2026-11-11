# BFP-NCR Running Card System — Technical Documentation

Technical reference for the BFP-NCR Running Card System, written from the source code as of commit `49aaa8a` (2026-11-07). The user-facing summary and quick setup are in the [root README](../README.md); guidance for AI agents is in [CLAUDE.md](../CLAUDE.md).

Statements that could not be confirmed from the code are marked **Needs Verification**.

## What the system does

Given a fire location in Metro Manila (NCR), the system lists the nearest fire stations that have an available truck, grouped into alarm levels (1st–5th Alarm, Task Force Alpha–Delta, General Alarm). This list is the *running card*. The radio operator of the city where the fire is dispatches from the card, raises the alarm, and closes the incident. The system tracks which trucks are responding.

## Contents

| Area | Documents |
|---|---|
| Architecture | [Overview](architecture/overview.md) · [Backend](architecture/backend.md) · [Frontend](architecture/frontend.md) · [Business processes](architecture/business-processes.md) |
| Database | [Schema](database/schema.md) · [ER diagram](database/erd.md) · [Data & seeding](database/data-and-seeding.md) |
| API | [Conventions](api/README.md) · [auth](api/auth.md) · [users](api/users.md) · [districts](api/districts.md) · [stations](api/stations.md) · [running-card](api/running-card.md) · [incidents](api/incidents.md) · [settings](api/settings.md) · [audit](api/audit.md) · [notifications](api/notifications.md) · [statistics](api/statistics.md) · [deployments](api/deployments.md) |
| Security | [Authentication](security/authentication.md) · [Authorization](security/authorization.md) · [Known gaps](security/gaps.md) |
| Development | [Setup](development/setup.md) · [Testing](development/testing.md) · [Deployment](development/deployment.md) · [Conventions](development/conventions.md) |
| Modules | [auth](modules/auth.md) · [users](modules/users.md) · [districts](modules/districts.md) · [stations](modules/stations.md) · [running-card](modules/running-card.md) · [incidents](modules/incidents.md) · [settings](modules/settings.md) · [audit](modules/audit.md) · [notifications](modules/notifications.md) · [deployments](modules/deployments.md) · [geo](modules/geo.md) · [routing](modules/routing.md) · [prisma](modules/prisma.md) |
| Review | [Documentation review: inconsistencies, assumptions, open items](review.md) |

## Glossary

| Term | Meaning in this codebase |
|---|---|
| **NCR** | National Capital Region (Metro Manila): 17 cities/municipalities in the seed data. |
| **Fire District (FD)** | `FireDistrict` row, codes 1–5. FD1 = Manila Fire District, FD2 = CAMANAVA, FD5 = Quezon City Fire District (aliases from `backend/prisma/seed.ts`). |
| **City** | `City` row; each belongs to one district. FD1 and FD5 have exactly one city each (Manila, Quezon City). |
| **Office** | Where an account sits: `OfficeLevel` REGIONAL, DISTRICT or CITY (`User.officeLevel`). |
| **Area** | The cities an office is responsible for (`areaCityIds`); `null` means all of NCR. See [authorization](security/authorization.md). |
| **Dispatch city** | The only city whose fires an account may dispatch (`dispatchCityId`). |
| **Running card** | Nearest stations with an available truck, `stationsPerAlarm` per alarm level. |
| **Alarm level** | One entry in `Settings.alarmLevels`; `Incident.alarmIndex` is a position in that list. |
| **Notification** | Alert on dispatch, raise and close to involved cities (fire's city, cities sending trucks, cities on the running card), their districts and the Regional office; delivered live over SSE. |
| **Unit** | `IncidentUnit`: one truck sent to an incident at a given alarm level. |
| **Special deployment** | A planned event (ASEAN, SONA) that Regional Operations sends trucks to; its trucks are `DEPLOYED` and left off every running card until released. |
| **Placeholder truck** | One `ENGINE` truck per seeded station, created when `SEED_PLACEHOLDER_TRUCKS=true`. |

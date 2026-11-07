# notifications module

`backend/src/notifications/`. Imported by `IncidentsModule`.

- `NotificationsService`
  - `record(tx, incidentId, type, alarmLevel, actorId, stepUnits)`: called inside the dispatch / raise / close transaction. Creates one `Notification` for the step with `cityIds` = the fire's city, cities of stations with a unit on the incident, and cities of stations on the incident's `runningCard` snapshot; `units` = the step's trucks (with city). Returns its id.
  - `publish(ids)`: called after the transaction commits; loads the rows and pushes them to `events` (RxJS `Subject`).
  - `isFor(user, n)`: Regional (`areaCityIds = null`) always; otherwise the area shares a city with `n.cityIds`.
  - `forUser(user, n)`: keeps only `units` from the account's area (Regional: all).
  - `list`, `unreadCount`, `markSeen`: see [API](../api/notifications.md).
- `NotificationsController`: the four routes, including the SSE `stream` (`@Sse`), filtered per connection with `isFor` and `forUser`.

Frontend: `src/components/Notifications.jsx` (`NotificationsProvider`: stream loop, unread count, alert toast + beep; `NotificationBell`), `src/pages/NotificationsPage.jsx`, helpers in `src/lib/notifications.js`, SSE reader `stream()` / `parseSse()` in `src/api/client.js`.

Future phase (not built): acknowledgement with repeated reminders, SMS/email.

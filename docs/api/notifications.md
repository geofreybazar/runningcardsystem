# Notifications API

Controller `NotificationsController` (`backend/src/notifications/notifications.controller.ts`), service `NotificationsService`. Every route needs `operate`.

One notification per incident step (dispatch, raise alarm, close), addressed to every **involved city** (`cityIds`): the fire's city, every city with a truck on the incident, and every city with a station on the incident's running card (the snapshot saved at dispatch).

**Who sees it:** accounts whose office area (`areaCityIds`) shares a city with `cityIds`, meaning those cities' city offices and their district offices, and **every Regional account** (area = all NCR, including Super Admin and Admin). There is no acknowledgement; "unread" means newer than the account's `notificationsSeenAt`.

**`units` is filtered per account:** an office sees only trucks from cities in its area; Regional accounts see all.

**Notification object:**

```json
{
  "id": 12, "incidentId": "uuid", "cityIds": [1, 3, 7], "type": "ALARM_RAISED", "alarmLevel": "2nd Alarm",
  "units": [{ "station": "Caloocan Central Fire Station", "callSign": "E-12", "cityId": 3, "city": "Caloocan" }],
  "actorId": "uuid", "createdAt": "ISO-8601",
  "incident": { "locationLabel": "…", "status": "OPEN", "city": { "id": 1, "name": "Manila" } },
  "actor": { "accountNumber": "B13084", "rank": "SFO2", "firstName": "Juan", "middleName": null, "lastName": "Dela Cruz" },
  "unread": true
}
```

`units` lists trucks moved in that step (sent for `DISPATCHED`/`ALARM_RAISED`, released for `INCIDENT_CLOSED`), after the per-account filter; it is empty when none of the account's trucks moved (e.g. a city that is only on the running card). `unread` is present on `GET /notifications` only.

## GET /api/notifications
- **Query:** `take` (1–100, default 20), `before` (optional notification id: return only older ones).
- **200:** `Notification[]` visible to me, newest first (by id), at most `take`. A page shorter than `take` is the last one.
- **Paging** is by cursor: pass the `id` of the last notification you have as `before` for the next page. Ids only grow, so notifications arriving meanwhile don't shift pages (no duplicates or gaps). The Notifications page loads pages of 20 as you scroll (with a "Load older notifications" button as fallback) and merges live notifications in at the top.

## GET /api/notifications/unread-count
- **200:** `{ "count": number }`.

## POST /api/notifications/seen
- **Body (optional):** `{ "incidentId"?: uuid }`.
- **204.** Without a body: sets `notificationsSeenAt = now()` (everything read). With `incidentId`: upserts `IncidentView(user, incident, seenAt = now())`, so that incident's notifications up to now are read; the incident page calls this when it opens and whenever a live notification for it arrives while it is on screen. 404 if the incident doesn't exist.
- Per account: other accounts of the same office keep their unread state.
- Unread = `createdAt` after `notificationsSeenAt` **and** after the account's `IncidentView.seenAt` for that incident.

## GET /api/notifications/stream
- **Server-Sent Events** (`text/event-stream`). Sends `event: notification` with a Notification (without `unread`) when one visible to me is created (units filtered as above), and `event: ping` every 25 s.
- Auth is the normal bearer header (the frontend reads the stream with `fetch`, not `EventSource`). The token is checked only when the stream opens, so the server **ends every stream after 10 minutes** and the client reconnects with a fresh token; a disabled account stops receiving within that time.
- The client re-reads `unread-count` on every (re)connect to catch up on anything missed.
- Behind nginx: `frontend/nginx.conf` has a dedicated location with `proxy_buffering off` and `proxy_read_timeout 15m`.
- shortcut: events are published in-process (RxJS `Subject`), so this works only with a single backend process. With more than one, publish through Postgres `LISTEN/NOTIFY` or Redis.

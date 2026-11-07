import { Body, Controller, Get, HttpCode, Post, Query, Sse, type MessageEvent } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { filter, interval, map, merge, takeUntil, timer, type Observable } from 'rxjs';
import { z } from 'zod';
import { AccessPolicy } from '../auth/access.policy.js';
import type { AuthUser } from '../auth/auth-user.js';
import { NotificationsService } from './notifications.service.js';

// Cursor paging: `before` is the id of the last notification already shown (ids only grow, so live inserts don't shift pages).
const listQuery = z.strictObject({
  take: z.coerce.number().int().min(1).max(100).optional(),
  before: z.coerce.number().int().min(1).optional(),
});
// Posted without a body to mark everything read.
const seenBody = z.strictObject({ incidentId: z.uuid().optional() }).default({});

@Controller('notifications')
@Can(AccessPolicy, 'operate')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** Notifications naming a city in my office's area (Regional: all), newest first, one page at a time. */
  @Get()
  list(@CurrentUser() user: AuthUser, @Query({ schema: listQuery }) query: z.infer<typeof listQuery>) {
    return this.notifications.list(user, query.take, query.before);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCount(user);
  }

  /** Marks everything (or, with incidentId, that incident's notifications) read up to now for this account. */
  @Post('seen')
  @HttpCode(204)
  async seen(@CurrentUser() user: AuthUser, @Body({ schema: seenBody }) body: z.infer<typeof seenBody>) {
    await this.notifications.markSeen(user, body.incidentId);
  }

  /**
   * Server-Sent Events. Auth is checked when the stream opens, so it ends after 10 minutes and the client
   * reconnects with a fresh token: a disabled account stops receiving within that time.
   * Pings every 25 s keep proxies from closing an idle connection.
   */
  @Sse('stream')
  stream(@CurrentUser() user: AuthUser): Observable<MessageEvent> {
    return merge(
      this.notifications.events.pipe(
        filter((n) => this.notifications.isFor(user, n)),
        map((n) => ({ type: 'notification', data: this.notifications.forUser(user, n) })),
      ),
      interval(25_000).pipe(map(() => ({ type: 'ping', data: '' }))),
    ).pipe(takeUntil(timer(10 * 60_000)));
  }
}

import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { AuthenticationEvents } from '@nestjs/authentication';
import type { Subscription } from 'rxjs';
import { AuditService } from '../audit/audit.service.js';

/**
 * Audits what only the authentication library sees: a sign-out (it knows whose refresh token it revoked), and a
 * refresh token used twice (a sign of a stolen session; the library revokes the whole family).
 */
@Injectable()
export class AuthAuditListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthAuditListener.name);
  private subscription?: Subscription;

  constructor(
    private readonly events: AuthenticationEvents,
    private readonly audit: AuditService,
  ) {}

  onModuleInit() {
    this.subscription = this.events.events$.subscribe((event) => {
      const entry =
        event.type === 'sign-out' ? this.audit.log(event.userId, 'SIGN_OUT', 'Session', event.userId)
        : event.type === 'refresh-token-reused' ? this.audit.log(event.userId, 'TOKEN_REUSED', 'Session', event.userId, { note: 'refresh token used twice; all its sessions were signed out' })
        : null;
      // The response has already gone out: a failed entry is logged, not thrown.
      entry?.catch((error: Error) => this.logger.error(`Could not audit ${event.type}: ${error.message}`));
    });
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe();
  }
}

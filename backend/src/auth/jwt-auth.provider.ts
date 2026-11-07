import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';
import type { AuthUser } from './auth-user.js';
import { UserLoader } from './user-loader.service.js';

@Injectable()
export class JwtAuth extends JwtBearerProvider<AuthUser> {
  constructor(
    private readonly users: UserLoader,
    registry: AuthenticationRegistry,
  ) {
    // Tolerate clock steps (WSL/VM time corrections, servers syncing): a token "issued" a few seconds in the future
    // would otherwise be refused. Negligible against the 15-minute token life.
    super({ realm: 'rcs', clockTolerance: '30s' });
    registry.registerProvider(this);
  }

  // Loads the user on every request so disabling, removing or a role change applies immediately.
  validate({ sub }: JwtClaims) {
    return sub ? this.users.load(sub) : null;
  }
}

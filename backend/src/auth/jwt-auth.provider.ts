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
    super({ realm: 'rcs' });
    registry.registerProvider(this);
  }

  // Loads the user on every request so disabling, removing or a role change applies immediately.
  validate({ sub }: JwtClaims) {
    return sub ? this.users.load(sub) : null;
  }
}

# Module: auth

`backend/src/auth/` · API: [auth](../api/auth.md) · Security: [authentication](../security/authentication.md), [authorization](../security/authorization.md)

| File | Responsibility |
|---|---|
| `auth.module.ts` | Provides `AuthService`, `JwtAuth`, `PrismaRefreshTokenStore`, `AccessPolicy`, `UserLoader`; exports `AccessPolicy` |
| `auth.controller.ts` | `/auth/login`, `/refresh`, `/logout`, `/me`, `/change-password`; sets/clears the `rcs_rt` cookie |
| `auth.service.ts` | Credential check, token issue/refresh/revoke via `TokenService`, password change |
| `auth.dto.ts` | `LoginDto`, `ChangePasswordDto` |
| `jwt-auth.provider.ts` | `JwtAuth extends JwtBearerProvider`; registers itself with `AuthenticationRegistry`; `validate()` → `UserLoader.load(sub)` |
| `prisma-refresh-token.store.ts` | `RefreshTokenStore` implementation on `RefreshToken` / `RevokedRefreshFamily`; registers with `AuthenticationStorage` |
| `user-loader.service.ts` | Loads an active, non-deleted user and adds `areaCityIds`, `dispatchCityId` (uses `CityDirectory`) |
| `auth-user.ts` | `AuthUser` type, `AUTH_USER_SELECT`, module augmentation of `AuthenticationTypes` |
| `area.ts` | `OFFICE_LEVELS`, `areaCityIds()`, `dispatchCityId()` (pure; tested in `area.spec.ts`) |
| `access.policy.ts` | `AccessPolicy`: `before`, `operate`, `editStations`, `editCity`, `dispatch`, `dispatchIn`, `manageUsers`, `viewAuditLog`, `manageSettings` |

Depends on: `@nestjs/authentication`, `@nestjs/authorization`, `@nestjs/throttler`, `PrismaService`, `CityDirectory`.

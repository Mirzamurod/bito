import type { UserRole } from '../models/User';

export interface AuthUser {
  userId: string;
  tenantId: string;
  role: UserRole;
}

/** NextAuth JWT strategy bilan mos payload. */
export interface AccessTokenPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
}

import { Role } from '../../common/enums/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  tokenType: 'access' | 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { AdminsService } from '../admins/admins.service';
import { Role } from '../common/enums/role.enum';
import { ClientsService } from '../clients/clients.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  const adminsService = {
    findByEmail: jest.fn(),
  } as unknown as AdminsService;

  const clientsService = {
    findByEmail: jest.fn(),
  } as unknown as ClientsService;

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const configService = {
    get: jest.fn((key: string, defaultValue: string) => {
      const values: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRY: '24h',
        CLIENT_JWT_EXPIRY: '30d',
        JWT_REFRESH_EXPIRY: '30d',
      };

      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();

    (jwtService.signAsync as jest.Mock).mockImplementation(
      async (payload: { tokenType: 'access' | 'refresh' }) =>
        `${payload.tokenType}-token`,
    );

    authService = new AuthService(
      adminsService,
      clientsService,
      jwtService,
      configService,
    );
  });

  it('logs in admin and returns token pair', async () => {
    const passwordHash = await hash('Admin123!', 10);

    (adminsService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@trexgym.local',
      passwordHash,
    });

    const result = await authService.loginAdmin('admin@trexgym.local', 'Admin123!');

    expect(result.user.role).toBe(Role.ADMIN);
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });

  it('fails login for invalid admin credentials', async () => {
    (adminsService.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.loginAdmin('missing@trexgym.local', 'wrong-pass'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logs in client and returns token pair', async () => {
    const pinHash = await hash('123456', 10);

    (clientsService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'client-1',
      email: 'client@trexgym.local',
      pinHash,
    });

    const result = await authService.loginClient('client@trexgym.local', '123456');

    expect(result.user.role).toBe(Role.CLIENT);
    expect(result.accessToken).toBe('access-token');
  });

  it('refreshes token pair from refresh token payload', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'admin-1',
      email: 'admin@trexgym.local',
      role: Role.ADMIN,
      tokenType: 'refresh',
    });

    const result = await authService.refresh('refresh-token');

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });
});

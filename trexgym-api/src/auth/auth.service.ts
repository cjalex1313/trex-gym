import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { AdminsService } from '../admins/admins.service';
import { Role } from '../common/enums/role.enum';
import { ClientsService } from '../clients/clients.service';
import { AuthenticatedUser, JwtPayload } from './interfaces/jwt-payload.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly clientsService: ClientsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async loginAdmin(email: string, password: string) {
    const admin = await this.adminsService.findByEmail(email);

    if (!admin || !(await compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user: AuthenticatedUser = {
      id: admin.id,
      email: admin.email,
      role: Role.ADMIN,
    };

    const tokens = await this.generateTokens(user, this.getAdminAccessExpiry());

    return {
      user,
      ...tokens,
    };
  }

  async loginClient(email: string, pin: string) {
    const client = await this.clientsService.findByEmail(email);

    if (!client || !(await compare(pin, client.pinHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user: AuthenticatedUser = {
      id: client.id,
      email: client.email,
      role: Role.CLIENT,
    };

    const tokens = await this.generateTokens(user, this.getClientAccessExpiry());

    return {
      user,
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev-secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token type');
    }

    const user: AuthenticatedUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    const accessExpiry =
      user.role === Role.ADMIN
        ? this.getAdminAccessExpiry()
        : this.getClientAccessExpiry();

    return this.generateTokens(user, accessExpiry);
  }

  private async generateTokens(
    user: AuthenticatedUser,
    accessExpiry: number,
  ): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'access',
    };

    const refreshPayload: JwtPayload = {
      ...accessPayload,
      tokenType: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev-secret'),
        expiresIn: accessExpiry,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev-secret'),
        expiresIn: this.getRefreshExpiry(),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  private getAdminAccessExpiry() {
    const value = this.configService.get<string>('JWT_EXPIRY', '24h');
    return this.parseExpiryToSeconds(value, 24 * 60 * 60);
  }

  private getClientAccessExpiry() {
    const value = this.configService.get<string>('CLIENT_JWT_EXPIRY', '30d');
    return this.parseExpiryToSeconds(value, 30 * 24 * 60 * 60);
  }

  private getRefreshExpiry() {
    const value = this.configService.get<string>('JWT_REFRESH_EXPIRY', '30d');
    return this.parseExpiryToSeconds(value, 30 * 24 * 60 * 60);
  }

  private parseExpiryToSeconds(value: string, fallback: number) {
    if (/^\d+$/.test(value)) {
      return Number(value);
    }

    const match = value.match(/^(\d+)([smhd])$/i);
    if (!match) {
      return fallback;
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 24 * 60 * 60;
      default:
        return fallback;
    }
  }
}

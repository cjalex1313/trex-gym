import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ClientLoginDto } from './dto/client-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';

const AUTH_THROTTLE_LIMIT = 200;
const AUTH_THROTTLE_TTL_MS = 60000;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ auth: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @Post('admin/login')
  loginAdmin(@Body() dto: AdminLoginDto): Promise<unknown> {
    return this.authService.loginAdmin(dto.email, dto.password);
  }

  @Public()
  @Throttle({ auth: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @Post('client/login')
  loginClient(@Body() dto: ClientLoginDto): Promise<unknown> {
    return this.authService.loginClient(dto.email, dto.pin);
  }

  @Public()
  @Throttle({ auth: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<unknown> {
    return this.authService.refresh(dto.refreshToken);
  }
}

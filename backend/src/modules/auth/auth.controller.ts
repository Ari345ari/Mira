import {
  Controller, Post, Get, Body,
  UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import {
  SignupDto, LoginDto,
  RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto,
} from './auth.dto'
import { RequestUser } from './jwt.strategy'

@ApiTags('auth')
@Controller('auth')
export class AuthController {

  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Create account' })
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto)
  }

  @ApiOperation({ summary: 'Login' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown'
    return this.authService.login(dto, ip)
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<any> {
    return this.authService.refresh(dto.refresh_token)
  }

  @ApiOperation({ summary: 'Logout' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refresh_token)
    return { message: 'Logged out successfully' }
  }

  @ApiOperation({ summary: 'Request password reset token' })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto)
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto)
  }

  @ApiOperation({ summary: 'Get current user' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: { user: RequestUser }) {
    return this.authService.getMe(req.user.userId)
  }
}

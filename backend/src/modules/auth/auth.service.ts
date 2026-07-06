import {
  Injectable, UnauthorizedException,
  ConflictException, BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { randomBytes, createHash, randomUUID } from 'crypto'
import { User } from '../../database/entities/user.entity'
import { Workspace } from '../../database/entities/workspace.entity'
import { WorkspaceMember, WorkspaceRole } from '../../database/entities/workspace-member.entity'
import { SignupDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './auth.dto'

interface TokenPair {
  access_token: string
  refresh_token: string
  expires_in: number
}

// Simple in-memory refresh token store for MVP
// Replace with DB table in production
const refreshTokenStore = new Map<string, {
  userId: string
  familyId: string
  isValid: boolean
  expiresAt: Date
}>()


@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Workspace)
    private workspaceRepo: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private memberRepo: Repository<WorkspaceMember>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<{ message: string }> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    })

    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
      })
    }

    const password_hash = await bcrypt.hash(dto.password, 12)

    const user = await this.userRepo.save({
      email: dto.email.toLowerCase(),
      full_name: dto.full_name,
      password_hash,
      preferred_language: dto.preferred_language ?? 'mn',
      email_verified_at: new Date(),
    })

    // Auto-create Personal workspace
    const slug = `${dto.full_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${randomUUID().slice(0, 8)}`
    const workspace = await this.workspaceRepo.save(
      this.workspaceRepo.create({ name: 'Personal', slug, owner_id: user.id }),
    )
    await this.memberRepo.save(
      this.memberRepo.create({ workspace_id: workspace.id, user_id: user.id, role: WorkspaceRole.ADMIN }),
    )

    return { message: 'Account created successfully' }
  }

  async login(dto: LoginDto, ipAddress: string): Promise<any> {
    // Load user with password_hash (normally excluded)
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password_hash')
      .where('u.email = :email', { email: dto.email.toLowerCase() })
      .andWhere('u.deleted_at IS NULL')
      .getOne()

    if (!user || !user.password_hash) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      })
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash)
    if (!passwordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      })
    }

    await this.userRepo.update(user.id, { last_login_at: new Date() })

    const tokens = await this.issueTokenPair(user.id)

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        preferred_language: user.preferred_language,
      },
    }
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken)
    const stored = refreshTokenStore.get(tokenHash)

    if (!stored) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Invalid refresh token',
      })
    }

    if (!stored.isValid) {
      for (const [, value] of refreshTokenStore.entries()) {
        if (value.familyId === stored.familyId) {
          value.isValid = false
        }
      }
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REUSED',
        message: 'Token reuse detected. Please log in again.',
      })
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Session expired. Please log in again.',
      })
    }

    stored.isValid = false
    return this.issueTokenPair(stored.userId, stored.familyId)
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken)
    refreshTokenStore.delete(tokenHash)
  }

  async getMe(userId: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
        preferred_language: true,
        timezone: true,
        email_verified_at: true,
        created_at: true,
      },
    })

    if (!user) throw new UnauthorizedException()
    return user
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; token?: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } })
    if (!user) {
      return { message: 'If that email is registered, a reset token has been generated.' }
    }
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = this.hashToken(rawToken)
    await this.userRepo.update(user.id, {
      password_reset_token_hash: tokenHash,
      password_reset_expires_at: new Date(Date.now() + 3600_000),
    })
    // In production: email rawToken. For dev, return it directly.
    return { message: 'Reset token generated.', token: rawToken }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(dto.token)
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password_reset_token_hash')
      .addSelect('u.password_reset_expires_at')
      .where('u.password_reset_token_hash = :tokenHash', { tokenHash })
      .getOne()
    if (!user || !user.password_reset_expires_at || user.password_reset_expires_at < new Date()) {
      throw new BadRequestException({ code: 'INVALID_RESET_TOKEN', message: 'Invalid or expired reset token.' })
    }
    const password_hash = await bcrypt.hash(dto.new_password, 12)
    await this.userRepo.update(user.id, {
      password_hash,
      password_reset_token_hash: null,
      password_reset_expires_at: null,
    })
    return { message: 'Password updated successfully.' }
  }

  private async issueTokenPair(
    userId: string,
    familyId?: string,
  ): Promise<TokenPair> {
    const family = familyId ?? randomUUID()

    const access_token = this.jwtService.sign({ sub: userId, type: 'access' })

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = this.hashToken(rawToken)

    refreshTokenStore.set(tokenHash, {
      userId,
      familyId: family,
      isValid: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    return { access_token, refresh_token: rawToken, expires_in: 900 }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }
}

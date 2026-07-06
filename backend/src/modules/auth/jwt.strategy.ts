import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

export interface JwtPayload {
  sub: string
  type: string
  iat: number
  exp: number
}

export interface RequestUser {
  userId: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      // Query param fallback lets native <video>/<audio> tags stream media
      // directly (they can't set an Authorization header)
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.query?.token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret'),
    })
  }

  validate(payload: JwtPayload): RequestUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException()
    }
    return { userId: payload.sub }
  }
}

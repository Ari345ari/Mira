import {
  IsEmail, IsString, MinLength,
  MaxLength, IsOptional,
} from 'class-validator'

export class SignupDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  full_name: string

  @IsOptional()
  @IsString()
  preferred_language?: string
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string

  @IsOptional()
  @IsString()
  device_hint?: string
}

export class RefreshTokenDto {
  @IsString()
  refresh_token: string
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string
}

export class ResetPasswordDto {
  @IsString()
  token: string

  @IsString()
  @MinLength(8)
  new_password: string
}

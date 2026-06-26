import { IsString, IsOptional, IsEmail, IsEnum, MinLength, MaxLength } from 'class-validator'
import { WorkspaceRole } from '../../database/entities/workspace-member.entity'

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string

  @IsString()
  @IsOptional()
  logo_url?: string
}

export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(80)
  name?: string

  @IsString()
  @IsOptional()
  logo_url?: string
}

export class InviteMemberDto {
  @IsEmail()
  email: string

  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole
}

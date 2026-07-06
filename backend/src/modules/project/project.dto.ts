import { IsString, IsOptional, MaxLength, IsHexColor } from 'class-validator'

export class CreateProjectDto {
  @IsString() @MaxLength(120)
  name: string

  @IsOptional() @IsString() @MaxLength(500)
  description?: string

  @IsOptional() @IsHexColor()
  color?: string
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @MaxLength(120)
  name?: string

  @IsOptional() @IsString() @MaxLength(500)
  description?: string

  @IsOptional() @IsHexColor()
  color?: string
}

export class AssignProjectDto {
  @IsOptional() @IsString()
  project_id?: string | null
}

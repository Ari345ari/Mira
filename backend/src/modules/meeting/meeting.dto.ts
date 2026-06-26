import { IsString, IsOptional, IsDateString, IsArray, IsEnum, MinLength } from 'class-validator'
import { Transform } from 'class-transformer'
import { MeetingLanguage } from '../../database/entities/meeting.entity'

function toStringArray({ value }: { value: unknown }): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

export class CreateMeetingDto {
  @IsString()
  @MinLength(2)
  title: string

  @IsString()
  workspace_id: string

  @IsDateString()
  meeting_date: string

  @IsEnum(MeetingLanguage)
  @IsOptional()
  language?: MeetingLanguage

  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  participants?: string[]
}

export class UpdateMeetingDto {
  @IsString()
  @IsOptional()
  title?: string

  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  participants?: string[]
}

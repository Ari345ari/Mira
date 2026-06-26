import { IsString, IsOptional, IsObject } from 'class-validator'

export class UpdateProtocolDto {
  @IsString()
  @IsOptional()
  summary?: string

  @IsObject()
  @IsOptional()
  agenda_items?: any[]

  @IsObject()
  @IsOptional()
  key_decisions?: any[]

  @IsObject()
  @IsOptional()
  action_items?: any[]

  @IsObject()
  @IsOptional()
  open_questions?: any[]
}

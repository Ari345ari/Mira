import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { IsString, IsArray, IsIn, ValidateNested, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'
import { ChatService, ChatMessage } from './chat.service'
import { RequestUser } from '../auth/jwt.strategy'

class HistoryItemDto {
  @IsIn(['user', 'model'])
  role: 'user' | 'model'

  @IsString()
  text: string
}

class BriefDto {
  @IsString()
  agenda: string

  @IsOptional()
  @IsString()
  workspace_id?: string
}

class ChatDto {
  @IsString()
  message: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryItemDto)
  history?: ChatMessage[]

  @IsOptional()
  @IsString()
  project_id?: string
}

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @HttpCode(HttpStatus.OK)
  @Post('chat')
  async chat(@Body() dto: ChatDto, @Req() req: { user: RequestUser }) {
    const reply = await this.chatService.chat(req.user.userId, dto.message, dto.history ?? [], dto.project_id)
    return { reply }
  }

  @HttpCode(HttpStatus.OK)
  @Post('brief')
  async brief(@Body() dto: BriefDto, @Req() req: { user: RequestUser }) {
    const brief = await this.chatService.brief(req.user.userId, dto.agenda, dto.workspace_id)
    return { brief }
  }
}

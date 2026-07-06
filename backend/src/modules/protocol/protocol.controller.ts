import { Controller, Get, Patch, Post, Param, Body, UseGuards, Request } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ProtocolService } from './protocol.service'
import { MeetingService } from '../meeting/meeting.service'
import { RealAiService } from '../../services/real-ai.service'
import { UpdateProtocolDto } from './protocol.dto'

@UseGuards(AuthGuard('jwt'))
@Controller('meetings/:meetingId/protocol')
export class ProtocolController {
  constructor(
    private readonly protocolService: ProtocolService,
    private readonly meetingService: MeetingService,
    private readonly realAiService: RealAiService,
  ) {}

  @Get()
  async get(@Param('meetingId') meetingId: string, @Request() req: any) {
    await this.meetingService.getById(meetingId, req.user.userId)
    return this.protocolService.getOrThrow(meetingId)
  }

  @Patch()
  async update(
    @Param('meetingId') meetingId: string,
    @Request() req: any,
    @Body() dto: UpdateProtocolDto,
  ) {
    await this.meetingService.getById(meetingId, req.user.userId)
    return this.protocolService.update(meetingId, req.user.userId, dto)
  }

  @Post('grammar-check')
  async grammarCheck(@Body() body: { text: string }) {
    const corrected = await this.realAiService.grammarCheck(body.text ?? '')
    return { corrected }
  }
}

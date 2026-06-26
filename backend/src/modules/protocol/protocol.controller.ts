import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ProtocolService } from './protocol.service'
import { MeetingService } from '../meeting/meeting.service'
import { UpdateProtocolDto } from './protocol.dto'

@UseGuards(AuthGuard('jwt'))
@Controller('meetings/:meetingId/protocol')
export class ProtocolController {
  constructor(
    private readonly protocolService: ProtocolService,
    private readonly meetingService: MeetingService,
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
}

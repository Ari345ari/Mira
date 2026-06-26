import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { TranscriptService } from './transcript.service'
import { MeetingService } from '../meeting/meeting.service'

@UseGuards(AuthGuard('jwt'))
@Controller('meetings/:meetingId/transcript')
export class TranscriptController {
  constructor(
    private readonly transcriptService: TranscriptService,
    private readonly meetingService: MeetingService,
  ) {}

  @Get()
  async get(@Param('meetingId') meetingId: string, @Request() req: any) {
    // Verify access
    await this.meetingService.getById(meetingId, req.user.userId)
    return this.transcriptService.getOrThrow(meetingId)
  }
}

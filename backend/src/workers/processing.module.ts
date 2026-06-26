import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { ProcessingWorker } from './processing.worker'
import { MeetingModule } from '../modules/meeting/meeting.module'
import { TranscriptModule } from '../modules/transcript/transcript.module'
import { ProtocolModule } from '../modules/protocol/protocol.module'
import { MockSttService } from '../services/mock-stt.service'
import { MockAiService } from '../services/mock-ai.service'
import { RealSttService } from '../services/real-stt.service'
import { RealAiService } from '../services/real-ai.service'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'meeting-processing' }),
    MeetingModule,
    TranscriptModule,
    ProtocolModule,
  ],
  providers: [ProcessingWorker, MockSttService, MockAiService, RealSttService, RealAiService],
})
export class ProcessingModule {}

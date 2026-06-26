import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Transcript } from '../../database/entities/transcript.entity'
import { TranscriptController } from './transcript.controller'
import { TranscriptService } from './transcript.service'
import { MeetingModule } from '../meeting/meeting.module'

@Module({
  imports: [TypeOrmModule.forFeature([Transcript]), MeetingModule],
  controllers: [TranscriptController],
  providers: [TranscriptService],
  exports: [TranscriptService],
})
export class TranscriptModule {}

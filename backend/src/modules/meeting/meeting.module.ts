import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bull'
import { Meeting } from '../../database/entities/meeting.entity'
import { WorkspaceMember } from '../../database/entities/workspace-member.entity'
import { MeetingController } from './meeting.controller'
import { MeetingService } from './meeting.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, WorkspaceMember]),
    BullModule.registerQueue({ name: 'meeting-processing' }),
  ],
  controllers: [MeetingController],
  providers: [MeetingService],
  exports: [MeetingService],
})
export class MeetingModule {}

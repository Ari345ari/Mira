import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Protocol } from '../../database/entities/protocol.entity'
import { ProtocolController } from './protocol.controller'
import { ProtocolService } from './protocol.service'
import { RealAiService } from '../../services/real-ai.service'
import { MeetingModule } from '../meeting/meeting.module'

@Module({
  imports: [TypeOrmModule.forFeature([Protocol]), MeetingModule],
  controllers: [ProtocolController],
  providers: [ProtocolService, RealAiService],
  exports: [ProtocolService],
})
export class ProtocolModule {}

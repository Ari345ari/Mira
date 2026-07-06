import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Protocol } from '../../database/entities/protocol.entity'
import { WorkspaceMember } from '../../database/entities/workspace-member.entity'
import { Meeting } from '../../database/entities/meeting.entity'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'

@Module({
  imports: [TypeOrmModule.forFeature([Protocol, WorkspaceMember, Meeting])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Protocol } from '../../database/entities/protocol.entity'
import { ActionItemStatus } from '../../database/entities/action-item-status.entity'
import { WorkspaceMember } from '../../database/entities/workspace-member.entity'
import { ActionsService } from './actions.service'
import { ActionsController } from './actions.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Protocol, ActionItemStatus, WorkspaceMember])],
  controllers: [ActionsController],
  providers: [ActionsService],
})
export class ActionsModule {}

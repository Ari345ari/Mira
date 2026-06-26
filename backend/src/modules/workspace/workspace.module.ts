import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Workspace } from '../../database/entities/workspace.entity'
import { WorkspaceMember } from '../../database/entities/workspace-member.entity'
import { WorkspaceInvite } from '../../database/entities/workspace-invite.entity'
import { WorkspaceFile } from '../../database/entities/workspace-file.entity'
import { User } from '../../database/entities/user.entity'
import { WorkspaceController } from './workspace.controller'
import { WorkspaceService } from './workspace.service'

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember, WorkspaceInvite, WorkspaceFile, User])],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}

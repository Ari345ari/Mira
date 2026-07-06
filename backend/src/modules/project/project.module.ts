import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Project } from '../../database/entities/project.entity'
import { Meeting } from '../../database/entities/meeting.entity'
import { WorkspaceMember } from '../../database/entities/workspace-member.entity'
import { ProjectController } from './project.controller'
import { ProjectService } from './project.service'

@Module({
  imports: [TypeOrmModule.forFeature([Project, Meeting, WorkspaceMember])],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}

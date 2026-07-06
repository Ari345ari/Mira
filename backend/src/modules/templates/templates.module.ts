import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MeetingTemplate } from '../../database/entities/meeting-template.entity'
import { WorkspaceMember } from '../../database/entities/workspace-member.entity'
import { TemplatesService } from './templates.service'
import { TemplatesController } from './templates.controller'

@Module({
  imports: [TypeOrmModule.forFeature([MeetingTemplate, WorkspaceMember])],
  controllers: [TemplatesController],
  providers: [TemplatesService],
})
export class TemplatesModule {}

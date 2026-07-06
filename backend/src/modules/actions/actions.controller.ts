import { Controller, Get, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ActionsService } from './actions.service'
import { WorkspaceMember } from '../../database/entities/workspace-member.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IsIn } from 'class-validator'

class UpdateStatusDto {
  @IsIn(['open', 'done'])
  status: 'open' | 'done'
}

@UseGuards(AuthGuard('jwt'))
@Controller()
export class ActionsController {
  constructor(
    private readonly actionsService: ActionsService,
    @InjectRepository(WorkspaceMember)
    private memberRepo: Repository<WorkspaceMember>,
  ) {}

  private async assertMember(userId: string, workspaceId: string) {
    const m = await this.memberRepo.findOne({ where: { user_id: userId, workspace_id: workspaceId } })
    if (!m) throw new ForbiddenException()
  }

  @Get('workspaces/:wsId/action-items')
  async getAll(@Param('wsId') wsId: string, @Request() req: any) {
    await this.assertMember(req.user.userId, wsId)
    return this.actionsService.getAll(wsId)
  }

  @Patch('workspaces/:wsId/action-items/:meetingId/:index')
  async updateStatus(
    @Param('wsId') wsId: string,
    @Param('meetingId') meetingId: string,
    @Param('index') index: string,
    @Body() body: UpdateStatusDto,
    @Request() req: any,
  ) {
    await this.assertMember(req.user.userId, wsId)
    return this.actionsService.updateStatus(wsId, meetingId, parseInt(index, 10), body.status)
  }
}

import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, Request, ForbiddenException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WorkspaceMember } from '../../database/entities/workspace-member.entity'
import { TemplatesService } from './templates.service'

@UseGuards(AuthGuard('jwt'))
@Controller()
export class TemplatesController {
  constructor(
    private readonly svc: TemplatesService,
    @InjectRepository(WorkspaceMember)
    private memberRepo: Repository<WorkspaceMember>,
  ) {}

  private async assertMember(userId: string, workspaceId: string) {
    const m = await this.memberRepo.findOne({ where: { user_id: userId, workspace_id: workspaceId } })
    if (!m) throw new ForbiddenException()
  }

  @Get('workspaces/:wsId/templates')
  async list(@Param('wsId') wsId: string, @Request() req: any) {
    await this.assertMember(req.user.userId, wsId)
    return this.svc.findAll(wsId)
  }

  @Post('workspaces/:wsId/templates')
  async create(@Param('wsId') wsId: string, @Body() body: any, @Request() req: any) {
    await this.assertMember(req.user.userId, wsId)
    return this.svc.create(wsId, body)
  }

  @Patch('workspaces/:wsId/templates/:id')
  async update(
    @Param('wsId') wsId: string,
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    await this.assertMember(req.user.userId, wsId)
    return this.svc.update(wsId, id, body)
  }

  @Delete('workspaces/:wsId/templates/:id')
  async remove(@Param('wsId') wsId: string, @Param('id') id: string, @Request() req: any) {
    await this.assertMember(req.user.userId, wsId)
    return this.svc.remove(wsId, id)
  }
}

import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ProjectService } from './project.service'
import { CreateProjectDto, UpdateProjectDto, AssignProjectDto } from './project.dto'
import { RequestUser } from '../auth/jwt.strategy'

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class ProjectController {
  constructor(private svc: ProjectService) {}

  @Get('workspaces/:wsId/projects')
  list(@Param('wsId') wsId: string, @Req() req: { user: RequestUser }) {
    return this.svc.list(req.user.userId, wsId)
  }

  @Post('workspaces/:wsId/projects')
  create(@Param('wsId') wsId: string, @Body() dto: CreateProjectDto, @Req() req: { user: RequestUser }) {
    return this.svc.create(req.user.userId, wsId, dto)
  }

  @Patch('projects/:id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Req() req: { user: RequestUser }) {
    return this.svc.update(req.user.userId, id, dto)
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('projects/:id')
  remove(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    return this.svc.remove(req.user.userId, id)
  }

  @Get('projects/:id/meetings')
  getMeetings(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    return this.svc.getMeetings(req.user.userId, id)
  }

  @Patch('meetings/:id/project')
  assignMeeting(
    @Param('id') meetingId: string,
    @Body() dto: AssignProjectDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.svc.assignMeeting(req.user.userId, meetingId, dto.project_id ?? null)
  }

  @HttpCode(HttpStatus.OK)
  @Post('meetings/:id/dismiss-suggestion')
  dismissSuggestion(@Param('id') meetingId: string, @Req() req: { user: RequestUser }) {
    return this.svc.dismissSuggestion(req.user.userId, meetingId)
  }

  @HttpCode(HttpStatus.OK)
  @Post('meetings/:id/suggest-project')
  suggestProject(@Param('id') meetingId: string, @Req() req: { user: RequestUser }) {
    return this.svc.suggestProject(req.user.userId, meetingId)
  }
}

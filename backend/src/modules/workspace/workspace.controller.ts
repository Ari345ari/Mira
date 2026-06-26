import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, Request, UseInterceptors, UploadedFile, Res, NotFoundException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '@nestjs/passport'
import { diskStorage } from 'multer'
import * as path from 'path'
import * as fs from 'fs'
import { randomUUID } from 'crypto'
import type { Response } from 'express'
import { WorkspaceService } from './workspace.service'
import { CreateWorkspaceDto, UpdateWorkspaceDto, InviteMemberDto } from './workspace.dto'
import { WorkspaceRole } from '../../database/entities/workspace-member.entity'

const wsFileStorage = diskStorage({
  destination: './uploads/workspace',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${randomUUID()}${ext}`)
  },
})

@UseGuards(AuthGuard('jwt'))
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  getAll(@Request() req: any) {
    return this.workspaceService.getForUser(req.user.userId)
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateWorkspaceDto) {
    return this.workspaceService.create(req.user.userId, dto)
  }

  @Get('invites/me')
  getMyInvites(@Request() req: any) {
    return this.workspaceService.getMyInvites(req.user.userId)
  }

  @Post('invites/:id/respond')
  respondToInvite(@Param('id') id: string, @Request() req: any, @Body('action') action: 'accept' | 'decline') {
    return this.workspaceService.respondToInvite(id, req.user.userId, action)
  }

  @Delete('invites/:id')
  cancelInvite(@Param('id') id: string, @Request() req: any) {
    return this.workspaceService.cancelInvite(id, req.user.userId)
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Request() req: any) {
    return this.workspaceService.getById(id, req.user.userId)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateWorkspaceDto) {
    return this.workspaceService.update(id, req.user.userId, dto)
  }

  @Get(':id/users/search')
  searchUsers(@Param('id') id: string, @Request() req: any, @Query('q') q: string) {
    return this.workspaceService.searchUsers(id, req.user.userId, q ?? '')
  }

  @Get(':id/files')
  listFiles(@Param('id') id: string, @Request() req: any) {
    return this.workspaceService.listFiles(id, req.user.userId)
  }

  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file', { storage: wsFileStorage }))
  uploadFile(@Param('id') id: string, @Request() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.workspaceService.uploadFile(id, req.user.userId, file)
  }

  @Get(':id/files/:fileId/download')
  async downloadFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Request() req: any,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { path: filePath, name, mime } = await this.workspaceService.getFilePath(id, fileId, req.user.userId)
    if (!fs.existsSync(filePath)) throw new NotFoundException('File not found on disk')
    res.setHeader('Content-Type', mime)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(name)}"`)
    res.setHeader('Content-Length', fs.statSync(filePath).size)
    fs.createReadStream(filePath).pipe(res)
  }

  @Delete(':id/files/:fileId')
  deleteFile(@Param('id') id: string, @Param('fileId') fileId: string, @Request() req: any) {
    return this.workspaceService.deleteFile(id, fileId, req.user.userId)
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string, @Request() req: any) {
    return this.workspaceService.getMembers(id, req.user.userId)
  }

  @Post(':id/members')
  inviteMember(@Param('id') id: string, @Request() req: any, @Body() dto: InviteMemberDto) {
    return this.workspaceService.inviteMember(id, req.user.userId, dto)
  }

  @Patch(':id/members/:userId/role')
  updateRole(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any, @Body('role') role: WorkspaceRole) {
    return this.workspaceService.updateMemberRole(id, req.user.userId, userId, role)
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
    return this.workspaceService.removeMember(id, req.user.userId, userId)
  }
}

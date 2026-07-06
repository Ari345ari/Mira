import {
  Controller, Get, Head, Post, Delete, Param, Body, Query,
  UseGuards, Request, UseInterceptors, UploadedFile,
  NotFoundException, Headers, Res, StreamableFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '@nestjs/passport'
import { diskStorage } from 'multer'
import * as path from 'path'
import * as fs from 'fs'
import { randomUUID } from 'crypto'
import type { Response } from 'express'
import { MeetingService } from './meeting.service'
import { CreateMeetingDto } from './meeting.dto'

const MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav',
  '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.opus': 'audio/ogg',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
}

const storage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${randomUUID()}${ext}`)
  },
})

@UseGuards(AuthGuard('jwt'))
@Controller('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Get()
  list(@Request() req: any, @Query('workspaceId') workspaceId?: string) {
    return this.meetingService.list(req.user.userId, workspaceId)
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  upload(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.meetingService.create(req.user.userId, dto, file)
  }

  @Head(':id/media')
  async headMedia(
    @Param('id') id: string,
    @Request() req: any,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { mimeType, fileSize } = await this.resolveMediaFile(id, req.user.userId)
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
    })
    res.end()
  }

  private async resolveMediaFile(id: string, userId: string) {
    const meeting = await this.meetingService.getById(id, userId)
    const filePath = meeting.file_path
    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundException('Media file not found')
    }
    const ext = path.extname(filePath).toLowerCase()
    const mimeType = MIME[ext] ?? 'application/octet-stream'
    const fileSize = fs.statSync(filePath).size
    return { filePath, mimeType, fileSize }
  }

  @Get(':id/media')
  async streamMedia(
    @Param('id') id: string,
    @Request() req: any,
    @Headers('range') range: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { filePath, mimeType, fileSize } = await this.resolveMediaFile(id, req.user.userId)

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
      const start = parseInt(startStr, 10)
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1
      const chunkSize = end - start + 1
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
      })
      fs.createReadStream(filePath, { start, end }).pipe(res)
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      })
      fs.createReadStream(filePath).pipe(res)
    }
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Request() req: any) {
    return this.meetingService.getById(id, req.user.userId)
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.meetingService.delete(id, req.user.userId)
  }
}

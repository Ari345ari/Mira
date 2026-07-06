import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Project } from '../../database/entities/project.entity'
import { Meeting } from '../../database/entities/meeting.entity'
import { WorkspaceMember } from '../../database/entities/workspace-member.entity'
import { CreateProjectDto, UpdateProjectDto } from './project.dto'

@Injectable()
export class ProjectService {
  private genAI: GoogleGenerativeAI | null = null

  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(Meeting)
    private meetingRepo: Repository<Meeting>,
    @InjectRepository(WorkspaceMember)
    private memberRepo: Repository<WorkspaceMember>,
  ) {}

  private getAI() {
    if (!this.genAI) this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    return this.genAI
  }

  private async assertMember(userId: string, workspaceId: string) {
    const m = await this.memberRepo.findOne({ where: { user_id: userId, workspace_id: workspaceId } })
    if (!m) throw new ForbiddenException()
  }

  async list(userId: string, workspaceId: string) {
    await this.assertMember(userId, workspaceId)
    const projects = await this.projectRepo.find({
      where: { workspace_id: workspaceId, deleted_at: IsNull() },
      order: { created_at: 'ASC' },
    })
    // Attach meeting count to each project
    const counts = await this.meetingRepo
      .createQueryBuilder('m')
      .select('m.folder_id', 'folder_id')
      .addSelect('COUNT(*)', 'count')
      .where('m.workspace_id = :workspaceId', { workspaceId })
      .andWhere('m.folder_id IS NOT NULL')
      .andWhere('m.deleted_at IS NULL')
      .groupBy('m.folder_id')
      .getRawMany()
    const countMap = Object.fromEntries(counts.map((r: any) => [r.folder_id, parseInt(r.count)]))
    return projects.map(p => ({ ...p, meeting_count: countMap[p.id] ?? 0 }))
  }

  async create(userId: string, workspaceId: string, dto: CreateProjectDto) {
    await this.assertMember(userId, workspaceId)
    return this.projectRepo.save(
      this.projectRepo.create({
        workspace_id: workspaceId,
        created_by: userId,
        name: dto.name,
        description: dto.description ?? null,
        color: dto.color ?? '#6366f1',
      }),
    )
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.projectRepo.findOne({ where: { id: projectId, deleted_at: IsNull() } })
    if (!project) throw new NotFoundException()
    await this.assertMember(userId, project.workspace_id)
    Object.assign(project, dto)
    return this.projectRepo.save(project)
  }

  async remove(userId: string, projectId: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId, deleted_at: IsNull() } })
    if (!project) throw new NotFoundException()
    await this.assertMember(userId, project.workspace_id)
    await this.projectRepo.softDelete(projectId)
    // Unassign all meetings in this project
    await this.meetingRepo.update({ folder_id: projectId }, { folder_id: null })
  }

  async getMeetings(userId: string, projectId: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId, deleted_at: IsNull() } })
    if (!project) throw new NotFoundException()
    await this.assertMember(userId, project.workspace_id)
    return {
      project,
      meetings: await this.meetingRepo.find({
        where: { folder_id: projectId, deleted_at: IsNull() },
        order: { meeting_date: 'DESC' },
      }),
    }
  }

  async assignMeeting(userId: string, meetingId: string, projectId: string | null) {
    const meeting = await this.meetingRepo.findOne({ where: { id: meetingId, deleted_at: IsNull() } })
    if (!meeting) throw new NotFoundException()
    await this.assertMember(userId, meeting.workspace_id)
    if (projectId) {
      const project = await this.projectRepo.findOne({ where: { id: projectId, workspace_id: meeting.workspace_id, deleted_at: IsNull() } })
      if (!project) throw new NotFoundException('Project not found in this workspace')
    }
    await this.meetingRepo.update(meetingId, {
      folder_id: projectId ?? null,
      suggestion_dismissed: true,
    })
    return { ok: true }
  }

  async dismissSuggestion(userId: string, meetingId: string) {
    const meeting = await this.meetingRepo.findOne({ where: { id: meetingId, deleted_at: IsNull() } })
    if (!meeting) throw new NotFoundException()
    await this.assertMember(userId, meeting.workspace_id)
    await this.meetingRepo.update(meetingId, { suggestion_dismissed: true })
    return { ok: true }
  }

  async suggestProject(userId: string, meetingId: string) {
    const meeting = await this.meetingRepo.findOne({ where: { id: meetingId, deleted_at: IsNull() } })
    if (!meeting) throw new NotFoundException()
    await this.assertMember(userId, meeting.workspace_id)

    const projects = await this.projectRepo.find({
      where: { workspace_id: meeting.workspace_id, deleted_at: IsNull() },
    })
    if (projects.length === 0) return { suggestion: null }

    const projectList = projects.map((p, i) =>
      `${i}: ${p.name}${p.description ? ` — ${p.description}` : ''}`
    ).join('\n')

    const prompt = `You are categorizing a meeting into a project folder.

Meeting title: "${meeting.title}"

Available projects (index: name — description):
${projectList}

Which project index (0-based) best fits this meeting? Reply with ONLY the index number, or -1 if none fit well.`

    try {
      const model = this.getAI().getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent(prompt)
      const idx = parseInt(result.response.text().trim(), 10)
      if (idx >= 0 && idx < projects.length) {
        const suggested = projects[idx]
        await this.meetingRepo.update(meetingId, { suggested_project_id: suggested.id })
        return { suggestion: suggested }
      }
    } catch { /* ignore AI errors */ }
    return { suggestion: null }
  }
}

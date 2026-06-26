import {
  Injectable, NotFoundException, ForbiddenException,
  ConflictException, BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as fs from 'fs'
import { Workspace } from '../../database/entities/workspace.entity'
import { WorkspaceMember, WorkspaceRole } from '../../database/entities/workspace-member.entity'
import { WorkspaceInvite } from '../../database/entities/workspace-invite.entity'
import { WorkspaceFile } from '../../database/entities/workspace-file.entity'
import { User } from '../../database/entities/user.entity'
import { CreateWorkspaceDto, UpdateWorkspaceDto, InviteMemberDto } from './workspace.dto'

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)      private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(WorkspaceMember) private readonly memberRepo: Repository<WorkspaceMember>,
    @InjectRepository(WorkspaceInvite) private readonly inviteRepo: Repository<WorkspaceInvite>,
    @InjectRepository(WorkspaceFile)  private readonly fileRepo: Repository<WorkspaceFile>,
    @InjectRepository(User)           private readonly userRepo: Repository<User>,
  ) {}

  // ── Workspaces ────────────────────────────────────────────────────

  async createPersonalWorkspace(userId: string, displayName: string): Promise<Workspace> {
    const base = displayName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const slug = `${base}-${Date.now().toString(36)}`
    const workspace = this.workspaceRepo.create({ name: 'Personal', slug, owner_id: userId })
    const saved = await this.workspaceRepo.save(workspace)
    await this.memberRepo.save(
      this.memberRepo.create({ workspace_id: saved.id, user_id: userId, role: WorkspaceRole.ADMIN, invited_by: null }),
    )
    return saved
  }

  async create(userId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
    const slug = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`
    const workspace = this.workspaceRepo.create({ ...dto, slug, owner_id: userId })
    const saved = await this.workspaceRepo.save(workspace)
    await this.memberRepo.save(
      this.memberRepo.create({ workspace_id: saved.id, user_id: userId, role: WorkspaceRole.ADMIN }),
    )
    return saved
  }

  async getForUser(userId: string): Promise<Workspace[]> {
    const memberships = await this.memberRepo.find({ where: { user_id: userId } })
    if (!memberships.length) {
      const user = await this.userRepo.findOne({ where: { id: userId } })
      const ws = await this.createPersonalWorkspace(userId, user?.full_name ?? 'user')
      return [ws]
    }
    const ids = memberships.map((m) => m.workspace_id)
    return this.workspaceRepo
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.members', 'members')
      .where('w.id IN (:...ids)', { ids })
      .orderBy('w.created_at', 'ASC')
      .getMany()
  }

  async getById(id: string, userId: string): Promise<Workspace> {
    await this.assertMember(id, userId)
    const ws = await this.workspaceRepo
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.members', 'members')
      .where('w.id = :id', { id })
      .getOne()
    if (!ws) throw new NotFoundException('Workspace not found')
    return ws
  }

  async update(id: string, userId: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
    const requester = await this.assertMember(id, userId)
    if (requester.role !== WorkspaceRole.ADMIN) throw new ForbiddenException('Only admins can update workspace settings')
    const ws = await this.workspaceRepo.findOne({ where: { id } })
    if (!ws) throw new NotFoundException('Workspace not found')
    Object.assign(ws, dto)
    return this.workspaceRepo.save(ws)
  }

  // ── Members ───────────────────────────────────────────────────────

  async getMembers(workspaceId: string, requesterId: string) {
    await this.assertMember(workspaceId, requesterId)

    const [members, pendingInvites] = await Promise.all([
      this.memberRepo
        .createQueryBuilder('wm')
        .leftJoinAndSelect('wm.user', 'user')
        .where('wm.workspace_id = :workspaceId', { workspaceId })
        .orderBy('wm.joined_at', 'ASC')
        .getMany(),
      this.inviteRepo
        .createQueryBuilder('inv')
        .leftJoinAndSelect('inv.invitee', 'invitee')
        .leftJoinAndSelect('inv.inviter', 'inviter')
        .where('inv.workspace_id = :workspaceId AND inv.status = :status', { workspaceId, status: 'pending' })
        .orderBy('inv.created_at', 'DESC')
        .getMany(),
    ])

    return {
      members: members.map((m) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        invited_by: m.invited_by,
        user: m.user ? { id: m.user.id, full_name: m.user.full_name, email: m.user.email, avatar_url: m.user.avatar_url } : null,
      })),
      pending_invites: pendingInvites.map((inv) => ({
        id: inv.id,
        role: inv.role,
        created_at: inv.created_at,
        invitee: inv.invitee ? { id: inv.invitee.id, full_name: inv.invitee.full_name, email: inv.invitee.email } : null,
        inviter: inv.inviter ? { id: inv.inviter.id, full_name: inv.inviter.full_name, email: inv.inviter.email } : null,
      })),
    }
  }

  async inviteMember(workspaceId: string, inviterId: string, dto: InviteMemberDto) {
    const inviter = await this.assertMember(workspaceId, inviterId)
    if (inviter.role === WorkspaceRole.VIEWER) {
      throw new ForbiddenException('Only admins and editors can invite members')
    }

    const invitee = await this.userRepo.findOne({ where: { email: dto.email } })
    if (!invitee) throw new NotFoundException(`No account found for ${dto.email}`)

    // Already a member?
    const existingMember = await this.memberRepo.findOne({
      where: { workspace_id: workspaceId, user_id: invitee.id },
    })
    if (existingMember) throw new ConflictException(`${dto.email} is already a member`)

    // Already has a pending invite?
    const existingInvite = await this.inviteRepo.findOne({
      where: { workspace_id: workspaceId, invitee_id: invitee.id, status: 'pending' },
    })
    if (existingInvite) throw new ConflictException(`${dto.email} already has a pending invite`)

    const invite = await this.inviteRepo.save(
      this.inviteRepo.create({
        workspace_id: workspaceId,
        invitee_id: invitee.id,
        inviter_id: inviterId,
        role: dto.role ?? WorkspaceRole.VIEWER,
        status: 'pending',
      }),
    )

    return {
      id: invite.id,
      role: invite.role,
      status: invite.status,
      created_at: invite.created_at,
      invitee: { id: invitee.id, full_name: invitee.full_name, email: invitee.email },
    }
  }

  async cancelInvite(inviteId: string, requesterId: string) {
    const invite = await this.inviteRepo.findOne({ where: { id: inviteId } })
    if (!invite) throw new NotFoundException('Invite not found')

    // Only the inviter or a workspace admin can cancel
    const member = await this.memberRepo.findOne({ where: { workspace_id: invite.workspace_id, user_id: requesterId } })
    if (!member) throw new ForbiddenException('Not a workspace member')
    if (invite.inviter_id !== requesterId && member.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only admins or the original inviter can cancel this invite')
    }

    invite.status = 'cancelled'
    invite.responded_at = new Date()
    await this.inviteRepo.save(invite)
    return { success: true }
  }

  async removeMember(workspaceId: string, requesterId: string, targetUserId: string) {
    const requester = await this.assertMember(workspaceId, requesterId)
    if (requesterId !== targetUserId && requester.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only admins can remove other members')
    }
    if (targetUserId === requesterId && requester.role === WorkspaceRole.ADMIN) {
      const adminCount = await this.memberRepo.count({ where: { workspace_id: workspaceId, role: WorkspaceRole.ADMIN } })
      if (adminCount <= 1) throw new ForbiddenException('Cannot leave — you are the only admin. Transfer ownership first.')
    }
    const target = await this.memberRepo.findOne({ where: { workspace_id: workspaceId, user_id: targetUserId } })
    if (!target) throw new NotFoundException('Member not found')
    await this.memberRepo.remove(target)
    return { success: true }
  }

  async updateMemberRole(workspaceId: string, requesterId: string, targetUserId: string, role: WorkspaceRole) {
    const requester = await this.assertMember(workspaceId, requesterId)
    if (requester.role !== WorkspaceRole.ADMIN) throw new ForbiddenException('Only admins can change roles')
    const target = await this.memberRepo.findOne({ where: { workspace_id: workspaceId, user_id: targetUserId } })
    if (!target) throw new NotFoundException('Member not found')
    target.role = role
    return this.memberRepo.save(target)
  }

  // ── Invites (invitee side) ────────────────────────────────────────

  async getMyInvites(userId: string) {
    const invites = await this.inviteRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.workspace', 'workspace')
      .leftJoinAndSelect('workspace.members', 'members')
      .leftJoinAndSelect('inv.inviter', 'inviter')
      .where('inv.invitee_id = :userId AND inv.status = :status', { userId, status: 'pending' })
      .orderBy('inv.created_at', 'DESC')
      .getMany()

    return invites.map((inv) => ({
      id: inv.id,
      role: inv.role,
      status: inv.status,
      created_at: inv.created_at,
      workspace: inv.workspace
        ? { id: inv.workspace.id, name: inv.workspace.name, slug: inv.workspace.slug, member_count: inv.workspace.members?.length ?? 0 }
        : null,
      inviter: inv.inviter
        ? { id: inv.inviter.id, full_name: inv.inviter.full_name, email: inv.inviter.email }
        : null,
    }))
  }

  async respondToInvite(inviteId: string, userId: string, action: 'accept' | 'decline') {
    const invite = await this.inviteRepo.findOne({ where: { id: inviteId, invitee_id: userId } })
    if (!invite) throw new NotFoundException('Invite not found')
    if (invite.status !== 'pending') throw new BadRequestException('This invite has already been responded to')

    invite.status = action === 'accept' ? 'accepted' : 'declined'
    invite.responded_at = new Date()
    await this.inviteRepo.save(invite)

    if (action === 'accept') {
      // Check not already a member (race condition guard)
      const existing = await this.memberRepo.findOne({ where: { workspace_id: invite.workspace_id, user_id: userId } })
      if (!existing) {
        await this.memberRepo.save(
          this.memberRepo.create({ workspace_id: invite.workspace_id, user_id: userId, role: invite.role, invited_by: invite.inviter_id }),
        )
      }
    }

    return { success: true, status: invite.status }
  }

  // ── Workspace files ────────────────────────────────────────────────

  async listFiles(workspaceId: string, requesterId: string) {
    await this.assertMember(workspaceId, requesterId)
    const files = await this.fileRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.uploader', 'uploader')
      .where('f.workspace_id = :workspaceId', { workspaceId })
      .orderBy('f.created_at', 'DESC')
      .getMany()
    return files.map((f) => ({
      id: f.id,
      name: f.name,
      size: Number(f.size),
      mime_type: f.mime_type,
      created_at: f.created_at,
      uploader: f.uploader ? { id: f.uploader.id, full_name: f.uploader.full_name, email: f.uploader.email } : null,
    }))
  }

  async uploadFile(workspaceId: string, uploaderId: string, file: Express.Multer.File) {
    await this.assertMember(workspaceId, uploaderId)
    const record = await this.fileRepo.save(
      this.fileRepo.create({
        workspace_id: workspaceId,
        uploader_id: uploaderId,
        name: file.originalname,
        size: file.size,
        mime_type: file.mimetype,
        storage_path: file.path,
      }),
    )
    return { id: record.id, name: record.name, size: Number(record.size), mime_type: record.mime_type, created_at: record.created_at }
  }

  async getFilePath(workspaceId: string, fileId: string, requesterId: string): Promise<{ path: string; name: string; mime: string }> {
    await this.assertMember(workspaceId, requesterId)
    const f = await this.fileRepo.findOne({ where: { id: fileId, workspace_id: workspaceId } })
    if (!f) throw new NotFoundException('File not found')
    return { path: f.storage_path, name: f.name, mime: f.mime_type }
  }

  async deleteFile(workspaceId: string, fileId: string, requesterId: string) {
    const member = await this.assertMember(workspaceId, requesterId)
    const f = await this.fileRepo.findOne({ where: { id: fileId, workspace_id: workspaceId } })
    if (!f) throw new NotFoundException('File not found')
    if (f.uploader_id !== requesterId && member.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only the uploader or an admin can delete this file')
    }
    await this.fileRepo.remove(f)
    try { fs.unlinkSync(f.storage_path) } catch { /* ignore if already gone */ }
    return { success: true }
  }

  async searchUsers(workspaceId: string, requesterId: string, query: string) {
    await this.assertMember(workspaceId, requesterId)
    if (!query || query.trim().length < 2) return []

    const q = `%${query.trim().toLowerCase()}%`

    const [members, pendingInvites] = await Promise.all([
      this.memberRepo.find({ where: { workspace_id: workspaceId }, select: { user_id: true } }),
      this.inviteRepo.find({ where: { workspace_id: workspaceId, status: 'pending' }, select: { invitee_id: true } }),
    ])

    const excludeIds = [
      ...members.map((m) => m.user_id),
      ...pendingInvites.map((inv) => inv.invitee_id),
    ]

    const qb = this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.full_name', 'user.email', 'user.avatar_url'])
      .where('(LOWER(user.full_name) LIKE :q OR LOWER(user.email) LIKE :q)', { q })
      .limit(8)

    if (excludeIds.length > 0) {
      qb.andWhere('user.id NOT IN (:...excludeIds)', { excludeIds })
    }

    return qb.getMany()
  }

  private async assertMember(workspaceId: string, userId: string): Promise<WorkspaceMember> {
    const member = await this.memberRepo.findOne({ where: { workspace_id: workspaceId, user_id: userId } })
    if (!member) throw new ForbiddenException('Not a workspace member')
    return member
  }
}

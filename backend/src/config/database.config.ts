import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { User } from '../database/entities/user.entity'
import { Workspace } from '../database/entities/workspace.entity'
import { WorkspaceMember } from '../database/entities/workspace-member.entity'
import { WorkspaceInvite } from '../database/entities/workspace-invite.entity'
import { WorkspaceFile } from '../database/entities/workspace-file.entity'
import { Meeting } from '../database/entities/meeting.entity'
import { Transcript } from '../database/entities/transcript.entity'
import { Protocol } from '../database/entities/protocol.entity'

export const getDatabaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get('DATABASE_HOST', 'localhost'),
  port: config.get<number>('DATABASE_PORT', 5432),
  username: config.get('DATABASE_USER', 'chimege'),
  password: config.get('DATABASE_PASSWORD', 'secret'),
  database: config.get('DATABASE_NAME', 'chimege_protocol'),
  entities: [
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceInvite,
    WorkspaceFile,
    Meeting,
    Transcript,
    Protocol,
  ],
  synchronize: config.get('NODE_ENV') === 'development', // auto-sync in dev only
  logging: config.get('NODE_ENV') === 'development',
  ssl: config.get('NODE_ENV') === 'production'
    ? { rejectUnauthorized: false }
    : false,
})

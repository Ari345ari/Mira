import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bull'
import { getDatabaseConfig } from './config/database.config'
import { AuthModule } from './modules/auth/auth.module'
import { WorkspaceModule } from './modules/workspace/workspace.module'
import { MeetingModule } from './modules/meeting/meeting.module'
import { TranscriptModule } from './modules/transcript/transcript.module'
import { ProtocolModule } from './modules/protocol/protocol.module'
import { ProcessingModule } from './workers/processing.module'
import { ChatModule } from './modules/chat/chat.module'
import { ProjectModule } from './modules/project/project.module'
import { ActionsModule } from './modules/actions/actions.module'
import { TemplatesModule } from './modules/templates/templates.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    AuthModule,
    WorkspaceModule,
    MeetingModule,
    TranscriptModule,
    ProtocolModule,
    ProcessingModule,
    ChatModule,
    ProjectModule,
    ActionsModule,
    TemplatesModule,
  ],
})
export class AppModule {}

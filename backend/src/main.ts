import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  // Security
  // crossOriginResourcePolicy relaxed since the frontend lives on a different
  // origin (separate Railway service) and needs to read API responses
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.enableCors({
    origin: config.get('FRONTEND_URL', 'http://localhost:3001'),
    credentials: true,
  })

  // Global prefix
  app.setGlobalPrefix('api/v1')

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))

  // Swagger docs (development only)
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Chimege Protocol API')
      .setDescription('Meeting intelligence platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document)
  }

  const port = config.get<number>('PORT', 3000)
  await app.listen(port)
  console.log(`API running on http://localhost:${port}`)
  console.log(`Swagger docs: http://localhost:${port}/api/docs`)
}

bootstrap()

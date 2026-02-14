import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(helmet());

  app.enableCors({
    origin: (
      process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [
        'http://localhost:5173',
        'http://localhost:8080',
      ]
    ).filter(Boolean),
    credentials: true,
  });
}

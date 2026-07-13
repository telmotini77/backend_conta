import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Cross-Origin Resource Sharing (CORS) for React integration
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`NestJS server is running on: http://localhost:${port}`);
  console.log('billing_service is managed independently by Docker (porta 3001).');
}

bootstrap().catch((err: unknown) => {
  console.error('Error starting NestJS application:', err);
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Cross-Origin Resource Sharing (CORS) for React integration
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`NestJS server is running on: http://localhost:${port}`);

  // Spawn the billing microservice as an independent process
  try {
    const billingDir = path.resolve(process.cwd(), '../billing_service');
    if (fs.existsSync(billingDir)) {
      console.log(`Starting independent Billing Microservice in: ${billingDir}`);

      const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const script = process.env.NODE_ENV === 'production' ? 'start:prod' : 'start';
      const billingProcess = spawn(cmd, ['run', script], {
        cwd: billingDir,
        stdio: 'inherit',
        shell: true,
      });

      billingProcess.on('error', (err) => {
        console.error('Failed to start billing microservice child process:', err);
      });
    } else {
      console.log('Billing Microservice directory not found. Skipping auto-spawn.');
    }
  } catch (err) {
    console.error('Error during starting billing microservice:', err);
  }
}
bootstrap().catch((err: unknown) => {
  console.error('Error starting NestJS application:', err);
});

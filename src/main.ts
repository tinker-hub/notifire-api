import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import * as admin from 'firebase-admin';

import { AppModule } from './app.module';

const firebaseConfig: admin.ServiceAccount = {
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

async function bootstrap() {
  // Initialize firebase admin
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });

  const app = await NestFactory.create(AppModule);
  app.enableCors();

  await app.listen(3000);
}

bootstrap();

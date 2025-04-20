import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activer CORS pour toutes les origines
  app.enableCors({
    origin: '*', // Allow requests from the Flutter app
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // Allow cookies and credentials
  });

  // await app.listen(3000);
  // console.log('Nest application successfully started on port 3000');

  await app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:3000');
  });
}
bootstrap();

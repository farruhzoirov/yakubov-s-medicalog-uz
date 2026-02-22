import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = 9000;

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders:
      'Content-Type, Authorization, Accept-Language, App-Type, Accept',
  });

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     exceptionFactory: (errors: ValidationError[]) => {
  //       const formattedErrors = errors.map((err: ValidationError) => ({
  //         field: err.property,
  //         message: Object.values(err.constraints || {}).join(', '),
  //       }));
  //       return {
  //         success: false,
  //         message: formattedErrors,
  //       };
  //     },
  //   }),
  // );

  await app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on ${PORT}`);
  });
}
bootstrap();

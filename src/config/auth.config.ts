import { registerAs } from '@nestjs/config';

export default registerAs('AUTH', () => ({
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
}));
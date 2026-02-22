import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserProfile } from '../type/interfaces/user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

const PUBLIC_PATHS: { method: string; path: string }[] = [
  { method: 'POST', path: '/auth/login' },
  { method: 'GET', path: '/sheet-sync' },
];

/** Parse DD.MM.YYYY to end-of-day Date. Returns null if invalid. */
function parseExpiryDate(value: string): Date | null {
  if (!value || typeof value !== 'string') return null;
  const parts = value.trim().split('.');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  const date = new Date(y, m - 1, d, 23, 59, 59, 999);
  return isNaN(date.getTime()) ? null : date;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const path = (req.originalUrl || req.url || '').split('?')[0];
    const isPublic = PUBLIC_PATHS.some(
      (p) => p.method === req.method && path === p.path,
    );
    if (isPublic) {
      return next();
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
    if (!token) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    try {
      const secret = process.env.JWT_SECRET || 'secret';
      const user = this.jwtService.verify<UserProfile>(token, { secret });

      const expiryDate = parseExpiryDate(user.expiry_date);
      if (expiryDate && new Date() > expiryDate) {
        throw new UnauthorizedException('User access has expired');
      }

      req.user = user;
      next();
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

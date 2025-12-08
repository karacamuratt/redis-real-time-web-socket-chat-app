import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';

interface User {
    email: string;
    password: string;
}

@Injectable()
export class AuthService {
  private users: User[] = []; // for now in memory, later DB

  constructor(private jwt: JwtService, private redis: RedisService) {}

  async signup(email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    this.users.push({ 
        email, password: hashed 
    });

    return { 
        ok: true 
    };
  }

  async login(email: string, password: string) {
    const user = this.users.find((u) => u.email === email);

    if (!user) {
        return null;
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return null;
    }

    const accessToken = this.jwt.sign({ email });
    const refreshToken = this.jwt.sign({ email }, { expiresIn: '7d' });

    await this.redis.set(`refresh:${email}`, refreshToken, 60 * 60 * 24 * 7); // 7 days

    return {
        accessToken,
        refreshToken,
        user: { email },
    };
  }

  async refresh(refreshToken: string) {
    try {
        const payload = this.jwt.verify(refreshToken);
        const stored = await this.redis.get(`refresh:${payload.email}`);

        if (stored !== refreshToken) {
            throw new UnauthorizedException();
        }

        const newAccess = this.jwt.sign({ 
            email: payload.email 
        });

        return { accessToken: newAccess };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  async revokeRefresh(email: string) {
    await this.redis.del(`refresh:${email}`);
  }
}

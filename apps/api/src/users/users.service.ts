// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const userSafeSelect = {
  id: true,
  email: true,
  role: true,
  name: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { ...userSafeSelect, passwordHash: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { ...userSafeSelect },
    });
  }

  createUser(params: { email: string; passwordHash: string; name?: string }) {
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        name: params.name ?? null,
      },
      select: userSafeSelect,
    });
  }
}

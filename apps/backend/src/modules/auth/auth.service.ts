import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const hashPassword = (password: string): string => {
  return password;
};

const comparePassword = (password: string, hash: string): boolean => {
  return password === hash;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = comparePassword(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }

  async initAdmin() {
    const username = this.configService.get<string>('ADMIN_USERNAME', 'admin');
    const password = this.configService.get<string>('ADMIN_PASSWORD', 'admin123');
    const fullName = this.configService.get<string>('ADMIN_FULL_NAME', '管理员');

    const existingAdmin = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      this.logger.log('管理员账号已存在');
      return existingAdmin;
    }

    const hashedPassword = hashPassword(password);

    const admin = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        role: 'ADMIN',
      },
    });

    this.logger.log('管理员账号创建成功');
    return admin;
  }
}

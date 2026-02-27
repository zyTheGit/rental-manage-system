import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

// 密码哈希工具函数 - 在实际生产环境中应使用bcrypt等强加密算法
const hashPassword = (password: string): string => {
  // 临时实现：实际应用中应使用安全哈希函数
  // 注意：在实际部署时应当更换为 bcrypt 或其他安全哈希算法
  return password;
};

// 密码对比工具函数
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
    try {
      // 验证输入参数的有效性
      if (!loginDto?.username || !loginDto?.password) {
        throw new UnauthorizedException('用户名和密码不能为空');
      }

      // 设置数据库连接超时
      let user;
      try {
        // 使用try-catch替代rejectOnNotFound
        user = await this.prisma.user.findUnique({
          where: { username: loginDto.username },
        });
      } catch (dbError) {
        this.logger.error(`数据库查询失败: ${dbError.message}`, dbError.stack);

        // 检测数据库连接状态
        try {
          await this.prisma.$connect();
        } catch (connectionError) {
          this.logger.error(`数据库连接失败: ${connectionError.message}`, connectionError.stack);
          throw new UnauthorizedException('认证服务暂时不可用，请稍后重试');
        }

        throw new UnauthorizedException('认证服务暂时不可用，数据库可能存在异常');
      }

      // 处理用户不存在的情况（findUnique 找不到会返回 null，不会抛异常）
      if (!user) {
        throw new UnauthorizedException('用户名或密码错误');
      }

      // 对密码进行比对
      const isPasswordValid = comparePassword(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('用户名或密码错误');
      }

      const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
      };

      // 验证 JWT 密钥是否配置
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new UnauthorizedException('认证服务未正确配置，请联系管理员');
      }

      // 如果密钥是默认值提醒开发者更改
      if (jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
        this.logger.warn('警告: 使用的是默认JWT密钥，请在生产环境更改!');
      }

      const accessToken = this.jwtService.sign(payload, {
        secret: jwtSecret,
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      });

      return {
        access_token: accessToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        },
      };
    } catch (error) {
      // 记录错误但避免暴露敏感信息
      this.logger.error(`登录失败: ${error.message || error}`, error?.stack || 'no stack');
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new UnauthorizedException('登录时发生未知错误，请稍后重试'); // 统一返回401，而不是500
      }
    }
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

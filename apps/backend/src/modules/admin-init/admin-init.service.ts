import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminInitService implements OnModuleInit {
  private readonly logger = new Logger(AdminInitService.name);

  constructor(private authService: AuthService) {}

  async onModuleInit() {
    try {
      // 检查数据库连接状态后再创建管理员账户
      await this.waitDbReady();
      await this.authService.initAdmin();
    } catch (error) {
      this.logger.error('管理员账号初始化失败', error);
      // 即使管理员初始化失败也不阻止应用启动
    }
  }

  // 添加等待数据库准备就绪的逻辑
  private async waitDbReady(timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        await this.authService['prisma'].$queryRaw`SELECT 1`;
        this.logger.log('数据库连接正常');
        return true;
      } catch (error) {
        this.logger.warn(`数据库尚未就绪，等待中... (${error.message})`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    throw new Error('数据库连接超时');
  }
}

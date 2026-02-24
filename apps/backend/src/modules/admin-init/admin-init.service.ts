import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class AdminInitService implements OnModuleInit {
  private readonly logger = new Logger(AdminInitService.name);

  constructor(private authService: AuthService) {}

  async onModuleInit() {
    try {
      await this.authService.initAdmin();
    } catch (error) {
      this.logger.error('管理员账号初始化失败', error);
    }
  }
}

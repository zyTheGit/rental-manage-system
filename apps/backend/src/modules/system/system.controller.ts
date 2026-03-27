import { Controller, Post, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SystemService } from './system.service';

@ApiTags('系统管理')
@Controller('system')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Post('backup')
  @ApiOperation({ summary: '创建数据备份' })
  async createBackup() {
    return this.systemService.createBackup();
  }

  @Get('backups')
  @ApiOperation({ summary: '获取备份列表' })
  async getBackups() {
    return this.systemService.getBackups();
  }

  @Post('restore')
  @ApiOperation({ summary: '从备份恢复数据' })
  async restore(@Query('file') backupFile: string) {
    return this.systemService.restore(backupFile);
  }
}
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import extract from 'extract-zip';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);
  private readonly backupDir: string;
  private readonly dbPath: string;
  private readonly retentionDays = 30;

  constructor(private configService: ConfigService) {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.dbPath = path.join(process.cwd(), 'dev.db');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(): Promise<{ success: boolean; file: string; size: number }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.zip`;
    const backupPath = path.join(this.backupDir, backupName);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(backupPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const size = archive.pointer();
        this.logger.log(`Backup created: ${backupPath} (${size} bytes)`);
        this.cleanOldBackups();
        resolve({ success: true, file: backupName, size });
      });

      archive.on('error', (err) => {
        this.logger.error(`Backup failed: ${err.message}`);
        reject(err);
      });

      archive.pipe(output);

      if (fs.existsSync(this.dbPath)) {
        archive.file(this.dbPath, { name: 'dev.db' });
      }

      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        archive.file(envPath, { name: '.env' });
      }

      const uploadsPath = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadsPath)) {
        archive.directory(uploadsPath, 'uploads');
      }

      archive.finalize();
    });
  }

  async getBackups(): Promise<{ backups: Array<{ name: string; size: number; createdAt: Date }> }> {
    if (!fs.existsSync(this.backupDir)) {
      return { backups: [] };
    }

    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.zip'))
      .map(name => {
        const filePath = path.join(this.backupDir, name);
        const stats = fs.statSync(filePath);
        return {
          name,
          size: stats.size,
          createdAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { backups: files };
  }

  async restore(backupFile: string): Promise<{ success: boolean; message: string }> {
    if (!backupFile) {
      throw new BadRequestException('请指定备份文件');
    }

    const backupPath = path.join(this.backupDir, backupFile);
    if (!fs.existsSync(backupPath)) {
      throw new NotFoundException('备份文件不存在');
    }

    try {
      const tempDir = path.join(this.backupDir, 'temp-restore');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
      fs.mkdirSync(tempDir, { recursive: true });

      await extract(backupPath, { dir: tempDir });

      const backupDb = path.join(tempDir, 'dev.db');
      if (fs.existsSync(backupDb)) {
        if (fs.existsSync(this.dbPath)) {
          const currentDbBackup = `${this.dbPath}.before-restore`;
          fs.copyFileSync(this.dbPath, currentDbBackup);
        }
        fs.copyFileSync(backupDb, this.dbPath);
      }

      const backupEnv = path.join(tempDir, '.env');
      if (fs.existsSync(backupEnv)) {
        fs.copyFileSync(backupEnv, path.join(process.cwd(), '.env'));
      }

      const backupUploads = path.join(tempDir, 'uploads');
      const uploadsPath = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(backupUploads)) {
        if (fs.existsSync(uploadsPath)) {
          fs.rmSync(uploadsPath, { recursive: true });
        }
        fs.cpSync(backupUploads, uploadsPath, { recursive: true });
      }

      fs.rmSync(tempDir, { recursive: true });

      this.logger.log(`Restored from backup: ${backupFile}`);
      return { success: true, message: '数据恢复成功，请重启服务' };
    } catch (error: any) {
      this.logger.error(`Restore failed: ${error.message}`);
      throw new BadRequestException(`恢复失败: ${error.message}`);
    }
  }

  private cleanOldBackups(): void {
    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.zip'))
      .map(name => ({
        name,
        path: path.join(this.backupDir, name),
        createdAt: fs.statSync(path.join(this.backupDir, name)).mtime,
      }));

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    files
      .filter(f => f.createdAt < cutoffDate)
      .forEach(f => {
        try {
          fs.unlinkSync(f.path);
          this.logger.log(`Deleted old backup: ${f.name}`);
        } catch (e) {
          this.logger.error(`Failed to delete backup ${f.name}`);
        }
      });
  }
}
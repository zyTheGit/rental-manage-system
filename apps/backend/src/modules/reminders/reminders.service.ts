import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateReminderDto, UpdateReminderDto } from './dto/reminder.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findAll() {
    return this.prisma.paymentReminder.findMany({
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const reminder = await this.prisma.paymentReminder.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
    });

    if (!reminder) {
      throw new NotFoundException('提醒配置不存在');
    }

    return reminder;
  }

  async findByTenant(tenantId: number) {
    return this.prisma.paymentReminder.findUnique({
      where: { tenantId },
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
    });
  }

  async create(createReminderDto: CreateReminderDto, tenantId: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    const existingReminder = await this.prisma.paymentReminder.findUnique({
      where: { tenantId },
    });

    if (existingReminder) {
      throw new ConflictException('该租户已存在提醒配置，请使用编辑功能修改');
    }

    return this.prisma.paymentReminder.create({
      data: {
        ...createReminderDto,
        tenantId,
      },
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
    });
  }

  async update(id: number, updateReminderDto: UpdateReminderDto) {
    const reminder = await this.prisma.paymentReminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException('提醒配置不存在');
    }

    return this.prisma.paymentReminder.update({
      where: { id },
      data: updateReminderDto,
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
    });
  }

  async updateByTenant(tenantId: number, updateReminderDto: UpdateReminderDto) {
    const reminder = await this.prisma.paymentReminder.findUnique({
      where: { tenantId },
    });

    if (!reminder) {
      throw new NotFoundException('提醒配置不存在');
    }

    return this.prisma.paymentReminder.update({
      where: { tenantId },
      data: updateReminderDto,
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    const reminder = await this.prisma.paymentReminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException('提醒配置不存在');
    }

    return this.prisma.paymentReminder.delete({
      where: { id },
    });
  }

  async getOverdueReminders() {
    const now = new Date();
    const currentDay = now.getDate();

    const reminders = await this.prisma.paymentReminder.findMany({
      where: {
        enabled: true,
      },
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
    });

    return reminders.filter((reminder) => {
      if (reminder.dueDay < currentDay) {
        const lastReminderDate = new Date(now.getFullYear(), now.getMonth(), reminder.dueDay);
        const lastPaymentDate = reminder.lastDueAt ? new Date(reminder.lastDueAt) : null;
        if (!lastPaymentDate || lastPaymentDate < lastReminderDate) {
          return true;
        }
      }
      return false;
    });
  }

  async sendReminderEmails() {
    const now = new Date();
    const currentDay = now.getDate();

    const reminders = await this.prisma.paymentReminder.findMany({
      where: {
        enabled: true,
        notifyByEmail: true,
      },
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
    });

    const results: any[] = [];

    for (const reminder of reminders) {
      if (reminder.reminderDay !== currentDay) {
        continue;
      }

      const tenant = reminder.tenant;
      if (!tenant || !tenant.email) {
        this.logger.warn(`Tenant ${tenant?.id} has no email, skipping`);
        continue;
      }

      try {
        await this.emailService.sendPaymentReminder(
          tenant.email,
          tenant.name,
          tenant.house?.title || '未知房屋',
          reminder.reminderDay,
          reminder.dueDay,
        );

        await this.prisma.paymentReminder.update({
          where: { id: reminder.id },
          data: { lastReminderAt: now },
        });

        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          email: tenant.email,
          success: true,
        });

        this.logger.log(`Reminder email sent to ${tenant.name} <${tenant.email}>`);
      } catch (error) {
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          email: tenant.email,
          success: false,
          error: error.message,
        });

        this.logger.error(`Failed to send reminder to ${tenant.name}: ${error.message}`);
      }
    }

    return {
      total: reminders.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  async sendTestReminderEmail(tenantId: number) {
    this.logger.log(`Sending test email for tenant ${tenantId}`);
    
    const reminder = await this.prisma.paymentReminder.findUnique({
      where: { tenantId },
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
    });

    if (!reminder) {
      this.logger.warn(`No reminder found for tenant ${tenantId}`);
      throw new NotFoundException('该租户没有提醒配置');
    }

    const tenant = reminder.tenant;
    this.logger.log(`Tenant: ${tenant?.name}, Email: ${tenant?.email}`);
    
    if (!tenant?.email) {
      throw new NotFoundException('该租户没有配置邮箱');
    }

    try {
      await this.emailService.sendPaymentReminder(
        tenant.email,
        tenant.name,
        tenant.house?.title || '未知房屋',
        reminder.reminderDay,
        reminder.dueDay,
      );

      return {
        success: true,
        message: `测试邮件已发送至 ${tenant.email}`,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send test email: ${error.message}`);
      throw error;
    }
  }
}

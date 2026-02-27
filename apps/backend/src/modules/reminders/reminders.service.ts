import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto, UpdateReminderDto } from './dto/reminder.dto';

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

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
}

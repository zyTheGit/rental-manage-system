import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto, GetUtilityStatsDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { type?: string; year?: string; tenantId?: number }) {
    const where: any = {};

    if (params?.tenantId) {
      where.tenantId = params.tenantId;
    }

    if (params?.year) {
      const startDate = new Date(`${params.year}-01-01`);
      const endDate = new Date(`${params.year}-12-31`);
      where.paidAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        items: true,
        tenant: {
          include: {
            house: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    if (params?.type) {
      return payments.filter((p) => p.items.some((item) => item.type === params.type));
    }

    return payments;
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        items: true,
        tenant: {
          include: {
            house: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('缴费记录不存在');
    }

    return payment;
  }

  async getShareVerifyInfo(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        tenant: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('缴费记录不存在');
    }

    return {
      id: payment.id,
      tenantId: payment.tenantId,
      tenantName: payment.tenant.name,
    };
  }

  async verifyAndShare(id: number, idCardLast6: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('缴费记录不存在');
    }

    const tenantIdCard = payment.tenant.idCard;
    if (!tenantIdCard || tenantIdCard.length < 6) {
      throw new UnauthorizedException('租户身份证信息不完整');
    }

    const actualLast6 = tenantIdCard.slice(-6);
    if (idCardLast6 !== actualLast6) {
      throw new UnauthorizedException('身份证后6位验证失败');
    }

    const allPayments = await this.prisma.payment.findMany({
      where: { tenantId: payment.tenantId },
      include: {
        items: true,
        tenant: {
          include: {
            house: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    return {
      tenant: {
        id: payment.tenant.id,
        name: payment.tenant.name,
        phone: payment.tenant.phone,
        house: payment.tenant.house,
      },
      payments: allPayments,
    };
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: createPaymentDto.tenantId },
      include: {
        house: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    const paidAt = new Date(createPaymentDto.paidAt);
    const year = paidAt.getFullYear();
    const month = paidAt.getMonth() + 1;

    const totalAmount = createPaymentDto.items.reduce((sum, item) => sum + item.amount, 0);

    const payment = await this.prisma.payment.create({
      data: {
        tenantId: createPaymentDto.tenantId,
        amount: totalAmount,
        paidAt,
        remark: createPaymentDto.remark,
        items: {
          create: createPaymentDto.items,
        },
      },
      include: {
        items: true,
      },
    });

    await this.updateUtilityStats(createPaymentDto.tenantId, year, month, createPaymentDto.items);

    const previousBalance = tenant.balance || 0;
    const actualPaid = createPaymentDto.actualPaid || totalAmount;
    const newBalance = previousBalance + totalAmount - actualPaid;

    await this.prisma.tenant.update({
      where: { id: createPaymentDto.tenantId },
      data: { balance: newBalance },
    });

    return payment;
  }

  private async updateUtilityStats(tenantId: number, year: number, month: number, items: any[]) {
    let electricStartRead = 0;
    let electricEndRead = 0;
    let electricUsage = 0;
    let waterStartRead = 0;
    let waterEndRead = 0;
    let waterUsage = 0;

    items.forEach((item) => {
      if (item.type === 'ELECTRIC') {
        if (item.electricStartRead) electricStartRead = item.electricStartRead;
        if (item.electricEndRead) electricEndRead = item.electricEndRead;
        if (item.electricUsage) electricUsage = item.electricUsage;
      }
      if (item.type === 'WATER') {
        if (item.waterStartRead) waterStartRead = item.waterStartRead;
        if (item.waterEndRead) waterEndRead = item.waterEndRead;
        if (item.waterUsage) waterUsage = item.waterUsage;
      }
    });

    const existing = await this.prisma.utilityStats.findUnique({
      where: {
        tenantId_year_month: {
          tenantId,
          year,
          month,
        },
      },
    });

    if (existing) {
      const updateData: any = {};

      if (electricEndRead > 0) {
        updateData.electricEndRead = electricEndRead;
        updateData.electricUsage = existing.electricUsage + electricUsage;
        if (
          existing.electricStartRead === 0 ||
          (electricStartRead > 0 && electricStartRead < existing.electricStartRead)
        ) {
          updateData.electricStartRead = electricStartRead;
        }
      }

      if (waterEndRead > 0) {
        updateData.waterEndRead = waterEndRead;
        updateData.waterUsage = existing.waterUsage + waterUsage;
        if (
          existing.waterStartRead === 0 ||
          (waterStartRead > 0 && waterStartRead < existing.waterStartRead)
        ) {
          updateData.waterStartRead = waterStartRead;
        }
      }

      await this.prisma.utilityStats.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      await this.prisma.utilityStats.create({
        data: {
          tenantId,
          year,
          month,
          electricStartRead,
          electricEndRead,
          electricUsage,
          waterStartRead,
          waterEndRead,
          waterUsage,
        },
      });
    }
  }

  async getMonthlyStats() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const payments = await this.prisma.payment.findMany({
      where: {
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
      },
    });

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);

    const byType: Record<string, number> = {};
    payments.forEach((p) => {
      p.items.forEach((item) => {
        byType[item.type] = (byType[item.type] || 0) + item.amount;
      });
    });

    const paymentDistribution = Object.entries(byType).map(([type, amount]) => ({
      name: type,
      value: amount,
    }));

    return {
      totalIncome,
      paymentDistribution,
    };
  }

  async getYearlyStats() {
    const now = new Date();
    const year = now.getFullYear();

    const payments = await this.prisma.payment.findMany({
      where: {
        paidAt: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31, 23, 59, 59),
        },
      },
      include: {
        items: true,
      },
    });

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);

    const byType: Record<string, number> = {};
    payments.forEach((p) => {
      p.items.forEach((item) => {
        byType[item.type] = (byType[item.type] || 0) + item.amount;
      });
    });

    const paymentDistribution = Object.entries(byType).map(([type, amount]) => ({
      name: type,
      value: amount,
    }));

    const byMonth = Array.from({ length: 12 }, (_, i) => {
      const monthPayments = payments.filter((p) => new Date(p.paidAt).getMonth() === i);
      return {
        month: `${i + 1}月`,
        amount: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      };
    });

    return {
      totalIncome,
      paymentDistribution,
      incomeTrend: byMonth,
    };
  }

  async getUtilityStats(params: GetUtilityStatsDto) {
    const where: any = {};

    if (params?.tenantId) {
      where.tenantId = params.tenantId;
    }

    if (params?.year) {
      where.year = params.year;
    }

    if (params?.month) {
      where.month = params.month;
    }

    const stats = await this.prisma.utilityStats.findMany({
      where,
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    if (!params?.tenantId && params?.year) {
      const totalElectricUsage = stats.reduce((sum, s) => sum + s.electricUsage, 0);
      const totalWaterUsage = stats.reduce((sum, s) => sum + s.waterUsage, 0);

      const monthlyStats = Array.from({ length: 12 }, (_, i) => {
        const monthStats = stats.filter((s) => s.month === i + 1);
        const electricUsage = monthStats.reduce((sum, s) => sum + s.electricUsage, 0);
        const waterUsage = monthStats.reduce((sum, s) => sum + s.waterUsage, 0);
        return {
          month: `${i + 1}月`,
          electricUsage,
          waterUsage,
        };
      });

      return {
        stats,
        yearlyStats: {
          year: params.year,
          totalElectricUsage,
          totalWaterUsage,
          monthlyStats,
        },
      };
    }

    return stats;
  }

  async getTenantUtilityByYear(tenantId: number, year?: number) {
    const targetYear = year || new Date().getFullYear();

    const stats = await this.prisma.utilityStats.findMany({
      where: {
        tenantId,
        year: targetYear,
      },
      orderBy: { month: 'asc' },
    });

    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const monthStat = stats.find((s) => s.month === i + 1);
      return {
        month: `${i + 1}月`,
        electricUsage: monthStat?.electricUsage || 0,
        waterUsage: monthStat?.waterUsage || 0,
      };
    });

    const totalElectricUsage = stats.reduce((sum, s) => sum + s.electricUsage, 0);
    const totalWaterUsage = stats.reduce((sum, s) => sum + s.waterUsage, 0);

    return {
      tenantId,
      year: targetYear,
      monthlyStats,
      totalElectricUsage,
      totalWaterUsage,
    };
  }

  exportToCsv(payments: any[]): string {
    const headers = ['ID', '租户', '房屋', '金额', '缴费日期', '类型', '备注', '创建时间'];
    const rows = payments.map((payment) => {
      const types = payment.items?.map((item) => item.type).join('/') || '-';
      return [
        payment.id,
        `"${payment.tenant?.name || ''}"`,
        `"${payment.tenant?.house?.title || ''}"`,
        payment.amount,
        `"${new Date(payment.paidAt).toLocaleString('zh-CN')}"`,
        `"${types}"`,
        `"${payment.remark || ''}"`,
        `"${new Date(payment.createdAt).toLocaleString('zh-CN')}"`,
      ];
    });
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        items: true,
        tenant: true
      },
    });

    if (!payment) {
      throw new NotFoundException('缴费记录不存在');
    }

    // 如果有新的items，先删除旧的items
    if (updatePaymentDto.items && updatePaymentDto.items.length > 0) {
      await this.prisma.paymentItem.deleteMany({
        where: { paymentId: id },
      });

      // 创建新的items
      for (const item of updatePaymentDto.items) {
        await this.prisma.paymentItem.create({
          data: {
            paymentId: id,
            type: item.type,
            amount: item.amount,
            electricStartRead: item.electricStartRead,
            electricEndRead: item.electricEndRead,
            electricUsage: item.electricUsage,
            waterStartRead: item.waterStartRead,
            waterEndRead: item.waterEndRead,
            waterUsage: item.waterUsage,
          },
        });
      }

      // 更新水电表统计
      const paidAt = updatePaymentDto.paidAt ? new Date(updatePaymentDto.paidAt) : payment.paidAt;
      const year = paidAt.getFullYear();
      const month = paidAt.getMonth() + 1;
      
      // 先减少旧的统计
      for (const oldItem of payment.items) {
        if (oldItem.type === 'ELECTRIC' && oldItem.electricUsage) {
          await this.decrementUtilityStats(payment.tenantId, year, month, 'electric', oldItem.electricUsage);
        }
        if (oldItem.type === 'WATER' && oldItem.waterUsage) {
          await this.decrementUtilityStats(payment.tenantId, year, month, 'water', oldItem.waterUsage);
        }
      }
      
      // 添加新的统计
      await this.updateUtilityStats(payment.tenantId, year, month, updatePaymentDto.items);
    }

    const totalAmount = updatePaymentDto.items 
      ? updatePaymentDto.items.reduce((sum, item) => sum + item.amount, 0)
      : payment.amount;

    return this.prisma.payment.update({
      where: { id },
      data: {
        paidAt: updatePaymentDto.paidAt ? new Date(updatePaymentDto.paidAt) : undefined,
        remark: updatePaymentDto.remark,
        amount: totalAmount,
      },
      include: {
        tenant: {
          include: { house: true },
        },
        items: true,
      },
    });
  }

  private async decrementUtilityStats(tenantId: number, year: number, month: number, type: 'electric' | 'water', usage: number) {
    const existing = await this.prisma.utilityStats.findUnique({
      where: {
        tenantId_year_month: {
          tenantId,
          year,
          month,
        },
      },
    });

    if (existing) {
      const updateData: any = {};
      if (type === 'electric') {
        updateData.electricUsage = Math.max(0, existing.electricUsage - usage);
      } else {
        updateData.waterUsage = Math.max(0, existing.waterUsage - usage);
      }

      await this.prisma.utilityStats.update({
        where: { id: existing.id },
        data: updateData,
      });
    }
  }

  async remove(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('缴费记录不存在');
    }

    // 删除关联的 items
    await this.prisma.paymentItem.deleteMany({
      where: { paymentId: id },
    });

    // 删除 payment reminder
    await this.prisma.paymentReminder.deleteMany({
      where: { tenantId: payment.tenantId },
    });

    return this.prisma.payment.delete({
      where: { id },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { type?: string; year?: string }) {
    const where: any = {};

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.year) {
      const startDate = new Date(`${params.year}-01-01`);
      const endDate = new Date(`${params.year}-12-31`);
      where.paidAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        tenant: {
          include: {
            house: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });
  }

  async findOne(id: number) {
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

    return payment;
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: createPaymentDto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    return this.prisma.payment.create({
      data: createPaymentDto,
    });
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
    });

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);

    const byType = payments.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

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
    });

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);

    const byType = payments.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

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
}

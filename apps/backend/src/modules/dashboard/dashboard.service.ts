import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const houseCount = await this.prisma.house.count();
    const tenantCount = await this.prisma.tenant.count();
    const rentedCount = await this.prisma.house.count({
      where: { status: 'RENTED' },
    });

    const occupancyRate = houseCount > 0 ? rentedCount / houseCount : 0;

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentYear = new Date(now.getFullYear(), 0, 1);

    const monthlyPayments = await this.prisma.payment.findMany({
      where: {
        paidAt: {
          gte: currentMonth,
        },
      },
    });

    const monthIncome = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    const yearlyPayments = await this.prisma.payment.findMany({
      where: {
        paidAt: {
          gte: currentYear,
        },
      },
    });

    const yearIncome = yearlyPayments.reduce((sum, p) => sum + p.amount, 0);

    const byMonth = Array.from({ length: 12 }, (_, i) => {
      const startDate = new Date(now.getFullYear(), i, 1);
      const endDate = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59);

      return this.prisma.payment
        .findMany({
          where: {
            paidAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
        .then((payments) => ({
          month: `${i + 1}月`,
          amount: payments.reduce((sum, p) => sum + p.amount, 0),
        }));
    });

    const incomeTrend = await Promise.all(byMonth);

    const byType = yearlyPayments.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    const paymentDistribution = Object.entries(byType).map(([type, amount]) => ({
      name: type,
      value: amount,
    }));

    return {
      totalIncome: yearlyPayments.reduce((sum, p) => sum + p.amount, 0),
      monthIncome,
      yearIncome,
      occupancyRate,
      houseCount,
      tenantCount,
      incomeTrend,
      paymentDistribution,
    };
  }
}

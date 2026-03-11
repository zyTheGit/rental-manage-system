import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DecimalUtil } from '../../common/utils/decimal.util';

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

    const monthIncome = DecimalUtil.sumArray(monthlyPayments, (p) => p.amount);

    const yearlyPayments = await this.prisma.payment.findMany({
      where: {
        paidAt: {
          gte: currentYear,
        },
      },
      include: {
        items: true,
      },
    });

    const yearIncome = DecimalUtil.sumArray(yearlyPayments, (p) => p.amount);

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
          amount: DecimalUtil.sumArray(payments, (p) => p.amount),
        }));
    });

    const incomeTrend = await Promise.all(byMonth);

    const byType: Record<string, number> = {};
    yearlyPayments.forEach((p) => {
      p.items.forEach((item) => {
        byType[item.type] = DecimalUtil.sum(byType[item.type] || 0, item.amount);
      });
    });

    const paymentDistribution = Object.entries(byType).map(([type, amount]) => ({
      name: type,
      value: amount,
    }));

    return {
      totalIncome: DecimalUtil.sumArray(yearlyPayments, (p) => p.amount),
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

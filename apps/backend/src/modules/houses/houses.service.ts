import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHouseDto, UpdateHouseDto, UpdateHouseStatusDto } from './dto/house.dto';

@Injectable()
export class HousesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { status?: string; search?: string }) {
    const where: any = {};

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.search) {
      where.OR = [{ title: { contains: params.search } }, { address: { contains: params.search } }];
    }

    return this.prisma.house.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    if (!id || isNaN(id) || id <= 0) {
      throw new NotFoundException('无效的房屋ID');
    }

    const house = await this.prisma.house.findUnique({
      where: { id },
    });

    if (!house) {
      throw new NotFoundException('房屋不存在');
    }

    return house;
  }

  async findOneWithLastRead(id: number) {
    if (!id || isNaN(id) || id <= 0) {
      throw new NotFoundException('无效的房屋ID');
    }

    const house = await this.prisma.house.findUnique({
      where: { id },
      include: {
        tenants: {
          where: {
            OR: [{ status: 'RENTED' }, { status: 'CHECKED_OUT' }],
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            payments: {
              where: {
                items: {
                  some: {
                    type: { in: ['WATER', 'ELECTRIC'] },
                  },
                },
              },
              orderBy: { paidAt: 'desc' },
              take: 1,
              include: {
                items: {
                  where: {
                    type: { in: ['WATER', 'ELECTRIC'] },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!house) {
      throw new NotFoundException('房屋不存在');
    }

    let lastElectricEndRead = house.electricInitialRead || 0;
    let lastWaterEndRead = house.waterInitialRead || 0;

    if (house.tenants && house.tenants.length > 0) {
      const tenant = house.tenants[0];
      if (tenant.payments && tenant.payments.length > 0) {
        const lastPayment = tenant.payments[0];
        const electricItem = lastPayment.items.find((item) => item.type === 'ELECTRIC');
        const waterItem = lastPayment.items.find((item) => item.type === 'WATER');
        if (electricItem?.electricEndRead) {
          lastElectricEndRead = electricItem.electricEndRead;
        }
        if (waterItem?.waterEndRead) {
          lastWaterEndRead = waterItem.waterEndRead;
        }
      }
    }

    return {
      ...house,
      lastElectricEndRead,
      lastWaterEndRead,
    };
  }

  async create(createHouseDto: CreateHouseDto) {
    return this.prisma.house.create({
      data: {
        ...createHouseDto,
        status: 'AVAILABLE',
      },
    });
  }

  async update(id: number, updateHouseDto: UpdateHouseDto) {
    if (!id || isNaN(id) || id <= 0) {
      throw new NotFoundException('无效的房屋ID');
    }
    return this.prisma.house.update({
      where: { id },
      data: updateHouseDto,
    });
  }

  async remove(id: number) {
    if (!id || isNaN(id) || id <= 0) {
      throw new NotFoundException('无效的房屋ID');
    }
    return this.prisma.house.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, updateStatusDto: UpdateHouseStatusDto) {
    if (!id || isNaN(id) || id <= 0) {
      throw new NotFoundException('无效的房屋ID');
    }
    return this.prisma.house.update({
      where: { id },
      data: { status: updateStatusDto.status },
    });
  }

  exportToCsv(houses: any[]): string {
    const headers = [
      'ID',
      '标题',
      '地址',
      '租金',
      '押金',
      '面积',
      '状态',
      '水表初始读数',
      '电表初始读数',
      '水费单价',
      '电费单价',
      '创建时间',
    ];
    const rows = houses.map((house) => [
      house.id,
      `"${house.title || ''}"`,
      `"${house.address || ''}"`,
      house.rent,
      house.deposit,
      house.area,
      house.status === 'AVAILABLE' ? '空置' : '已租',
      house.waterInitialRead || 0,
      house.electricInitialRead || 0,
      house.waterRate || 0,
      house.electricRate || 0,
      `"${new Date(house.createdAt).toLocaleString('zh-CN')}"`,
    ]);
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}

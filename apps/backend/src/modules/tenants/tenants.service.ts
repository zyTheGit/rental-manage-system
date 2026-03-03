import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        house: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        house: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    return tenant;
  }

  async create(createTenantDto: CreateTenantDto) {
    const house = await this.prisma.house.findUnique({
      where: { id: createTenantDto.houseId },
    });

    if (!house) {
      throw new NotFoundException('房屋不存在');
    }

    if (house.status === 'RENTED') {
      throw new NotFoundException('该房屋已出租');
    }

    // 处理 rentEnd 可能为空的情况
    const data: any = {
      name: createTenantDto.name,
      phone: createTenantDto.phone,
      idCard: createTenantDto.idCard,
      houseId: createTenantDto.houseId,
      rentStart: new Date(createTenantDto.rentStart),
      status: 'RENTED',
    };

    if (createTenantDto.rentEnd) {
      data.rentEnd = new Date(createTenantDto.rentEnd);
    }

    const tenant = await this.prisma.tenant.create({
      data,
    });

    await this.prisma.house.update({
      where: { id: createTenantDto.houseId },
      data: { status: 'RENTED' },
    });

    return {
      ...tenant,
      house,
    };
  }

  async update(id: number, updateTenantDto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
      include: {
        house: true,
      },
    });
  }

  async remove(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    await this.prisma.house.update({
      where: { id: tenant.houseId },
      data: { status: 'AVAILABLE' },
    });

    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  async checkout(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { house: true },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'CHECKED_OUT' },
      include: { house: true },
    });

    await this.prisma.house.update({
      where: { id: tenant.houseId },
      data: { status: 'AVAILABLE' },
    });

    return updatedTenant;
  }

  async getLastMeterReads(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { house: true },
    });

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    // 获取默认初始读数
    let lastWaterEndRead = tenant.house?.waterInitialRead || 0;
    let lastElectricEndRead = tenant.house?.electricInitialRead || 0;

    // 分别查询电费的最新记录
    const lastElectricItem = await this.prisma.paymentItem.findFirst({
      where: {
        type: 'ELECTRIC',
        payment: { tenantId: id },
      },
      orderBy: { payment: { paidAt: 'desc' } },
      include: { payment: true },
    });

    // 分别查询水费的最新记录
    const lastWaterItem = await this.prisma.paymentItem.findFirst({
      where: {
        type: 'WATER',
        payment: { tenantId: id },
      },
      orderBy: { payment: { paidAt: 'desc' } },
      include: { payment: true },
    });

    if (lastElectricItem?.electricEndRead) {
      lastElectricEndRead = lastElectricItem.electricEndRead;
    }
    if (lastWaterItem?.waterEndRead) {
      lastWaterEndRead = lastWaterItem.waterEndRead;
    }

    return {
      tenantId: id,
      lastWaterEndRead,
      lastElectricEndRead,
    };
  }

  exportToCsv(tenants: any[]): string {
    const headers = [
      'ID',
      '姓名',
      '电话',
      '身份证号',
      '房屋标题',
      '房屋地址',
      '租期开始',
      '租期结束',
      '状态',
      '创建时间',
    ];
    const rows = tenants.map((tenant) => [
      tenant.id,
      `"${tenant.name || ''}"`,
      `"${tenant.phone || ''}"`,
      `"${tenant.idCard || ''}"`,
      `"${tenant.house?.title || ''}"`,
      `"${tenant.house?.address || ''}"`,
      `"${new Date(tenant.rentStart).toLocaleString('zh-CN')}"`,
      tenant.rentEnd ? `"${new Date(tenant.rentEnd).toLocaleString('zh-CN')}"` : '-',
      tenant.status === 'RENTED' ? '已租' : '已退租',
      `"${new Date(tenant.createdAt).toLocaleString('zh-CN')}"`,
    ]);
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}

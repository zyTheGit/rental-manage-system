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

    const tenant = await this.prisma.tenant.create({
      data: createTenantDto,
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
}

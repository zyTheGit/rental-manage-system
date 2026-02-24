import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHouseDto, UpdateHouseDto, UpdateHouseStatusDto } from './dto/house.dto';

@Injectable()
export class HousesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { status?: string }) {
    const where = params?.status ? { status: params.status } : {};

    return this.prisma.house.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const house = await this.prisma.house.findUnique({
      where: { id },
    });

    if (!house) {
      throw new NotFoundException('房屋不存在');
    }

    return house;
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
    return this.prisma.house.update({
      where: { id },
      data: updateHouseDto,
    });
  }

  async remove(id: number) {
    return this.prisma.house.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, updateStatusDto: UpdateHouseStatusDto) {
    return this.prisma.house.update({
      where: { id },
      data: { status: updateStatusDto.status },
    });
  }
}

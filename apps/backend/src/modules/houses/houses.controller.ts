import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { HousesService } from './houses.service';
import { CreateHouseDto, UpdateHouseDto, UpdateHouseStatusDto } from './dto/house.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('房屋')
@Controller('houses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @Get()
  @ApiOperation({ summary: '获取所有房屋' })
  async findAll() {
    return this.housesService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: '房屋 ID' })
  @ApiOperation({ summary: '获取单个房屋' })
  async findOne(@Param('id') id: string) {
    return this.housesService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: '创建房屋' })
  async create(@Body() createHouseDto: CreateHouseDto) {
    return this.housesService.create(createHouseDto);
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: '房屋 ID' })
  @ApiOperation({ summary: '更新房屋' })
  async update(@Param('id') id: string, @Body() updateHouseDto: UpdateHouseDto) {
    return this.housesService.update(+id, updateHouseDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: '房屋 ID' })
  @ApiOperation({ summary: '删除房屋' })
  async remove(@Param('id') id: string) {
    return this.housesService.remove(+id);
  }

  @Put(':id/status')
  @ApiParam({ name: 'id', description: '房屋 ID' })
  @ApiOperation({ summary: '更新房屋状态' })
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateHouseStatusDto) {
    return this.housesService.updateStatus(+id, updateStatusDto);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
  Header,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { HousesService } from './houses.service';
import { CreateHouseDto, UpdateHouseDto, UpdateHouseStatusDto } from './dto/house.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Response } from 'express';

@ApiTags('房屋')
@Controller('houses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HousesController {
  private readonly logger = new Logger(HousesController.name);

  constructor(private readonly housesService: HousesService) {}

  @Get()
  @ApiOperation({ summary: '获取所有房屋' })
  async findAll() {
    try {
      return await this.housesService.findAll();
    } catch (error) {
      this.logger.error(`获取所有房屋失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: '房屋 ID' })
  @ApiOperation({ summary: '获取单个房屋' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.housesService.findOne(+id);
    } catch (error) {
      this.logger.error(`获取房屋ID ${id} 失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/with-last-read')
  @ApiParam({ name: 'id', description: '房屋 ID' })
  @ApiOperation({ summary: '获取房屋及最后水电表读数' })
  async findOneWithLastRead(@Param('id') id: string) {
    try {
      return await this.housesService.findOneWithLastRead(+id);
    } catch (error) {
      this.logger.error(`获取房屋ID ${id} 及水电读数失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: '创建房屋' })
  async create(@Body() createHouseDto: CreateHouseDto) {
    try {
      return await this.housesService.create(createHouseDto);
    } catch (error) {
      this.logger.error(`创建房屋失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: '房屋 ID' })
  @ApiOperation({ summary: '更新房屋' })
  async update(@Param('id') id: string, @Body() updateHouseDto: UpdateHouseDto) {
    try {
      return await this.housesService.update(+id, updateHouseDto);
    } catch (error) {
      this.logger.error(`更新房屋ID ${id} 失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: '房屋 ID' })
  @ApiOperation({ summary: '删除房屋' })
  async remove(@Param('id') id: string) {
    try {
      return await this.housesService.remove(+id);
    } catch (error) {
      this.logger.error(`删除房屋ID ${id} 失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id/status')
  @ApiParam({ name: 'id', description: '房屋 ID' })
  @ApiOperation({ summary: '更新房屋状态' })
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateHouseStatusDto) {
    try {
      return await this.housesService.updateStatus(+id, updateStatusDto);
    } catch (error) {
      this.logger.error(`更新房屋ID ${id} 状态失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('export/csv')
  @ApiOperation({ summary: '导出房屋 CSV' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="houses.csv"')
  async exportCsv(@Res() res: Response) {
    try {
      const houses = await this.housesService.findAll();
      const csv = this.housesService.exportToCsv(houses);
      res.send(csv);
    } catch (error) {
      this.logger.error(`导出房屋CSV失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}

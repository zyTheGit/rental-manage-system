import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

async function checkDb() {
  // 加载环境变量
  ConfigModule.forRoot({ isGlobal: true });
  
  const prisma = new PrismaClient();
  
  try {
    // 创建 Prisma 生成的表
    console.log('检查数据库结构...');
    await prisma.$connect();
    
    // 执行同步操作，如果需要的话
    console.log('数据库连接成功！');
    
    // 尝试查询用户（不一定会成功，因为可能没有这个表）
    try {
      await prisma.user.findFirst();
      console.log('用户表已找到');
    } catch(error) {
      console.error('用户表查询失败或不存在');
      console.error('请注意：您需要运行数据库迁移命令来创建必要的表');
    }
  } catch (error) {
    console.error('数据库连接失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
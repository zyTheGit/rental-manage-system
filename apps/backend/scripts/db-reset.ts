import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';

async function resetDatabase() {
  const logger = new Logger('DB_RESET');
  
  // 临时手动连接数据库
  const prisma = new PrismaClient();
  
  try {
    console.log('开始重置数据库...');
    
    // 创建 Prisma 生成的表结构
    // 如果有预定义表，尝试生成
    await prisma.$connect();
    logger.log('数据库连接成功');

    // 测试数据库表是否存在 - 尝试从用户表中获取第一个记录
    let userExists = true;
    try {
      await prisma.user.findFirst();
      logger.log('用户表存在');
    } catch (error) {
      userExists = false;
      logger.warn(`用户表不存在或不可访问: ${error.message}`);
    }

    if (!userExists) {
      console.log('检测到数据库缺少必要的表结构，需要执行迁移...');
      console.log('注意：在终端执行 "npx prisma migrate dev" 以创建数据库表。');
    } else {
      console.log('数据库表看起来是完整的');
    }
    
    // 尝试创建默认管理员用户
    try {
      const { hashPassword } = require('./dist/modules/auth/auth.service.js');
      const env = require('dotenv').config({ path: '.env' });
      
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const fullName = process.env.ADMIN_FULL_NAME || '管理员';
      
      // 检查用户是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });
      
      if (existingUser) {
        logger.log(`用户 '${username}' 已存在，跳过创建`);
      } else {
        const newUser = await prisma.user.create({
          data: {
            username,
            password: hashPassword(password),
            fullName,
            role: 'ADMIN',
          },
        });
        logger.log(`管理员用户创建成功: ${newUser.username}`);
      }
    } catch (error) {
      logger.error(`创建管理员用户失败: ${error.message}`);
    }
    
  } catch (error) {
    logger.error(`数据库重置失败: ${error.message}`);
    process.exit(1); // 非零退出码表示失败
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase().catch(e => {
  console.error(e);
  process.exit(1);
});
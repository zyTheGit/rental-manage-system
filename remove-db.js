const fs = require('fs');
const path = require('path');

try {
  const dbPath = path.join(__dirname, 'apps/backend/prisma/dev.db');
  const journalPath = path.join(__dirname, 'apps/backend/prisma/dev.db-journal');
  
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('数据库文件已删除:', dbPath);
  } else {
    console.log('数据库文件不存在:', dbPath);
  }
  
  if (fs.existsSync(journalPath)) {
    fs.unlinkSync(journalPath);
    console.log('数据库日志文件已删除:', journalPath);
  } else {
    console.log('数据库日志文件不存在:', journalPath);
  }
  
  console.log('文件清理完成');
} catch (error) {
  console.error('清理文件时出错:', error);
}
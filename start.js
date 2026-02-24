#!/usr/bin/env node

/**
 * 后端服务启动脚本
 * 用于在 Windows 环境下开发
 */

const { spawn, exec } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, 'apps', 'backend');
const frontendDir = path.join(__dirname, 'apps', 'frontend');

console.log('\n=== 个人租房管理系统启动脚本 ===\n');

// 启动后端
console.log('1. 启动后端服务...');
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: backendDir,
  shell: true,
  env: { ...process.env, DATABASE_URL: 'file:./dev.db' }
});

backendProcess.stdout.on('data', (data) => {
  console.log(`[后端] ${data.toString().trim()}`);
});

backendProcess.stderr.on('data', (data) => {
  console.error(`[后端] ${data.toString().trim()}`);
});

// 等待后端启动
setTimeout(() => {
  console.log('\n2. 启动前端服务...');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: frontendDir,
    shell: true
  });

  frontendProcess.stdout.on('data', (data) => {
    console.log(`[前端] ${data.toString().trim()}`);
  });

  frontendProcess.stderr.on('data', (data) => {
    console.error(`[前端] ${data.toString().trim()}`);
  });

  frontendProcess.on('close', (code) => {
    console.log(`前端进程退出，代码: ${code}`);
  });
}, 5000);

console.log('\n📌 后端地址: http://localhost:3001');
console.log('📌 前端地址: http://localhost:5173');
console.log('📌 API 文档: http://localhost:3001/api/docs');
console.log('📌 管理员账号: admin / admin123\n');
console.log('按 Ctrl+C 停止所有服务\n');

process.on('SIGINT', () => {
  console.log('\n正在停止服务...');
  process.exit(0);
});

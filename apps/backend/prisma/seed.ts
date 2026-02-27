import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 清空现有数据
  await prisma.utilityStats.deleteMany({});
  await prisma.paymentItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.tenant.deleteMany({});
  await prisma.house.deleteMany({});

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const fullName = process.env.ADMIN_FULL_NAME || '管理员';

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      password: hashedPassword,
      fullName,
      role: 'ADMIN',
    },
  });

  console.log('管理员账号创建/更新成功:');
  console.log(`用户名: ${username}`);
  console.log(`密码: ${password}`);

  // 创建10条房屋数据
  const houses = [
    { title: '阳光花园1栋101', address: '阳光花园小区1栋1单元101室', rent: 2000, deposit: 2000, area: 85, waterInitialRead: 100, electricInitialRead: 500, waterRate: 3, electricRate: 1, status: 'RENTED' },
    { title: '阳光花园1栋102', address: '阳光花园小区1栋1单元102室', rent: 1800, deposit: 1800, area: 75, waterInitialRead: 50, electricInitialRead: 200, waterRate: 3, electricRate: 1, status: 'RENTED' },
    { title: '阳光花园2栋201', address: '阳光花园小区2栋2单元201室', rent: 2200, deposit: 2200, area: 95, waterInitialRead: 80, electricInitialRead: 600, waterRate: 3, electricRate: 1, status: 'RENTED' },
    { title: '阳光花园2栋202', address: '阳光花园小区2栋2单元202室', rent: 1900, deposit: 1900, area: 80, waterInitialRead: 120, electricInitialRead: 450, waterRate: 3, electricRate: 1, status: 'AVAILABLE' },
    { title: '翠湖天地A座801', address: '翠湖天地小区A座8楼801室', rent: 3500, deposit: 7000, area: 120, waterInitialRead: 200, electricInitialRead: 1000, waterRate: 3.5, electricRate: 1.2, status: 'RENTED' },
    { title: '翠湖天地A座802', address: '翠湖天地小区A座8楼802室', rent: 3200, deposit: 6400, area: 110, waterInitialRead: 180, electricInitialRead: 800, waterRate: 3.5, electricRate: 1.2, status: 'RENTED' },
    { title: '城市之光3号楼1501', address: '城市之光小区3号楼15楼1501室', rent: 2800, deposit: 5600, area: 100, waterInitialRead: 300, electricInitialRead: 1500, waterRate: 3, electricRate: 1, status: 'RENTED' },
    { title: '城市之光3号楼1502', address: '城市之光小区3号楼15楼1502室', rent: 2600, deposit: 5200, area: 90, waterInitialRead: 250, electricInitialRead: 1200, waterRate: 3, electricRate: 1, status: 'AVAILABLE' },
    { title: '幸福家园5栋301', address: '幸福家园小区5栋3楼301室', rent: 1500, deposit: 1500, area: 60, waterInitialRead: 60, electricInitialRead: 300, waterRate: 2.5, electricRate: 0.8, status: 'RENTED' },
    { title: '幸福家园5栋302', address: '幸福家园小区5栋3楼302室', rent: 1600, deposit: 1600, area: 65, waterInitialRead: 70, electricInitialRead: 350, waterRate: 2.5, electricRate: 0.8, status: 'RENTED' },
  ];

  console.log('\n开始创建房屋数据...');
  const createdHouses: any[] = [];
  for (const house of houses) {
    const created = await prisma.house.create({ data: house });
    createdHouses.push(created);
    console.log(`创建房屋: ${house.title} (ID: ${created.id})`);
  }

  // 创建10条租户数据
  const tenantData = [
    { name: '张伟', phone: '13800138001', idCard: '110101199001011234', rentStart: new Date('2025-01-15'), balance: 150 },
    { name: '王芳', phone: '13800138002', idCard: '110101199002022345', rentStart: new Date('2025-02-01'), balance: -50 },
    { name: '李强', phone: '13800138003', idCard: '110101199003033456', rentStart: new Date('2025-03-10'), balance: 200 },
    { name: '赵敏', phone: '13800138004', idCard: '110101199004044567', rentStart: new Date('2025-01-01'), balance: 0 },
    { name: '刘洋', phone: '13800138005', idCard: '110101199005055678', rentStart: new Date('2025-04-15'), balance: 100 },
    { name: '陈静', phone: '13800138006', idCard: '110101199006066789', rentStart: new Date('2025-05-01'), balance: -30 },
    { name: '杨帆', phone: '13800138007', idCard: '110101199007077890', rentStart: new Date('2025-06-10'), balance: 80 },
    { name: '周婷', phone: '13800138008', idCard: '110101199008088901', rentStart: new Date('2025-07-01'), balance: 0 },
    { name: '吴磊', phone: '13800138009', idCard: '110101199009099012', rentStart: new Date('2025-08-15'), balance: 0, status: 'CHECKED_OUT' },
    { name: '郑雪', phone: '13800138010', idCard: '110101199010100123', rentStart: new Date('2025-09-01'), balance: 0, status: 'CHECKED_OUT' },
  ];

  console.log('\n开始创建租户数据...');
  const createdTenants: any[] = [];
  for (let i = 0; i < tenantData.length; i++) {
    const t = tenantData[i];
    const created = await prisma.tenant.create({
      data: {
        ...t,
        houseId: createdHouses[i].id,
      }
    });
    createdTenants.push(created);
    console.log(`创建租户: ${t.name} (房屋: ${createdHouses[i].title})`);
  }

  // 创建缴费记录（同时创建UtilityStats数据）
  const paymentData = [
    { tenantIdx: 0, amount: 2100, paidAt: new Date('2026-01-05'), remark: '1月份房租+水电', year: 2026, month: 1,
      items: [
        { type: 'RENT', amount: 2000 },
        { type: 'WATER', amount: 30, waterStartRead: 100, waterEndRead: 110, waterUsage: 10 },
        { type: 'ELECTRIC', amount: 70, electricStartRead: 500, electricEndRead: 570, electricUsage: 70 }
      ],
      utility: { electricStartRead: 500, electricEndRead: 570, electricUsage: 70, waterStartRead: 100, waterEndRead: 110, waterUsage: 10 }
    },
    { tenantIdx: 1, amount: 1850, paidAt: new Date('2026-01-08'), remark: '1月份房租+水电', year: 2026, month: 1,
      items: [
        { type: 'RENT', amount: 1800 },
        { type: 'WATER', amount: 15, waterStartRead: 50, waterEndRead: 55, waterUsage: 5 },
        { type: 'ELECTRIC', amount: 35, electricStartRead: 200, electricEndRead: 235, electricUsage: 35 }
      ],
      utility: { electricStartRead: 200, electricEndRead: 235, electricUsage: 35, waterStartRead: 50, waterEndRead: 55, waterUsage: 5 }
    },
    { tenantIdx: 2, amount: 2350, paidAt: new Date('2026-01-10'), remark: '1月份房租+水电', year: 2026, month: 1,
      items: [
        { type: 'RENT', amount: 2200 },
        { type: 'WATER', amount: 45, waterStartRead: 80, waterEndRead: 95, waterUsage: 15 },
        { type: 'ELECTRIC', amount: 105, electricStartRead: 600, electricEndRead: 705, electricUsage: 105 }
      ],
      utility: { electricStartRead: 600, electricEndRead: 705, electricUsage: 105, waterStartRead: 80, waterEndRead: 95, waterUsage: 15 }
    },
    { tenantIdx: 3, amount: 3700, paidAt: new Date('2026-01-03'), remark: '1月份房租+水电', year: 2026, month: 1,
      items: [
        { type: 'RENT', amount: 3500 },
        { type: 'WATER', amount: 56, waterStartRead: 200, waterEndRead: 216, waterUsage: 16 },
        { type: 'ELECTRIC', amount: 144, electricStartRead: 1000, electricEndRead: 1120, electricUsage: 120 }
      ],
      utility: { electricStartRead: 1000, electricEndRead: 1120, electricUsage: 120, waterStartRead: 200, waterEndRead: 216, waterUsage: 16 }
    },
    { tenantIdx: 4, amount: 3400, paidAt: new Date('2026-01-12'), remark: '1月份房租+水电', year: 2026, month: 1,
      items: [
        { type: 'RENT', amount: 3200 },
        { type: 'WATER', amount: 70, waterStartRead: 180, waterEndRead: 200, waterUsage: 20 },
        { type: 'ELECTRIC', amount: 130, electricStartRead: 800, electricEndRead: 908, electricUsage: 108 }
      ],
      utility: { electricStartRead: 800, electricEndRead: 908, electricUsage: 108, waterStartRead: 180, waterEndRead: 200, waterUsage: 20 }
    },
    { tenantIdx: 5, amount: 2950, paidAt: new Date('2026-01-15'), remark: '1月份房租+水电', year: 2026, month: 1,
      items: [
        { type: 'RENT', amount: 2800 },
        { type: 'WATER', amount: 36, waterStartRead: 300, waterEndRead: 312, waterUsage: 12 },
        { type: 'ELECTRIC', amount: 114, electricStartRead: 1500, electricEndRead: 1614, electricUsage: 114 }
      ],
      utility: { electricStartRead: 1500, electricEndRead: 1614, electricUsage: 114, waterStartRead: 300, waterEndRead: 312, waterUsage: 12 }
    },
    { tenantIdx: 6, amount: 1600, paidAt: new Date('2026-01-18'), remark: '1月份房租+水电', year: 2026, month: 1,
      items: [
        { type: 'RENT', amount: 1500 },
        { type: 'WATER', amount: 25, waterStartRead: 60, waterEndRead: 70, waterUsage: 10 },
        { type: 'ELECTRIC', amount: 75, electricStartRead: 300, electricEndRead: 394, electricUsage: 94 }
      ],
      utility: { electricStartRead: 300, electricEndRead: 394, electricUsage: 94, waterStartRead: 60, waterEndRead: 70, waterUsage: 10 }
    },
    { tenantIdx: 7, amount: 1720, paidAt: new Date('2026-01-20'), remark: '1月份房租+水电', year: 2026, month: 1,
      items: [
        { type: 'RENT', amount: 1600 },
        { type: 'WATER', amount: 30, waterStartRead: 70, waterEndRead: 82, waterUsage: 12 },
        { type: 'ELECTRIC', amount: 90, electricStartRead: 350, electricEndRead: 462, electricUsage: 112 }
      ],
      utility: { electricStartRead: 350, electricEndRead: 462, electricUsage: 112, waterStartRead: 70, waterEndRead: 82, waterUsage: 12 }
    },
    { tenantIdx: 0, amount: 2080, paidAt: new Date('2026-02-05'), remark: '2月份房租+水电', year: 2026, month: 2,
      items: [
        { type: 'RENT', amount: 2000 },
        { type: 'WATER', amount: 24, waterStartRead: 110, waterEndRead: 118, waterUsage: 8 },
        { type: 'ELECTRIC', amount: 56, electricStartRead: 570, electricEndRead: 626, electricUsage: 56 }
      ],
      utility: { electricStartRead: 570, electricEndRead: 626, electricUsage: 56, waterStartRead: 110, waterEndRead: 118, waterUsage: 8 }
    },
    { tenantIdx: 1, amount: 1865, paidAt: new Date('2026-02-08'), remark: '2月份房租+水电', year: 2026, month: 2,
      items: [
        { type: 'RENT', amount: 1800 },
        { type: 'WATER', amount: 21, waterStartRead: 55, waterEndRead: 62, waterUsage: 7 },
        { type: 'ELECTRIC', amount: 44, electricStartRead: 235, electricEndRead: 279, electricUsage: 44 }
      ],
      utility: { electricStartRead: 235, electricEndRead: 279, electricUsage: 44, waterStartRead: 55, waterEndRead: 62, waterUsage: 7 }
    },
  ];

  console.log('\n开始创建缴费记录和水电统计数据...');
  for (let i = 0; i < paymentData.length; i++) {
    const payment = paymentData[i];
    const tenant = createdTenants[payment.tenantIdx];
    
    // 创建缴费记录
    await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        amount: payment.amount,
        paidAt: payment.paidAt,
        remark: payment.remark,
        items: {
          create: payment.items
        }
      }
    });
    console.log(`创建缴费记录 #${i + 1}: ${tenant.name} - ${payment.amount}元`);

    // 创建或更新水电统计
    await prisma.utilityStats.upsert({
      where: {
        tenantId_year_month: {
          tenantId: tenant.id,
          year: payment.year,
          month: payment.month
        }
      },
      update: {
        electricEndRead: payment.utility.electricEndRead,
        electricUsage: { increment: payment.utility.electricUsage },
        waterEndRead: payment.utility.waterEndRead,
        waterUsage: { increment: payment.utility.waterUsage },
      },
      create: {
        tenantId: tenant.id,
        year: payment.year,
        month: payment.month,
        electricStartRead: payment.utility.electricStartRead,
        electricEndRead: payment.utility.electricEndRead,
        electricUsage: payment.utility.electricUsage,
        waterStartRead: payment.utility.waterStartRead,
        waterEndRead: payment.utility.waterEndRead,
        waterUsage: payment.utility.waterUsage,
      }
    });
    console.log(`  -> 创建水电统计: ${payment.year}年${payment.month}月`);
  }

  console.log('\n测试数据创建完成!');
  console.log(`- 房屋: ${createdHouses.length} 条`);
  console.log(`- 租户: ${createdTenants.length} 条`);
  console.log(`- 缴费记录: ${paymentData.length} 条`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
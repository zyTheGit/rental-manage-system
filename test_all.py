from playwright.sync_api import sync_playwright
import time

def test_login(page):
    print("=== 测试登录功能 ===")
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    
    # 检查是否在登录页面
    if 'login' in page.url or page.locator('input[type="password"]').count() > 0:
        print("检测到登录页面")
        # 输入用户名密码
        page.fill('input[type="text"], input[placeholder*="用户名"], input[placeholder*="账号"]', 'admin')
        page.fill('input[type="password"]', 'admin123')
        page.click('button:has-text("登录"), button[type="submit"]')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
    
    # 验证是否登录成功
    if 'login' not in page.url:
        print("✓ 登录成功")
        return True
    else:
        print("✗ 登录失败")
        return False

def test_dashboard(page):
    print("\n=== 测试仪表盘 ===")
    page.goto('http://localhost:5173/')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    
    # 检查统计卡片
    cards = page.locator('.stat-card, .summary-card, [class*="card"]').count()
    print(f"找到 {cards} 个统计卡片")
    
    # 检查是否有数据展示
    if page.locator('text=/入住率|收入|房源|租客/').count() > 0:
        print("✓ 仪表盘数据展示正常")
        return True
    return False

def test_houses(page):
    print("\n=== 测试房源管理 ===")
    page.goto('http://localhost:5173/houses')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    
    # 检查房源列表
    houses_count = page.locator('.house-card, .house-item, [class*="house"]').count()
    print(f"找到 {houses_count} 个房源元素")
    
    # 尝试点击新增按钮
    add_btn = page.locator('button:has-text("新增"), button:has-text("添加"), [class*="add"]')
    if add_btn.count() > 0:
        print("找到新增按钮")
    
    # 检查是否有房源数据
    if houses_count > 0 or page.locator('text=/房源|房间|已租/').count() > 0:
        print("✓ 房源管理页面正常")
        return True
    return False

def test_tenants(page):
    print("\n=== 测试租客管理 ===")
    page.goto('http://localhost:5173/tenants')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    
    # 检查租客列表
    tenants_count = page.locator('.tenant-card, .tenant-item, [class*="tenant"]').count()
    print(f"找到 {tenants_count} 个租客元素")
    
    # 检查是否有租客数据
    if tenants_count > 0 or page.locator('text=/租客|姓名|入住/').count() > 0:
        print("✓ 租客管理页面正常")
        return True
    return False

def test_payments(page):
    print("\n=== 测试缴费管理 ===")
    page.goto('http://localhost:5173/payments')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    
    # 检查缴费列表
    payments_count = page.locator('.payment-card, .payment-item, [class*="payment"]').count()
    print(f"找到 {payments_count} 个缴费元素")
    
    # 尝试点击新增缴费
    add_btn = page.locator('button:has-text("新增"), button:has-text("添加"), button:has-text("缴费")')
    if add_btn.count() > 0:
        print("找到新增缴费按钮")
    
    # 检查是否有缴费数据
    if payments_count > 0 or page.locator('text=/缴费|金额|水电/').count() > 0:
        print("✓ 缴费管理页面正常")
        return True
    return False

def test_reminders(page):
    print("\n=== 测试提醒管理 ===")
    page.goto('http://localhost:5173/reminders')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    
    # 检查提醒列表
    reminders_count = page.locator('.reminder-card, .reminder-item, [class*="reminder"]').count()
    print(f"找到 {reminders_count} 个提醒元素")
    
    # 检查是否有提醒数据
    if reminders_count > 0 or page.locator('text=/提醒|日期|到期/').count() > 0:
        print("✓ 提醒管理页面正常")
        return True
    return False

def test_utility_stats(page):
    print("\n=== 测试水电统计 ===")
    page.goto('http://localhost:5173/utility-stats')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    
    # 检查图表
    charts = page.locator('canvas, [class*="chart"]').count()
    print(f"找到 {charts} 个图表元素")
    
    # 检查是否有统计数据
    if charts > 0 or page.locator('text=/用电|用水|统计/').count() > 0:
        print("✓ 水电统计页面正常")
        return True
    return False

def main():
    results = {}
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # 登录测试
            results['登录'] = test_login(page)
            
            if results['登录']:
                # 功能测试
                results['仪表盘'] = test_dashboard(page)
                results['房源管理'] = test_houses(page)
                results['租客管理'] = test_tenants(page)
                results['缴费管理'] = test_payments(page)
                results['提醒管理'] = test_reminders(page)
                results['水电统计'] = test_utility_stats(page)
            else:
                print("登录失败，跳过其他测试")
                
        except Exception as e:
            print(f"测试出错: {e}")
        finally:
            browser.close()
    
    # 输出测试结果
    print("\n" + "="*50)
    print("测试结果汇总:")
    print("="*50)
    passed = 0
    failed = 0
    for name, result in results.items():
        status = "✓ 通过" if result else "✗ 失败"
        print(f"{name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    print("="*50)
    print(f"总计: {passed} 通过, {failed} 失败")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
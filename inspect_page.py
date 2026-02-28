from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # 访问首页
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    
    # 截图
    page.screenshot(path='D:/zy/project_other/rental-manage-system/screenshot_login.png', full_page=True)
    
    # 打印页面内容
    print("页面URL:", page.url)
    print("\n页面标题:", page.title())
    
    # 查找所有输入框
    inputs = page.locator('input').all()
    print(f"\n找到 {len(inputs)} 个输入框:")
    for i, inp in enumerate(inputs):
        inp_type = inp.get_attribute('type') or 'text'
        inp_placeholder = inp.get_attribute('placeholder') or ''
        print(f"  {i+1}. type={inp_type}, placeholder={inp_placeholder}")
    
    # 查找所有按钮
    buttons = page.locator('button').all()
    print(f"\n找到 {len(buttons)} 个按钮:")
    for i, btn in enumerate(buttons):
        btn_text = btn.inner_text()
        print(f"  {i+1}. {btn_text}")
    
    browser.close()
    print("\n截图已保存到 screenshot_login.png")
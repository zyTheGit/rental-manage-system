<template>
  <div class="layout-container" :class="{ 'with-sidebar': !isMobile && showSidebar }">
    <van-sticky v-if="!isMobile || showHeader" :offset-top="0">
      <van-nav-bar
        :title="currentTitle"
        left-arrow
        @click-left="toggleLeftDrawer"
        :placeholder="true"
      >
        <template #right>
          <van-icon name="friends" size="18" @click="handleShowUserMenu" />
        </template>
      </van-nav-bar>
    </van-sticky>

    <aside v-if="!isMobile && showSidebar" class="desktop-sidebar">
      <div class="sidebar-brand">
        <div class="brand-bg"></div>
        <div class="brand-content">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path d="M9 22V12h6v10"/>
            </svg>
          </div>
          <h1 class="brand-title">租房管理</h1>
          <p class="brand-subtitle">Rental Management</p>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="nav-section-title">主要功能</span>
          <div class="nav-list">
            <a
              v-for="item in mainMenuItems"
              :key="item.key"
              class="nav-item"
              :class="{ active: route.name === item.key }"
              @click="handleMenuSelect(item.key)"
            >
              <div class="nav-icon">
                <component :is="item.iconComponent" />
              </div>
              <span class="nav-label">{{ item.label }}</span>
              <div class="nav-indicator"></div>
            </a>
          </div>
        </div>
        
        <div class="nav-section">
          <span class="nav-section-title">统计分析</span>
          <div class="nav-list">
            <a
              v-for="item in statsMenuItems"
              :key="item.key"
              class="nav-item"
              :class="{ active: route.name === item.key }"
              @click="handleMenuSelect(item.key)"
            >
              <div class="nav-icon">
                <component :is="item.iconComponent" />
              </div>
              <span class="nav-label">{{ item.label }}</span>
              <div class="nav-indicator"></div>
            </a>
          </div>
        </div>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">
            {{ userStore.user?.fullName?.charAt(0) || 'U' }}
          </div>
          <div class="user-info">
            <span class="user-name">{{ userStore.user?.fullName || '用户' }}</span>
            <span class="user-role">管理员</span>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <van-popup
      v-model:show="showSidebar"
      position="left"
      class="mobile-sidebar-popup"
      :style="{ width: '280px', height: '100%' }"
      @opened="onSidebarOpened"
      @closed="onSidebarClosed"
    >
      <div class="sidebar-brand">
        <div class="brand-bg"></div>
        <div class="brand-content">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path d="M9 22V12h6v10"/>
            </svg>
          </div>
          <h1 class="brand-title">租房管理</h1>
          <p class="brand-subtitle">Rental Management</p>
        </div>
      </div>
      
      <nav class="sidebar-nav mobile-nav">
        <a
          v-for="item in allMenuItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: route.name === item.key }"
          @click="handleMenuSelect(item.key)"
        >
          <div class="nav-icon">
            <component :is="item.iconComponent" />
          </div>
          <span class="nav-label">{{ item.label }}</span>
          <div class="nav-indicator"></div>
        </a>
      </nav>
      
      <div class="sidebar-footer mobile-footer">
        <button class="logout-btn" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>退出登录</span>
        </button>
      </div>
    </van-popup>

    <van-popup
      v-model:show="showUserMenu"
      position="right"
      round
      :style="{ width: '240px' }"
    >
      <div class="user-popup">
        <div class="user-popup-header">
          <div class="user-avatar large">
            {{ userStore.user?.fullName?.charAt(0) || 'U' }}
          </div>
          <span class="user-name">{{ userStore.user?.fullName || '用户' }}</span>
          <span class="user-role">管理员</span>
        </div>
        <button class="logout-btn-full" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>退出登录</span>
        </button>
      </div>
    </van-popup>

    <div class="content">
      <router-view />
    </div>

    <van-tabbar v-if="isMobile && showTabbar" v-model="activeTab" @change="handleTabChange" :fixed="true" :bordered="false" :placeholder="true" class="main-tabbar">
      <van-tabbar-item name="Dashboard">
        <template #icon="props">
          <div class="tabbar-icon" :class="{ active: props.active }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
          </div>
        </template>
        首页
      </van-tabbar-item>
      <van-tabbar-item name="Houses">
        <template #icon="props">
          <div class="tabbar-icon" :class="{ active: props.active }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path d="M9 22V12h6v10"/>
            </svg>
          </div>
        </template>
        房屋
      </van-tabbar-item>
      <van-tabbar-item name="Payments">
        <template #icon="props">
          <div class="tabbar-icon" :class="{ active: props.active }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="6" width="20" height="14" rx="2"/>
              <path d="M22 10H2"/>
              <path d="M6 14h4"/>
            </svg>
          </div>
        </template>
        缴费
      </van-tabbar-item>
      <van-tabbar-item name="More">
        <template #icon="props">
          <div class="tabbar-icon" :class="{ active: props.active }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
              <circle cx="5" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
            </svg>
          </div>
        </template>
        更多
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showConfirmDialog } from 'vant'
import { useWindowSize } from '@vueuse/core'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const showSidebar = ref(false)
const showUserMenu = ref(false)
const showTabbar = ref(true)
const activeTab = ref(route.name as string)

const DashboardIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { d: 'M3 3v18h18' }),
    h('path', { d: 'M18 17V9' }),
    h('path', { d: 'M13 17V5' }),
    h('path', { d: 'M8 17v-3' })
  ])
}

const HouseIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' }),
    h('path', { d: 'M9 22V12h6v10' })
  ])
}

const TenantIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { d: 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' }),
    h('circle', { cx: '8.5', cy: '7', r: '4' }),
    h('path', { d: 'M20 8v6M23 11h-6' })
  ])
}

const PaymentIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('rect', { x: '2', y: '6', width: '20', height: '14', rx: '2' }),
    h('path', { d: 'M22 10H2' }),
    h('path', { d: 'M6 14h4' })
  ])
}

const ChartIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { d: 'M12 20V10' }),
    h('path', { d: 'M18 20V4' }),
    h('path', { d: 'M6 20v-4' })
  ])
}

const BellIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { d: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9' }),
    h('path', { d: 'M13.73 21a2 2 0 01-3.46 0' })
  ])
}

const mainMenuItems = [
  { label: '数据统计', key: 'Dashboard', iconComponent: DashboardIcon },
  { label: '房屋管理', key: 'Houses', iconComponent: HouseIcon },
  { label: '租户管理', key: 'Tenants', iconComponent: TenantIcon },
  { label: '缴费记录', key: 'Payments', iconComponent: PaymentIcon }
]

const statsMenuItems = [
  { label: '水电统计', key: 'UtilityStats', iconComponent: ChartIcon },
  { label: '缴费提醒', key: 'Reminders', iconComponent: BellIcon }
]

const allMenuItems = [...mainMenuItems, ...statsMenuItems]

const showHeader = computed(() => {
  return !!route.meta.fullWidthHeader
})

const currentTitle = computed(() => {
  const menuItem = allMenuItems.find(item => item.key === route.name)
  return menuItem?.label || '租房管理系统'
})

const toggleLeftDrawer = () => {
  showSidebar.value = !showSidebar.value
}

const showUserPopup = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleMenuSelect = (key: string) => {
  router.push({ name: key })
  if (isMobile.value) {
    showSidebar.value = false
  }
}

const handleTabChange = (name: string) => {
  if (name === 'More') {
    showSidebar.value = !showSidebar.value
    return
  }
  showSidebar.value = false
  router.push({ name })
  activeTab.value = name
}

const handleLogout = () => {
  showConfirmDialog({
    title: '确认退出',
    message: '确定要退出登录吗？'
  }).then(() => {
    userStore.logout()
    router.push('/login')
  })
  .catch(() => {})
  showUserMenu.value = false
}

const onSidebarOpened = () => {
  if (isMobile.value) {
    showTabbar.value = false
  }
}

const onSidebarClosed = () => {
  if (isMobile.value) {
    showTabbar.value = true
    if (activeTab.value === 'More') {
      const menuItem = allMenuItems.find(item => item.key === route.name)
      activeTab.value = menuItem ? route.name as string : 'Dashboard'
    }
  }
}

const handleShowUserMenu = () => {
  if (isMobile.value) {
    showSidebar.value = !showSidebar.value
  } else {
    showUserPopup()
  }
}

watch(() => route.name, (name) => {
  activeTab.value = name as string
  showTabbar.value = isMobile.value && !showSidebar.value
})

onMounted(() => {
  activeTab.value = route.name as string
  if (isMobile.value) {
    showTabbar.value = true
    showSidebar.value = false
  } else {
    showSidebar.value = true
    showTabbar.value = false
  }
})
</script>

<style scoped lang="less">

.layout-container {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

.layout-container.with-sidebar {
  flex-direction: row;
}

.desktop-sidebar {
  width: 260px;
  min-height: 100vh;
  background: var(--bg-card);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.03);
}

.layout-container.with-sidebar .content {
  flex: 1;
  padding: 0;
  min-height: 100vh;
}

.layout-container.with-sidebar .van-sticky {
  display: none;
}

.content {
  flex: 1;
  padding: 0;
}

.sidebar-brand {
  position: relative;
  padding: 24px 20px;
  overflow: hidden;
}

.brand-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
}

.brand-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%);
}

.brand-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.brand-icon {
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  backdrop-filter: blur(10px);
  
  svg {
    width: 26px;
    height: 26px;
    color: white;
  }
}

.brand-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 12px;
  overflow-y: auto;
}

.mobile-nav {
  padding: 16px 12px;
}

.nav-section {
  margin-bottom: 24px;
}

.nav-section-title {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 12px;
  margin-bottom: 8px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: var(--bg-input);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &.active {
    background: var(--primary-light);
    
    .nav-icon {
      background: var(--primary);
      
      svg {
        color: white;
      }
    }
    
    .nav-label {
      color: var(--primary);
      font-weight: 600;
    }
    
    .nav-indicator {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 24px;
      background: var(--primary);
      border-radius: 0 4px 4px 0;
    }
  }
}

.nav-icon {
  width: 36px;
  height: 36px;
  background: var(--bg-input);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  
  svg {
    width: 18px;
    height: 18px;
    color: var(--text-secondary);
  }
}

.nav-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-page);
}

.mobile-footer {
  margin-top: auto;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
  
  &.large {
    width: 56px;
    height: 56px;
    font-size: 20px;
    border-radius: 14px;
  }
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 2px;
}

.user-role {
  font-size: 12px;
  color: var(--text-secondary);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &:hover {
    background: #FEF2F2;
    border-color: #FECACA;
    color: #EF4444;
    
    svg {
      color: #EF4444;
    }
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.mobile-sidebar-popup {
  background: var(--bg-card) !important;
}

.user-popup {
  padding: 24px 20px;
}

.user-popup-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  
  .user-name {
    font-size: 16px;
    margin-top: 12px;
    margin-bottom: 4px;
  }
  
  .user-role {
    font-size: 12px;
  }
}

.logout-btn-full {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  color: #EF4444;
  cursor: pointer;
  transition: all 0.2s ease;
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.main-tabbar {
  background: var(--bg-card) !important;
  border-top: 1px solid var(--border-light) !important;
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 22px;
    height: 22px;
    color: var(--text-secondary);
    transition: all 0.2s ease;
  }
  
  &.active svg {
    color: var(--primary);
  }
}

:deep(.van-tabbar-item) {
  color: var(--text-secondary);
}

:deep(.van-tabbar-item--active) {
  color: var(--primary);
}

:deep(.van-tabbar-item--active .van-tabbar-item__text) {
  font-weight: 600;
}
</style>
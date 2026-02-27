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

    <!-- PC端固定侧边栏 -->
    <aside v-if="!isMobile && showSidebar" class="desktop-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-title">租房管理</div>
      </div>
      <van-cell-group inset>
        <van-cell
          v-for="item in menuItems"
          :key="item.key"
          :title="item.label"
          :icon="item.icon"
          is-link
          @click="handleMenuSelect(item.key)"
          :class="{ active: route.name === item.key }"
        />
      </van-cell-group>
      <div class="sidebar-footer">
        <van-button block plain type="danger" @click="handleLogout">
          退出登录
        </van-button>
      </div>
    </aside>

    <!-- 移动端弹出侧边栏 -->
    <van-popup
      v-model:show="showSidebar"
      position="left"
      :style="{ width: '280px', height: '100%' }"
      @opened="onSidebarOpened"
      @closed="onSidebarClosed"
    >
      <div class="sidebar-header">
        <div class="sidebar-title">租房管理</div>
      </div>
      <van-cell-group inset>
        <van-cell
          v-for="item in menuItems"
          :key="item.key"
          :title="item.label"
          :icon="item.icon"
          is-link
          @click="handleMenuSelect(item.key)"
          :class="{ active: route.name === item.key }"
        />
      </van-cell-group>

      <div class="sidebar-footer">
        <van-button block plain type="danger" @click="handleLogout">
          退出登录
        </van-button>
      </div>
    </van-popup>

    <van-popup
      v-model:show="showUserMenu"
      position="right"
      round
      :style="{ width: '200px' }"
    >
      <div class="user-info">
        <van-icon name="user-o" size="40" />
        <div class="user-name">{{ userStore.user?.fullName || '用户' }}</div>
      </div>
      <van-cell-group inset>
        <van-cell title="退出登录" is-link @click="handleLogout" />
      </van-cell-group>
    </van-popup>

    <div class="content">
      <router-view />
    </div>

<van-tabbar v-if="isMobile && showTabbar" v-model="activeTab" @change="handleTabChange" :fixed="true" :bordered="false" :placeholder="true">
      <van-tabbar-item name="Dashboard">
        <template #icon>
          <span style="font-size: 20px;">📊</span>
        </template>
        首页
      </van-tabbar-item>
      <van-tabbar-item name="Houses">
        <template #icon>
          <span style="font-size: 20px;">🏠</span>
        </template>
        房屋
      </van-tabbar-item>
      <van-tabbar-item name="Payments">
        <template #icon>
          <span style="font-size: 20px;">💰</span>
        </template>
        缴费
      </van-tabbar-item>
      <van-tabbar-item name="More">
        <template #icon>
          <span style="font-size: 20px;">☰</span>
        </template>
        更多
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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

const menuItems = [
  {
    label: '数据统计',
    key: 'Dashboard',
    icon: 'chart-trending-o'
  },
  {
    label: '房屋管理',
    key: 'Houses',
    icon: 'home-o'
  },
  {
    label: '租户管理',
    key: 'Tenants',
    icon: 'friends-o'
  },
  {
    label: '缴费记录',
    key: 'Payments',
    icon: 'balance-o'
  },
  {
    label: '水电统计',
    key: 'UtilityStats',
    icon: 'chart-trending-o'
  },
  {
    label: '缴费提醒',
    key: 'Reminders',
    icon: 'bell'
  }
]

const showHeader = computed(() => {
  return !!route.meta.fullWidthHeader
})

const currentTitle = computed(() => {
  const menuItem = menuItems.find(item => item.key === route.name)
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
    showSidebar.value = true
    return
  }
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
  .catch(() => {
    // 用户取消
  })
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

<style scoped>
@import '@/styles/theme.css';

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
  width: 240px;
  min-height: 100vh;
  background: var(--bg-card);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
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

.sidebar-header {
  padding: 20px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

:deep(.van-cell-group--inset) {
  margin: 16px;
}

:deep(.van-cell) {
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  transition: var(--transition);
}

:deep(.van-cell:active) {
  background: var(--primary-light);
}

:deep(.van-cell__title) {
  color: var(--text-main);
}

:deep(.van-cell.active) {
  background: var(--primary-light);
}

:deep(.van-cell.active .van-cell__title) {
  color: var(--primary);
}

:deep(.van-cell.active .van-icon) {
  color: var(--primary);
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.van-button--danger) {
  border-color: transparent;
}

.user-info {
  padding: 24px 20px;
  text-align: center;
  background: var(--bg-input);
}

.user-info .van-icon {
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 50%;
  padding: 12px;
  margin-bottom: 8px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

:deep(.van-tabbar) {
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
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

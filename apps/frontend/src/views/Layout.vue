<template>
  <n-layout has-sider class="min-h-screen">
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="isMobile"
      show-trigger="arrow-circle"
      class="hidden md:block"
    >
      <div class="h-16 flex items-center justify-center border-b">
        <h1 class="font-bold text-lg">租房管理</h1>
      </div>
      
      <n-menu
        v-model:value="activeKey"
        :collapsed="isMobile"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered class="flex items-center justify-between px-6 h-16">
        <h2 class="text-xl font-bold">{{ currentTitle }}</h2>
        
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-3">
            <n-avatar round>
              <template #icon>
                <n-icon>
                  <PersonIcon />
                </n-icon>
              </template>
            </n-avatar>
            <span class="text-gray-700">{{ userStore.user?.fullName }}</span>
          </div>
          <n-button text @click="handleLogout">退出</n-button>
        </div>
      </n-layout-header>

      <n-layout-content>
        <div class="content">
          <router-view />
        </div>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { PersonOutline as PersonIcon } from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isMobile = ref(false)
const activeKey = ref(route.name as string)

const menuOptions = [
  {
    label: '数据统计',
    key: 'Dashboard',
    icon: () => '📊'
  },
  {
    label: '房屋管理',
    key: 'Houses',
    icon: () => '🏠'
  },
  {
    label: '租户管理',
    key: 'Tenants',
    icon: () => '👥'
  },
  {
    label: '缴费记录',
    key: 'Payments',
    icon: () => '💰'
  }
]

const currentTitle = computed(() => {
  const menuItem = menuOptions.find(item => item.key === route.name)
  return menuItem?.label || '租房管理系统'
})

const handleMenuSelect = (key: string) => {
  activeKey.value = key
  router.push({ name: key })
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.content {
  padding: 24px;
}
</style>

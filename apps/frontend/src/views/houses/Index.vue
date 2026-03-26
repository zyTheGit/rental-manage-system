<template>
  <div class="houses-page page-container">
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
        <div class="header-info">
          <h1 class="page-title">房屋管理</h1>
          <p class="page-subtitle">{{ houses.length }} 间房产</p>
        </div>
      </div>
      <button class="btn-add" @click="addHouse">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>

    <div class="toolbar">
      <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          :value="searchText"
          type="text"
          placeholder="搜索房屋..."
          @input="handleSearchInput(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="filter-chip" @click="showStatusPicker = true">
        <span>{{ filterStatusText }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-pulse"></div>
      <span>加载中...</span>
    </div>

    <div v-else class="houses-grid">
      <div 
        v-for="(house, index) in houses" 
        :key="house.id" 
        class="house-card"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div class="card-top">
          <div class="status-badge" :class="house.status === 'AVAILABLE' ? 'available' : 'rented'">
            {{ house.status === "AVAILABLE" ? "空置" : "已租" }}
          </div>
          <div class="card-menu" @click.stop>
            <button class="menu-btn" @click="editHouse(house)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="card-content">
          <h3 class="house-title">{{ house.title }}</h3>
          <p class="house-address">{{ house.address }}</p>
          
          <div class="house-meta">
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
              </svg>
              <span>{{ house.area }}㎡</span>
            </div>
            <div class="meta-item price">
              <span class="price-value">¥{{ house.rent.toLocaleString() }}</span>
              <span class="price-unit">/月</span>
            </div>
          </div>
        </div>

        <div class="card-action">
          <button 
            class="action-btn" 
            :class="house.status === 'AVAILABLE' ? 'rent' : 'checkout'"
            @click="toggleStatus(house)"
          >
            <span>{{ house.status === "AVAILABLE" ? "标记出租" : "标记空置" }}</span>
          </button>
        </div>
      </div>

      <div v-if="houses.length === 0" class="empty-state">
        <div class="empty-visual">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path d="M9 22V12h6v10"/>
          </svg>
        </div>
        <h3>还没有房屋</h3>
        <p>添加您的第一间房产开始管理</p>
        <button class="btn-add-large" @click="addHouse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>添加房屋</span>
        </button>
      </div>
    </div>

    <HouseModal
      v-if="showModal"
      :show="showModal"
      :house="editingHouse"
      @update:show="showModal = $event"
      @save="handleSave"
    />

    <CommonPicker
      :show="showStatusPicker"
      title="选择状态"
      :options="statusOptions"
      v-model="filterStatus"
      @update:show="showStatusPicker = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { showToast, showDialog } from "vant"
import { housesApi } from "@/api"
import HouseModal from "./components/HouseModal.vue"
import CommonPicker from "@/components/CommonPicker.vue"

const houses = ref<any[]>([])
const loading = ref(false)
const searchText = ref("")
const filterStatus = ref<string>("")
const showModal = ref(false)
const editingHouse = ref<any>(null)
const showStatusPicker = ref(false)

const statusOptions = [
  { value: "", label: "全部" },
  { value: "AVAILABLE", label: "空置" },
  { value: "RENTED", label: "已租" },
]

const filterStatusText = computed(() => {
  const option = statusOptions.find((o) => o.value === filterStatus.value)
  return option?.label || "全部"
})

let searchTimer: ReturnType<typeof setTimeout> | null = null

const fetchHouses = async (search?: string) => {
  loading.value = true
  try {
    const params: any = {}
    if (search || searchText.value) {
      params.search = search || searchText.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    const data = (await housesApi.getList(Object.keys(params).length > 0 ? params : undefined)) as unknown as any[]
    houses.value = Array.isArray(data) ? data : []
  } catch (error) {
    showToast({ type: "fail", message: "获取房屋列表失败" })
    houses.value = []
  } finally {
    loading.value = false
  }
}

const handleSearchInput = (value: string) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    fetchHouses(value)
  }, 300)
}

watch(filterStatus, () => {
  fetchHouses()
})

const addHouse = () => {
  editingHouse.value = null
  showModal.value = true
}

const editHouse = (house: any) => {
  editingHouse.value = house
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingHouse.value = null
}

const handleSave = async (data: any) => {
  try {
    if (editingHouse.value) {
      await housesApi.update(editingHouse.value.id, data)
      showToast({ type: "success", message: "更新成功" })
    } else {
      await housesApi.create(data)
      showToast({ type: "success", message: "添加成功" })
    }
    closeModal()
    fetchHouses()
  } catch (error: any) {
    showToast({
      type: "fail",
      message: error.response?.data?.message || "操作失败",
    })
  }
}

const toggleStatus = async (house: any) => {
  const newStatus = house.status === "AVAILABLE" ? "RENTED" : "AVAILABLE"
  const action = newStatus === "RENTED" ? "出租" : "空置"
  try {
    await showDialog({
      title: "确认操作",
      message: `确定要将 "${house.title}" 标记为${action}吗？`,
      showCancelButton: true,
    })
    await housesApi.updateStatus(house.id, newStatus)
    showToast({ type: "success", message: "操作成功" })
    fetchHouses()
  } catch (error: any) {
    if (error !== "cancel") {
      showToast({
        type: "fail",
        message: error.response?.data?.message || "操作失败",
      })
    }
  }
}

onMounted(() => fetchHouses())
</script>

<style scoped lang="less">
.houses-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 100px;
  overflow-x: hidden;
}

* {
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.header-icon {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  
  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
}

.header-info {
  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin: 0 0 2px 0;
  }
  
  .page-subtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    margin: 0;
  }
}

.btn-add {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  svg {
    width: 22px;
    height: 22px;
    color: white;
  }
  
  &:active {
    transform: scale(0.92);
    background: rgba(255,255,255,0.3);
  }
}

.toolbar {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  overflow-x: hidden;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-input);
  border-radius: 10px;
  transition: all 0.2s ease;
  min-width: 0;
  
  &:focus-within {
    background: white;
    box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
  }
  
  .search-icon {
    width: 18px;
    height: 18px;
    color: var(--text-secondary);
    flex-shrink: 0;
  }
  
  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    color: var(--text-main);
    outline: none;
    min-width: 0;
    
    &::placeholder {
      color: var(--text-placeholder);
    }
  }
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--bg-input);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  
  svg {
    width: 14px;
    height: 14px;
    color: var(--text-secondary);
  }
  
  &:active {
    transform: scale(0.97);
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.loading-pulse {
  width: 40px;
  height: 40px;
  background: var(--primary);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.5; }
}

.houses-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-x: hidden;
}

.house-card {
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  animation: slideUp 0.4s ease backwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 16px 0;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  
  &.available {
    background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
    color: #047857;
  }
  
  &.rented {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    color: #92400E;
  }
}

.card-menu {
  .menu-btn {
    width: 32px;
    height: 32px;
    background: var(--bg-input);
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    
    svg {
      width: 16px;
      height: 16px;
      color: var(--text-secondary);
    }
    
    &:active {
      background: var(--primary-light);
      
      svg {
        color: var(--primary);
      }
    }
  }
}

.card-content {
  padding: 12px 16px 16px;
}

.house-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 4px 0;
}

.house-address {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.house-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &.price {
    .price-value {
      font-size: 20px;
      font-weight: 700;
      color: #059669;
    }
    
    .price-unit {
      font-size: 13px;
      color: var(--text-secondary);
    }
  }
}

.card-action {
  padding: 12px 16px 16px;
}

.action-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.rent {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
  }
  
  &.checkout {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
  
  .empty-visual {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    
    svg {
      width: 40px;
      height: 40px;
      color: #059669;
    }
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 8px 0;
  }
  
  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 24px 0;
  }
}

.btn-add-large {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  &:active {
    transform: scale(0.97);
  }
}
</style>
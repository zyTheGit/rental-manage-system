<template>
  <div class="houses-page">
    <div class="page-header">
      <div class="page-info">
        <h1 class="page-title">房屋管理</h1>
        <p class="page-subtitle">管理您的所有房产信息</p>
      </div>
      <button class="btn btn-primary ripple-effect" @click="addHouse">
        <span class="btn-icon">➕</span>
        <span>添加房屋</span>
      </button>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            :value="searchText"
            type="text"
            class="search-input"
            placeholder="搜索标题、地址..."
            @input="handleSearchInput(($event.target as HTMLInputElement).value)"
          />
        </div>
      <div class="filter-group" @click="showStatusPicker = true">
        <div class="filter-select-custom">
          <span>{{ filterStatusText }}</span>
          <span class="filter-arrow">▼</span>
        </div>
      </div>
      </div>
      <button
        class="btn btn-secondary ripple-effect"
        @click="exportToCSV"
        :disabled="exporting"
      >
        <span class="btn-icon">📥</span>
        <span>{{ exporting ? "导出中..." : "导出" }}</span>
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="houses-grid">
      <div v-for="house in houses" :key="house.id" class="house-card">
        <div class="card-header">
          <span
            class="house-tag"
            :class="
              house.status === 'AVAILABLE' ? 'tag-available' : 'tag-rented'
            "
          >
            {{ house.status === "AVAILABLE" ? "空置" : "已租" }}
          </span>
          <h3 class="house-title">{{ house.title }}</h3>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="info-icon">📍</span>
            <span class="info-text">{{ house.address }}</span>
          </div>
          <div class="info-row">
            <span class="info-icon">📐</span>
            <span class="info-text">{{ house.area }}㎡</span>
          </div>
          <div class="info-row info-highlight">
            <span class="info-icon">💰</span>
            <span class="info-price"
              >¥{{ house.rent.toLocaleString()
              }}<span class="price-unit">/月</span></span
            >
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-action btn-edit" @click="editHouse(house)">
            <span>✏️ 编辑</span>
          </button>
          <button
            class="btn-action"
            :class="house.status === 'AVAILABLE' ? 'btn-rent' : 'btn-checkout'"
            @click="toggleStatus(house)"
          >
            <span>{{
              house.status === "AVAILABLE" ? "🏠 出租" : "🔄 退租"
            }}</span>
          </button>
        </div>
      </div>

      <div v-if="houses.length === 0" class="empty-state">
        <span class="empty-icon">🏚️</span>
        <p class="empty-text">暂无房屋数据</p>
        <button class="btn btn-primary" @click="addHouse">
          添加第一个房屋
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
import { ref, computed, onMounted, watch } from "vue";
import { showToast, showDialog } from "vant";
import dayjs from "dayjs";
import { housesApi } from "@/api";
import HouseModal from "./components/HouseModal.vue";
import CommonPicker from "@/components/CommonPicker.vue";

const houses = ref<any[]>([]);
const loading = ref(false);
const exporting = ref(false);
const searchText = ref("");
const filterStatus = ref<string>("");
const showModal = ref(false);
const editingHouse = ref<any>(null);
const showStatusPicker = ref(false);

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "AVAILABLE", label: "空置" },
  { value: "RENTED", label: "已租" },
];

const filterStatusText = computed(() => {
  const option = statusOptions.find((o) => o.value === filterStatus.value);
  return option?.label || "全部状态";
});

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const fetchHouses = async (search?: string) => {
  loading.value = true;
  try {
    const params: any = {};
    if (search || searchText.value) {
      params.search = search || searchText.value;
    }
    if (filterStatus.value) {
      params.status = filterStatus.value;
    }
    const data = (await housesApi.getList(Object.keys(params).length > 0 ? params : undefined)) as unknown as any[];
    houses.value = Array.isArray(data) ? data : [];
  } catch (error) {
    showToast({ type: "fail", message: "获取房屋列表失败" });
    houses.value = [];
  } finally {
    loading.value = false;
  }
};

const handleSearchInput = (value: string) => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    fetchHouses(value);
  }, 300);
};

watch(filterStatus, () => {
  fetchHouses();
});

const addHouse = () => {
  editingHouse.value = null;
  showModal.value = true;
};

const editHouse = (house: any) => {
  editingHouse.value = house;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingHouse.value = null;
};

const handleSave = async (data: any) => {
  try {
    if (editingHouse.value) {
      await housesApi.update(editingHouse.value.id, data);
      showToast({ type: "success", message: "更新成功" });
    } else {
      await housesApi.create(data);
      showToast({ type: "success", message: "添加成功" });
    }
    closeModal();
    fetchHouses();
  } catch (error: any) {
    showToast({
      type: "fail",
      message: error.response?.data?.message || "操作失败",
    });
  }
};

const toggleStatus = async (house: any) => {
  const newStatus = house.status === "AVAILABLE" ? "RENTED" : "AVAILABLE";
  const action = newStatus === "RENTED" ? "出租" : "退租";
  try {
    await showDialog({
      title: "确认操作",
      message: `确定要将 "${house.title}" 标记为${action}吗？`,
      showCancelButton: true,
    });
    await housesApi.updateStatus(house.id, newStatus);
    showToast({ type: "success", message: "操作成功" });
    fetchHouses();
  } catch (error: any) {
    if (error !== "cancel") {
      showToast({
        type: "fail",
        message: error.response?.data?.message || "操作失败",
      });
    }
  }
};

const exportToCSV = () => {
  exporting.value = true;
  try {
    const data = houses.value;
    const rows = data.map((h) =>
      [
        h.title,
        h.address,
        h.area,
        h.rent,
        h.status === "AVAILABLE" ? "空置" : "已租",
      ]
        .map((v) => `"${v || ""}"`)
        .join(","),
    );

    const csvContent = ["标题,地址,面积,租金,状态", ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `房屋列表_${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
    showToast({ type: "success", message: "导出成功" });
  } catch (error) {
    showToast({ type: "fail", message: "导出失败" });
  } finally {
    exporting.value = false;
  }
};

onMounted(() => fetchHouses());
</script>

<style scoped lang="less">

.houses-page {
  padding: 12px;
  background: var(--bg-page);
  min-height: 100vh;
  padding-bottom: 60px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0 0;
  margin-bottom: 16px;
}

.page-info h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-secondary {
  background: white;
  color: var(--text-main);
  border: 2px solid var(--border-light);
}

.btn-secondary:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 18px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.toolbar-left > * {
  min-width: 0;
  flex: 1 1 auto;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  min-width: 0;
}

.search-box .search-input {
  min-width: 0;
  width: 100px;
}

.search-icon {
  font-size: 16px;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}

.filter-group {
  min-width: 0;
  flex: 1 1 auto;
}

.filter-select-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.filter-arrow {
  font-size: 10px;
  color: var(--text-secondary);
  margin-left: 8px;
}

/* 移动端响应式 */
@media (max-width: 640px) {
  .toolbar {
    padding: 10px 12px;
  }

  .toolbar-left {
    flex-wrap: wrap;
    width: 100%;
  }

  .search-box {
    flex: 1 1 100%;
    order: 1;
  }

  .filter-select-custom {
    flex: 0 0 auto;
    order: 2;
  }

  .btn-secondary {
    order: 3;
    width: 100%;
    margin-top: 4px;
  }

  .btn-secondary .btn-icon {
    display: none;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--primary-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.houses-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.house-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.card-header {
  margin-bottom: 16px;
}

.house-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 8px;
}

.tag-available {
  background: #dcfce7;
  color: #166534;
}

.tag-rented {
  background: #fef3c7;
  color: #92400e;
}

.house-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.card-body {
  margin-bottom: 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.info-icon {
  font-size: 16px;
}

.info-text {
  font-size: 14px;
  color: var(--text-main);
}

.info-highlight .info-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

.price-unit {
  font-size: 14px;
  font-weight: 400;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid var(--border-light);
}

.btn-action {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action:active {
  transform: scale(0.98);
}

.btn-edit {
  background: var(--primary-light);
  color: var(--primary);
}

.btn-rent {
  background: #dcfce7;
  color: #166534;
}

.btn-checkout {
  background: var(--accent-light);
  color: var(--accent);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  text-align: center;
  grid-column: 1 / -1;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 32px 0;
}

.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect:active {
  transform: scale(0.98);
}
</style>

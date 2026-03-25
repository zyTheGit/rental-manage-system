<template>
  <div class="payments-page">
    <div class="page-header">
      <div class="page-info">
        <h1 class="page-title">缴费记录</h1>
        <p class="page-subtitle">管理房租、水电费等缴费记录</p>
      </div>
      <button class="btn btn-primary ripple-effect" @click="openAddModal">
        <span class="btn-icon">➕</span>
        <span>添加记录</span>
      </button>
    </div>

    <PaymentFilters
      v-model="filters"
      :exporting="exporting"
      @export="exportToCSV"
      @startDateClick="showStartDatePicker = true"
      @endDateClick="showEndDatePicker = true"
      @typeClick="showTypePicker = true"
      @clearTenantFilter="clearTenantFilter"
    />

    <PaymentList
      :payments="filteredPayments"
      :loading="loading"
      @viewDetail="viewPaymentDetail"
      @edit="handleEdit"
      @delete="handleDelete"
      @add="openAddModal"
    />

    <DatePickerModal
      v-if="showStartDatePicker || showEndDatePicker"
      :title="'选择日期'"
      :show="showStartDatePicker || showEndDatePicker"
      @confirm="onDateConfirm"
      @cancel="closeDatePickers"
    />

    <PaymentFormModal
      v-if="showModal"
      :show="showModal"
      :tenants="tenants"
      :edit-data="editingPayment"
      @update:show="showModal = $event"
      @save="handleSave"
    />

    <PaymentDetailModal
      v-if="showDetailModal"
      :payment="selectedPayment"
      @close="showDetailModal = false"
      @share="handleShare"
    />

    <EditPaymentModal
      v-if="showEditModal"
      :payment="selectedPayment"
      @close="showEditModal = false"
      @save="confirmEdit"
    />

    <TenantPickerModal
      v-if="showTenantPicker"
      :show="showTenantPicker"
      :tenants="tenants"
      :selected-id="form.tenantId"
      @select="selectTenant"
      @confirm="confirmTenantWithSelection"
      @cancel="showTenantPicker = false"
    />

    <CommonPicker
      :show="showTypePicker"
      title="选择类型"
      :options="typeOptions"
      v-model="filters.type"
      @update:show="showTypePicker = $event"
      @change="onTypeChange"
    />

    <van-date-picker
      v-if="showDatePicker"
      v-model="datePickerValue"
      title="选择缴费时间"
      @confirm="confirmDatePicker"
      @cancel="showDatePicker = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast, showDialog } from "vant";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { paymentsApi, tenantsApi } from "@/api";
import PaymentFilters from "./components/PaymentFilters.vue";
import PaymentList from "./components/PaymentList.vue";
import DatePickerModal from "./components/DatePickerModal.vue";
import PaymentFormModal from "./components/PaymentFormModal.vue";
import PaymentDetailModal from "./components/PaymentDetailModal.vue";
import EditPaymentModal from "./components/EditPaymentModal.vue";
import TenantPickerModal from "./components/TenantPickerModal.vue";
import CommonPicker from "@/components/CommonPicker.vue";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const route = useRoute();
const router = useRouter();

const payments = ref<any[]>([]);
const tenants = ref<any[]>([]);
const loading = ref(false);
const exporting = ref(false);

const filters = reactive({
  searchText: "",
  type: "" as string,
  startDate: "",
  endDate: "",
  tenantId: null as number | null,
  tenantName: "",
});

const showModal = ref(false);
const showDetailModal = ref(false);
const showEditModal = ref(false);
const showTenantPicker = ref(false);
const showDatePicker = ref(false);
const showStartDatePicker = ref(false);
const showEndDatePicker = ref(false);
const showTypePicker = ref(false);

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'RENT', label: '房租' },
  { value: 'WATER', label: '水费' },
  { value: 'ELECTRIC', label: '电费' },
  { value: 'OTHER', label: '其他' },
];

const selectedPayment = ref<any>(null);
const editingPayment = ref<any>(null);

const form = reactive({
  tenantId: null as number | null,
  paidAt: new Date().toISOString(),
  remark: "",
});

const datePickerValue = ref([
  dayjs().format("YYYY"),
  dayjs().format("MM"),
  dayjs().format("DD"),
]);

const filteredPayments = computed(() => {
  let filtered = payments.value;
  if (filters.searchText) {
    const search = filters.searchText.toLowerCase();
    filtered = filtered.filter((p) =>
      p.tenant?.name.toLowerCase().includes(search),
    );
  }
  if (filters.tenantId) {
    filtered = filtered.filter((p) => p.tenantId === filters.tenantId);
  }
  if (filters.type) {
    filtered = filtered.filter((p) =>
      p.items?.some((item: any) => item.type === filters.type),
    );
  }
  if (filters.startDate && filters.endDate) {
    const start = dayjs(filters.startDate);
    const end = dayjs(filters.endDate);
    filtered = filtered.filter((p) => {
      const paidDate = dayjs(p.paidAt);
      return (
        paidDate.isSameOrAfter(start, "day") &&
        paidDate.isSameOrBefore(end, "day")
      );
    });
  }
  return filtered;
});

const fetchPayments = async () => {
  loading.value = true;
  try {
    const data = (await paymentsApi.getList()) as unknown as any[];
    payments.value = data;
    if (route.query.tenantId) {
      filters.tenantId = Number(route.query.tenantId);
      filters.tenantName = (route.query.tenantName as string) || "";
    }
  } catch (error) {
    showToast({ type: "fail", message: "获取缴费记录失败" });
  } finally {
    loading.value = false;
  }
};

const openAddModal = async () => {
  try {
    const data = (await tenantsApi.getList()) as unknown as any[];
    tenants.value = data;
    form.tenantId = null;
    form.paidAt = new Date().toISOString();
    form.remark = "";
    showModal.value = true;
  } catch (error) {
    showToast({ type: "fail", message: "获取租户列表失败" });
  }
};

const closeModal = () => {
  showModal.value = false;
};

const clearTenantFilter = () => {
  filters.tenantId = null;
  filters.tenantName = "";
  router.replace({ path: "/payments" });
};

const closeDatePickers = () => {
  showStartDatePicker.value = false;
  showEndDatePicker.value = false;
};

const onDateConfirm = ({ selectedValues }: any) => {
  const date = selectedValues.join("-");
  if (showStartDatePicker.value) {
    filters.startDate = date;
  } else {
    filters.endDate = date;
  }
  closeDatePickers();
};

const onTypeChange = (value: any) => {
  filters.type = value;
};

const selectTenant = (tenant: any) => {
  form.tenantId = tenant.id;
};

const confirmTenantWithSelection = () => {
  showTenantPicker.value = false;
};

const confirmDatePicker = () => {
  const date = dayjs(datePickerValue.value.join("-"));
  form.paidAt = date.toISOString();
  showDatePicker.value = false;
};

const handleSave = async (data: any) => {
  try {
    await paymentsApi.create(data);
    showToast({ type: "success", message: "添加成功" });
    closeModal();
    fetchPayments();
  } catch (error: any) {
    showToast({
      type: "fail",
      message: error.response?.data?.message || "添加失败",
    });
  }
};

const handleEdit = async (payment: any) => {
  try {
    const data = (await paymentsApi.getById(payment.id)) as unknown as any;
    selectedPayment.value = data;
    showEditModal.value = true;
  } catch (error) {
    showToast({ type: "fail", message: "获取详情失败" });
  }
};

const confirmEdit = async (data: any) => {
  try {
    await paymentsApi.update(selectedPayment.value.id, data);
    showToast({ type: "success", message: "更新成功" });
    showEditModal.value = false;
    fetchPayments();
  } catch (error: any) {
    showToast({
      type: "fail",
      message: error.response?.data?.message || "更新失败",
    });
  }
};

const handleDelete = async (payment: any) => {
  try {
    await showDialog({
      title: "确认删除",
      message: `确定要删除 "${payment.tenant?.name}" 的缴费记录吗？`,
      showCancelButton: true,
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
    await paymentsApi.delete(payment.id);
    showToast({ type: "success", message: "删除成功" });
    fetchPayments();
  } catch (error: any) {
    if (error !== "cancel") {
      showToast({
        type: "fail",
        message: error.response?.data?.message || "删除失败",
      });
    }
  }
};

const viewPaymentDetail = async (payment: any) => {
  try {
    const data = (await paymentsApi.getById(payment.id)) as unknown as any;
    selectedPayment.value = data;
    showDetailModal.value = true;
  } catch (error) {
    showToast({ type: "fail", message: "获取详情失败" });
  }
};

const handleShare = () => {
  if (!selectedPayment.value) return;
  const shareUrl = `${window.location.origin}/share/${selectedPayment.value.id}`;
  navigator.clipboard
    ?.writeText(shareUrl)
    .then(() => {
      showToast({ type: "success", message: "分享链接已复制" });
    })
    .catch(() => {
      showToast({ type: "success", message: "分享链接已复制" });
    });
};

const exportToCSV = () => {
  exporting.value = true;
  try {
    const data = filteredPayments.value;
    const rows: string[] = [];
    const typesMap: Record<string, string> = {
      RENT: "房租",
      WATER: "水费",
      ELECTRIC: "电费",
      OTHER: "其他",
    };

    data.forEach((payment) => {
      if (payment.items && payment.items.length > 0) {
        payment.items.forEach((item: any) => {
          rows.push(
            [
              payment.tenant?.name || "",
              payment.tenant?.house?.title || "",
              payment.paidAt
                ? dayjs(payment.paidAt).format("YYYY-MM-DD HH:mm")
                : "",
              typesMap[item.type] || item.type || "",
              item.amount || 0,
              payment.remark || "",
            ]
              .map((v) => `"${v || ""}"`)
              .join(","),
          );
        });
      } else {
        rows.push(
          [
            payment.tenant?.name || "",
            payment.tenant?.house?.title || "",
            payment.paidAt
              ? dayjs(payment.paidAt).format("YYYY-MM-DD HH:mm")
              : "",
            "",
            "",
            "",
          ]
            .map((v) => `"${v || ""}"`)
            .join(","),
        );
      }
    });

    const csvContent = ["租户,房号,缴费时间,缴费类型,金额,备注", ...rows].join(
      "\n",
    );
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `缴费记录_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.csv`;
    link.click();
    showToast({ type: "success", message: "导出成功" });
  } catch (error) {
    showToast({ type: "fail", message: "导出失败" });
  } finally {
    exporting.value = false;
  }
};

onMounted(() => fetchPayments());
</script>

<style scoped lang="less">

.payments-page {
  padding: 16px;
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
  line-height: 1.2;
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

.btn-icon {
  font-size: 18px;
}

.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect:active {
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .payments-page {
    padding: 12px;
  }
}
</style>

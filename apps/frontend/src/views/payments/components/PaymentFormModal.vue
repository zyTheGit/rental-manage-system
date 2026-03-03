<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    :close-on-click-overlay="false"
    @update:show="$emit('update:show', $event)"
  >
    <div class="modal-header">
      <h2 class="modal-title">{{ editData ? "编辑缴费" : "添加缴费" }}</h2>
      <button class="btn-close" @click="$emit('update:show', false)">✕</button>
    </div>

    <div class="modal-body">
      <div class="form-section">
        <div class="form-row" @click="showTenantPicker = true">
          <span class="form-label">租户</span>
          <span class="form-value">{{ tenantText || "点击选择 ›" }}</span>
        </div>
        <div class="form-row" @click="showDatePicker = true">
          <span class="form-label">缴费日期</span>
          <span class="form-value">{{ paidAtText || "点击选择 ›" }}</span>
        </div>
      </div>

      <div v-if="form.tenantId" class="fee-section">
        <div class="section-title">费用明细（勾选需要缴费的项目）</div>

        <div class="fee-item" :class="{ 'fee-selected': feeChecks.rent }">
          <div class="fee-header" @click="feeChecks.rent = !feeChecks.rent; toggleFee('rent');">
            <label class="fee-check-large" @click.stop>
              <input type="checkbox" v-model="feeChecks.rent" @change="toggleFee('rent')" />
              <span class="checkmark-large"></span>
            </label>
            <span class="fee-name">🏠 房租</span>
            <span v-if="feeChecks.rent" class="fee-amount-badge">¥{{ feeAmounts.rent || 0 }}</span>
          </div>
          <div v-if="feeChecks.rent" class="fee-input">
            <span class="currency">¥</span>
            <input v-model.number="feeAmounts.rent" type="number" placeholder="金额" />
          </div>
          <div v-if="feeChecks.rent && houseInfo.rent" class="fee-hint-row">
            <span class="fee-hint-text">参考价: ¥{{ houseInfo.rent }}/月</span>
          </div>
        </div>

        <div class="fee-item" :class="{ 'fee-selected': feeChecks.electric }">
          <div class="fee-header" @click="feeChecks.electric = !feeChecks.electric; toggleFee('electric');">
            <label class="fee-check-large" @click.stop>
              <input type="checkbox" v-model="feeChecks.electric" @change="toggleFee('electric')" />
              <span class="checkmark-large"></span>
            </label>
            <span class="fee-name">⚡ 电费</span>
            <span v-if="feeChecks.electric" class="fee-amount-badge">¥{{ feeAmounts.electric }}</span>
          </div>
          <div v-if="feeChecks.electric" class="fee-meter">
            <div class="meter-row">
              <span class="meter-label">上期读数</span>
              <span class="meter-value">{{ meterReads.lastElectricEndRead }}</span>
            </div>
            <div class="meter-row">
              <span class="meter-label">本期读数</span>
              <input
                v-model.number="meterReads.electricEndRead"
                type="number"
                class="meter-input"
                placeholder="输入"
                @input="calculateElectric"
                @blur="calculateElectric"
              />
            </div>
            <div class="meter-row">
              <span class="meter-label">用电量</span>
              <span class="meter-value highlight">{{ meterReads.electricUsage || 0 }} 度</span>
            </div>
            <div class="meter-row total">
              <span class="meter-label">电费金额</span>
              <span class="meter-value price">¥{{ feeAmounts.electric || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="fee-item" :class="{ 'fee-selected': feeChecks.water }">
          <div class="fee-header" @click="feeChecks.water = !feeChecks.water; toggleFee('water');">
            <label class="fee-check-large" @click.stop>
              <input type="checkbox" v-model="feeChecks.water" @change="toggleFee('water')" />
              <span class="checkmark-large"></span>
            </label>
            <span class="fee-name">💧 水费</span>
            <span v-if="feeChecks.water" class="fee-amount-badge">¥{{ feeAmounts.water }}</span>
          </div>
          <div v-if="feeChecks.water" class="fee-meter">
            <div class="meter-row">
              <span class="meter-label">上期读数</span>
              <span class="meter-value">{{ meterReads.lastWaterEndRead }}</span>
            </div>
            <div class="meter-row">
              <span class="meter-label">本期读数</span>
              <input
                v-model.number="meterReads.waterEndRead"
                type="number"
                class="meter-input"
                placeholder="输入"
                @input="calculateWater"
                @blur="calculateWater"
              />
            </div>
            <div class="meter-row">
              <span class="meter-label">用水量</span>
              <span class="meter-value highlight">{{ meterReads.waterUsage || 0 }} 吨</span>
            </div>
            <div class="meter-row total">
              <span class="meter-label">水费金额</span>
              <span class="meter-value price">¥{{ feeAmounts.water || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="fee-item" :class="{ 'fee-selected': feeChecks.other }">
          <div class="fee-header" @click="feeChecks.other = !feeChecks.other; toggleFee('other');">
            <label class="fee-check-large" @click.stop>
              <input type="checkbox" v-model="feeChecks.other" />
              <span class="checkmark-large"></span>
            </label>
            <span class="fee-name">📝 其他费用</span>
          </div>
          <div v-if="feeChecks.other" class="fee-other-content">
            <div class="fee-input-row">
              <span class="currency">¥</span>
              <input v-model.number="feeAmounts.other" type="number" class="fee-amount-input" placeholder="金额" />
            </div>
          </div>
        </div>

        <div class="summary-section">
          <div class="summary-row total">
            <span>费用合计</span>
            <span class="summary-grand">¥{{ currentTotal }}</span>
          </div>
        </div>

        <div class="form-section">
          <textarea v-model="form.remark" class="remark-input" placeholder="备注（选填）" rows="2"></textarea>
        </div>
      </div>

      <div v-if="!form.tenantId" class="empty-tenant">
        <span class="empty-icon">👆</span>
        <p>请先选择租户</p>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('update:show', false)">取消</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="!form.tenantId || currentTotalNum <= 0">
          确认缴费
        </button>
      </div>
    </div>

    <!-- 租户选择器 -->
    <van-popup v-model:show="showTenantPicker" position="bottom" round>
      <div class="picker-header">
        <span class="picker-title">选择租户</span>
        <button class="btn-close" @click="showTenantPicker = false">✕</button>
      </div>
      <div class="picker-options">
        <div
          v-for="tenant in tenants"
          :key="tenant.id"
          class="picker-option"
          :class="{ active: form.tenantId === tenant.id }"
          @click="handleSelectTenant(tenant)"
        >
          <span class="option-radio"></span>
          <div class="option-content">
            <div class="option-title">{{ tenant.name }}</div>
            <div class="option-subtitle">{{ tenant.house?.title || '' }} - {{ tenant.phone }}</div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="datePickerValue"
        title="选择缴费时间"
        @confirm="confirmDate"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { showToast } from "vant";
import dayjs from "dayjs";
import { tenantsApi, housesApi } from "@/api";
import type { Tenant } from "@/api/tenants";

const props = defineProps<{
  show: boolean;
  tenants: Tenant[];
  editData?: any;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  save: [data: any];
}>();

const form = reactive({
  tenantId: null as number | null,
  paidAt: new Date().toISOString(),
  remark: "",
});

const feeChecks = reactive({
  rent: false,
  electric: false,
  water: false,
  other: false,
});

const feeAmounts = reactive({
  rent: 0,
  electric: 0,
  water: 0,
  other: 0,
});

const meterReads = reactive({
  lastElectricEndRead: 0,
  lastWaterEndRead: 0,
  electricEndRead: 0,
  waterEndRead: 0,
  electricUsage: 0,
  waterUsage: 0,
});

const houseInfo = reactive({
  rent: 0,
  electricRate: 1,
  waterRate: 3,
});

const tenantText = ref("");
const paidAtText = ref(dayjs().format("YYYY-MM-DD HH:mm"));
const showTenantPicker = ref(false);
const showDatePicker = ref(false);
const datePickerValue = ref([
  dayjs().format("YYYY"),
  dayjs().format("MM"),
  dayjs().format("DD"),
]);

const currentTotal = computed(() => {
  let total = 0;
  if (feeChecks.rent) total += Number(feeAmounts.rent) || 0;
  if (feeChecks.electric) total += Number(feeAmounts.electric) || 0;
  if (feeChecks.water) total += Number(feeAmounts.water) || 0;
  if (feeChecks.other) total += Number(feeAmounts.other) || 0;
  return total.toFixed(2);
});

const currentTotalNum = computed(() => {
  let total = 0;
  if (feeChecks.rent) total += Number(feeAmounts.rent) || 0;
  if (feeChecks.electric) total += Number(feeAmounts.electric) || 0;
  if (feeChecks.water) total += Number(feeAmounts.water) || 0;
  if (feeChecks.other) total += Number(feeAmounts.other) || 0;
  return total;
});

const toggleFee = async (type: string) => {
  if (type === "rent" && feeChecks.rent) {
    feeAmounts.rent = houseInfo.rent || 0;
  }
};

const calculateElectric = () => {
  const start = meterReads.lastElectricEndRead || 0;
  const end = meterReads.electricEndRead;
  if (end === null || end === undefined || isNaN(Number(end))) {
    meterReads.electricUsage = 0;
    feeAmounts.electric = 0;
    return;
  }
  const endNum = Number(end);
  if (isNaN(endNum)) {
    meterReads.electricUsage = 0;
    feeAmounts.electric = 0;
    return;
  }
  meterReads.electricUsage = endNum - start;
  feeAmounts.electric = Number((meterReads.electricUsage * houseInfo.electricRate).toFixed(2));
};

const calculateWater = () => {
  const start = meterReads.lastWaterEndRead || 0;
  const end = meterReads.waterEndRead;
  if (end === null || end === undefined || isNaN(Number(end))) {
    meterReads.waterUsage = 0;
    feeAmounts.water = 0;
    return;
  }
  const endNum = Number(end);
  if (isNaN(endNum)) {
    meterReads.waterUsage = 0;
    feeAmounts.water = 0;
    return;
  }
  meterReads.waterUsage = endNum - start;
  feeAmounts.water = Number((meterReads.waterUsage * houseInfo.waterRate).toFixed(2));
};

const handleSelectTenant = async (tenant: any) => {
  form.tenantId = tenant.id;
  tenantText.value = `${tenant.name} - ${tenant.house?.title || ""}`;

  feeChecks.rent = false;
  feeChecks.electric = false;
  feeChecks.water = false;
  feeChecks.other = false;
  feeAmounts.rent = 0;
  feeAmounts.electric = 0;
  feeAmounts.water = 0;
  feeAmounts.other = 0;
  meterReads.electricEndRead = 0;
  meterReads.waterEndRead = 0;
  meterReads.electricUsage = 0;
  meterReads.waterUsage = 0;

  if (tenant.house?.id) {
    try {
      const house = (await housesApi.getById(tenant.house.id)) as any;
      houseInfo.rent = house.rent || 0;
      houseInfo.electricRate = house.electricRate || 1;
      houseInfo.waterRate = house.waterRate || 3;
      feeChecks.rent = true;
      feeAmounts.rent = house.rent || 0;
    } catch (error) {
      console.error("获取房屋配置失败", error);
    }
  }

  try {
    const lastReads = (await tenantsApi.getLastMeterReads(tenant.id)) as any;
    meterReads.lastElectricEndRead = lastReads.lastElectricEndRead || 0;
    meterReads.lastWaterEndRead = lastReads.lastWaterEndRead || 0;
  } catch (error) {
    console.error("获取上次读数失败", error);
  }

  showTenantPicker.value = false;
};

const confirmDate = () => {
  const date = dayjs(datePickerValue.value.join("-"));
  form.paidAt = date.toISOString();
  paidAtText.value = date.format("YYYY-MM-DD HH:mm");
  showDatePicker.value = false;
};

const handleSave = () => {
  if (!form.tenantId || currentTotalNum.value <= 0) {
    showToast({ type: "fail", message: "请选择租户并勾选至少一项费用" });
    return;
  }

  const items: any[] = [];
  if (feeChecks.rent) {
    items.push({ type: "RENT", amount: Number(feeAmounts.rent) || 0 });
  }
  if (feeChecks.electric) {
    const start = meterReads.lastElectricEndRead || 0;
    const end = Number(meterReads.electricEndRead) || 0;
    if (end < start) {
      showToast({ type: "fail", message: `电费结束读数不能小于起始读数 ${start}` });
      return;
    }
    items.push({
      type: "ELECTRIC",
      amount: Number(feeAmounts.electric) || 0,
      electricStartRead: start,
      electricEndRead: end,
      electricUsage: meterReads.electricUsage || 0,
    });
  }
  if (feeChecks.water) {
    const start = meterReads.lastWaterEndRead || 0;
    const end = Number(meterReads.waterEndRead) || 0;
    if (end < start) {
      showToast({ type: "fail", message: `水费结束读数不能小于起始读数 ${start}` });
      return;
    }
    items.push({
      type: "WATER",
      amount: Number(feeAmounts.water) || 0,
      waterStartRead: start,
      waterEndRead: end,
      waterUsage: meterReads.waterUsage || 0,
    });
  }
  if (feeChecks.other) {
    items.push({ type: "OTHER", amount: Number(feeAmounts.other) || 0 });
  }

  emit("save", {
    tenantId: form.tenantId,
    items,
    paidAt: form.paidAt,
    remark: form.remark,
    actualPaid: currentTotalNum.value,
  });
};

watch(
  () => props.show,
  (val) => {
    if (val) {
      form.tenantId = null;
      form.paidAt = new Date().toISOString();
      form.remark = "";
      tenantText.value = "";
      paidAtText.value = dayjs().format("YYYY-MM-DD HH:mm");
      feeChecks.rent = false;
      feeChecks.electric = false;
      feeChecks.water = false;
      feeChecks.other = false;
      feeAmounts.rent = 0;
      feeAmounts.electric = 0;
      feeAmounts.water = 0;
      feeAmounts.other = 0;
    }
  }
);
</script>

<style scoped>
@import "../../../styles/theme.css";

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
}

.modal-body {
  padding: 0 20px 20px;
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.form-section {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  cursor: pointer;
}

.form-row:active {
  background: var(--border-light);
}

.form-label {
  font-size: 15px;
  color: var(--text-main);
}

.form-value {
  font-size: 15px;
  color: var(--text-secondary);
}

.fee-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
  padding-top: 8px;
}

.fee-item {
  background: var(--bg-card);
  margin-bottom: 8px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid transparent;
}

.fee-item.fee-selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.fee-header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  gap: 12px;
}

.fee-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-main);
}

.fee-amount-badge {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
}

.fee-check-large {
  position: relative;
  width: 26px;
  height: 26px;
}

.fee-check-large input {
  opacity: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  cursor: pointer;
  z-index: 1;
}

.checkmark-large {
  position: absolute;
  top: 0;
  left: 0;
  width: 26px;
  height: 26px;
  border: 2px solid var(--border);
  border-radius: 6px;
  background: var(--bg-card);
}

.fee-check-large input:checked + .checkmark-large {
  background: var(--primary);
  border-color: var(--primary);
}

.fee-check-large input:checked + .checkmark-large::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
}

.fee-input {
  display: flex;
  align-items: center;
  padding: 0 16px 14px;
  gap: 8px;
}

.currency {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}

.fee-input input {
  flex: 1;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 16px;
}

.fee-hint-row {
  padding: 0 16px 14px;
}

.fee-hint-text {
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-input);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--primary);
}

.fee-meter {
  padding: 0 16px 14px;
}

.meter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.meter-row.total {
  border-top: 1px dashed var(--border-light);
  margin-top: 8px;
  padding-top: 12px;
}

.meter-label {
  color: var(--text-secondary);
}

.meter-value {
  color: var(--text-main);
  font-weight: 500;
}

.meter-value.highlight {
  color: var(--primary);
  font-weight: 600;
}

.meter-value.price {
  color: var(--accent);
  font-weight: 700;
  font-size: 16px;
}

.meter-input {
  width: 100px;
  padding: 6px 10px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 14px;
  text-align: right;
}

.fee-other-content {
  padding: 0 16px 14px;
}

.fee-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fee-amount-input {
  flex: 1;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 16px;
}

.summary-section {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.summary-row.total {
  border-top: 2px solid var(--primary);
  margin-top: 8px;
  padding-top: 12px;
}

.summary-grand {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.empty-tenant {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.remark-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 14px;
  resize: none;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-light);
}

.btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-secondary {
  background: var(--bg-input);
  color: var(--text-main);
}

/* 选择器样式 */
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.picker-options {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 20px;
}

.picker-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  cursor: pointer;
  border: 2px solid transparent;
}

.picker-option:hover {
  background: var(--bg-input);
}

.picker-option.active {
  border-color: var(--primary);
  background: var(--primary-light);
}

.option-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border);
  margin-right: 12px;
  flex-shrink: 0;
}

.picker-option.active .option-radio {
  border-color: var(--primary);
  position: relative;
}

.picker-option.active .option-radio::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
}

.option-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
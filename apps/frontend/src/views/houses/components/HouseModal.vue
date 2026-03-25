<template>
  <van-popup
    :show="show"
    @update:show="$emit('update:show', $event)"
    position="bottom"
    round
    class="modal-popup"
  >
    <div class="modal-header">
      <h2 class="modal-title">{{ house ? '编辑房屋' : '添加房屋' }}</h2>
      <button class="btn-close" @click="handleClose">✕</button>
    </div>

    <van-form @submit="handleSubmit" ref="formRef" class="form-content">
      <van-cell-group inset>
        <van-field
          v-model="form.title"
          label="标题"
          placeholder="请输入房屋标题"
          :rules="fieldValidators.title"
          required
        />

        <van-field
          v-model="form.address"
          label="地址"
          placeholder="请输入地址"
          :rules="fieldValidators.address"
          required
        />

        <van-field
          v-model.number="form.rent"
          type="number"
          label="租金 (元)"
          placeholder="请输入租金"
          :rules="fieldValidators.rent"
          required
        />

        <van-field
          v-model.number="form.deposit"
          type="number"
          label="押金 (元)"
          placeholder="请输入押金"
          :rules="fieldValidators.deposit"
        />

        <van-field
          v-model.number="form.area"
          type="number"
          label="面积 (㎡)"
          placeholder="请输入面积"
          :rules="fieldValidators.area"
          required
        />

        <van-field
          v-model="form.description"
          type="textarea"
          label="描述"
          rows="3"
          placeholder="请输入描述"
        />

        <van-cell title="水电表配置" class="section-title" />

        <div class="utility-row">
          <van-field
            v-model.number="form.waterInitialRead"
            type="number"
            label="水表初始"
            placeholder="请输入水表初始读数"
            class="utility-field"
          />
          <van-button 
            v-if="house" 
            size="small" 
            type="primary" 
            plain 
            class="fetch-btn"
            :loading="fetchingLastRead"
            @click="fetchLastRead"
          >
            获取上家读数
          </van-button>
        </div>

        <van-field
          v-model.number="form.electricInitialRead"
          type="number"
          label="电表初始"
          placeholder="请输入电表初始读数"
        />

        <van-field
          v-model.number="form.waterRate"
          type="number"
          label="水费单价"
          placeholder="请输入水费单价 (元/吨)"
        />

        <van-field
          v-model.number="form.electricRate"
          type="number"
          label="电费单价"
          placeholder="请输入电费单价 (元/度)"
        />
      </van-cell-group>

      <div class="form-footer">
        <button class="btn btn-secondary" @click="handleClose">取消</button>
        <button class="btn btn-primary" native-type="submit">确认</button>
      </div>
    </van-form>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { showToast } from 'vant'
import { fieldValidators } from '@/utils/validate'
import { housesApi } from '@/api'

const props = defineProps<{
  show: boolean
  house?: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
  (e: 'update:show', value: boolean): void
}>()

const formRef = ref()
const fetchingLastRead = ref(false)
const form = ref({
  title: '',
  address: '',
  rent: 0,
  deposit: 0,
  area: 0,
  description: '',
  waterInitialRead: 0,
  electricInitialRead: 0,
  waterRate: 0,
  electricRate: 0
})

const handleClose = () => {
  emit('update:show', false)
  emit('close')
}

const fetchLastRead = async () => {
  if (!props.house?.id) return
  
  fetchingLastRead.value = true
  try {
    const data = await housesApi.getByIdWithLastRead(props.house.id) as any
    form.value.waterInitialRead = data.lastWaterEndRead || 0
    form.value.electricInitialRead = data.lastElectricEndRead || 0
    showToast({ type: 'success', message: '已获取上家读数' })
  } catch (error) {
    showToast({ type: 'fail', message: '获取上家读数失败' })
  } finally {
    fetchingLastRead.value = false
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    emit('save', form.value)
  } catch (error) {
    return
  }
}

watch(() => props.show, (show) => {
  if (show) {
    if (props.house) {
      form.value = {
        ...props.house,
        waterInitialRead: props.house.waterInitialRead ?? 0,
        electricInitialRead: props.house.electricInitialRead ?? 0,
        waterRate: props.house.waterRate ?? 0,
        electricRate: props.house.electricRate ?? 0
      }
    } else {
      form.value = {
        title: '',
        address: '',
        rent: 0,
        deposit: 0,
        area: 0,
        description: '',
        waterInitialRead: 0,
        electricInitialRead: 0,
        waterRate: 0,
        electricRate: 0
      }
    }
  }
}, { immediate: true })
</script>

<style scoped lang="less">

.modal-popup {
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-card);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
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

.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  background: var(--bg-page);
}

:deep(.van-cell-group--inset) {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin: 0 16px;
}

.section-title {
  background: var(--bg-input);
  font-weight: 600;
  margin-top: 16px;
}

.utility-row {
  display: flex;
  align-items: center;
}

.utility-field {
  flex: 1;
}

.fetch-btn {
  margin-right: 16px;
  white-space: nowrap;
  font-size: 12px;
  padding: 0 8px;
  height: 28px;
}

.form-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
  background: var(--bg-card);
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

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-secondary {
  background: var(--bg-input);
  color: var(--text-main);
}
</style>

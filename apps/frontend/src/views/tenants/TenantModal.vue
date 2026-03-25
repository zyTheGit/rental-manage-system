<template>
  <van-popup
    :show="show"
    :close-on-click-overlay="false"
    round
    position="bottom"
    class="modal-popup"
    @update:show="emit('close')"
  >
    <div class="modal-header">
      <h2 class="modal-title">{{ tenant ? '编辑租户' : '添加租户' }}</h2>
      <button class="btn-close" @click="closeModal">✕</button>
    </div>

    <van-form @submit="handleSubmit" ref="formRef" class="form-content">
        <van-cell-group inset>
        <van-field
          v-model="form.name"
          name="name"
          label="姓名"
          placeholder="请输入姓名"
          :rules="[{ required: true, message: '请输入姓名' }]"
        />

        <van-field
          v-model="form.phone"
          name="phone"
          label="电话"
          type="tel"
          placeholder="请输入电话"
          :rules="[
            { required: true, message: '请输入电话' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
          ]"
        />

        <van-field
          v-model="form.idCard"
          name="idCard"
          label="身份证号"
          placeholder="请输入身份证号"
          :rules="[
            { required: true, message: '请输入身份证号' },
            { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入有效的身份证号' }
          ]"
        />

        <van-field
          v-model="houseText"
          readonly
          clickable
          name="house"
          label="选择房屋"
          placeholder="请选择房屋"
          @click="showHousePicker = true"
          :rules="[{ required: true, message: '请选择房屋' }]"
        />

         <div class="period-section">
           <div class="period-label">租期起止</div>
           <div class="period-row">
             <van-field
               v-model="form.rentStart"
               readonly
               clickable
               name="rentStart"
               placeholder="开始日期"
               @click="showStartDatePicker = true"
               :rules="[{ required: true, message: '请选择开始日期' }]"
             />
             <van-field
               v-model="form.rentEnd"
               readonly
               clickable
               name="rentEnd"
               placeholder="结束日期（选填）"
               @click="showEndDatePicker = true"
             />
          </div>
        </div>
        </van-cell-group>

      <div class="form-footer">
        <van-button round block type="primary" native-type="submit" class="btn-submit">
          保存
        </van-button>
      </div>
    </van-form>

    <van-popup v-model:show="showHousePicker" position="bottom" round>
      <van-picker
        :columns="houseOptions"
        @confirm="onHouseConfirm"
        @cancel="showHousePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showStartDatePicker" position="bottom" round>
      <van-date-picker
        v-model="startDateValue"
        @confirm="onStartDateConfirm"
        @cancel="showStartDatePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showEndDatePicker" position="bottom" round>
      <van-date-picker
        v-model="endDateValue"
        @confirm="onEndDateConfirm"
        @cancel="showEndDatePicker = false"
      />
    </van-popup>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{
  show: boolean
  tenant?: any
  availableHouses?: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
}>()

const formRef = ref()
const form = ref({
  name: '',
  phone: '',
  idCard: '',
  houseId: null as number | null,
  rentStart: '',
  rentEnd: ''
})

const showHousePicker = ref(false)
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)
const startDateValue = ref(['1970', '01', '01'])
const endDateValue = ref(['1970', '01', '01'])

const houseText = ref('')

const houseOptions = computed(() => {
  return (props.availableHouses || []).map(house => ({
    text: `${house.title} - ${house.address}`,
    value: house.id
  }))
})

const closeModal = () => {
  emit('close')
}

const handleSubmit = async () => {
  emit('save', form.value)
}

const onHouseConfirm = ({ selectedOptions }: any) => {
  const option = selectedOptions[0]
  form.value.houseId = option.value
  houseText.value = option.text
  showHousePicker.value = false
}

const onStartDateConfirm = ({ selectedValues }: any) => {
  form.value.rentStart = selectedValues.join('-')
  showStartDatePicker.value = false
}

const onEndDateConfirm = ({ selectedValues }: any) => {
  form.value.rentEnd = selectedValues.length ? selectedValues.join('-') : ''
  showEndDatePicker.value = false
}

watch(() => props.show, (show) => {
  if (show) {
    if (props.tenant) {
      const startDate = props.tenant.rentStart ? dayjs(props.tenant.rentStart) : dayjs()
      const endDate = props.tenant.rentEnd ? dayjs(props.tenant.rentEnd) : dayjs()

      form.value = {
        name: props.tenant.name,
        phone: props.tenant.phone,
        idCard: props.tenant.idCard,
        houseId: props.tenant.houseId,
        rentStart: startDate.format('YYYY-MM-DD'),
        rentEnd: endDate.format('YYYY-MM-DD')
      }
      startDateValue.value = [startDate.format('YYYY'), startDate.format('MM'), startDate.format('DD')]
      endDateValue.value = [endDate.format('YYYY'), endDate.format('MM'), endDate.format('DD')]

      if (props.tenant.house) {
        houseText.value = `${props.tenant.house.title} - ${props.tenant.house.address}`
      } else {
        houseText.value = ''
      }
    } else {
      const now = dayjs()
      const today = now.format('YYYY-MM-DD')
      const todayArray = [now.format('YYYY'), now.format('MM'), now.format('DD')]

      form.value = {
        name: '',
        phone: '',
        idCard: '',
        houseId: null,
        rentStart: today,
        rentEnd: ''
      }
      houseText.value = ''
      startDateValue.value = todayArray
      endDateValue.value = todayArray
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
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: var(--accent-light);
  color: var(--accent);
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

.form-footer {
  padding: 16px 24px 24px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
}

.btn-submit {
  font-weight: 600;
  padding: 12px;
}

.period-section {
  margin: 16px 0;
  padding: 0 16px;
}

.period-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 8px;
}

.period-row {
  display: flex;
  gap: 8px;
}
</style>

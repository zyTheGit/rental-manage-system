<template>
  <div class="payments-page">
    <!-- 页面头部：标题 + 新增按钮 -->
    <div class="page-header">
      <div class="page-info">
        <h1 class="page-title">缴费记录</h1>
        <p class="page-subtitle">管理房租、水电费等缴费记录</p>
      </div>
      <button class="btn btn-primary ripple-effect" @click="fetchTenants">
        <span class="btn-icon">➕</span>
        <span>添加记录</span>
      </button>
    </div>

    <div v-if="filters.tenantId" class="tenant-filter-bar">
      <span class="filter-label">当前筛选租户:</span>
      <span class="filter-value">{{ filters.tenantName }}</span>
      <button class="btn-clear" @click="clearTenantFilter">✕ 清除</button>
    </div>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="filters.searchText"
            type="text"
            class="search-input"
            placeholder="搜索租户姓名..."
          />
        </div>
        <div class="filter-group">
          <select v-model="filters.type" class="filter-select">
            <option :value="null">全部类型</option>
            <option value="RENT">房租</option>
            <option value="WATER">水费</option>
            <option value="ELECTRIC">电费</option>
            <option value="OTHER">其他</option>
          </select>
        </div>
      </div>
      <button class="btn btn-secondary ripple-effect" @click="exportToCSV" :disabled="exporting">
        <span class="btn-icon">📥</span>
        <span>{{ exporting ? '导出中...' : '导出' }}</span>
      </button>
    </div>

    <!-- 日期范围 -->
    <div class="date-range-bar">
      <div class="date-field" @click="showStartDatePicker = true">
        <span class="date-value">{{ filters.startDate || '开始日期' }}</span>
        <span class="date-icon">📅</span>
      </div>
      <span class="date-separator">→</span>
      <div class="date-field" @click="showEndDatePicker = true">
        <span class="date-value">{{ filters.endDate || '结束日期' }}</span>
        <span class="date-icon">📅</span>
      </div>
    </div>

    <!-- 缴费列表 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="payments-list">
      <div
        v-for="payment in filteredPayments"
        :key="payment.id"
        class="payment-card"
        @click="viewPaymentDetail(payment)"
      >
        <div class="card-header">
          <div class="payment-info">
            <h3 class="tenant-name">{{ payment.tenant?.name || '-' }}</h3>
            <span class="payment-time">{{ formatPaymentTime(payment.paidAt) }}</span>
          </div>
          <div class="price-section">
            <span class="price">¥{{ formatCurrency(payment.amount || 0, '') }}</span>
          </div>
        </div>

        <div class="card-body">
          <div class="payment-items">
            <span
              v-for="(item, index) in payment.items?.slice(0, 3)"
              :key="index"
              class="payment-item-tag"
              :class="getItemClass(item.type)"
            >
              {{ getTypeLabel(item.type) }} ¥{{ item.amount }}
            </span>
            <span v-if="payment.items?.length > 3" class="more-tag">
              +{{ payment.items.length - 3 }}
            </span>
          </div>
          <div v-if="payment.remark" class="payment-remark">{{ payment.remark }}</div>
        </div>

        <div class="card-actions" @click.stop>
          <button class="btn-action btn-edit" @click="handleEdit(payment)">编辑</button>
          <button class="btn-action btn-delete-action" @click="handleDelete(payment)">删除</button>
        </div>
      </div>

      <div v-if="filteredPayments.length === 0" class="empty-state">
        <span class="empty-icon">💰</span>
        <p class="empty-text">暂无缴费记录</p>
        <button class="btn btn-primary" @click="fetchTenants">
          添加第一笔缴费
        </button>
      </div>
    </div>

    <!-- 日期选择弹框 -->
    <div v-if="showStartDatePicker || showEndDatePicker" class="modal-overlay" @click.self="closeDatePickers">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn btn-outline btn-sm" @click="closeDatePickers">取消</button>
          <h3 class="picker-title">选择日期</h3>
          <button class="btn btn-primary btn-sm" @click="closeDatePickers">确认</button>
        </div>
        <van-date-picker
          :model-value="currentDateValue"
          @confirm="onDateConfirm"
          @cancel="closeDatePickers"
        />
      </div>
    </div>

    <!-- 缴费弹框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content slide-in-bottom payment-modal-new">
        <div class="modal-header">
          <h2 class="modal-title">添加缴费</h2>
          <button class="btn-close ripple-effect" @click="closeModal">✕</button>
        </div>
        <div class="modal-body modal-scroll">
          <!-- 选择租户 -->
          <div class="form-section">
            <div class="form-row" @click="showTenantPicker = true">
              <span class="form-label">租户</span>
              <span class="form-value">{{ tenantText || '点击选择 ›' }}</span>
            </div>
            <div class="form-row" @click="showDatePicker = true">
              <span class="form-label">缴费日期</span>
              <span class="form-value">{{ paidAtText?.split(' ')[0] || '点击选择 ›' }}</span>
            </div>
          </div>

          <!-- 费用明细 -->
          <div v-if="form.tenantId" class="fee-section">
            <div class="section-title">费用明细（勾选需要缴费的项目）</div>
            
            <!-- 房租 -->
            <div class="fee-item" :class="{ 'fee-selected': feeChecks.rent }">
              <div class="fee-header" @click="feeChecks.rent = !feeChecks.rent; toggleFee('rent')">
                <label class="fee-check-large">
                  <input type="checkbox" v-model="feeChecks.rent" @change="toggleFee('rent')" />
                  <span class="checkmark-large"></span>
                </label>
                <span class="fee-name">🏠 房租</span>
                <span v-if="feeChecks.rent" class="fee-amount-badge">¥{{ feeAmounts.rent || 0 }}</span>
              </div>
              <div v-if="feeChecks.rent" class="fee-input">
                <span class="currency">¥</span>
                <input v-model.number="feeAmounts.rent" type="number" placeholder="金额" @input="calculateTotal" />
              </div>
              <div v-if="feeChecks.rent && houseInfo.rent" class="fee-hint-row">
                <span class="fee-hint-text">参考价: ¥{{ houseInfo.rent }}/月</span>
              </div>
            </div>

            <!-- 电费 -->
            <div class="fee-item" :class="{ 'fee-selected': feeChecks.electric }">
              <div class="fee-header" @click="feeChecks.electric = !feeChecks.electric">
                <label class="fee-check-large">
                  <input type="checkbox" v-model="feeChecks.electric" @change="toggleFee('electric')" />
                  <span class="checkmark-large"></span>
                </label>
                <span class="fee-name">⚡ 电费</span>
                <span v-if="feeChecks.electric && feeAmounts.electric" class="fee-amount-badge">¥{{ feeAmounts.electric }}</span>
              </div>
              <div v-if="feeChecks.electric" class="fee-meter" @click.stop>
                <div class="meter-row">
                  <span class="meter-label">上期读数</span>
                  <span class="meter-value">{{ meterReads.lastElectricEndRead || houseInfo.electricInitialRead || 0 }}</span>
                </div>
                <div class="meter-row">
                  <span class="meter-label">本期读数</span>
                  <input v-model.number="meterReads.electricEndRead" type="number" class="meter-input" placeholder="输入" @input="onElectricInput" />
                </div>
                <div class="meter-row">
                  <span class="meter-label">用电量</span>
                  <span class="meter-value highlight">{{ meterReads.electricUsage || 0 }} 度</span>
                </div>
                <div class="meter-row">
                  <span class="meter-label">单价</span>
                  <span class="meter-value">¥{{ houseInfo.electricRate || 1 }}/度</span>
                </div>
                <div class="meter-row total">
                  <span class="meter-label">电费金额</span>
                  <span class="meter-value price">¥{{ feeAmounts.electric || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- 水费 -->
            <div class="fee-item" :class="{ 'fee-selected': feeChecks.water }">
              <div class="fee-header" @click="feeChecks.water = !feeChecks.water">
                <label class="fee-check-large">
                  <input type="checkbox" v-model="feeChecks.water" @change="toggleFee('water')" />
                  <span class="checkmark-large"></span>
                </label>
                <span class="fee-name">💧 水费</span>
                <span v-if="feeChecks.water && feeAmounts.water" class="fee-amount-badge">¥{{ feeAmounts.water }}</span>
              </div>
              <div v-if="feeChecks.water" class="fee-meter" @click.stop>
                <div class="meter-row">
                  <span class="meter-label">上期读数</span>
                  <span class="meter-value">{{ meterReads.lastWaterEndRead || houseInfo.waterInitialRead || 0 }}</span>
                </div>
                <div class="meter-row">
                  <span class="meter-label">本期读数</span>
                  <input v-model.number="meterReads.waterEndRead" type="number" class="meter-input" placeholder="输入" @input="onWaterInput" />
                </div>
                <div class="meter-row">
                  <span class="meter-label">用水量</span>
                  <span class="meter-value highlight">{{ meterReads.waterUsage || 0 }} 吨</span>
                </div>
                <div class="meter-row">
                  <span class="meter-label">单价</span>
                  <span class="meter-value">¥{{ houseInfo.waterRate || 3 }}/吨</span>
                </div>
                <div class="meter-row total">
                  <span class="meter-label">水费金额</span>
                  <span class="meter-value price">¥{{ feeAmounts.water || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- 其他费用 -->
            <div class="fee-item" :class="{ 'fee-selected': feeChecks.other }">
              <div class="fee-header" @click="feeChecks.other = !feeChecks.other">
                <label class="fee-check-large">
                  <input type="checkbox" v-model="feeChecks.other" @change="toggleFee('other')" />
                  <span class="checkmark-large"></span>
                </label>
                <span class="fee-name">📝 其他费用</span>
                <span v-if="feeChecks.other && feeAmounts.other" class="fee-amount-badge">¥{{ feeAmounts.other }}</span>
              </div>
              <div v-if="feeChecks.other" class="fee-other-content" @click.stop>
                <div class="fee-input-row">
                  <span class="currency">¥</span>
                  <input v-model.number="feeAmounts.other" type="number" class="fee-amount-input" placeholder="金额" @input="calculateTotal" />
                </div>
                <input v-model="feeRemark.other" type="text" class="fee-remark-input" placeholder="备注说明（选填）" />
              </div>
            </div>

            <!-- 上次欠费 -->
            <div v-if="form.previousBalance !== 0" class="fee-item balance-item">
              <div class="fee-header">
                <span class="fee-name">{{ form.previousBalance > 0 ? '⚠️ 上次欠费' : '✅ 上次结余' }}</span>
              </div>
              <div class="fee-input">
                <span class="currency" :class="{ 'text-danger': form.previousBalance > 0, 'text-success': form.previousBalance < 0 }">
                  {{ form.previousBalance > 0 ? '+' : '' }}¥{{ Math.abs(form.previousBalance).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="empty-tenant">
            <span class="empty-icon">👆</span>
            <p>请先选择租户</p>
          </div>

          <!-- 汇总 -->
          <div v-if="form.tenantId" class="summary-section">
            <div class="summary-row">
              <span>本期费用</span>
              <span class="summary-value">¥{{ currentTotal }}</span>
            </div>
            <div v-if="form.previousBalance !== 0" class="summary-row">
              <span>{{ form.previousBalance > 0 ? '上次欠费' : '上次结余' }}</span>
              <span class="summary-value" :class="{ 'text-danger': form.previousBalance > 0, 'text-success': form.previousBalance < 0 }">
                {{ form.previousBalance > 0 ? '+' : '' }}¥{{ form.previousBalance.toFixed(2) }}
              </span>
            </div>
            <div class="summary-row total">
              <span>应缴金额</span>
              <span class="summary-grand">¥{{ grandTotal }}</span>
            </div>
            <div class="summary-row">
              <span>实缴金额</span>
              <div class="paid-input">
                <span class="currency">¥</span>
                <input v-model.number="form.actualPaid" type="number" placeholder="输入实缴金额" @input="calculateBalance" />
              </div>
            </div>
            <div class="summary-row" :class="{ 'text-danger': newBalance > 0, 'text-success': newBalance < 0 }">
              <span>{{ newBalance > 0 ? '剩余欠费' : newBalance < 0 ? '找零' : '已结清' }}</span>
              <span v-if="newBalance !== 0">¥{{ Math.abs(newBalance).toFixed(2) }}</span>
            </div>
          </div>

          <!-- 备注 -->
          <div v-if="form.tenantId" class="form-section">
            <textarea v-model="form.remark" class="remark-input" placeholder="备注（选填）" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="handleSave" :disabled="!form.tenantId || currentTotal <= 0">确认缴费</button>
        </div>
      </div>
    </div>

    <!-- 详情弹框 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="detail-modal slide-in-bottom">
        <div class="detail-header">
          <h2 class="detail-title">缴费详情</h2>
          <button class="btn-close ripple-effect" @click="showDetailModal = false">✕</button>
        </div>
        <div v-if="selectedPayment" class="detail-content modal-scroll">
          <div class="detail-row">
            <span class="detail-label">租户:</span>
            <span class="detail-value">{{ selectedPayment.tenant?.name }} - {{ selectedPayment.tenant?.house?.title }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">缴费时间:</span>
            <span class="detail-value">{{ formatPaymentTime(selectedPayment.paidAt) }}</span>
          </div>
          <div class="detail-row emphasis">
            <span class="detail-label">总金额:</span>
            <span class="detail-value price">¥{{ formatCurrency(selectedPayment.amount || 0, '') }}</span>
          </div>

          <div v-if="selectedPayment.items && selectedPayment.items.length > 0" class="items-section">
            <div class="section-title">缴费项目</div>
            <div class="items-list">
              <div
                v-for="(item, index) in selectedPayment.items"
                :key="index"
                class="item-detail"
              >
                <span class="item-tag" :class="getItemClass(item.type)">
                  {{ getTypeLabel(item.type) }}
                </span>
                <span class="item-amount">¥{{ item.amount }}</span>
                  <div v-if="item.type === 'ELECTRIC'" class="meter-detail">
                    电表: {{ item.electricStartRead || 0 }} → {{ item.electricEndRead || 0 }} = {{ item.electricUsage || 0 }}度
                </div>
                <div v-if="item.type === 'WATER'" class="meter-detail">
                    水表: {{ item.waterStartRead || 0 }} → {{ item.waterEndRead || 0 }} = {{ item.waterUsage || 0 }}吨
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedPayment.remark" class="detail-row">
            <span class="detail-label">备注:</span>
            <span class="detail-value">{{ selectedPayment.remark }}</span>
          </div>
        </div>
        <div class="detail-footer">
          <button class="btn btn-secondary ripple-effect" @click="showDetailModal = false">关闭</button>
          <button class="btn btn-primary ripple-effect" @click="handleShare">
            <span class="btn-icon">📤</span>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑弹框 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content slide-in-bottom payment-modal-new">
        <div class="modal-header">
          <h2 class="modal-title">编辑缴费记录</h2>
          <button class="btn-close ripple-effect" @click="showEditModal = false">✕</button>
        </div>
        <div class="detail-content modal-scroll">
          <div class="detail-row">
            <span class="detail-label">租户:</span>
            <span class="detail-value">{{ selectedPayment?.tenant?.name }} - {{ selectedPayment?.tenant?.house?.title }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">缴费日期:</span>
            <div @click="showEditDatePicker = true" class="selector-field">
              <span>{{ editForm.paidAtText || '点击选择' }}</span>
              <span class="selector-arrow">›</span>
            </div>
          </div>
          
          <!-- 编辑费用明细 -->
          <div v-if="editForm.tenantId" class="fee-section">
            <div class="section-title">费用明细（勾选需要缴费的项目）</div>
            
            <!-- 房租 -->
            <div class="fee-item" :class="{ 'fee-selected': editFeeChecks.rent }">
              <div class="fee-header" @click="toggleEditFee('rent')">
                <label class="fee-check-large">
                  <input type="checkbox" v-model="editFeeChecks.rent" @change="toggleEditFee('rent')" />
                  <span class="checkmark-large"></span>
                </label>
                <span class="fee-name">🏠 房租</span>
                <span v-if="editFeeChecks.rent" class="fee-amount-badge">¥{{ editFeeAmounts.rent || 0 }}</span>
              </div>
              <div v-if="editFeeChecks.rent" class="fee-input">
                <span class="currency">¥</span>
                <input v-model.number="editFeeAmounts.rent" type="number" placeholder="金额" @input="calculateEditTotal" />
              </div>
            </div>

            <!-- 电费 -->
            <div class="fee-item" :class="{ 'fee-selected': editFeeChecks.electric }">
              <div class="fee-header" @click="toggleEditFee('electric')">
                <label class="fee-check-large">
                  <input type="checkbox" v-model="editFeeChecks.electric" @change="toggleEditFee('electric')" />
                  <span class="checkmark-large"></span>
                </label>
                <span class="fee-name">⚡ 电费</span>
                <span v-if="editFeeChecks.electric && editFeeAmounts.electric" class="fee-amount-badge">¥{{ editFeeAmounts.electric }}</span>
              </div>
              <div v-if="editFeeChecks.electric" class="fee-meter">
                <div class="meter-row">
                  <span class="meter-label">上期读数</span>
                  <span class="meter-value">{{ editMeterReads.lastElectricEndRead || 0 }}</span>
                </div>
                <div class="meter-row">
                  <span class="meter-label">本期读数</span>
                  <input v-model.number="editMeterReads.electricEndRead" type="number" class="meter-input" placeholder="输入" @input="calculateEditElectric" />
                </div>
                <div class="meter-row">
                  <span class="meter-label">用电量</span>
                  <span class="meter-value highlight">{{ editMeterReads.electricUsage || 0 }} 度</span>
                </div>
                <div class="meter-row total">
                  <span class="meter-label">电费金额</span>
                  <span class="meter-value price">¥{{ editFeeAmounts.electric || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- 水费 -->
            <div class="fee-item" :class="{ 'fee-selected': editFeeChecks.water }">
              <div class="fee-header" @click="toggleEditFee('water')">
                <label class="fee-check-large">
                  <input type="checkbox" v-model="editFeeChecks.water" @change="toggleEditFee('water')" />
                  <span class="checkmark-large"></span>
                </label>
                <span class="fee-name">💧 水费</span>
                <span v-if="editFeeChecks.water && editFeeAmounts.water" class="fee-amount-badge">¥{{ editFeeAmounts.water }}</span>
              </div>
              <div v-if="editFeeChecks.water" class="fee-meter">
                <div class="meter-row">
                  <span class="meter-label">上期读数</span>
                  <span class="meter-value">{{ editMeterReads.lastWaterEndRead || 0 }}</span>
                </div>
                <div class="meter-row">
                  <span class="meter-label">本期读数</span>
                  <input v-model.number="editMeterReads.waterEndRead" type="number" class="meter-input" placeholder="输入" @input="calculateEditWater" />
                </div>
                <div class="meter-row">
                  <span class="meter-label">用水量</span>
                  <span class="meter-value highlight">{{ editMeterReads.waterUsage || 0 }} 吨</span>
                </div>
                <div class="meter-row total">
                  <span class="meter-label">水费金额</span>
                  <span class="meter-value price">¥{{ editFeeAmounts.water || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- 其他费用 -->
            <div class="fee-item" :class="{ 'fee-selected': editFeeChecks.other }">
              <div class="fee-header" @click="toggleEditFee('other')">
                <label class="fee-check-large">
                  <input type="checkbox" v-model="editFeeChecks.other" @change="toggleEditFee('other')" />
                  <span class="checkmark-large"></span>
                </label>
                <span class="fee-name">📝 其他费用</span>
                <span v-if="editFeeChecks.other && editFeeAmounts.other" class="fee-amount-badge">¥{{ editFeeAmounts.other }}</span>
              </div>
              <div v-if="editFeeChecks.other" class="fee-other-content">
                <div class="fee-input-row">
                  <span class="currency">¥</span>
                  <input v-model.number="editFeeAmounts.other" type="number" class="fee-amount-input" placeholder="金额" @input="calculateEditTotal" />
                </div>
              </div>
            </div>

            <!-- 汇总 -->
            <div class="summary-section">
              <div class="summary-row total">
                <span>费用合计</span>
                <span class="summary-grand">¥{{ editCurrentTotal }}</span>
              </div>
            </div>
          </div>

          <div class="detail-row">
            <span class="detail-label">备注:</span>
            <textarea v-model="editForm.remark" class="edit-input" rows="2" placeholder="备注（选填）"></textarea>
          </div>
        </div>
        <div class="detail-footer">
          <button class="btn btn-secondary ripple-effect" @click="showEditModal = false">取消</button>
          <button class="btn btn-primary ripple-effect" @click="confirmEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- 编辑日期选择弹框 -->
    <div v-if="showEditDatePicker" class="modal-overlay" @click.self="showEditDatePicker = false">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn btn-outline btn-sm" @click="showEditDatePicker = false">取消</button>
          <h3 class="picker-title">选择缴费时间</h3>
          <button class="btn btn-primary btn-sm" @click="confirmEditDatePicker">确认</button>
        </div>
        <van-date-picker
          v-model="editDatePickerValue"
          :show-toolbar="false"
        />
      </div>
    </div>

    <!-- 租户选择弹框 -->
    <div v-if="showTenantPicker" class="modal-overlay" @click.self="showTenantPicker = false">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn btn-outline btn-sm" @click="showTenantPicker = false">取消</button>
          <h3 class="picker-title">选择租户</h3>
          <button class="btn btn-primary btn-sm" @click="confirmTenantWithSelection">确认</button>
        </div>
        <div class="picker-options">
          <div
            v-for="tenant in tenants"
            :key="tenant.id"
            class="picker-option"
            :class="{ active: form.tenantId === tenant.id }"
            @click="selectTenant(tenant)"
          >
            <span class="option-radio"></span>
            <div class="option-content">
              <div class="option-title">{{ tenant.name }}</div>
              <div class="option-subtitle">{{ tenant.house?.title || '' }} - {{ tenant.phone }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 类型选择弹框 -->
    <div v-if="showTypePicker" class="modal-overlay" @click.self="showTypePicker = false">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn btn-outline btn-sm" @click="showTypePicker = false">取消</button>
          <h3 class="picker-title">选择类型</h3>
          <button class="btn btn-primary btn-sm" @click="confirmTypeWithSelection">确认</button>
        </div>
        <div class="picker-options">
          <div
            v-for="option in typeOptions"
            :key="option.value"
            class="picker-option"
            :class="{ active: form.items[selectedItemIndex]?.type === option.value }"
            @click="selectType(option)"
          >
            <span class="option-radio"></span>
            <span class="option-text">{{ option.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 缴费时间选择弹框 -->
    <div v-if="showDatePicker" class="modal-overlay" @click.self="showDatePicker = false">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn-link" @click="showDatePicker = false">取消</button>
          <h3 class="picker-title">选择缴费时间</h3>
          <button class="btn-link btn-primary" @click="confirmDatePicker">确认</button>
        </div>
        <van-date-picker
          v-model="datePickerValue"
          :show-toolbar="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type TagType, showToast, showLoadingToast, closeToast, showDialog } from 'vant'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { DatePicker as VanDatePicker } from 'vant'
import { paymentsApi } from '@/api'
import { tenantsApi, housesApi } from '@/api'
import { formatCurrency } from '@/utils/helpers'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const route = useRoute()
const router = useRouter()

const payments = ref<any[]>([])
const tenants = ref<any[]>([])
const showModal = ref(false)
const showDetailModal = ref(false)
const showTenantPicker = ref(false)
const showTypePicker = ref(false)
const showDatePicker = ref(false)
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)
const currentDateValue = ref(['2024', '01', '01'])
const exporting = ref(false)
const loading = ref(false)
const selectedItemIndex = ref(0)

const filters = ref({
  searchText: '',
  type: null as string | null,
  startDate: '',
  endDate: '',
  tenantId: null as number | null,
  tenantName: ''
})

interface PaymentFormItem {
  type: string
  typeText: string
  amount: number
  electricStartRead?: number
  electricEndRead?: number
  electricUsage?: number
  electricRate?: number
  waterStartRead?: number
  waterEndRead?: number
  waterUsage?: number
  waterRate?: number
}

const form = ref({
  tenantId: null as number | null,
  items: [] as PaymentFormItem[],
  paidAt: new Date().toISOString(),
  remark: '',
  previousBalance: 0,
  actualPaid: 0
})

// 新增费用相关的响应式变量
const feeChecks = ref({
  rent: false,
  electric: false,
  water: false,
  other: false
})

const feeAmounts = ref({
  rent: 0,
  electric: 0,
  water: 0,
  other: 0
})

const feeRemark = ref({
  other: ''
})

const meterReads = ref({
  lastElectricEndRead: 0,
  lastWaterEndRead: 0,
  electricEndRead: 0,
  waterEndRead: 0,
  electricUsage: 0,
  waterUsage: 0
})

const houseInfo = ref({
  rent: 0,
  electricRate: 1,
  waterRate: 3,
  electricInitialRead: 0,
  waterInitialRead: 0
})

const tenantText = ref('')
const paidAtText = ref('')
const datePickerValue = ref([dayjs().format('YYYY'), dayjs().format('MM'), dayjs().format('DD')])

const typeOptions = [
  { text: '房租', value: 'RENT', icon: '🏠' },
  { text: '水费', value: 'WATER', icon: '💧' },
  { text: '电费', value: 'ELECTRIC', icon: '⚡' },
  { text: '其他', value: 'OTHER', icon: '📝' }
]

const typesMap: Record<string, { label: string; tagType: TagType | 'default' }> = {
  RENT: { label: '房租', tagType: 'success' },
  WATER: { label: '水费', tagType: 'primary' },
  ELECTRIC: { label: '电费', tagType: 'warning' },
  OTHER: { label: '其他', tagType: 'default' }
}

const selectedPayment = ref<any>(null)

const showEditModal = ref(false)
const showEditDatePicker = ref(false)
const editForm = ref({
  tenantId: null as number | null,
  paidAt: '',
  paidAtText: '',
  remark: ''
})

const editFeeChecks = ref({
  rent: false,
  electric: false,
  water: false,
  other: false
})

const editFeeAmounts = ref({
  rent: 0,
  electric: 0,
  water: 0,
  other: 0
})

const editMeterReads = ref({
  lastElectricEndRead: 0,
  lastWaterEndRead: 0,
  electricEndRead: 0,
  waterEndRead: 0,
  electricUsage: 0,
  waterUsage: 0
})

const editDatePickerValue = ref([dayjs().format('YYYY'), dayjs().format('MM'), dayjs().format('DD')])

const editCurrentTotal = computed(() => {
  let total = 0
  if (editFeeChecks.value.rent) total += Number(editFeeAmounts.value.rent) || 0
  if (editFeeChecks.value.electric) total += Number(editFeeAmounts.value.electric) || 0
  if (editFeeChecks.value.water) total += Number(editFeeAmounts.value.water) || 0
  if (editFeeChecks.value.other) total += Number(editFeeAmounts.value.other) || 0
  return total.toFixed(2)
})

const getTypeLabel = (type: string) => typesMap[type]?.label || type || '-'

const getItemClass = (type: string) => {
  const tagType = typesMap[type]?.tagType || 'default'
  return `tag-${tagType}`
}

const formatPaymentTime = (paidAt: string) => {
  return dayjs(paidAt).format('YYYY-MM-DD HH:mm')
}

const filteredPayments = computed(() => {
  let filtered = payments.value
  if (filters.value.searchText) {
    const search = filters.value.searchText.toLowerCase()
    filtered = filtered.filter((p) =>
      p.tenant?.name.toLowerCase().includes(search)
    )
  }
  if (filters.value.tenantId) {
    filtered = filtered.filter((p) => p.tenantId === filters.value.tenantId)
  }
  if (filters.value.type) {
    filtered = filtered.filter((p) =>
      p.items?.some((item: any) => item.type === filters.value.type)
    )
  }
  if (filters.value.startDate && filters.value.endDate) {
    const start = dayjs(filters.value.startDate)
    const end = dayjs(filters.value.endDate)
    filtered = filtered.filter((p) => {
      const paidDate = dayjs(p.paidAt)
      return paidDate.isSameOrAfter(start, 'day') && paidDate.isSameOrBefore(end, 'day')
    })
  }
  return filtered
})

const currentTotal = computed(() => {
  let total = 0
  if (feeChecks.value.rent) total += Number(feeAmounts.value.rent) || 0
  if (feeChecks.value.electric) total += Number(feeAmounts.value.electric) || 0
  if (feeChecks.value.water) total += Number(feeAmounts.value.water) || 0
  if (feeChecks.value.other) total += Number(feeAmounts.value.other) || 0
  return total
})

const grandTotal = computed(() => {
  return (Number(currentTotal.value) + (form.value.previousBalance || 0)).toFixed(2)
})

const newBalance = computed(() => {
  return Number(grandTotal.value) - (form.value.actualPaid || 0)
})

const toggleFee = (type: string) => {
  if (type === 'rent' && feeChecks.value.rent) {
    feeAmounts.value.rent = houseInfo.value.rent || 0
  }
  calculateTotal()
}

// 输入时只计算，不校验
const onElectricInput = () => {
  const start = meterReads.value.lastElectricEndRead || houseInfo.value.electricInitialRead || 0
  const end = meterReads.value.electricEndRead
  
  // 允许清空
  if (end === null || end === undefined || isNaN(Number(end))) {
    meterReads.value.electricUsage = 0
    feeAmounts.value.electric = 0
    return
  }
  
  const endNum = Number(end)
  if (isNaN(endNum)) {
    meterReads.value.electricUsage = 0
    feeAmounts.value.electric = 0
    return
  }
  
  meterReads.value.electricUsage = endNum - start
  feeAmounts.value.electric = Number((meterReads.value.electricUsage * (houseInfo.value.electricRate || 1)).toFixed(2))
}

// 输入时只计算，不校验
const onWaterInput = () => {
  const start = meterReads.value.lastWaterEndRead || houseInfo.value.waterInitialRead || 0
  const end = meterReads.value.waterEndRead
  
  // 允许清空
  if (end === null || end === undefined || isNaN(Number(end))) {
    meterReads.value.waterUsage = 0
    feeAmounts.value.water = 0
    return
  }
  
  const endNum = Number(end)
  if (isNaN(endNum)) {
    meterReads.value.waterUsage = 0
    feeAmounts.value.water = 0
    return
  }
  
  meterReads.value.waterUsage = endNum - start
  feeAmounts.value.water = Number((meterReads.value.waterUsage * (houseInfo.value.waterRate || 3)).toFixed(2))
}

const calculateTotal = () => {
  // 触发重新计算
}

const calculateBalance = () => {
  // 触发重新计算
}

const fetchPayments = async () => {
  loading.value = true
  try {
    const data = await paymentsApi.getList() as unknown as any[]
    payments.value = data
    if (route.query.tenantId) {
      filters.value.tenantId = Number(route.query.tenantId)
      filters.value.tenantName = (route.query.tenantName as string) || ''
    }
  } catch (error) {
    showToast({ type: 'fail', message: '获取缴费记录失败' })
  } finally {
    loading.value = false
  }
}

const fetchTenants = async () => {
  try {
    const data = await tenantsApi.getList() as unknown as any[]
    tenants.value = data
    form.value = {
      tenantId: null,
      items: [{ type: '', typeText: '', amount: 0 }],
      paidAt: new Date().toISOString(),
      remark: '',
      previousBalance: 0,
      actualPaid: 0
    }
    tenantText.value = ''
    paidAtText.value = dayjs().format('YYYY-MM-DD HH:mm')
    showModal.value = true
  } catch (error) {
    showToast({ type: 'fail', message: '获取租户列表失败' })
  }
}

const closeModal = () => {
  showModal.value = false
}

const clearTenantFilter = () => {
  filters.value.tenantId = null
  filters.value.tenantName = ''
  router.replace({ path: '/payments' })
}

const closeDatePickers = () => {
  showStartDatePicker.value = false
  showEndDatePicker.value = false
}

const onDateConfirm = ({ selectedValues }: any) => {
  const date = selectedValues.join('-')
  if (showStartDatePicker.value) {
    filters.value.startDate = date
  } else {
    filters.value.endDate = date
  }
  closeDatePickers()
}

const selectTenant = async (tenant: any) => {
  form.value.tenantId = tenant.id
  form.value.previousBalance = tenant.balance || 0
  tenantText.value = `${tenant.name} - ${tenant.house?.title || ''}`
  showTenantPicker.value = false

  // 重置费用选择
  feeChecks.value = { rent: false, electric: false, water: false, other: false }
  feeAmounts.value = { rent: 0, electric: 0, water: 0, other: 0 }
  meterReads.value = {
    lastElectricEndRead: 0,
    lastWaterEndRead: 0,
    electricEndRead: 0,
    waterEndRead: 0,
    electricUsage: 0,
    waterUsage: 0
  }

  // 获取房屋信息
  if (tenant.house?.id) {
    try {
      const house = await housesApi.getById(tenant.house.id) as any
      houseInfo.value = {
        rent: house.rent || 0,
        electricRate: house.electricRate || 1,
        waterRate: house.waterRate || 3,
        electricInitialRead: house.electricInitialRead || 0,
        waterInitialRead: house.waterInitialRead || 0
      }
      // 默认选中房租并填充金额
      feeChecks.value.rent = true
      feeAmounts.value.rent = house.rent || 0
    } catch (error) {
      console.error('获取房屋配置失败', error)
    }
  }

  // 获取租户上次水电表读数
  try {
    const lastReads = await tenantsApi.getLastMeterReads(tenant.id) as any
    meterReads.value.lastElectricEndRead = lastReads.lastElectricEndRead || houseInfo.value.electricInitialRead || 0
    meterReads.value.lastWaterEndRead = lastReads.lastWaterEndRead || houseInfo.value.waterInitialRead || 0
  } catch (error) {
    console.error('获取上次读数失败', error)
    meterReads.value.lastElectricEndRead = houseInfo.value.electricInitialRead || 0
    meterReads.value.lastWaterEndRead = houseInfo.value.waterInitialRead || 0
  }
}

const confirmTenantWithSelection = () => {
  if (!form.value.tenantId) return
  const tenant = tenants.value.find((t: any) => t.id === form.value.tenantId)
  tenantText.value = tenant ? `${tenant.name} - ${tenant.house?.title || ''}` : ''
  showTenantPicker.value = false
}

const selectType = async (option: any) => {
  const index = selectedItemIndex.value
  form.value.items[index].type = option.value
  form.value.items[index].typeText = option.text

  // 如果已选择租户，自动设置费率和起始读数
  if (form.value.tenantId) {
    const tenant = tenants.value.find((t: any) => t.id === form.value.tenantId)
    if (tenant?.house?.id) {
      try {
        const house = await housesApi.getByIdWithLastRead(tenant.house.id) as any
        if (option.value === 'ELECTRIC') {
          form.value.items[index].electricRate = house.electricRate || 0
          form.value.items[index].electricStartRead = house.lastElectricEndRead || house.electricInitialRead || 0
        } else if (option.value === 'WATER') {
          form.value.items[index].waterRate = house.waterRate || 0
          form.value.items[index].waterStartRead = house.lastWaterEndRead || house.waterInitialRead || 0
        }
      } catch (error) {
        console.error('获取房屋配置失败', error)
      }
    }
  }
}

const confirmTypeWithSelection = () => {
  showTypePicker.value = false
}

const confirmDatePicker = () => {
  const date = dayjs(datePickerValue.value.join('-'))
  form.value.paidAt = date.toISOString()
  paidAtText.value = date.format('YYYY-MM-DD HH:mm')
  showDatePicker.value = false
}

const handleSave = async () => {
  console.log('handleSave called', {
    tenantId: form.value.tenantId,
    currentTotal: currentTotal.value,
    feeChecks: feeChecks.value,
    meterReads: meterReads.value,
    feeAmounts: feeAmounts.value
  })
  
  // 验证水电读数
  if (feeChecks.value.electric) {
    const start = meterReads.value.lastElectricEndRead || houseInfo.value.electricInitialRead || 0
    const end = meterReads.value.electricEndRead
    if (end === null || end === undefined) {
      showToast({ type: 'fail', message: '请输入电费本期读数' })
      return
    }
    const endNum = Number(end)
    if (isNaN(endNum) || endNum < start) {
      showToast({ type: 'fail', message: `电费读数无效，当前读数不能小于${start}` })
      return
    }
  }
  
  if (feeChecks.value.water) {
    const start = meterReads.value.lastWaterEndRead || houseInfo.value.waterInitialRead || 0
    const end = meterReads.value.waterEndRead
    if (end === null || end === undefined) {
      showToast({ type: 'fail', message: '请输入水费本期读数' })
      return
    }
    const endNum = Number(end)
    if (isNaN(endNum) || endNum < start) {
      showToast({ type: 'fail', message: `水费读数无效，当前读数不能小于${start}` })
      return
    }
  }
  
  if (!form.value.tenantId || currentTotal.value <= 0) {
    showToast({ type: 'fail', message: '请选择租户并勾选至少一项费用' })
    return
  }
  
  showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 })
  try {
    // 构建items数组
    const items: any[] = []
    
    if (feeChecks.value.rent) {
      items.push({
        type: 'RENT',
        amount: Number(feeAmounts.value.rent) || 0
      })
    }
    
    if (feeChecks.value.electric) {
      const start = meterReads.value.lastElectricEndRead || houseInfo.value.electricInitialRead || 0
      const end = Number(meterReads.value.electricEndRead) || 0
      items.push({
        type: 'ELECTRIC',
        amount: Number(feeAmounts.value.electric) || 0,
        electricStartRead: start,
        electricEndRead: end,
        electricUsage: meterReads.value.electricUsage || 0
      })
    }
    
    if (feeChecks.value.water) {
      const start = meterReads.value.lastWaterEndRead || houseInfo.value.waterInitialRead || 0
      const end = Number(meterReads.value.waterEndRead) || 0
      items.push({
        type: 'WATER',
        amount: Number(feeAmounts.value.water) || 0,
        waterStartRead: start,
        waterEndRead: end,
        waterUsage: meterReads.value.waterUsage || 0
      })
    }
    
    if (feeChecks.value.other) {
      items.push({
        type: 'OTHER',
        amount: Number(feeAmounts.value.other) || 0
      })
    }

    // 同步更新 form.items
    form.value.items = items;

    await paymentsApi.create({
      tenantId: form.value.tenantId!,
      items,
      paidAt: form.value.paidAt,
      remark: form.value.remark,
      actualPaid: form.value.actualPaid || currentTotal.value
    })
    closeToast()
    showToast({ type: 'success', message: '添加成功' })
    closeModal()
    fetchPayments()
  } catch (error: any) {
    closeToast()
    showToast({ type: 'fail', message: error.response?.data?.message || '添加失败' })
  }
}

const handleEdit = async (payment: any) => {
  selectedPayment.value = payment
  
  // 加载完整的缴费记录详情
  try {
    const fullPayment = await paymentsApi.getById(payment.id) as any
    selectedPayment.value = fullPayment
    
    editForm.value = {
      tenantId: fullPayment.tenantId,
      paidAt: fullPayment.paidAt,
      paidAtText: dayjs(fullPayment.paidAt).format('YYYY-MM-DD'),
      remark: fullPayment.remark || ''
    }
    
    // 初始化日期选择器
    const paidDate = dayjs(fullPayment.paidAt)
    editDatePickerValue.value = [String(paidDate.year()), String(paidDate.month() + 1).padStart(2, '0'), String(paidDate.date()).padStart(2, '0')]
    
    // 解析费用项目
    editFeeChecks.value = { rent: false, electric: false, water: false, other: false }
    editFeeAmounts.value = { rent: 0, electric: 0, water: 0, other: 0 }
    editMeterReads.value = { lastElectricEndRead: 0, lastWaterEndRead: 0, electricEndRead: 0, waterEndRead: 0, electricUsage: 0, waterUsage: 0 }
    
    for (const item of fullPayment.items || []) {
      if (item.type === 'RENT') {
        editFeeChecks.value.rent = true
        editFeeAmounts.value.rent = item.amount
      } else if (item.type === 'ELECTRIC') {
        editFeeChecks.value.electric = true
        editFeeAmounts.value.electric = item.amount
        editMeterReads.value.lastElectricEndRead = item.electricStartRead || 0
        editMeterReads.value.electricEndRead = item.electricEndRead || 0
        editMeterReads.value.electricUsage = item.electricUsage || 0
      } else if (item.type === 'WATER') {
        editFeeChecks.value.water = true
        editFeeAmounts.value.water = item.amount
        editMeterReads.value.lastWaterEndRead = item.waterStartRead || 0
        editMeterReads.value.waterEndRead = item.waterEndRead || 0
        editMeterReads.value.waterUsage = item.waterUsage || 0
      } else if (item.type === 'OTHER') {
        editFeeChecks.value.other = true
        editFeeAmounts.value.other = item.amount
      }
    }
    
    // 获取上次水电表读数（用于验证）
    try {
      const lastReads = await tenantsApi.getLastMeterReads(fullPayment.tenantId) as any
      // 只有在没有电表/水表读数时才使用上期读数
      if (editMeterReads.value.electricEndRead === 0) {
        editMeterReads.value.lastElectricEndRead = lastReads.lastElectricEndRead || 0
      }
      if (editMeterReads.value.waterEndRead === 0) {
        editMeterReads.value.lastWaterEndRead = lastReads.lastWaterEndRead || 0
      }
    } catch (error) {
      console.error('获取上次读数失败', error)
    }
    
    showEditModal.value = true
  } catch (error) {
    showToast({ type: 'fail', message: '获取详情失败' })
  }
}

const toggleEditFee = (_type: string) => {
  // 切换时不自动填充金额，保持原值
}

const calculateEditElectric = () => {
  const start = editMeterReads.value.lastElectricEndRead || 0
  const end = editMeterReads.value.electricEndRead
  
  if (end === null || end === undefined || isNaN(Number(end)) || Number(end) === 0) {
    editMeterReads.value.electricUsage = 0
    editFeeAmounts.value.electric = 0
    return
  }
  
  const endNum = Number(end)
  if (endNum < start) {
    showToast({ type: 'fail', message: `当前读数 ${endNum} 小于上期读数 ${start}，请检查输入` })
    editMeterReads.value.electricUsage = 0
    editFeeAmounts.value.electric = 0
  } else {
    editMeterReads.value.electricUsage = endNum - start
    editFeeAmounts.value.electric = Number((editMeterReads.value.electricUsage).toFixed(2))
  }
}

const calculateEditWater = () => {
  const start = editMeterReads.value.lastWaterEndRead || 0
  const end = editMeterReads.value.waterEndRead
  
  if (end === null || end === undefined || isNaN(Number(end)) || Number(end) === 0) {
    editMeterReads.value.waterUsage = 0
    editFeeAmounts.value.water = 0
    return
  }
  
  const endNum = Number(end)
  if (endNum < start) {
    showToast({ type: 'fail', message: `当前读数 ${endNum} 小于上期读数 ${start}，请检查输入` })
    editMeterReads.value.waterUsage = 0
    editFeeAmounts.value.water = 0
  } else {
    editMeterReads.value.waterUsage = endNum - start
    editFeeAmounts.value.water = Number((editMeterReads.value.waterUsage).toFixed(2))
  }
}

const calculateEditTotal = () => {
  // 触发重新计算
}

const confirmEditDatePicker = () => {
  const date = dayjs(editDatePickerValue.value.join('-'))
  editForm.value.paidAt = date.toISOString()
  editForm.value.paidAtText = date.format('YYYY-MM-DD')
  showEditDatePicker.value = false
}

const handleDelete = async (payment: any) => {
  try {
    const result = await showDialog({
      title: '确认删除',
      message: `确定要删除 "${payment.tenant?.name}" 的缴费记录吗？`,
      showCancelButton: true,
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      allowEscapeKey: true
    })
    
    if (result === 'confirm') {
      await paymentsApi.delete(payment.id)
      showToast({ type: 'success', message: '删除成功' })
      fetchPayments()
    }
  } catch (error: any) {
    if (error.message !== '取消操作') {
      showToast({ type: 'fail', message: error.response?.data?.message || '删除失败' })
    }
  }
}

const confirmEdit = async () => {
  if (!selectedPayment.value) return
  
  // 验证水电读数
  if (editFeeChecks.value.electric && editMeterReads.value.electricEndRead) {
    const start = editMeterReads.value.lastElectricEndRead || 0
    const end = editMeterReads.value.electricEndRead
    if (Number(end) < start) {
      showToast({ type: 'fail', message: `电费读数无效，当前读数不能小于${start}` })
      return
    }
  }
  
  if (editFeeChecks.value.water && editMeterReads.value.waterEndRead) {
    const start = editMeterReads.value.lastWaterEndRead || 0
    const end = editMeterReads.value.waterEndRead
    if (Number(end) < start) {
      showToast({ type: 'fail', message: `水费读数无效，当前读数不能小于${start}` })
      return
    }
  }
  
  try {
    const items: any[] = []
    
    if (editFeeChecks.value.rent) {
      items.push({
        type: 'RENT',
        amount: Number(editFeeAmounts.value.rent) || 0
      })
    }
    
    if (editFeeChecks.value.electric) {
      const start = editMeterReads.value.lastElectricEndRead || 0
      const end = Number(editMeterReads.value.electricEndRead) || 0
      items.push({
        type: 'ELECTRIC',
        amount: Number(editFeeAmounts.value.electric) || 0,
        electricStartRead: start,
        electricEndRead: end,
        electricUsage: editMeterReads.value.electricUsage || 0
      })
    }
    
    if (editFeeChecks.value.water) {
      const start = editMeterReads.value.lastWaterEndRead || 0
      const end = Number(editMeterReads.value.waterEndRead) || 0
      items.push({
        type: 'WATER',
        amount: Number(editFeeAmounts.value.water) || 0,
        waterStartRead: start,
        waterEndRead: end,
        waterUsage: editMeterReads.value.waterUsage || 0
      })
    }
    
    if (editFeeChecks.value.other) {
      items.push({
        type: 'OTHER',
        amount: Number(editFeeAmounts.value.other) || 0
      })
    }
    
    if (items.length === 0) {
      showToast({ type: 'fail', message: '请至少选择一个缴费项目' })
      return
    }
    
    showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 })
    await paymentsApi.update(selectedPayment.value.id, {
      paidAt: editForm.value.paidAt,
      remark: editForm.value.remark,
      items
    })
    closeToast()
    showToast({ type: 'success', message: '更新成功' })
    showEditModal.value = false
    fetchPayments()
  } catch (error: any) {
    closeToast()
    showToast({ type: 'fail', message: error.response?.data?.message || '更新失败' })
  }
}

const viewPaymentDetail = async (payment: any) => {
  try {
    const data = await paymentsApi.getById(payment.id) as unknown as any
    selectedPayment.value = data
    showDetailModal.value = true
  } catch (error) {
    showToast({ type: 'fail', message: '获取详情失败' })
  }
}

const handleShare = () => {
  if (!selectedPayment.value) return
  const shareUrl = `${window.location.origin}/share/${selectedPayment.value.id}`
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast({ type: 'success', message: '分享链接已复制到剪贴板' })
    }).catch(() => {
      fallbackCopy(shareUrl)
    })
  } else {
    fallbackCopy(shareUrl)
  }
}

const fallbackCopy = (text: string) => {
  const input = document.createElement('input')
  input.value = text
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
  showToast({ type: 'success', message: '分享链接已复制到剪贴板' })
}

const exportToCSV = () => {
  exporting.value = true
  try {
    const data = filteredPayments.value
    const rows: string[] = []
    data.forEach((payment) => {
      if (payment.items && payment.items.length > 0) {
        payment.items.forEach((item: any) => {
          rows.push([
            payment.tenant?.name || '',
            payment.tenant?.house?.title || '',
            payment.paidAt ? dayjs(payment.paidAt).format('YYYY-MM-DD HH:mm') : '',
            typesMap[item.type]?.label || item.type || '',
            item.amount || 0,
            payment.remark || ''
          ].map((v) => `"${v || ''}"`).join(','))
        })
      } else {
        rows.push([
          payment.tenant?.name || '',
          payment.tenant?.house?.title || '',
          payment.paidAt ? dayjs(payment.paidAt).format('YYYY-MM-DD HH:mm') : '',
          '', '', ''
        ].map((v) => `"${v || ''}"`).join(','))
      }
    })

    const csvContent = [
      '租户,房号,缴费时间,缴费类型,金额,备注',
      ...rows
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `缴费记录_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    showToast({ type: 'success', message: '导出成功' })
  } catch (error) {
    showToast({ type: 'fail', message: '导出失败' })
  } finally {
    exporting.value = false
  }
}

onMounted(() => fetchPayments())
</script>

<style scoped>
@import '../../styles/theme.css';

.payments-page {
  padding: 16px;
  background: var(--bg-page);
  min-height: 100vh;
}

/* 页面头部 */
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
  transition: var(--transition);
  white-space: nowrap;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}

.btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: white;
  color: var(--text-main);
  border: 2px solid var(--border-light);
}

.btn-secondary:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-small {
  padding: 8px 16px;
  font-size: 13px;
}

.btn-icon {
  font-size: 18px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  flex: 1;
  max-width: 360px;
  transition: var(--transition);
}

.search-box:focus-within {
  background: white;
  box-shadow: 0 0 0 2px var(--primary-light);
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
  color: var(--text-main);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

.filter-select {
  padding: 10px 16px;
  background: var(--bg-input);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-main);
  cursor: pointer;
  transition: var(--transition);
}

.filter-select:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-light);
}

.date-range-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.date-field {
  padding: 10px 16px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  transition: var(--transition);
}

.date-field:hover {
  border-color: var(--primary);
  background: white;
}

.date-value {
  font-size: 14px;
  color: var(--text-main);
}

.date-icon {
  font-size: 16px;
}

.date-separator {
  color: var(--text-placeholder);
  font-size: 18px;
}

.tenant-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--primary-light);
  border-radius: var(--radius-md);
  border: 1px solid var(--primary);
}

.filter-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.filter-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.btn-clear {
  margin-left: auto;
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: var(--transition);
}

.btn-clear:hover {
  color: var(--accent);
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
  to { transform: rotate(360deg); }
}

/* 缴费列表 */
.payments-list {
  display: grid;
  gap: 16px;
}

.payment-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  border: 1px solid var(--border-light);
  cursor: pointer;
}

.payment-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.tenant-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 4px 0;
}

.payment-time {
  font-size: 13px;
  color: var(--text-secondary);
}

.price {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.card-body {
  margin-bottom: 0;
}

.payment-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.payment-item-tag,
.more-tag {
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.tag-success {
  background: #DCFCE7;
  color: #166534;
}

.tag-primary {
  background: #DBEAFE;
  color: #1E40AF;
}

.tag-warning {
  background: #FEF3C7;
  color: #92400E;
}

.tag-default {
  background: #F1F5F9;
  color: #64748B;
}

.more-tag {
  color: var(--text-secondary);
}

.payment-remark {
  font-size: 13px;
  color: var(--text-secondary);
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

/* 弹框 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-content,
.picker-content,
.detail-modal {
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  background: var(--bg-card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideInBottom 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-card);
  flex-shrink: 0;
}

@keyframes slideInBottom {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header,
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title,
.picker-title,
.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-page);
}

.btn-link {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.btn-link:hover {
  color: var(--text-main);
}

.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect:active {
  transform: scale(0.98);
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
}

.btn-close:hover {
  background: var(--accent-light);
  color: var(--accent);
}

.modal-body,
.detail-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.modal-scroll {
  max-height: none;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-card);
  position: sticky;
  bottom: 0;
  z-index: 1;
  flex-shrink: 0;
}

.modal-footer .btn {
  flex: 1;
  justify-content: center;
}

.detail-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-card);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  flex-shrink: 0;
}

.detail-footer .btn {
  flex: 1;
  justify-content: center;
}

.detail-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-card);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  flex-shrink: 0;
}

.detail-footer .btn {
  flex: 1;
  justify-content: center;
}

/* 表单 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 8px;
}

.required-mark {
  color: var(--accent);
  margin-left: 4px;
  font-size: 16px;
  line-height: 1;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-row.row-compact {
  gap: 12px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-main);
  background: var(--bg-card);
  transition: var(--transition);
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--bg-input);
}

.form-input::placeholder {
  color: var(--text-placeholder);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.selector-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  cursor: pointer;
  transition: var(--transition);
}

.selector-field:hover {
  border-color: var(--primary);
}

.selector-value {
  font-size: 14px;
  color: var(--text-main);
}

.selector-arrow {
  font-size: 12px;
  color: var(--text-placeholder);
}

/* 缴费项目 */
.items-section {
  margin: 24px 0;
  padding: 16px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.entry-item {
  background: var(--bg-card);
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 12px;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.entry-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.btn-delete {
  padding: 6px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.5;
  transition: var(--transition);
}

.btn-delete:hover {
  opacity: 1;
  color: var(--accent);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-page);
}

.btn-action {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}

.btn-edit {
  background: var(--primary-light);
  color: var(--primary);
}

.btn-edit:hover {
  background: var(--primary);
  color: white;
}

.btn-delete-action {
  background: var(--accent-light);
  color: var(--accent);
}

.btn-delete-action:hover {
  background: var(--accent);
  color: white;
}

.edit-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background: var(--bg-input);
  color: var(--text-main);
}

.edit-input:focus {
  outline: none;
  border-color: var(--border-focus);
}

.empty-hint {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.meter-info {
  text-align: center;
  padding: 8px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.meter-info .usage-value {
  color: var(--primary);
  font-weight: 600;
}

.meter-info .rate-value {
  color: var(--text-main);
  font-weight: 500;
}

.meter-info .amount-value {
  color: #ea580c;
  font-weight: 700;
  font-size: 14px;
}

.total-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.total-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.total-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

/* 详情内容 */
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.detail-row.emphasis {
  padding: 16px 0;
}

.detail-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 14px;
  color: var(--text-main);
  text-align: right;
}

.detail-row.emphasis .detail-value.price {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

.items-list {
  margin: 16px 0;
}

.item-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
}

.item-tag {
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
}

.item-amount {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
}

.meter-detail {
  text-align: right;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0 8px 0;
}

/* 选择器选项样式 */
.picker-options {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 16px 16px;
}

.picker-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  cursor: pointer;
  transition: var(--transition);
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
  border: 2px solid var(--border-light);
  margin-right: 12px;
  position: relative;
  flex-shrink: 0;
}

.picker-option.active .option-radio {
  border-color: var(--primary);
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
  overflow: hidden;
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

.option-text {
  font-size: 15px;
  color: var(--text-main);
  font-weight: 500;
}

/* 新缴费弹框样式 */
.payment-modal-new .modal-body {
  padding: 12px 16px;
}

.compact-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.compact-field {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  cursor: pointer;
}

.field-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.field-value {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 500;
}

.type-section {
  margin-bottom: 16px;
}

.type-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.type-cards {
  display: flex;
  gap: 10px;
}

.type-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.type-chip.active {
  border-color: var(--primary);
  background: var(--primary-light);
}

.chip-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.chip-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-main);
}

.quick-item {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 10px;
  border: 1px solid var(--border-light);
}

.quick-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.quick-type {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: var(--radius-sm);
}

.quick-type.type-rent { background: #DCFCE7; color: #166534; }
.quick-type.type-water { background: #DBEAFE; color: #1E40AF; }
.quick-type.type-electric { background: #FEF3C7; color: #92400E; }
.quick-type.type-other { background: #F1F5F9; color: #64748B; }

.quick-remove {
  background: none;
  border: none;
  color: var(--text-placeholder);
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}

.quick-input-row {
  display: flex;
  align-items: center;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: 0 12px;
}

.quick-currency {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-right: 4px;
}

.quick-amount {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-main);
  padding: 10px 0;
}

.quick-amount:focus {
  outline: none;
}

.quick-meter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-light);
}

.quick-meter-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 16px;
  background: var(--bg-input);
}

.quick-usage {
  font-size: 14px;
  color: var(--primary);
  font-weight: 600;
  white-space: nowrap;
}

/* 新缴费表单样式 */
.form-section {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  overflow: hidden;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
}

.form-row:last-child {
  border-bottom: none;
}

.form-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.form-value {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 500;
}

.fee-section {
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 10px 16px;
  background: var(--bg-input);
}

.fee-item {
  background: var(--bg-card);
  margin-bottom: 8px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s ease;
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
  flex-shrink: 0;
}

.fee-check-large input {
  opacity: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  cursor: pointer;
  z-index: 1;
}

.fee-check-large .checkmark-large {
  position: absolute;
  top: 0;
  left: 0;
  width: 26px;
  height: 26px;
  border: 2px solid var(--border);
  border-radius: 6px;
  background: var(--bg-card);
  transition: all 0.2s ease;
}

.fee-check-large input:checked + .checkmark-large {
  background: var(--primary);
  border-color: var(--primary);
}

.fee-check-large input:checked + .checkmark-large::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.fee-input {
  display: flex;
  align-items: center;
  padding: 0 16px 14px;
  gap: 8px;
}

.fee-input .currency {
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
  background: var(--bg-input);
}

.fee-input input:focus {
  outline: none;
  border-color: var(--primary);
}

.fee-hint-row {
  padding: 0 16px 14px;
}

.fee-hint-text {
  display: inline-block;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-input);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--primary);
}

.fee-other-content {
  padding: 0 16px 14px;
}

.fee-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.fee-input-row .currency {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}

.fee-amount-input {
  flex: 1;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 16px;
  background: var(--bg-input);
}

.fee-amount-input:focus {
  outline: none;
  border-color: var(--primary);
}

.fee-remark-input {
  width: 100%;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--bg-input);
  box-sizing: border-box;
}

.fee-remark-input:focus {
  outline: none;
  border-color: var(--primary);
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
  background: var(--bg-input);
}

.meter-input:focus {
  outline: none;
  border-color: var(--primary);
}

.balance-item {
  background: var(--primary-light);
}

.empty-tenant {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-tenant .empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
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

.summary-value {
  font-weight: 500;
  color: var(--text-main);
}

.summary-grand {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.paid-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.paid-input .currency {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}

.paid-input input {
  width: 100px;
  padding: 6px 10px;
  border: 1px solid var(--primary);
  border-radius: var(--radius-sm);
  font-size: 16px;
  font-weight: 600;
  text-align: right;
  background: var(--bg-input);
}

.text-danger {
  color: var(--accent) !important;
}

.text-success {
  color: #16a34a !important;
}

.remark-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--bg-input);
  resize: none;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
}

.btn-outline {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-main);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.btn-outline:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.btn-outline:active {
  background: var(--bg-input);
  transform: scale(0.98);
}

.quick-total {
  padding: 14px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
  padding: 6px 0;
}

.total-row:not(:last-child) {
  border-bottom: 1px dashed var(--border-light);
}

.total-value {
  font-weight: 600;
  color: var(--text-main);
}

.balance-row .balance-value {
  color: var(--accent);
}

.balance-row .balance-value.balance-negative {
  color: var(--primary);
}

.grand-total-row {
  padding-top: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.grand-total-row .grand-total {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.actual-payment {
  background: var(--bg-card);
  border: 2px solid var(--primary);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 12px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.payment-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: 0 12px;
}

.payment-currency {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-right: 4px;
}

.payment-input {
  width: 120px;
  border: none;
  background: transparent;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
  text-align: right;
  padding: 8px 0;
}

.payment-input:focus {
  outline: none;
}

.balance-result {
  text-align: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
  font-size: 14px;
  color: var(--primary);
  font-weight: 500;
}

.balance-result.balance-due {
  color: var(--accent);
}

.balance-result.balance-change {
  color: #16a34a;
}

.quick-total-amount {
  font-size: 26px;
  font-weight: 700;
  color: var(--primary);
}

.quick-remark {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 14px;
  resize: none;
  background: var(--bg-card);
  box-sizing: border-box;
}

.btn-block {
  width: 100%;
}

/* 响应式 */
@media (max-width: 768px) {
  .payments-page {
    padding: 12px;
    padding-bottom: 60px; /* 为 tabbar 预留空间 */
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 12px 0 0;
    margin-bottom: 12px;
  }

  .page-info h1 {
    font-size: 20px;
  }

  .toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .toolbar-left {
    flex-direction: column;
  }

  .search-box {
    max-width: 100%;
  }

  .date-range-bar {
    flex-direction: column;
  }

  .date-separator {
    transform: rotate(90deg);
  }

  .form-row,
  .form-row.row-compact {
    grid-template-columns: 1fr;
  }
}
</style>

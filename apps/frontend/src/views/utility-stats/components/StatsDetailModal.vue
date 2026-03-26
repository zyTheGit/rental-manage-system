<template>
    <van-popup
        v-model:show="show"
        round
        position="bottom"
        class="stats-detail-modal"
    >
        <div class="detail-modal">
            <div class="modal-header">
                <div class="header-bg"></div>
                <div class="header-content">
                    <div class="header-icon">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                        >
                            <path d="M12 20V10" />
                            <path d="M18 20V4" />
                            <path d="M6 20v-4" />
                        </svg>
                    </div>
                    <h2 class="modal-title">水电详情</h2>
                    <p class="modal-subtitle">
                        {{ stat?.year }}年{{ stat?.month }}月统计
                    </p>
                </div>
                <button class="btn-close" @click="handleClose">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div v-if="stat" class="modal-body">
                <div class="info-section">
                    <div class="section-label">租户信息</div>
                    <div class="info-card">
                        <div class="info-row">
                            <div class="info-icon tenant">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path
                                        d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                                    />
                                    <circle cx="8.5" cy="7" r="4" />
                                </svg>
                            </div>
                            <div class="info-content">
                                <span class="info-label">租户姓名</span>
                                <span class="info-value">{{
                                    stat.tenant?.name || "-"
                                }}</span>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-icon house">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path
                                        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                    />
                                    <path d="M9 22V12h6v10" />
                                </svg>
                            </div>
                            <div class="info-content">
                                <span class="info-label">房屋地址</span>
                                <span class="info-value">{{
                                    stat.tenant?.house?.title || "未绑定"
                                }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="usage-summary">
                    <div class="summary-header">
                        <span class="summary-label">本月用量汇总</span>
                    </div>
                    <div class="summary-cards">
                        <div class="summary-card electric">
                            <div class="summary-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                            </div>
                            <div class="summary-content">
                                <span class="summary-title">用电量</span>
                                <div class="summary-value-row">
                                    <span class="summary-num">{{
                                        formatNumber(stat.electricUsage)
                                    }}</span>
                                    <span class="summary-unit">度</span>
                                </div>
                                <span class="summary-daily"
                                    >日均 {{ dailyElectric }} 度</span
                                >
                            </div>
                        </div>
                        <div class="summary-card water">
                            <div class="summary-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z"
                                    />
                                </svg>
                            </div>
                            <div class="summary-content">
                                <span class="summary-title">用水量</span>
                                <div class="summary-value-row">
                                    <span class="summary-num">{{
                                        formatNumber(stat.waterUsage)
                                    }}</span>
                                    <span class="summary-unit">吨</span>
                                </div>
                                <span class="summary-daily"
                                    >日均 {{ dailyWater }} 吨</span
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <div class="meter-section">
                    <div class="meter-card electric">
                        <div class="meter-card-header">
                            <div class="meter-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                            </div>
                            <div class="meter-title">
                                <span class="title-text">电表读数</span>
                                <span class="title-unit">单位: 度</span>
                            </div>
                        </div>
                        <div class="meter-reads">
                            <div class="read-item">
                                <div class="read-badge start">起始</div>
                                <div class="read-value">
                                    {{ formatNumber(stat.electricStartRead) }}
                                </div>
                            </div>
                            <div class="read-arrow">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                            <div class="read-item">
                                <div class="read-badge end">结束</div>
                                <div class="read-value">
                                    {{ formatNumber(stat.electricEndRead) }}
                                </div>
                            </div>
                        </div>
                        <div class="meter-result">
                            <div class="result-row">
                                <span class="result-label">用量</span>
                                <span class="result-value highlight"
                                    >{{
                                        formatNumber(stat.electricUsage)
                                    }}
                                    度</span
                                >
                            </div>
                            <div class="result-row">
                                <span class="result-label">单价</span>
                                <span class="result-value"
                                    >{{ electricRate }} 元/度</span
                                >
                            </div>
                            <div class="result-row total">
                                <span class="result-label">电费金额</span>
                                <span class="result-value"
                                    >¥{{ formatNumber(electricAmount) }}</span
                                >
                            </div>
                        </div>
                        <div class="meter-bar">
                            <div class="bar-header">
                                <span class="bar-title">用量分布</span>
                                <span class="bar-percent"
                                    >{{ electricPercent }}%</span
                                >
                            </div>
                            <div class="bar-track">
                                <div
                                    class="bar-fill electric"
                                    :style="{
                                        width: `${Math.min(100, electricPercent)}%`,
                                    }"
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div class="meter-card water">
                        <div class="meter-card-header">
                            <div class="meter-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z"
                                    />
                                </svg>
                            </div>
                            <div class="meter-title">
                                <span class="title-text">水表读数</span>
                                <span class="title-unit">单位: 吨</span>
                            </div>
                        </div>
                        <div class="meter-reads">
                            <div class="read-item">
                                <div class="read-badge start">起始</div>
                                <div class="read-value">
                                    {{ formatNumber(stat.waterStartRead) }}
                                </div>
                            </div>
                            <div class="read-arrow">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                            <div class="read-item">
                                <div class="read-badge end">结束</div>
                                <div class="read-value">
                                    {{ formatNumber(stat.waterEndRead) }}
                                </div>
                            </div>
                        </div>
                        <div class="meter-result">
                            <div class="result-row">
                                <span class="result-label">用量</span>
                                <span class="result-value highlight"
                                    >{{
                                        formatNumber(stat.waterUsage)
                                    }}
                                    吨</span
                                >
                            </div>
                            <div class="result-row">
                                <span class="result-label">单价</span>
                                <span class="result-value"
                                    >{{ waterRate }} 元/吨</span
                                >
                            </div>
                            <div class="result-row total">
                                <span class="result-label">水费金额</span>
                                <span class="result-value"
                                    >¥{{ formatNumber(waterAmount) }}</span
                                >
                            </div>
                        </div>
                        <div class="meter-bar">
                            <div class="bar-header">
                                <span class="bar-title">用量分布</span>
                                <span class="bar-percent"
                                    >{{ waterPercent }}%</span
                                >
                            </div>
                            <div class="bar-track">
                                <div
                                    class="bar-fill water"
                                    :style="{
                                        width: `${Math.min(100, waterPercent)}%`,
                                    }"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="cost-summary">
                    <div class="summary-row">
                        <span class="summary-label">本月水电费用合计</span>
                        <div class="summary-total">
                            <span class="total-currency">¥</span>
                            <span class="total-amount">{{
                                formatNumber(totalAmount)
                            }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </van-popup>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";

const props = defineProps<{
    stat: any;
}>();

const emit = defineEmits<{
    (e: "close"): void;
}>();

const show = ref(true);

const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "0";
    return Number(num).toFixed(num % 1 === 0 ? 0 : 2);
};

const handleClose = () => {
    show.value = false;
    emit("close");
};

const electricRate = computed(() => {
    return props.stat?.tenant?.house?.electricRate || 1;
});

const waterRate = computed(() => {
    return props.stat?.tenant?.house?.waterRate || 3;
});

const dailyElectric = computed(() => {
    const usage = props.stat?.electricUsage || 0;
    const days = getDaysInMonth(props.stat?.year, props.stat?.month);
    return (usage / days).toFixed(1);
});

const dailyWater = computed(() => {
    const usage = props.stat?.waterUsage || 0;
    const days = getDaysInMonth(props.stat?.year, props.stat?.month);
    return (usage / days).toFixed(1);
});

const electricAmount = computed(() => {
    return (props.stat?.electricUsage || 0) * electricRate.value;
});

const waterAmount = computed(() => {
    return (props.stat?.waterUsage || 0) * waterRate.value;
});

const totalAmount = computed(() => {
    return electricAmount.value + waterAmount.value;
});

const electricPercent = computed(() => {
    const usage = props.stat?.electricUsage || 0;
    return Math.min(100, Math.round((usage / 300) * 100));
});

const waterPercent = computed(() => {
    const usage = props.stat?.waterUsage || 0;
    return Math.min(100, Math.round((usage / 30) * 100));
});

const getDaysInMonth = (year: number, month: number) => {
    if (!year || !month) return 30;
    return new Date(year, month, 0).getDate();
};

watch(
    () => props.stat,
    (val) => {
        show.value = !!val;
    },
    { immediate: true },
);
</script>

<style scoped lang="less">
.stats-detail-modal {
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.detail-modal {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-page);
}

.modal-header {
    position: relative;
    padding: 24px 20px 20px;
    background: linear-gradient(135deg, #475569 0%, #334155 100%);
    overflow: hidden;
    flex-shrink: 0;
}

.header-bg {
    position: absolute;
    inset: 0;
    background-image:
        radial-gradient(
            circle at 20% 80%,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 50%
        ),
        radial-gradient(
            circle at 80% 20%,
            rgba(255, 255, 255, 0.08) 0%,
            transparent 40%
        );
    pointer-events: none;
}

.header-content {
    position: relative;
    z-index: 1;
}

.header-icon {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    backdrop-filter: blur(10px);

    svg {
        width: 24px;
        height: 24px;
        color: white;
    }
}

.modal-title {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin: 0 0 4px 0;
    letter-spacing: -0.02em;
}

.modal-subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
}

.btn-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.15);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;

    svg {
        width: 16px;
        height: 16px;
        color: white;
    }

    &:active {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(0.95);
    }
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

.info-section {
    margin-bottom: 20px;
}

.section-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 10px;
    padding-left: 4px;
}

.info-card {
    background: var(--bg-card);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.info-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-light);

    &:last-child {
        border-bottom: none;
    }
}

.info-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
        width: 18px;
        height: 18px;
    }

    &.tenant {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
    }

    &.house {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
    }
}

.info-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.info-label {
    font-size: 12px;
    color: var(--text-secondary);
}

.info-value {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-main);
}

.usage-summary {
    margin-bottom: 20px;
}

.summary-header {
    margin-bottom: 10px;
}

.summary-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-left: 4px;
}

.summary-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.summary-card {
    background: var(--bg-card);
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    gap: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    &.electric {
        border-left: 4px solid #f59e0b;
    }

    &.water {
        border-left: 4px solid #3b82f6;
    }
}

.summary-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
        width: 24px;
        height: 24px;
        color: white;
    }

    .electric & {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .water & {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    }
}

.summary-content {
    flex: 1;
}

.summary-title {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.summary-value-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 4px;
}

.summary-num {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-main);

    .electric & {
        color: #d97706;
    }

    .water & {
        color: #1d4ed8;
    }
}

.summary-unit {
    font-size: 13px;
    color: var(--text-secondary);
}

.summary-daily {
    font-size: 11px;
    color: var(--text-placeholder);
}

.meter-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;
}

.meter-card {
    background: var(--bg-card);
    border-radius: var(--radius-md);
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    &.electric {
        border-left: 4px solid #f59e0b;
    }

    &.water {
        border-left: 4px solid #3b82f6;
    }
}

.meter-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.meter-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        width: 22px;
        height: 22px;
        color: white;
    }

    .electric & {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .water & {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    }
}

.meter-title {
    flex: 1;
}

.title-text {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 2px;
}

.title-unit {
    font-size: 12px;
    color: var(--text-secondary);
}

.meter-reads {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: var(--bg-input);
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
}

.read-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.read-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 12px;

    &.start {
        background: #e2e8f0;
        color: #475569;
    }

    &.end {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        color: #1d4ed8;
    }

    .water &.end {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        color: #1d4ed8;
    }
}

.read-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-main);
}

.read-arrow {
    svg {
        width: 20px;
        height: 20px;
        color: var(--text-placeholder);
    }
}

.meter-result {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    margin-bottom: 12px;
}

.result-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;

    &:not(:last-child) {
        border-bottom: 1px dashed var(--border-light);
    }

    &.total {
        border-bottom: none;
        padding-top: 12px;
        margin-top: 4px;
    }
}

.result-label {
    font-size: 13px;
    color: var(--text-secondary);
}

.result-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-main);

    &.highlight {
        font-weight: 700;

        .electric & {
            color: #d97706;
        }

        .water & {
            color: #1d4ed8;
        }
    }

    .total & {
        font-size: 18px;
        font-weight: 700;

        .electric & {
            color: #d97706;
        }

        .water & {
            color: #1d4ed8;
        }
    }
}

.meter-bar {
    margin-top: 4px;
}

.bar-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.bar-title {
    font-size: 12px;
    color: var(--text-secondary);
}

.bar-percent {
    font-size: 12px;
    font-weight: 600;

    .electric & {
        color: #d97706;
    }

    .water & {
        color: #3b82f6;
    }
}

.bar-track {
    height: 8px;
    background: var(--bg-input);
    border-radius: 4px;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;

    &.electric {
        background: linear-gradient(90deg, #fcd34d 0%, #f59e0b 100%);
    }

    &.water {
        background: linear-gradient(90deg, #93c5fd 0%, #3b82f6 100%);
    }
}

.cost-summary {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    border-radius: var(--radius-md);
    padding: 20px;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cost-summary .summary-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    text-transform: none;
    letter-spacing: 0;
    padding-left: 0;
}

.summary-total {
    display: flex;
    align-items: baseline;
    gap: 2px;
}

.total-currency {
    font-size: 16px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
}

.total-amount {
    font-size: 28px;
    font-weight: 700;
    color: white;
}
</style>

<template>
  <Dialog v-model="dialogVisible" title="智能采购建议" width="900px" :close-on-click-modal="false">
    <!-- 药品基本信息 -->
    <div class="drug-info-section" v-if="drugInfo">
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <Icon icon="ep:medicine-box" class="header-icon" />
            <span class="header-title">药品信息</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <span class="info-label">药品编码：</span>
              <span class="info-value">{{ drugInfo.hosDrugId }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="info-label">药品名称：</span>
              <span class="info-value">{{ drugInfo.productName }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="info-label">当前库存：</span>
              <span class="info-value" :class="getStockStatusClass(drugInfo.currentStock)">
                {{ drugInfo.currentStock || 0 }}
              </span>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 分析结果展示 -->
    <div class="analysis-section">
      <el-row :gutter="20">
        <!-- 需求分析 -->
        <el-col :span="12">
          <el-card class="analysis-card">
            <template #header>
              <div class="card-header">
                <Icon icon="ep:trend-charts" class="header-icon trend-icon" />
                <span class="header-title">需求分析</span>
              </div>
            </template>
            <div class="demand-analysis">
              <div class="demand-chart" ref="demandChartRef"></div>
              <div class="demand-summary">
                <div class="summary-item">
                  <span class="summary-label">月均消耗：</span>
                  <span class="summary-value">{{ demandAnalysis.monthlyConsumption }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">预计需求：</span>
                  <span class="summary-value">{{ demandAnalysis.expectedDemand }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">季节系数：</span>
                  <span class="summary-value">{{ demandAnalysis.seasonalFactor }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 供应商分析 -->
        <el-col :span="12">
          <el-card class="analysis-card">
            <template #header>
              <div class="card-header">
                <Icon icon="ep:office-building" class="header-icon supplier-icon" />
                <span class="header-title">供应商分析</span>
              </div>
            </template>
            <div class="supplier-analysis">
              <div class="supplier-list">
                <div
                  class="supplier-item"
                  v-for="supplier in supplierOptions"
                  :key="supplier.id"
                  :class="{ 'recommended': supplier.recommended }"
                >
                  <div class="supplier-header">
                    <span class="supplier-name">{{ supplier.name }}</span>
                    <el-tag v-if="supplier.recommended" type="success" size="small">推荐</el-tag>
                  </div>
                  <div class="supplier-details">
                    <div class="detail-row">
                      <span class="detail-label">价格：</span>
                      <span class="detail-value">¥{{ supplier.price.toFixed(2) }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">交期：</span>
                      <span class="detail-value">{{ supplier.leadTime }}天</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">质量评级：</span>
                      <el-rate v-model="supplier.qualityRating" disabled size="small" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 采购建议 -->
    <div class="advice-section">
      <el-card class="advice-card">
        <template #header>
          <div class="card-header">
            <Icon icon="ep:shopping-cart" class="header-icon advice-icon" />
            <span class="header-title">智能采购建议</span>
            <div class="confidence-indicator">
              <el-tag :type="getConfidenceType()" size="small">
                置信度: {{ (purchaseAdvice.confidence * 100).toFixed(1) }}%
              </el-tag>
            </div>
          </div>
        </template>

        <div class="advice-content">
          <el-row :gutter="20">
            <el-col :span="16">
              <div class="advice-details">
                <el-form :model="purchaseAdvice" label-width="120px" class="advice-form">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="建议采购量">
                        <el-input-number
                          v-model="purchaseAdvice.recommendedQuantity"
                          :min="1"
                          class="w-full"
                          @change="calculateCosts"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="建议供应商">
                        <el-select v-model="purchaseAdvice.recommendedSupplier" class="w-full">
                          <el-option
                            v-for="supplier in supplierOptions"
                            :key="supplier.id"
                            :label="supplier.name"
                            :value="supplier.id"
                          />
                        </el-select>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="预计到货时间">
                        <el-date-picker
                          v-model="purchaseAdvice.expectedDelivery"
                          type="date"
                          placeholder="选择到货日期"
                          class="w-full"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="紧急程度">
                        <el-select v-model="purchaseAdvice.urgency" class="w-full">
                          <el-option label="低" value="low" />
                          <el-option label="中" value="medium" />
                          <el-option label="高" value="high" />
                          <el-option label="紧急" value="critical" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-form-item label="采购原因">
                    <el-checkbox-group v-model="purchaseAdvice.reasons">
                      <el-checkbox value="stock_low">库存不足</el-checkbox>
                      <el-checkbox value="seasonal_demand">季节性需求</el-checkbox>
                      <el-checkbox value="price_advantage">价格优势</el-checkbox>
                      <el-checkbox value="quality_improvement">质量提升</el-checkbox>
                    </el-checkbox-group>
                  </el-form-item>

                  <el-form-item label="备注说明">
                    <el-input
                      v-model="purchaseAdvice.notes"
                      type="textarea"
                      :rows="3"
                      placeholder="输入补充说明"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </el-col>

            <el-col :span="8">
              <div class="cost-analysis">
                <h4 class="analysis-title">成本分析</h4>
                <div class="cost-items">
                  <div class="cost-item">
                    <span class="cost-label">采购成本：</span>
                    <span class="cost-value">¥{{ formatAmount(costAnalysis.purchaseCost) }}</span>
                  </div>
                  <div class="cost-item">
                    <span class="cost-label">运输成本：</span>
                    <span class="cost-value">¥{{ formatAmount(costAnalysis.shippingCost) }}</span>
                  </div>
                  <div class="cost-item">
                    <span class="cost-label">存储成本：</span>
                    <span class="cost-value">¥{{ formatAmount(costAnalysis.storageCost) }}</span>
                  </div>
                  <div class="cost-item total">
                    <span class="cost-label">总成本：</span>
                    <span class="cost-value">¥{{ formatAmount(costAnalysis.totalCost) }}</span>
                  </div>
                </div>

                <div class="roi-analysis">
                  <h4 class="analysis-title">投资回报</h4>
                  <div class="roi-item">
                    <span class="roi-label">预期节约：</span>
                    <span class="roi-value positive">¥{{ formatAmount(costAnalysis.expectedSavings) }}</span>
                  </div>
                  <div class="roi-item">
                    <span class="roi-label">回报率：</span>
                    <span class="roi-value positive">{{ (costAnalysis.roi * 100).toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <!-- 风险提示 -->
    <div class="risk-section" v-if="riskFactors.length > 0">
      <el-alert
        title="风险提示"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          <ul class="risk-list">
            <li v-for="risk in riskFactors" :key="risk.type" class="risk-item">
              <Icon :icon="risk.icon" class="risk-icon" />
              <span class="risk-text">{{ risk.description }}</span>
            </li>
          </ul>
        </template>
      </el-alert>
    </div>

    <!-- 对话框底部操作 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="info" @click="saveDraft">保存草稿</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="submitting">
          {{ submitting ? '生成中...' : '生成采购单' }}
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

defineOptions({ name: 'PurchaseAdviceDialog' })

// ========== Props 和 Emits ==========

interface Props {
  modelValue: boolean
  drugInfo: any
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  drugInfo: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [data: any]
}>()

// ========== 响应式数据 ==========

const submitting = ref(false)
const demandChartRef = ref<HTMLElement>()
let demandChart: echarts.ECharts | null = null

// 对话框显示控制
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 需求分析数据
const demandAnalysis = ref({
  monthlyConsumption: 150,
  expectedDemand: 180,
  seasonalFactor: 1.2
})

// 供应商选项
const supplierOptions = ref([
  {
    id: 'supplier1',
    name: '华东医药供应商',
    price: 25.80,
    leadTime: 7,
    qualityRating: 4,
    recommended: true
  },
  {
    id: 'supplier2',
    name: '北京康美医药',
    price: 26.50,
    leadTime: 5,
    qualityRating: 5,
    recommended: false
  },
  {
    id: 'supplier3',
    name: '上海医药集团',
    price: 24.90,
    leadTime: 10,
    qualityRating: 4,
    recommended: false
  }
])

// 采购建议数据
const purchaseAdvice = ref({
  recommendedQuantity: 500,
  recommendedSupplier: 'supplier1',
  expectedDelivery: null,
  urgency: 'medium',
  reasons: ['stock_low'],
  notes: '',
  confidence: 0.85
})

// 成本分析数据
const costAnalysis = ref({
  purchaseCost: 12900,
  shippingCost: 200,
  storageCost: 150,
  totalCost: 13250,
  expectedSavings: 800,
  roi: 0.06
})

// 风险因素
const riskFactors = ref([
  {
    type: 'quality',
    icon: 'ep:warning',
    description: '该供应商最近质量评级有所下降，建议加强质量检查'
  },
  {
    type: 'delivery',
    icon: 'ep:clock',
    description: '供应商交货期可能延长，建议提前安排采购计划'
  }
])

// ========== 生命周期 ==========

onMounted(() => {
  initDemandChart()
})

// ========== 监听器 ==========

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    nextTick(() => {
      initDemandChart()
      calculateInitialAdvice()
    })
  }
})

// ========== 方法 ==========

/**
 * 初始化需求图表
 */
const initDemandChart = () => {
  if (!demandChartRef.value) return

  if (demandChart) {
    demandChart.dispose()
  }

  demandChart = echarts.init(demandChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      name: '消耗量'
    },
    series: [
      {
        name: '历史消耗',
        type: 'line',
        data: [120, 132, 101, 134, 90, 150],
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '预测消耗',
        type: 'line',
        data: [null, null, null, null, null, 150, 160, 170],
        smooth: true,
        itemStyle: { color: '#67C23A' },
        lineStyle: { type: 'dashed' }
      }
    ]
  }

  demandChart.setOption(option)
}

/**
 * 计算初始建议
 */
const calculateInitialAdvice = () => {
  if (!props.drugInfo) return

  const currentStock = props.drugInfo.currentStock || 0
  const safetyStock = props.drugInfo.safetyStock || 100
  const monthlyConsumption = demandAnalysis.value.monthlyConsumption

  // 计算建议采购量
  const recommendedQuantity = Math.max(
    safetyStock * 2 - currentStock,
    monthlyConsumption * 2
  )

  purchaseAdvice.value.recommendedQuantity = Math.round(recommendedQuantity)

  // 重新计算成本
  calculateCosts()
}

/**
 * 计算成本
 */
const calculateCosts = () => {
  const quantity = purchaseAdvice.value.recommendedQuantity
  const supplier = supplierOptions.value.find(
    s => s.id === purchaseAdvice.value.recommendedSupplier
  )

  if (supplier) {
    const purchaseCost = quantity * supplier.price
    const shippingCost = Math.max(200, purchaseCost * 0.02)
    const storageCost = purchaseCost * 0.01
    const totalCost = purchaseCost + shippingCost + storageCost

    costAnalysis.value = {
      purchaseCost,
      shippingCost,
      storageCost,
      totalCost,
      expectedSavings: totalCost * 0.06,
      roi: 0.06
    }
  }
}

/**
 * 获取库存状态样式
 */
const getStockStatusClass = (stock: number): string => {
  if (stock < 50) return 'stock-critical'
  if (stock < 100) return 'stock-warning'
  return 'stock-normal'
}

/**
 * 获取置信度类型
 */
const getConfidenceType = (): string => {
  const confidence = purchaseAdvice.value.confidence
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.6) return 'warning'
  return 'danger'
}

/**
 * 格式化金额
 */
const formatAmount = (amount: number): string => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  }
  return amount.toFixed(2)
}

/**
 * 保存草稿
 */
const saveDraft = () => {
  ElMessage.success('采购建议已保存为草稿')
}

/**
 * 确认操作
 */
const handleConfirm = async () => {
  submitting.value = true

  try {
    // 模拟生成采购单
    await new Promise(resolve => setTimeout(resolve, 2000))

    const purchaseOrder = {
      drugInfo: props.drugInfo,
      advice: purchaseAdvice.value,
      cost: costAnalysis.value,
      supplier: supplierOptions.value.find(
        s => s.id === purchaseAdvice.value.recommendedSupplier
      ),
      generatedAt: new Date().toISOString()
    }

    emit('confirm', purchaseOrder)
    ElMessage.success('采购单已生成')
    dialogVisible.value = false

  } catch (error) {
    ElMessage.error('生成采购单失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 取消操作
 */
const handleCancel = () => {
  dialogVisible.value = false
}

// ========== 组件销毁 ==========

onUnmounted(() => {
  if (demandChart) {
    demandChart.dispose()
  }
})
</script>

<style scoped>
.drug-info-section {
  margin-bottom: 20px;
}

.info-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.header-icon {
  margin-right: 8px;
  color: #409eff;
}

.trend-icon {
  color: #67c23a;
}

.supplier-icon {
  color: #e6a23c;
}

.advice-icon {
  color: #409eff;
}

.info-item {
  margin-bottom: 8px;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-weight: 500;
  margin-left: 8px;
}

.stock-critical {
  color: #f56c6c;
  font-weight: 600;
}

.stock-warning {
  color: #e6a23c;
  font-weight: 600;
}

.stock-normal {
  color: #67c23a;
  font-weight: 600;
}

.analysis-section {
  margin-bottom: 20px;
}

.analysis-card {
  border-radius: 8px;
  height: 100%;
}

.demand-analysis {
  padding: 0;
}

.demand-chart {
  height: 200px;
  margin-bottom: 16px;
}

.demand-summary {
  display: grid;
  gap: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.summary-label {
  color: #606266;
  font-size: 14px;
}

.summary-value {
  color: #303133;
  font-weight: 500;
}

.supplier-analysis {
  padding: 0;
}

.supplier-list {
  display: grid;
  gap: 12px;
}

.supplier-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
}

.supplier-item.recommended {
  border-color: #67c23a;
  background: #f0f9ff;
}

.supplier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.supplier-name {
  font-weight: 600;
  color: #303133;
}

.supplier-details {
  display: grid;
  gap: 4px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  color: #909399;
  font-size: 12px;
}

.detail-value {
  color: #606266;
  font-size: 12px;
}

.advice-section {
  margin-bottom: 20px;
}

.advice-card {
  border-radius: 8px;
}

.confidence-indicator {
  margin-left: auto;
}

.advice-content {
  padding: 0;
}

.advice-form {
  margin: 0;
}

.cost-analysis {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.analysis-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
}

.cost-items {
  margin-bottom: 20px;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}

.cost-item.total {
  border-top: 2px solid #e4e7ed;
  border-bottom: none;
  padding-top: 12px;
  margin-top: 8px;
  font-weight: 600;
}

.cost-label {
  color: #606266;
  font-size: 14px;
}

.cost-value {
  color: #303133;
  font-weight: 500;
}

.roi-analysis {
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
}

.roi-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.roi-label {
  color: #606266;
  font-size: 14px;
}

.roi-value {
  font-weight: 600;
}

.roi-value.positive {
  color: #67c23a;
}

.risk-section {
  margin-bottom: 20px;
}

.risk-list {
  margin: 0;
  padding-left: 20px;
}

.risk-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.risk-icon {
  color: #e6a23c;
  margin-right: 8px;
}

.risk-text {
  color: #606266;
  font-size: 14px;
}

.dialog-footer {
  text-align: right;
}

.w-full {
  width: 100%;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>

<template>
  <Dialog v-model="dialogVisible" title="医疗机构资源详情" width="1000px">
    <div v-loading="loading" class="resource-detail">
      <!-- 机构基本信息 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <Icon icon="ep:office-building" />
            <span>机构基本信息</span>
          </div>
        </template>
        <div class="detail-content">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">机构代码：</span>
                <span class="value">{{ resourceData.hospitalCode }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">机构名称：</span>
                <span class="value">{{ resourceData.organizationName }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">统计日期：</span>
                <span class="value">{{ formatStatDate(resourceData.statDate) }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">系统编码：</span>
                <span class="value">{{ resourceData.domainCode }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">组织机构代码：</span>
                <span class="value">{{ resourceData.organizationCode }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">上报日期：</span>
                <span class="value">{{ formatUploadDate(resourceData.uploadDate) }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 资源配置情况 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <Icon icon="ep:collection" />
            <span>资源配置情况</span>
          </div>
        </template>
        <div class="resource-metrics">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="metric-card bed-metric">
                <div class="metric-icon">
                  <Icon icon="ep:house" />
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ resourceData.bedsNum || 0 }}</div>
                  <div class="metric-label">实有床位数</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="metric-card doctor-metric">
                <div class="metric-icon">
                  <Icon icon="ep:user" />
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ resourceData.pracDockerNum || 0 }}</div>
                  <div class="metric-label">执业医师数</div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="metric-card assistant-metric">
                <div class="metric-icon">
                  <Icon icon="ep:user-filled" />
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ resourceData.assDockerNum || 0 }}</div>
                  <div class="metric-label">执业助理医师数</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 服务能力分析 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <Icon icon="ep:data-analysis" />
            <span>服务能力分析</span>
          </div>
        </template>
        <div class="service-analysis">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="analysis-item">
                <div class="analysis-title">诊疗服务情况</div>
                <div class="analysis-content">
                  <div class="service-data">
                    <div class="data-item">
                      <span class="data-value visit-color">{{ formatNumber(resourceData.visitCount) }}</span>
                      <span class="data-label">总诊疗人次</span>
                    </div>
                    <div class="data-item">
                      <span class="data-value discharge-color">{{ formatNumber(resourceData.leaveHosCount) }}</span>
                      <span class="data-label">出院人数</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="analysis-item">
                <div class="analysis-title">人均服务效率</div>
                <div class="analysis-content">
                  <div class="efficiency-metrics">
                    <div class="efficiency-item">
                      <span class="efficiency-label">人均诊疗量：</span>
                      <span class="efficiency-value">{{ calculatePerDoctorVisit() }} 人次/医师</span>
                    </div>
                    <div class="efficiency-item">
                      <span class="efficiency-label">床位使用率：</span>
                      <span class="efficiency-value">{{ calculateBedUtilization() }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 药品收入分析 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <Icon icon="ep:money" />
            <span>药品收入分析</span>
          </div>
        </template>
        <div class="revenue-analysis">
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="revenue-overview">
                <div class="revenue-main">
                  <div class="main-revenue">
                    <div class="revenue-amount">{{ formatAmount(resourceData.drugSellAmount) }}</div>
                    <div class="revenue-label">本季度药品总收入</div>
                  </div>
                  <div class="revenue-details">
                    <div class="detail-item">
                      <span class="detail-label">人均药品费用：</span>
                      <span class="detail-value">{{ calculatePerPatientCost() }} 元</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">药品收入占比：</span>
                      <span class="detail-value">{{ calculateDrugRevenueRatio() }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 中医药发展情况 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <Icon icon="ep:menu" />
            <span>中医药发展情况</span>
          </div>
        </template>
        <div class="tcm-analysis">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="tcm-category">
                <div class="category-title">中药饮片</div>
                <div class="category-data">
                  <div class="tcm-item">
                    <span class="tcm-label">采购金额：</span>
                    <span class="tcm-value purchase-color">{{ formatAmount(resourceData.ypPurchaseAmount) }}</span>
                  </div>
                  <div class="tcm-item">
                    <span class="tcm-label">销售金额：</span>
                    <span class="tcm-value sale-color">{{ formatAmount(resourceData.ypSellAmount) }}</span>
                  </div>
                  <div class="tcm-item">
                    <span class="tcm-label">毛利率：</span>
                    <span class="tcm-value profit-color">{{ calculateYpProfitRate() }}%</span>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="tcm-category">
                <div class="category-title">中药颗粒剂</div>
                <div class="category-data">
                  <div class="tcm-item">
                    <span class="tcm-label">采购金额：</span>
                    <span class="tcm-value purchase-color">{{ formatAmount(resourceData.klPurchaseAmount) }}</span>
                  </div>
                  <div class="tcm-item">
                    <span class="tcm-label">销售金额：</span>
                    <span class="tcm-value sale-color">{{ formatAmount(resourceData.klSellAmount) }}</span>
                  </div>
                  <div class="tcm-item">
                    <span class="tcm-label">毛利率：</span>
                    <span class="tcm-value profit-color">{{ calculateKlProfitRate() }}%</span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>

          <el-divider />

          <div class="tcm-summary">
            <div class="summary-title">中医药总体情况</div>
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="summary-item">
                  <div class="summary-value">{{ formatAmount(getTotalTcmPurchase()) }}</div>
                  <div class="summary-label">总采购金额</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="summary-item">
                  <div class="summary-value">{{ formatAmount(getTotalTcmSale()) }}</div>
                  <div class="summary-label">总销售金额</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="summary-item">
                  <div class="summary-value">{{ calculateTcmRatio() }}%</div>
                  <div class="summary-label">中医药占比</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-card>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
defineOptions({ name: 'HospitalResourceDialog' })

const dialogVisible = ref(false)
const loading = ref(false)
const resourceData = ref({})

/** 打开对话框 */
const open = (data) => {
  dialogVisible.value = true
  resourceData.value = data
}

/** 格式化统计日期 */
const formatStatDate = (date: string) => {
  if (!date) return '-'
  return date.replace(/(\d{4})(\d{2})/, '$1年$2月')
}

/** 格式化上报日期 */
const formatUploadDate = (date: string) => {
  if (!date) return '-'
  return date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
}

/** 格式化数字 */
const formatNumber = (num: number) => {
  if (!num) return '0'
  return num.toLocaleString()
}

/** 格式化金额 */
const formatAmount = (amount: number) => {
  if (!amount) return '0'
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + ' 万元'
  }
  return amount.toLocaleString() + ' 元'
}

/** 计算人均诊疗量 */
const calculatePerDoctorVisit = () => {
  const totalDoctors = (resourceData.value.pracDockerNum || 0) + (resourceData.value.assDockerNum || 0)
  if (totalDoctors === 0) return 0
  return Math.round((resourceData.value.visitCount || 0) / totalDoctors)
}

/** 计算床位使用率 */
const calculateBedUtilization = () => {
  if (!resourceData.value.bedsNum || !resourceData.value.leaveHosCount) return 0
  // 简化计算：出院人数 / 床位数 * 30天 / 90天（季度）
  const utilization = (resourceData.value.leaveHosCount / resourceData.value.bedsNum) * (30 / 90) * 100
  return Math.min(utilization, 100).toFixed(1)
}

/** 计算人均药品费用 */
const calculatePerPatientCost = () => {
  if (!resourceData.value.visitCount || !resourceData.value.drugSellAmount) return 0
  return Math.round(resourceData.value.drugSellAmount / resourceData.value.visitCount)
}

/** 计算药品收入占比 */
const calculateDrugRevenueRatio = () => {
  // 假设总收入为药品收入的1.5倍（简化计算）
  if (!resourceData.value.drugSellAmount) return 0
  return ((resourceData.value.drugSellAmount / (resourceData.value.drugSellAmount * 1.5)) * 100).toFixed(1)
}

/** 计算中药饮片毛利率 */
const calculateYpProfitRate = () => {
  const purchase = resourceData.value.ypPurchaseAmount || 0
  const sale = resourceData.value.ypSellAmount || 0
  if (purchase === 0) return 0
  return (((sale - purchase) / sale) * 100).toFixed(1)
}

/** 计算中药颗粒剂毛利率 */
const calculateKlProfitRate = () => {
  const purchase = resourceData.value.klPurchaseAmount || 0
  const sale = resourceData.value.klSellAmount || 0
  if (purchase === 0) return 0
  return (((sale - purchase) / sale) * 100).toFixed(1)
}

/** 获取中医药总采购金额 */
const getTotalTcmPurchase = () => {
  return (resourceData.value.ypPurchaseAmount || 0) + (resourceData.value.klPurchaseAmount || 0)
}

/** 获取中医药总销售金额 */
const getTotalTcmSale = () => {
  return (resourceData.value.ypSellAmount || 0) + (resourceData.value.klSellAmount || 0)
}

/** 计算中医药占比 */
const calculateTcmRatio = () => {
  const tcmSale = getTotalTcmSale()
  const totalDrugSale = resourceData.value.drugSellAmount || 0
  if (totalDrugSale === 0) return 0
  return ((tcmSale / totalDrugSale) * 100).toFixed(1)
}

defineExpose({ open })
</script>

<style scoped>
.resource-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.detail-content {
  padding: 10px 0;
}

.detail-item {
  display: flex;
  margin-bottom: 12px;
  font-size: 14px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #606266;
  width: 120px;
  flex-shrink: 0;
  font-weight: 500;
}

.value {
  color: #303133;
  flex: 1;
  word-break: break-all;
}

.resource-metrics {
  padding: 10px 0;
}

.metric-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bed-metric {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.doctor-metric {
  background: linear-gradient(135deg, #f3e5f5 0%, #ce93d8 100%);
}

.assistant-metric {
  background: linear-gradient(135deg, #e8f5e8 0%, #a5d6a7 100%);
}

.metric-icon {
  font-size: 32px;
  margin-right: 15px;
  color: #1890ff;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.service-analysis,
.revenue-analysis,
.tcm-analysis {
  padding: 10px 0;
}

.analysis-item {
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  height: 100%;
}

.analysis-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  text-align: center;
}

.service-data {
  display: flex;
  justify-content: space-around;
}

.data-item {
  text-align: center;
}

.data-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
}

.data-label {
  font-size: 12px;
  color: #666;
}

.visit-color {
  color: #1890ff;
}

.discharge-color {
  color: #52c41a;
}

.efficiency-metrics {
  space-y: 10px;
}

.efficiency-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e8e8e8;
}

.efficiency-item:last-child {
  border-bottom: none;
}

.efficiency-label {
  color: #666;
  font-size: 14px;
}

.efficiency-value {
  color: #303133;
  font-weight: 600;
}

.revenue-overview {
  background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%);
  padding: 20px;
  border-radius: 8px;
}

.revenue-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.main-revenue {
  text-align: left;
}

.revenue-amount {
  font-size: 32px;
  font-weight: bold;
  color: #ff4d4f;
  margin-bottom: 5px;
}

.revenue-label {
  font-size: 14px;
  color: #666;
}

.revenue-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-label {
  color: #666;
  font-size: 14px;
}

.detail-value {
  color: #303133;
  font-weight: 600;
}

.tcm-category {
  background: #f6ffed;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #d9f7be;
}

.category-title {
  font-size: 16px;
  font-weight: 600;
  color: #389e0d;
  margin-bottom: 15px;
  text-align: center;
}

.category-data {
  space-y: 10px;
}

.tcm-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e8f5e8;
}

.tcm-item:last-child {
  border-bottom: none;
}

.tcm-label {
  color: #666;
  font-size: 14px;
}

.tcm-value {
  font-weight: 600;
}

.purchase-color {
  color: #722ed1;
}

.sale-color {
  color: #52c41a;
}

.profit-color {
  color: #fa8c16;
}

.tcm-summary {
  margin-top: 10px;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  text-align: center;
}

.summary-item {
  text-align: center;
  padding: 15px;
  background: #fafafa;
  border-radius: 6px;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 5px;
}

.summary-label {
  font-size: 12px;
  color: #666;
}
</style>

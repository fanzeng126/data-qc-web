<template>
  <div class="usage-container">
    <!-- 页面头部 -->
    <PageHeader
      title="药品使用情况管理"
      content="监控药品销售和使用数据，支持价格异常检测和数据修复，确保药品使用信息的准确性和合规性"
    >
      <template #extra>
        <el-button type="primary" @click="openForm('create')" v-hasPermi="['drug:usage:create']">
          <Icon icon="ep:plus" class="mr-5px" />
          新增记录
        </el-button>
        <el-button
          type="success"
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['drug:usage:export']"
        >
          <Icon icon="ep:download" class="mr-5px" />
          导出数据
        </el-button>
      </template>
    </PageHeader>

    <!-- 统计概览卡片 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="今日销售金额"
            :value="statistics.todayAmount || 0"
            icon="ShoppingCart"
            color="#409eff"
            suffix="元"
            description="今日累计"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="今日销售笔数"
            :value="statistics.todayCount || 0"
            icon="DocumentCopy"
            color="#67c23a"
            description="销售记录"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="价格异常记录"
            :value="statistics.priceAbnormal || 0"
            icon="Warning"
            color="#e6a23c"
            description="需要关注"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="数据修复率"
            :value="statistics.fixRate || 0"
            suffix="%"
            icon="Tools"
            color="#909399"
            :trend="statistics.fixRateTrend || 0"
            :loading="statsLoading"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 搜索工作栏 -->
    <el-card class="search-card" shadow="never">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="100px"
        class="search-form"
      >
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="药品编码" prop="ypid">
              <el-input
                v-model="queryParams.ypid"
                placeholder="请输入YPID编码"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="产品名称" prop="productName">
              <el-input
                v-model="queryParams.productName"
                placeholder="请输入产品名称"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="销售日期" prop="usageDate">
              <el-date-picker
                v-model="queryParams.usageDate"
                type="daterange"
                value-format="YYYY-MM-DD"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="价格状态" prop="priceStatus">
              <el-select
                v-model="queryParams.priceStatus"
                placeholder="请选择价格状态"
                clearable
                style="width: 100%"
              >
                <el-option label="全部" value="" />
                <el-option label="正常" :value="0" />
                <el-option label="价格过高" :value="1" />
                <el-option label="价格过低" :value="2" />
                <el-option label="价格异常" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="修复状态" prop="fixStatus">
              <el-select
                v-model="queryParams.fixStatus"
                placeholder="请选择修复状态"
                clearable
                style="width: 100%"
              >
                <el-option label="全部" value="" />
                <el-option label="未修复" :value="0" />
                <el-option label="自动修复" :value="1" />
                <el-option label="手动修复" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="机构名称" prop="organizationName">
              <el-input
                v-model="queryParams.organizationName"
                placeholder="请输入机构名称"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24" style="text-align: center">
            <el-form-item>
              <el-button type="primary" @click="handleQuery">
                <Icon icon="ep:search" class="mr-5px" />
                搜索
              </el-button>
              <el-button @click="resetQuery">
                <Icon icon="ep:refresh" class="mr-5px" />
                重置
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 数据列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title">使用记录列表</span>
          <div class="table-actions">
            <el-button size="small" @click="handleRefresh" :loading="refreshing">
              <Icon icon="ep:refresh" class="mr-5px" />
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="销售日期" align="center" prop="usageDate" width="100" fixed="left">
          <template #default="{ row }">
            {{ formatDate(row.usageDate) }}
          </template>
        </el-table-column>
        <el-table-column label="药品信息" align="left" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="drug-info">
              <div class="drug-name">{{ row.productName }}</div>
              <div class="drug-code">
                <span>YPID: {{ row.ypid }}</span>
                <span v-if="row.hospitalDrugId">院内码: {{ row.hospitalDrugId }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="机构信息" align="center" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="org-info">
              <div>{{ row.organizationName }}</div>
              <div class="text-muted">{{ row.hospitalCode }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="销售数量" align="center" width="120">
          <template #default="{ row }">
            <div class="quantity-info">
              <div>包装: {{ formatNumber(row.usagePackQuantity) }}</div>
              <div class="text-muted">制剂: {{ formatNumber(row.usageDosageQuantity) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="销售价格" align="center" width="140">
          <template #default="{ row }">
            <div class="price-info">
              <div>包装: ¥{{ formatAmount(row.usagePackPrice) }}</div>
              <div class="text-muted">制剂: ¥{{ formatAmount(row.usageDosagePrice) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="销售总额" align="center" prop="usageTotalAmount" width="120">
          <template #default="{ row }">
            <span class="total-amount">¥{{ formatAmount(row.usageTotalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="价格状态" align="center" prop="priceStatus" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriceStatusType(row.priceStatus)" size="small" effect="plain">
              {{ getPriceStatusText(row.priceStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="修复状态" align="center" width="120">
          <template #default="{ row }">
            <div class="fix-status">
              <el-tag :type="getFixStatusType(row.fixStatus)" size="small">
                {{ getFixStatusText(row.fixStatus) }}
              </el-tag>
              <div v-if="row.fixRule" class="fix-rule">{{ row.fixRule }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="质控状态" align="center" prop="qcStatus" width="100">
          <template #default="{ row }">
            <el-tag :type="getQcStatusType(row.qcStatus)" size="small" effect="dark">
              {{ getQcStatusText(row.qcStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          align="center"
          prop="createTime"
          :formatter="dateFormatter"
          width="160"
        />
        <el-table-column label="操作" align="center" width="160" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button
                link
                type="primary"
                size="small"
                @click="openForm('update', scope.row.id)"
                v-hasPermi="['drug:usage:update']"
              >
                <Icon icon="ep:edit" class="mr-3px" />
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="handleDelete(scope.row.id)"
                v-hasPermi="['drug:usage:delete']"
              >
                <Icon icon="ep:delete" class="mr-3px" />
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </div>
    </el-card>

    <!-- 表单弹窗：添加/修改 -->
    <UsageForm ref="formRef" @success="handleFormSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { UsageApi, UsageVO } from '@/api/drug/data/usage'
import UsageForm from './UsageForm.vue'
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'

/** 药品使用情况管理页面 */
defineOptions({ name: 'Usage' })

const message = useMessage()
const { t } = useI18n()

// ========================= 响应式数据 =========================
const loading = ref(true)
const refreshing = ref(false)
const statsLoading = ref(true)
const list = ref<UsageVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  ypid: undefined,
  productName: undefined,
  organizationName: undefined,
  usageDate: [],
  priceStatus: undefined,
  fixStatus: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

// 统计数据
const statistics = reactive({
  todayAmount: 0,
  todayCount: 0,
  priceAbnormal: 0,
  fixRate: 0,
  fixRateTrend: 0
})

// ========================= 生命周期 =========================
onMounted(() => {
  getList()
  loadStatistics()
})

// ========================= 核心方法 =========================

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await UsageApi.getUsagePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 加载统计数据 */
const loadStatistics = async () => {
  statsLoading.value = true
  try {
    // 获取今日数据
    const today = new Date().toISOString().split('T')[0]
    const todayData = await UsageApi.getUsagePage({
      pageNo: 1,
      pageSize: 100,
      usageDate: [today + ' 00:00:00', today + ' 23:59:59']
    })

    const todayList = todayData.list || []
    statistics.todayCount = todayList.length
    statistics.todayAmount = todayList.reduce((sum, item) => sum + (item.usageTotalAmount || 0), 0)

    // 获取所有数据统计
    const allData = await UsageApi.getUsagePage({ pageNo: 1, pageSize: 100 })
    const allList = allData.list || []
    statistics.priceAbnormal = allList.filter((item) => item.priceStatus !== 0).length

    // 计算修复率
    const needFixCount = allList.filter((item) => item.priceStatus !== 0).length
    const fixedCount = allList.filter((item) => item.fixStatus === 1 || item.fixStatus === 2).length
    statistics.fixRate = needFixCount > 0 ? Math.round((fixedCount / needFixCount) * 100) : 0
    statistics.fixRateTrend = 3 // 模拟趋势数据
  } catch (error) {
    console.error('加载统计数据失败:', error)
  } finally {
    statsLoading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 刷新操作 */
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([getList(), loadStatistics()])
    message.success('刷新成功')
  } finally {
    refreshing.value = false
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 表单成功回调 */
const handleFormSuccess = () => {
  getList()
  loadStatistics()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await UsageApi.deleteUsage(id)
    message.success(t('common.delSuccess'))
    await getList()
    await loadStatistics()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await UsageApi.exportUsage(queryParams)
    download.excel(data, '药品使用情况.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

// ========================= 工具方法 =========================

/** 格式化日期 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  return dateStr.split(' ')[0]
}

/** 格式化数字 */
const formatNumber = (num: number | undefined): string => {
  if (!num) return '0'
  return num.toLocaleString()
}

/** 格式化金额 */
const formatAmount = (amount: number | undefined): string => {
  if (!amount) return '0.00'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 获取价格状态类型 */
const getPriceStatusType = (status: number): string => {
  const types = {
    0: 'success',
    1: 'danger',
    2: 'warning',
    3: 'danger'
  }
  return types[status] || 'info'
}

/** 获取价格状态文本 */
const getPriceStatusText = (status: number): string => {
  const texts = {
    0: '正常',
    1: '价格过高',
    2: '价格过低',
    3: '价格异常'
  }
  return texts[status] || '未知'
}

/** 获取修复状态类型 */
const getFixStatusType = (status: number): string => {
  const types = {
    0: 'info',
    1: 'success',
    2: 'primary'
  }
  return types[status] || 'info'
}

/** 获取修复状态文本 */
const getFixStatusText = (status: number): string => {
  const texts = {
    0: '未修复',
    1: '自动修复',
    2: '手动修复'
  }
  return texts[status] || '未知'
}

/** 获取质控状态类型 */
const getQcStatusType = (status: number): string => {
  const types = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return types[status] || 'info'
}

/** 获取质控状态文本 */
const getQcStatusText = (status: number): string => {
  const texts = {
    0: '未质控',
    1: '质控通过',
    2: '质控失败'
  }
  return texts[status] || '未知'
}
</script>

<style scoped>
.usage-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.stats-overview {
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-form {
  margin-bottom: -18px;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: end;
  margin-top: 20px;
  padding: 20px;
}

/* 药品信息样式 */
.drug-info {
  text-align: left;
}

.drug-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.drug-code {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 12px;
}

/* 机构信息样式 */
.org-info {
  font-size: 13px;
  line-height: 1.4;
}

/* 数量和价格信息样式 */
.quantity-info,
.price-info {
  font-size: 13px;
  line-height: 1.5;
}

/* 总金额样式 */
.total-amount {
  font-weight: 600;
  color: #67c23a;
  font-size: 14px;
}

/* 修复状态样式 */
.fix-status {
  text-align: center;
}

.fix-rule {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .usage-container {
    padding: 10px;
  }

  .search-form :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .drug-code {
    flex-direction: column;
    gap: 2px;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* 卡片样式 */
:deep(.el-card) {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-card__header) {
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
  padding: 16px 20px;
}
</style>

<template>
  <div class="hospital-container">
    <!-- 页面头部 -->
    <PageHeader
      title="医疗机构信息管理"
      content="管理医疗机构基本信息，包括床位数、医师数、诊疗人次、药品收入等关键数据"
    >
      <template #extra>
        <el-button
          type="primary"
          @click="openForm('create')"
          v-hasPermi="['drug:hospital-info:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" />
          新增机构
        </el-button>
        <el-button
          type="success"
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['drug:hospital-info:export']"
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
            title="医疗机构总数"
            :value="statistics.totalCount || 0"
            icon="Hospital"
            color="#409eff"
            description="已登记机构"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="总床位数"
            :value="statistics.totalBedCount || 0"
            icon="HomeFilled"
            color="#67c23a"
            description="实有床位"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="执业医师总数"
            :value="statistics.totalDoctorCount || 0"
            icon="User"
            color="#e6a23c"
            description="含助理医师"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="质控通过率"
            :value="statistics.qcPassRate || 0"
            suffix="%"
            icon="CircleCheck"
            color="#909399"
            :trend="statistics.qcPassRateTrend || 0"
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
            <el-form-item label="机构代码" prop="hospitalCode">
              <el-input
                v-model="queryParams.hospitalCode"
                placeholder="请输入医疗机构代码"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="机构名称" prop="organizationName">
              <el-input
                v-model="queryParams.organizationName"
                placeholder="请输入组织机构名称"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="行政区划" prop="domainCode">
              <el-input
                v-model="queryParams.domainCode"
                placeholder="请输入省级行政区划代码"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="质控状态" prop="qcStatus">
              <el-select
                v-model="queryParams.qcStatus"
                placeholder="请选择质控状态"
                clearable
                style="width: 100%"
              >
                <el-option label="全部" value="" />
                <el-option label="未质控" :value="0" />
                <el-option label="质控通过" :value="1" />
                <el-option label="质控失败" :value="2" />
              </el-select>
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
          <span class="table-title">医疗机构列表</span>
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
        <el-table-column
          label="医疗机构代码"
          align="center"
          prop="hospitalCode"
          width="180"
          fixed="left"
        />
        <el-table-column
          label="机构名称"
          align="center"
          prop="organizationName"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column label="行政区划" align="center" prop="domainCode" width="100" />
        <el-table-column label="床位数" align="center" prop="bedCount" width="100">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ row.bedCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="医师数" align="center" width="120">
          <template #default="{ row }">
            <div class="doctor-info">
              <span>执业: {{ row.doctorCount || 0 }}</span>
              <span class="text-muted">助理: {{ row.assistantDoctorCount || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="总诊疗人次" align="center" prop="visitCount" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.visitCount) }}
          </template>
        </el-table-column>
        <el-table-column label="年度药品收入" align="center" prop="annualDrugIncome" width="140">
          <template #default="{ row }">
            <span class="income-value">¥{{ formatAmount(row.annualDrugIncome) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="中药销售情况" align="center" width="180">
          <template #default="{ row }">
            <div class="medicine-info">
              <div>饮片: ¥{{ formatAmount(row.ypSellAmount) }}</div>
              <div>颗粒剂: ¥{{ formatAmount(row.klSellAmount) }}</div>
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
                v-hasPermi="['drug:hospital-info:update']"
              >
                <Icon icon="ep:edit" class="mr-3px" />
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="handleDelete(scope.row.id)"
                v-hasPermi="['drug:hospital-info:delete']"
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
    <HospitalInfoForm ref="formRef" @success="handleFormSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { HospitalInfoApi, HospitalInfoVO } from '@/api/drug/data/hospital'
import HospitalInfoForm from './HospitalInfoForm.vue'
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'

/** 医疗机构基本情况 列表 */
defineOptions({ name: 'HospitalInfo' })

const message = useMessage()
const { t } = useI18n()

// ========================= 响应式数据 =========================
const loading = ref(true)
const refreshing = ref(false)
const statsLoading = ref(true)
const list = ref<HospitalInfoVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  hospitalCode: undefined,
  organizationName: undefined,
  domainCode: undefined,
  qcStatus: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

// 统计数据
const statistics = reactive({
  totalCount: 0,
  totalBedCount: 0,
  totalDoctorCount: 0,
  qcPassRate: 0,
  qcPassRateTrend: 0
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
    const data = await HospitalInfoApi.getHospitalInfoPage(queryParams)
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
    // 模拟统计数据，实际应从后端获取
    const data = await HospitalInfoApi.getHospitalInfoPage({ pageNo: 1, pageSize: 100 })
    const allData = data.list || []

    statistics.totalCount = data.total || 0
    statistics.totalBedCount = allData.reduce((sum, item) => sum + (item.bedCount || 0), 0)
    statistics.totalDoctorCount = allData.reduce(
      (sum, item) => sum + (item.doctorCount || 0) + (item.assistantDoctorCount || 0),
      0
    )

    const passCount = allData.filter((item) => item.qcStatus === 1).length
    statistics.qcPassRate = allData.length > 0 ? Math.round((passCount / allData.length) * 100) : 0
    statistics.qcPassRateTrend = 5 // 模拟趋势数据
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
    await HospitalInfoApi.deleteHospitalInfo(id)
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
    const data = await HospitalInfoApi.exportHospitalInfo(queryParams)
    download.excel(data, '医疗机构基本情况.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

// ========================= 工具方法 =========================

/** 格式化数字 */
const formatNumber = (num: number | undefined): string => {
  if (!num) return '0'
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

/** 格式化金额 */
const formatAmount = (amount: number | undefined): string => {
  if (!amount) return '0'
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
.hospital-container {
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

.doctor-info {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  line-height: 1.4;
}

.medicine-info {
  font-size: 12px;
  line-height: 1.5;
}

.income-value {
  font-weight: 600;
  color: #67c23a;
}

.text-muted {
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hospital-container {
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

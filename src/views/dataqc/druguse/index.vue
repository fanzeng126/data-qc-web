<template>
  <doc-alert title="药品使用情况管理" url="https://doc.iocoder.cn/drug-use/" />

  <ContentWrap>
    <!-- 搜索区域 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="药品编码" prop="hosDrugId">
        <el-input
          v-model="queryParams.hosDrugId"
          placeholder="请输入院内药品编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="药品名称" prop="productName">
        <el-input
          v-model="queryParams.productName"
          placeholder="请输入产品通用名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="科室名称" prop="departmentName">
        <el-input
          v-model="queryParams.departmentName"
          placeholder="请输入科室名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="医生姓名" prop="doctorName">
        <el-input
          v-model="queryParams.doctorName"
          placeholder="请输入医生姓名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="患者类型" prop="patientType">
        <el-select
          v-model="queryParams.patientType"
          placeholder="请选择患者类型"
          clearable
          class="!w-240px"
        >
          <el-option label="门诊" value="1" />
          <el-option label="急诊" value="2" />
          <el-option label="住院" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="销售日期" prop="sellDate">
        <el-date-picker
          v-model="queryParams.sellDate"
          value-format="YYYYMMDD"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['dataqc:drug-use:create']"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
        <el-button
          type="warning"
          plain
          @click="handleImport"
          v-hasPermi="['dataqc:drug-use:import']"
        >
          <Icon icon="ep:upload" /> 导入
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['dataqc:drug-use:export']"
        >
          <Icon icon="ep:download" />导出
        </el-button>
        <el-button
          type="primary"
          plain
          @click="openAnalysis"
          v-hasPermi="['dataqc:drug-use:query']"
        >
          <Icon icon="ep:data-analysis" />统计分析
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 数据概览卡片 -->
  <ContentWrap>
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="overview-content">
            <div class="overview-icon prescription-icon">
              <Icon icon="ep:document" />
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ overviewData.totalPrescriptions || 0 }}</div>
              <div class="overview-label">处方总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="overview-content">
            <div class="overview-icon amount-icon">
              <Icon icon="ep:money" />
            </div>
            <div class="overview-info">
              <div class="overview-value">¥{{ formatAmount(overviewData.totalAmount || 0) }}</div>
              <div class="overview-label">用药总金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="overview-content">
            <div class="overview-icon drug-icon">
              <Icon icon="fa-solid:notes-medical" />
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ overviewData.drugCount || 0 }}</div>
              <div class="overview-label">涉及药品</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card">
          <div class="overview-content">
            <div class="overview-icon department-icon">
              <Icon icon="ep:office-building" />
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ overviewData.departmentCount || 0 }}</div>
              <div class="overview-label">科室数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </ContentWrap>

  <!-- 基药使用率指标 -->
  <ContentWrap>
    <el-card class="metrics-card mb-4">
      <template #header>
        <div class="card-header">
          <span class="card-title">基药使用率监控</span>
          <div class="header-actions">
            <el-tag :type="getBaseDrugRateType()" size="small">
              {{ baseDrugRate }}% 基药使用率
            </el-tag>
          </div>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="metric-item">
            <div class="metric-label">基药金额</div>
            <div class="metric-value base-drug">¥{{ formatAmount(baseDrugData.baseDrugAmount || 0) }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="metric-item">
            <div class="metric-label">非基药金额</div>
            <div class="metric-value non-base-drug">¥{{ formatAmount(baseDrugData.nonBaseDrugAmount || 0) }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="metric-item">
            <div class="metric-label">使用率目标</div>
            <div class="metric-value target">≥ 60%</div>
            <div class="metric-desc">国家政策要求</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="药品编码" align="center" prop="hosDrugId" width="120" />
      <el-table-column
        label="产品名称"
        align="center"
        prop="productName"
        :show-overflow-tooltip="true"
        min-width="150"
      />
      <el-table-column label="销售数量" align="center" width="100">
        <template #default="scope">
          {{ scope.row.sellPackQuantity || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="销售单价" align="center" width="100">
        <template #default="scope">
          ¥{{ scope.row.sellPackPrice || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="销售金额" align="center" width="120">
        <template #default="scope">
          <span class="text-green-600 font-medium">
            ¥{{ formatAmount((scope.row.sellPackQuantity || 0) * (scope.row.sellPackPrice || 0)) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column
        label="科室"
        align="center"
        prop="departmentName"
        :show-overflow-tooltip="true"
        width="120"
      />
      <el-table-column
        label="医生"
        align="center"
        prop="doctorName"
        :show-overflow-tooltip="true"
        width="100"
      />
      <el-table-column label="患者类型" align="center" width="90">
        <template #default="scope">
          <el-tag :type="getPatientTypeTag(scope.row.patientType)" size="small">
            {{ getPatientTypeName(scope.row.patientType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="销售日期" align="center" prop="sellDate" width="110" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
          <div class="flex items-center justify-center">
            <el-button
              type="primary"
              link
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['dataqc:drug-use:update']"
            >
              <Icon icon="ep:edit" />修改
            </el-button>
            <el-button
              type="danger"
              link
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['dataqc:drug-use:delete']"
            >
              <Icon icon="ep:delete" />删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单对话框 -->
  <DrugUseForm ref="formRef" @success="getList" />

  <!-- 导入对话框 -->
  <DrugUseImportForm ref="importFormRef" @success="getList" />

  <!-- 分析对话框 -->
  <DrugUseAnalysisDialog ref="analysisDialogRef" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import * as DrugUseApi from '@/api/dataqc/drugUse'
import DrugUseForm from './DrugUseForm.vue'
import DrugUseImportForm from './DrugUseImportForm.vue'
import DrugUseAnalysisDialog from './DrugUseAnalysisDialog.vue'

defineOptions({ name: 'DataqcDrugUse' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref([])
const exportLoading = ref(false)
const overviewData = ref({})
const baseDrugData = ref({})
const baseDrugRate = ref(0)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  hosDrugId: undefined,
  productName: undefined,
  departmentName: undefined,
  doctorName: undefined,
  patientType: undefined,
  sellDate: []
})
const queryFormRef = ref()

// 组件引用
const formRef = ref()
const importFormRef = ref()
const analysisDialogRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DrugUseApi.getDrugUseInfoPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 获取概览数据 */
const getOverviewData = async () => {
  try {
    const data = await DrugUseApi.getDrugUseStatistics(queryParams)
    if (data && data.length > 0) {
      overviewData.value = data[0]
    }
  } catch (error) {
    console.error('获取概览数据失败', error)
  }
}

/** 获取基药数据 */
const getBaseDrugData = async () => {
  try {
    const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10).replace(/-/g, '')

    const data = await DrugUseApi.getBaseDrugAnalysis(startDate, endDate)
    baseDrugData.value = data

    // 计算基药使用率
    const totalAmount = (data.baseDrugAmount || 0) + (data.nonBaseDrugAmount || 0)
    if (totalAmount > 0) {
      baseDrugRate.value = Math.round((data.baseDrugAmount || 0) / totalAmount * 100)
    }
  } catch (error) {
    console.error('获取基药数据失败', error)
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
  getOverviewData()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 新增/修改操作 */
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 导入操作 */
const handleImport = () => {
  importFormRef.value.open()
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await DrugUseApi.exportDrugUseInfo(queryParams)
    download.excel(data, '药品使用数据.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DrugUseApi.deleteDrugUseInfo(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 打开分析对话框 */
const openAnalysis = () => {
  analysisDialogRef.value.open()
}

/** 格式化金额 */
const formatAmount = (amount: number) => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  }
  return amount.toFixed(2)
}

/** 获取患者类型标签 */
const getPatientTypeTag = (type: string) => {
  const tagMap = {
    '1': 'success',
    '2': 'warning',
    '3': 'info'
  }
  return tagMap[type] || 'info'
}

/** 获取患者类型名称 */
const getPatientTypeName = (type: string) => {
  const nameMap = {
    '1': '门诊',
    '2': '急诊',
    '3': '住院'
  }
  return nameMap[type] || '未知'
}

/** 获取基药使用率标签类型 */
const getBaseDrugRateType = () => {
  if (baseDrugRate.value >= 60) return 'success'
  if (baseDrugRate.value >= 40) return 'warning'
  return 'danger'
}

/** 初始化 */
onMounted(() => {
  getList()
  getOverviewData()
  getBaseDrugData()
})
</script>

<style scoped>
.overview-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-content {
  display: flex;
  align-items: center;
  padding: 16px;
}

.overview-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 16px;
}

.prescription-icon {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.amount-icon {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.drug-icon {
  background: linear-gradient(135deg, #e6a23c, #f0a020);
}

.department-icon {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.overview-info {
  flex: 1;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

.metrics-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.metric-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  margin: 0 8px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.metric-value.base-drug {
  color: #67c23a;
}

.metric-value.non-base-drug {
  color: #e6a23c;
}

.metric-value.target {
  color: #409eff;
}

.metric-desc {
  font-size: 12px;
  color: #c0c4cc;
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}
</style>

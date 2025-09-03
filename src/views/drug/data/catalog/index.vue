<template>
  <div class="catalog-container">
    <!-- Page Header -->
    <PageHeader
      title="药品目录管理"
      content="维护医疗机构药品目录信息，包括药品编码、名称、规格、生产企业等关键数据，支持YPID匹配和质控管理"
    >
      <template #extra>
        <div class="header-actions">
          <el-select
            v-model="queryParams.uploadDate"
            placeholder="选择导入批次"
            clearable
            style="width: 200px; margin-right: 12px"
            @change="handleQuery"
          >
            <el-option
              v-for="batch in dimensionFilters.uploadDates"
              :key="batch"
              :label="`${batch.substring(0, 4)}-${batch.substring(4, 6)}-${batch.substring(6, 8)}`"
              :value="batch"
            />
          </el-select>
          <el-button
            type="primary"
            @click="openForm('create')"
            v-hasPermi="['drug:catalog:create']"
          >
            <Icon icon="ep:plus" class="mr-5px" />
            新增药品
          </el-button>
          <el-button
            type="success"
            @click="handleExport"
            :loading="exportLoading"
            v-hasPermi="['drug:catalog:export']"
          >
            <Icon icon="ep:download" class="mr-5px" />
            导出目录
          </el-button>
        </div>
      </template>
    </PageHeader>

    <!-- Statistics Overview -->
    <!--
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="药品品种总数"
            :value="statistics.totalDrugs || 0"
            icon="FirstAidKit"
            color="#409eff"
            description="已登记品种"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="基本药物品种"
            :value="statistics.basicDrugs || 0"
            icon="CircleCheck"
            color="#67c23a"
            description="国家基药目录"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="一致性评价药品"
            :value="statistics.consistencyDrugs || 0"
            icon="Medal"
            color="#e6a23c"
            description="通过评价"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="YPID匹配率"
            :value="statistics.ypidMatchRate || 0"
            suffix="%"
            icon="Connection"
            color="#909399"
            :trend="statistics.matchRateTrend || 0"
            :loading="statsLoading"
          />
        </el-col>
      </el-row>
    </div>
-->

    <!-- 搜索和操作区域 -->
    <ContentWrap>
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="药品编码" prop="ypid">
          <el-input
            v-model="queryParams.ypid"
            placeholder="请输入YPID编码"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="产品名称" prop="productName">
          <el-input
            v-model="queryParams.productName"
            placeholder="请输入产品名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="通用名" prop="drugName">
          <el-input
            v-model="queryParams.drugName"
            placeholder="请输入药品通用名"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="质控状态" prop="qcStatus">
          <el-select
            v-model="queryParams.qcStatus"
            placeholder="请选择质控状态"
            clearable
            class="!w-240px"
          >
            <el-option label="全部" value="" />
            <el-option label="未质控" :value="0" />
            <el-option label="质控通过" :value="1" />
            <el-option label="质控失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
          <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
        <el-table-column label="ID" align="center" prop="id" />
        <el-table-column label="数据上报日期" align="center" prop="uploadDate" width="100">
          <template #default="{ row }">
            {{ formatDate(row.uploadDate) }}
          </template>
        </el-table-column>
        <el-table-column label="省级行政区划代码" align="center" prop="domainCode" width="130" />
        <el-table-column label="组织机构代码" align="center" prop="organizationCode" width="120" />
        <el-table-column label="医疗机构代码" align="center" prop="hospitalCode" width="120" />
        <el-table-column
          label="医疗机构名称"
          align="center"
          prop="hospitalName"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          label="国家药品编码（YPID）"
          align="center"
          prop="ypid"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          label="院内药品唯一码"
          align="center"
          prop="hospitalDrugId"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          label="省级药品集中采购平台药品编码"
          align="center"
          prop="provinceDrugCode"
          width="180"
          show-overflow-tooltip
        />
        <el-table-column
          label="通用名"
          align="center"
          prop="drugName"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column
          label="产品名称"
          align="center"
          prop="productName"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          label="商品名"
          align="center"
          prop="tradeName"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column
          label="商品名（英文）"
          align="center"
          prop="tradeNameEn"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          label="批准文号"
          align="center"
          prop="approvalNumber"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          label="生产企业"
          align="center"
          prop="manufacturer"
          width="180"
          show-overflow-tooltip
        />
        <el-table-column label="剂型名称" align="center" prop="drugForm" width="120" />
        <el-table-column label="制剂规格" align="center" prop="drugSpec" width="120" />
        <el-table-column label="制剂单位" align="center" prop="dosageUnit" width="120" />
        <el-table-column label="最小销售包装单位" align="center" prop="packUnit" width="150" />
        <el-table-column label="转换系数" align="center" prop="conversionFactor" width="120" />
        <el-table-column label="是否基本药物" align="center" prop="isBasicDrug" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isBasicDrug === 1 ? 'success' : 'info'" size="small">
              {{ row.isBasicDrug === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="匹配状态" align="center" prop="ypidMatchStatus" width="100">
          <template #default="{ row }">
            <el-tag :type="getMatchStatusType(row.ypidMatchStatus)" size="small" effect="dark">
              {{ getMatchStatusText(row.ypidMatchStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="修复规则" align="center" prop="fixRule" width="100" />
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
          width="180px"
        />

        <el-table-column label="操作" align="center" min-width="120px">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['drug:catalog:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['drug:catalog:delete']"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </ContentWrap>

    <!-- Form Dialog -->
    <CatalogForm ref="formRef" @success="handleFormSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { CatalogApi, CatalogVO } from '@/api/drug/data/catalog'
import CatalogForm from './CatalogForm.vue'
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'

/** Drug Catalog Management Page */
defineOptions({ name: 'Catalog' })

const message = useMessage()
const { t } = useI18n()

// ========================= Reactive Data =========================
const loading = ref(true)
const refreshing = ref(false)
const statsLoading = ref(true)
const list = ref<CatalogVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  ypid: undefined,
  productName: undefined,
  drugName: undefined,
  qcStatus: undefined,
  uploadDate: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

// Statistics data
const statistics = reactive({
  totalDrugs: 0,
  basicDrugs: 0,
  consistencyDrugs: 0,
  ypidMatchRate: 0,
  matchRateTrend: 0
})

// 维度筛选数据
const dimensionFilters = reactive({
  uploadDates: []
})

// ========================= Lifecycle =========================
onMounted(() => {
  getList()
  loadStatistics()
  loadDimensionFilters()
})

// ========================= Core Methods =========================

/** Query list */
const getList = async () => {
  loading.value = true
  try {
    const data = await CatalogApi.getCatalogPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** Load statistics */
const loadStatistics = async () => {
  statsLoading.value = true
  try {
    const allData = await CatalogApi.getCatalogPage({ pageNo: 1, pageSize: 100 })
    const allList = allData.list || []

    statistics.totalDrugs = allData.total || 0
    statistics.basicDrugs = allList.filter((item) => item.isBasicDrug === 1).length
    statistics.consistencyDrugs = allList.filter(
      (item) => item.isConsistencyEvaluation === 1
    ).length

    const matchedCount = allList.filter(
      (item) => item.ypidMatchStatus === 1 || item.ypidMatchStatus === 2
    ).length
    statistics.ypidMatchRate =
      allList.length > 0 ? Math.round((matchedCount / allList.length) * 100) : 0
    statistics.matchRateTrend = 2
  } catch (error) {
    console.error('Failed to load statistics:', error)
  } finally {
    statsLoading.value = false
  }
}

/** 加载维度筛选数据 */
const loadDimensionFilters = async () => {
  try {
    const data = await CatalogApi.getDimensionFilters()
    dimensionFilters.uploadDates = data.uploadDates || []
  } catch (error) {
    console.error('加载维度筛选数据失败:', error)
  }
}

/** Search */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** Reset query */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** Refresh */
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([getList(), loadStatistics()])
    message.success('刷新成功')
  } finally {
    refreshing.value = false
  }
}

/** Open form */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** Form success callback */
const handleFormSuccess = () => {
  getList()
  loadStatistics()
}

/** Delete */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await CatalogApi.deleteCatalog(id)
    message.success(t('common.delSuccess'))
    await getList()
    await loadStatistics()
  } catch {}
}

/** Export */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await CatalogApi.exportCatalog(queryParams)
    download.excel(data, '药品目录.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

// ========================= Utility Methods =========================

/** Get match status type */
const getMatchStatusType = (status: number): string => {
  const types = {
    0: 'info',
    1: 'success',
    2: 'primary',
    3: 'danger'
  }
  return types[status] || 'info'
}

/** Get match status text */
const getMatchStatusText = (status: number): string => {
  const texts = {
    0: '未匹配',
    1: '自动匹配',
    2: '手动匹配',
    3: '匹配失败'
  }
  return texts[status] || '未知'
}

/** Get QC status type */
const getQcStatusType = (status: number): string => {
  const types = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return types[status] || 'info'
}

/** Get QC status text */
const getQcStatusText = (status: number): string => {
  const texts = {
    0: '未质控',
    1: '质控通过',
    2: '质控失败'
  }
  return texts[status] || '未知'
}

/** 格式化日期 */
const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 8) return dateStr || ''
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
}
</script>

<style scoped>
.catalog-container {
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

.header-actions {
  display: flex;
  align-items: center;
}

/* Drug info styles */
.drug-info {
  text-align: left;
  padding: 8px 0;
}

.drug-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  font-size: 14px;
}

.drug-details {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
}

.generic-name {
  margin-right: 12px;
}

.trade-name {
  color: #909399;
}

.drug-codes {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* Spec info styles */
.spec-info {
  font-size: 12px;
  line-height: 1.6;
}

.units {
  color: #606266;
  margin-top: 2px;
}

.units span {
  margin-right: 8px;
}

.conversion {
  color: #909399;
  margin-top: 2px;
}

/* Property tags */
.property-tags {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Responsive design */
@media (max-width: 768px) {
  .catalog-container {
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

  .drug-codes {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
}
</style>

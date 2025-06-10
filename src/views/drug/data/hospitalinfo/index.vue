<template>
  <div class="hospital-info-page">
    <!-- 页面头部 -->
    <PageHeader
      title="机构基本信息"
      content="医疗机构基本情况数据管理，包括机构信息、规模数据、药品收入等"
    />

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <StatCard
          title="机构总数"
          :value="statistics.totalCount"
          icon="Building"
          color="#409eff"
        />
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <StatCard
          title="质控通过"
          :value="statistics.qcPassedCount"
          icon="CircleCheck"
          color="#67c23a"
        />
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <StatCard
          title="平均床位数"
          :value="statistics.avgBedCount"
          suffix="张"
          icon="Bed"
          color="#e6a23c"
        />
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <StatCard
          title="总诊疗人次"
          :value="formatLargeNumber(statistics.totalVisitCount)"
          icon="User"
          color="#909399"
        />
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <DrugDataTable
      ref="tableRef"
      table-title="机构信息列表"
      :columns="tableColumns"
      :detail-fields="detailFields"
      api-module="hospital"
      @query="handleQuery"
      @view="handleView"
      @qc="handleQc"
      @export="handleExport"
    >
      <!-- 自定义搜索项 -->
      <template #search-items>
        <el-form-item label="组织机构代码" prop="organizationCode">
          <el-input
            v-model="queryParams.organizationCode"
            placeholder="请输入组织机构代码"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="医疗机构代码" prop="hospitalCode">
          <el-input
            v-model="queryParams.hospitalCode"
            placeholder="请输入医疗机构代码"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="机构名称" prop="organizationName">
          <el-input
            v-model="queryParams.organizationName"
            placeholder="请输入机构名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="省级区划" prop="domainCode">
          <el-select
            v-model="queryParams.domainCode"
            placeholder="请选择省份"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="item in provinceList"
              :key="item.code"
              :label="item.name"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
      </template>

      <!-- 自定义列插槽 -->
      <template #drugIncome="{ row }">
        <span class="money-text">{{ formatMoney(row.annualDrugIncome) }}</span>
      </template>
    </DrugDataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '../import/components/StatCard.vue'
import DrugDataTable from './components/DrugDataTable.vue'
import { DrugHospitalApi } from '@/api/drug/hospital'

/** 页面名称 */
defineOptions({ name: 'HospitalInfo' })

// 响应式数据
const tableRef = ref()
const statistics = reactive({
  totalCount: 0,
  qcPassedCount: 0,
  avgBedCount: 0,
  totalVisitCount: 0
})

const queryParams = reactive({
  organizationCode: undefined,
  hospitalCode: undefined,
  organizationName: undefined,
  domainCode: undefined
})

// 表格列定义
const tableColumns = [
  { prop: 'organizationCode', label: '组织机构代码', width: 120 },
  { prop: 'hospitalCode', label: '医疗机构代码', width: 180 },
  { prop: 'organizationName', label: '机构名称', minWidth: 200 },
  { prop: 'domainCode', label: '省级区划', width: 100 },
  { prop: 'bedCount', label: '床位数', width: 80 },
  { prop: 'doctorCount', label: '执业医师数', width: 100 },
  { prop: 'visitCount', label: '总诊疗人次', width: 120, formatter: formatLargeNumber },
  { prop: 'annualDrugIncome', label: '年度药品收入', width: 150, slot: 'drugIncome' }
]

// 详情字段定义
const detailFields = [
  { prop: 'organizationCode', label: '组织机构代码' },
  { prop: 'hospitalCode', label: '医疗机构代码' },
  { prop: 'organizationName', label: '机构名称', span: 2 },
  { prop: 'domainCode', label: '省级行政区划代码' },
  { prop: 'bedCount', label: '实有床位数' },
  { prop: 'doctorCount', label: '执业医师数' },
  { prop: 'assistantDoctorCount', label: '执业助理医师数' },
  { prop: 'visitCount', label: '总诊疗人次数', formatter: formatLargeNumber },
  { prop: 'dischargeCount', label: '出院人数', formatter: formatLargeNumber },
  { prop: 'annualDrugIncome', label: '年度药品总收入', formatter: formatMoney },
  { prop: 'ypPurchaseAmount', label: '中药饮片总采购额', formatter: formatMoney },
  { prop: 'ypSellAmount', label: '中药饮片总销售额', formatter: formatMoney },
  { prop: 'klPurchaseAmount', label: '中药颗粒剂总采购额', formatter: formatMoney },
  { prop: 'klSellAmount', label: '中药颗粒剂总销售额', formatter: formatMoney },
  { prop: 'createTime', label: '创建时间', span: 2 }
]

// 省份列表（示例数据）
const provinceList = [
  { code: '110000', name: '北京市' },
  { code: '120000', name: '天津市' },
  { code: '310000', name: '上海市' },
  { code: '440000', name: '广东省' },
  // ... 更多省份
]

// 生命周期
onMounted(() => {
  loadStatistics()
})

// 方法
const loadStatistics = async () => {
  try {
    const data = await DrugHospitalApi.getStatistics()
    Object.assign(statistics, data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const handleQuery = async (params: any) => {
  try {
    const mergedParams = { ...params, ...queryParams }
    const { list, total } = await DrugHospitalApi.getPage(mergedParams)

    // 更新表格数据
    if (tableRef.value) {
      tableRef.value.tableData = list
      tableRef.value.total = total
    }
  } catch (error) {
    ElMessage.error('查询失败')
  }
}

const handleView = (row: any) => {
  // 查看详情逻辑
  console.log('查看详情:', row)
}

const handleQc = async (row: any) => {
  try {
    await DrugHospitalApi.executeQc(row.id)
    ElMessage.success('质控执行成功')
    tableRef.value?.loadData()
  } catch (error) {
    ElMessage.error('质控执行失败')
  }
}

const handleExport = async (params: any) => {
  try {
    await DrugHospitalApi.exportData({ ...params, ...queryParams })
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 工具函数
function formatLargeNumber(num: number) {
  if (!num) return '0'
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toLocaleString()
}

function formatMoney(amount: number) {
  if (!amount) return '¥0.00'
  return '¥' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
.hospital-info-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.stat-cards {
  margin-bottom: 20px;
}

.money-text {
  color: #f56c6c;
  font-weight: 500;
}
</style>

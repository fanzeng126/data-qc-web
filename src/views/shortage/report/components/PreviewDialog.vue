<template>
  <Dialog title="填报数据预览" v-model="dialogVisible" width="1000px">
    <el-table :data="displayData" border max-height="400">
      <el-table-column label="序号" type="index" width="60" />
      <el-table-column label="药品名称" prop="drugName" width="180" />
      <el-table-column label="剂型" prop="dosageForm" width="100" />
      <el-table-column label="单位" prop="dosageUnit" width="80" />
      <el-table-column label="本周累计使用量" prop="weekUsageAmount" width="120" align="right">
        <template #default="scope">
          {{ formatNumber(scope.row.weekUsageAmount) }}
        </template>
      </el-table-column>
      <el-table-column label="当日库存量" prop="currentStockAmount" width="120" align="right">
        <template #default="scope">
          {{ formatNumber(scope.row.currentStockAmount) }}
        </template>
      </el-table-column>
      <el-table-column label="供应情况" prop="supplyStatus" width="100" align="center">
        <template #default="scope">
          <el-tag 
            :type="getSupplyStatusTagType(scope.row.supplyStatus)"
            size="small"
          >
            {{ getSupplyStatusLabel(scope.row.supplyStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="库存天数" width="100" align="right">
        <template #default="scope">
          {{ calculateStockDays(scope.row) }}天
        </template>
      </el-table-column>
    </el-table>

    <!-- 统计信息 -->
    <div class="statistics-section" v-if="statistics">
      <el-divider content-position="left">统计信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-statistic title="填报药品总数" :value="statistics.totalDrugs" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="充足药品" :value="statistics.sufficientCount">
            <template #suffix>
              <span style="color: #67c23a;">个</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="短缺药品" :value="statistics.shortageCount">
            <template #suffix>
              <span style="color: #f56c6c;">个</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="严重短缺" :value="statistics.severeShortageCount">
            <template #suffix>
              <span style="color: #f56c6c;">个</span>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
    </div>

    <template #footer>
      <el-button @click="handleExport" type="success" plain>
        <Icon icon="ep:download" class="mr-1" />
        导出预览
      </el-button>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { type ReportRecordVO, getSupplyStatusLabel } from '@/api/shortage'

interface Statistics {
  totalDrugs: number
  sufficientCount: number
  shortageCount: number
  severeShortageCount: number
}

const dialogVisible = ref(false)
const displayData = ref<ReportRecordVO[]>([])

const statistics = computed((): Statistics | null => {
  if (!displayData.value.length) return null
  
  return {
    totalDrugs: displayData.value.length,
    sufficientCount: displayData.value.filter(item => item.supplyStatus === 1 || item.supplyStatus === 2).length,
    shortageCount: displayData.value.filter(item => item.supplyStatus === 3).length,
    severeShortageCount: displayData.value.filter(item => item.supplyStatus === 4).length,
  }
})

const open = (data: ReportRecordVO[] = []) => {
  displayData.value = [...data]
  dialogVisible.value = true
}

const formatNumber = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-'
  return value.toFixed(2)
}

const getSupplyStatusTagType = (status: number): string => {
  switch (status) {
    case 1: return 'success'
    case 2: return 'warning'
    case 3: return 'danger'
    case 4: return 'danger'
    default: return 'info'
  }
}

const calculateStockDays = (row: ReportRecordVO): string => {
  const weekUsage = row.weekUsageAmount || 0
  const currentStock = row.currentStockAmount || 0
  
  if (weekUsage === 0) return '∞'
  
  const dailyUsage = weekUsage / 7
  if (dailyUsage === 0) return '∞'
  
  const days = Math.floor(currentStock / dailyUsage)
  return days.toString()
}

const handleExport = () => {
  // 这里可以实现导出功能
  console.log('导出预览数据:', displayData.value)
}

defineExpose({ open })
</script>

<style scoped>
.statistics-section {
  margin-top: 20px;
}

:deep(.el-statistic__number) {
  font-size: 24px;
  font-weight: 600;
}

:deep(.el-statistic__title) {
  font-size: 14px;
  margin-bottom: 8px;
}
</style>
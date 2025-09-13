<template>
  <!-- 专区选择区域 -->
  <ContentWrap>
    <el-form :inline="true">
      <el-form-item label="填报专区">
        <el-select
          v-model="selectedZoneId"
          @change="loadDrugList"
          placeholder="请选择专区"
          style="width: 200px"
        >
          <el-option
            v-for="zone in zoneList"
            :key="zone.id"
            :label="zone.zoneName"
            :value="zone.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="当前周期">
        <el-tag type="info">{{ currentWeek }}</el-tag>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 时间提醒组件 -->
  <TimeAlert
    :is-time-restricted="isTimeRestricted"
    :is-in-report-time="isInReportTime"
    :remaining-time="remainingTime"
    :time-config-display="timeConfigDisplay"
    :closable="true"
  />

  <!-- 通知区域 -->
  <ContentWrap
    v-if="zoneNotice && selectedZoneId"
    title="填报通知"
    header-icon="ep:bell"
    headerIconColor="orange"
  >
    <div v-html="zoneNotice" class="notice-content"></div>
  </ContentWrap>

  <!-- 填报表格 -->
  <ContentWrap
    v-if="selectedZoneId"
    :title="tableTitle"
    message="请检查填报数据，确保准确无误后提交"
    header-icon="ep:edit"
  >
    <el-table
      v-loading="loading"
      :data="reportList"
      border
      class="report-table"
      :row-class-name="getRowClassName"
      :span-method="arraySpanMethod"
    >
      <el-table-column label="序号" type="index" width="60" fixed class-name="header-bold" />
      <el-table-column
        label="药品分类"
        prop="drugCategory"
        width="150"
        class-name="header-bold"
        show-overflow-tooltip
      />
      <el-table-column label="药品名称" prop="drugName" width="200" class-name="header-bold" />
      <el-table-column label="剂型" prop="dosageCategory" width="120" class-name="header-bold" />
      <el-table-column label="最小剂量单位" prop="dosageUnit" width="200" class-name="header-bold">
        <template #default="scope">
          <el-select
            v-model="scope.row.dosageUnit"
            :disabled="!isInReportTime"
            style="width: 100%"
            placeholder="请选择"
          >
            <el-option
              v-for="unit in scope.row.dosageUnitOptions || []"
              :key="unit.value"
              :label="unit.label"
              :value="unit.value"
            />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column
        label="本周累计使用量（最小剂量单位）"
        width="240"
        align="center"
        class-name="header-bold"
      >
        <template #default="scope">
          <div class="usage-input">
            <el-input-number
              v-model="scope.row.weekUsageAmount"
              :min="0"
              :precision="2"
              :disabled="!isInReportTime"
              style="width: 100%"
              placeholder="按包装单位"
              @change="handleUsageChange(scope.row)"
            />
          </div>
        </template>
      </el-table-column>

      <el-table-column
        label="当日实时库存量（最小剂量单位）"
        width="240"
        align="center"
        class-name="header-bold"
      >
        <template #default="scope">
          <div class="stock-input">
            <el-input-number
              v-model="scope.row.currentStockAmount"
              :min="0"
              :precision="2"
              :disabled="!isInReportTime"
              style="width: 100%"
              placeholder="按包装单位"
              @change="handleStockChange(scope.row)"
            />
          </div>
        </template>
      </el-table-column>

      <el-table-column label="供应情况" width="150" align="center" class-name="header-bold">
        <template #header>
          <div class="custom-header">
            <span>供应情况</span>
          </div>
        </template>
        <template #default="scope">
          <div class="supply-input-wrapper">
            <el-select
              v-model="scope.row.supplyStatus"
              :disabled="!isInReportTime"
              style="width: 100%"
              placeholder="请选择"
              :class="{ 'required-field': isSupplyStatusRequired(scope.row) }"
              :key="`supply-${scope.$index}-${scope.row.weekUsageAmount}-${scope.row.currentStockAmount}`"
            >
              <el-option
                v-for="status in getIntDictOptions(DICT_TYPE.SUPPLY_STATUS)"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
            <span 
              v-if="isSupplyStatusRequired(scope.row)" 
              class="required-indicator"
              :key="`required-${scope.$index}-${scope.row.weekUsageAmount}-${scope.row.currentStockAmount}`"
            >*</span>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 提交区域 -->
    <div class="submit-area" v-if="selectedZoneId && reportList.length > 0">
      <div class="flex items-center justify-between">
        <div class="submit-buttons">
          <el-button @click="handlePreview" :disabled="!isInReportTime"> 预览数据</el-button>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="submitting"
            :disabled="!isInReportTime || !isDataValid"
          >
            <Icon icon="ep:upload" class="mr-1" />
            提交填报
          </el-button>
        </div>
      </div>
    </div>
  </ContentWrap>

  <!-- 空状态 -->
  <el-empty v-if="!selectedZoneId" description="请选择填报专区开始填报" :image-size="100" />

  <!-- 预览对话框 -->
  <PreviewDialog ref="previewDialogRef" />
</template>

<script setup lang="ts">
import {
  ReportZoneApi,
  ReportRecordApi,
  type ReportZoneVO,
  type ReportRecordVO,
  getSupplyStatusLabel,
  SupplyStatusEnum
} from '@/api/shortage'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import PreviewDialog from './components/PreviewDialog.vue'
import TimeAlert from './components/TimeAlert.vue'

/** 短缺药品数据填报页面 */
defineOptions({ name: 'ShortageReport' })

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const selectedZoneId = ref<number>()
const zoneList = ref<ReportZoneVO[]>([])
const reportList = ref<ReportRecordVO[]>([])
const zoneNotice = ref('')

// 表格合并单元格方法
const arraySpanMethod = ({ row, column, rowIndex, columnIndex }) => {
  // 只对药品分类列进行合并（第2列，因为第1列是序号）
  if (columnIndex === 1) {
    const currentCategory = row.drugCategory
    const dataList = reportList.value

    // 找到当前分类的第一行
    let startIndex = -1
    for (let i = 0; i < dataList.length; i++) {
      if (dataList[i].drugCategory === currentCategory) {
        startIndex = i
        break
      }
    }

    // 计算当前分类的总行数
    const categoryCount = dataList.filter((item) => item.drugCategory === currentCategory).length

    if (rowIndex === startIndex) {
      // 第一行显示合并的单元格
      return {
        rowspan: categoryCount,
        colspan: 1
      }
    } else if (dataList[rowIndex].drugCategory === currentCategory) {
      // 同一分类的其他行不显示
      return {
        rowspan: 0,
        colspan: 0
      }
    }
  }

  return {
    rowspan: 1,
    colspan: 1
  }
}

// 当前周期
const currentWeek = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}-${week.toString().padStart(2, '0')}周`
})

// 表格标题
const tableTitle = computed(() => {
  const baseTitle = '药品填报数据'
  return reportList.value.length > 0
    ? `${baseTitle} (共 ${reportList.value.length} 个药品)`
    : baseTitle
})

// 填报时间控制
const isTimeRestricted = ref(false) // 是否有时间限制
const isInReportTime = ref(false)
const remainingTime = ref('')
const timeConfigDisplay = ref('加载中...')

// 判断供应情况是否必填 - 使用计算属性确保响应式更新
const getIsSupplyStatusRequired = (row: ReportRecordVO): boolean => {
  // 显式检查数值，确保响应式更新
  const weekUsage = row.weekUsageAmount
  const stockAmount = row.currentStockAmount
  
  return (
    (weekUsage !== undefined && weekUsage !== null && weekUsage > 0) ||
    (stockAmount !== undefined && stockAmount !== null && stockAmount > 0)
  )
}

// 为了在模板中使用，创建一个方法
const isSupplyStatusRequired = (row: ReportRecordVO): boolean => {
  return getIsSupplyStatusRequired(row)
}

// 处理用量变化
const handleUsageChange = (row: ReportRecordVO) => {
  checkAndClearSupplyStatus(row)
}

// 处理库存变化
const handleStockChange = (row: ReportRecordVO) => {
  checkAndClearSupplyStatus(row)
}

// 检查并清空供应情况
const checkAndClearSupplyStatus = (row: ReportRecordVO) => {
  // 如果两个值都为0或未填写，清空供应情况
  const weekUsage = row.weekUsageAmount || 0
  const stockAmount = row.currentStockAmount || 0
  
  if (weekUsage === 0 && stockAmount === 0) {
    row.supplyStatus = null
  }
}

// 数据有效性检查
const isDataValid = computed(() => {
  if (!reportList.value.length) return false

  return reportList.value.every((item) => {
    // 使用相同的逻辑检查是否需要必填
    const isRequired = getIsSupplyStatusRequired(item)

    // 如果需要必填，供应情况必须填写
    if (isRequired) {
      return item.supplyStatus !== undefined && item.supplyStatus !== null
    }

    // 如果不需要必填，则通过验证
    return true
  })
})
const checkReportTime = async () => {
  if (!selectedZoneId.value) {
    timeConfigDisplay.value = '请先选择填报专区'
    isTimeRestricted.value = false
    return
  }

  try {
    const result = await ReportZoneApi.checkReportTime(selectedZoneId.value)
    isInReportTime.value = result.isInTime
    timeConfigDisplay.value = result.message
    isTimeRestricted.value = result.hasTimeRestriction !== false // 如果有时间限制则显示组件

    if (result.isInTime && result.remainingMinutes) {
      const hours = Math.floor(result.remainingMinutes / 60)
      const minutes = result.remainingMinutes % 60
      remainingTime.value = `${hours}小时${minutes}分钟`
    }
  } catch (error) {
    console.error('检查填报时间失败:', error)
    // 降级到固定时间检查
    checkReportTimeFixed()
  }
}

// 保留原有固定时间检查作为降级方案
const checkReportTimeFixed = () => {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()

  isInReportTime.value = day === 5 && hour >= 12 && hour < 18
  isTimeRestricted.value = true // 降级方案默认有时间限制

  if (isInReportTime.value) {
    const endTime = new Date()
    endTime.setHours(18, 0, 0, 0)
    const remaining = endTime.getTime() - now.getTime()
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    remainingTime.value = `${hours}小时${minutes}分钟`
  }

  timeConfigDisplay.value = '填报时间：每周五 12:00-18:00'
}

// 获取周数
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// 加载专区列表
const loadZoneList = async () => {
  try {
    const data = await ReportZoneApi.getPage({
      pageNo: 1,
      pageSize: -1,
      status: 0
    })
    zoneList.value = data.list
  } catch (error) {
    console.error('加载专区列表失败:', error)
  }
}

// 加载药品列表
const loadDrugList = async () => {
  if (!selectedZoneId.value) return

  loading.value = true
  try {
    const data = await ReportRecordApi.getReportListByZoneId(selectedZoneId.value)
    reportList.value = data

    // 获取通知内容
    const zone = zoneList.value.find((z) => z.id === selectedZoneId.value)
    zoneNotice.value = zone?.noticeContent || ''

    // 检查填报时间
    await checkReportTime()

    // 切换专区时重置时间提醒的关闭状态
    // if (timeAlertRef.value) {
    //   timeAlertRef.value.reset()
    // }
  } catch (error) {
    console.error('加载药品列表失败:', error)
    message.error('加载药品列表失败')
  } finally {
    loading.value = false
  }
}

// 获取行样式类名
const getRowClassName = ({ row }: { row: ReportRecordVO }): string => {
  if (row.supplyStatus === 4) return 'severe-shortage-row'
  if (row.supplyStatus === 3) return 'shortage-row'
  return ''
}

// 预览数据
const previewDialogRef = ref()
const handlePreview = () => {
  previewDialogRef.value?.open(reportList.value)
}

// 提交填报
const handleSubmit = async () => {
  if (!isInReportTime.value) {
    message.warning('当前不在填报时间内')
    return
  }

  if (!isDataValid.value) {
    message.warning('请完整填写所有必填字段')
    return
  }

  try {
    await message.confirm('确认提交本次填报数据吗？提交后将无法修改。')

    submitting.value = true

    // 过滤出需要提交的数据（有供应情况的记录）
    const submitData = reportList.value
      .filter((item) => item.supplyStatus !== undefined && item.supplyStatus !== null)
      .map((item) => ({
        ...item,
        dosageUnit: item.dosageUnit // 确保包含 dosageUnit 字段
      }))

    await ReportRecordApi.batchSave(submitData)
    message.success('填报成功')

    // 重新加载数据
    await loadDrugList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

// 初始化
onMounted(() => {
  loadZoneList()

  // 初始化时间显示
  timeConfigDisplay.value = '请选择填报专区'
  isTimeRestricted.value = false

  // 每分钟检查一次时间（如果已选择专区）
  setInterval(() => {
    if (selectedZoneId.value) {
      checkReportTime()
    }
  }, 60000)
})
</script>

<style scoped>
.notice-content {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  padding: 12px 0;
}

.notice-content :deep(h3) {
  color: #303133;
  margin-top: 0;
  margin-bottom: 12px;
}

.notice-content :deep(ol) {
  padding-left: 20px;
}

.notice-content :deep(li) {
  margin-bottom: 8px;
}

.report-table {
  margin-bottom: 20px;
}

.report-table :deep(.shortage-row) {
  background-color: #fef2f2;
}

.report-table :deep(.severe-shortage-row) {
  background-color: #fef2f2;
}

.submit-area {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.info-text {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.submit-buttons {
  display: flex;
  gap: 12px;
}

.report-table :deep(.header-bold .cell) {
  font-weight: bold;
}

.usage-input,
.stock-input {
  display: flex;
  align-items: center;
}

.usage-input .el-input-number,
.stock-input .el-input-number {
  width: 100%;
}

.supply-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.required-indicator {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  color: #f56c6c;
  font-weight: bold;
  font-size: 14px;
  line-height: 1;
}

.required-field {
  border-color: #f56c6c !important;
}

.custom-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
</style>

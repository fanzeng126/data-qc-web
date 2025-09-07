<template>
  <ContentWrap>
    <!-- 专区选择区域 -->
    <el-card class="zone-selector" shadow="never">
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
        <el-form-item>
          <el-tag v-if="!isInReportTime" type="warning">
            ⏰ 填报时间：每周五 12:00-18:00
          </el-tag>
          <el-tag v-else type="success">
            ⏰ 剩余填报时间: {{ remainingTime }}
          </el-tag>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通知区域 -->
    <el-card v-if="zoneNotice && selectedZoneId" class="notice-card" shadow="never">
      <template #header>
        <div class="card-header">
          <Icon icon="ep:bell" class="mr-2" />
          <span>填报通知</span>
        </div>
      </template>
      <div v-html="zoneNotice" class="notice-content"></div>
    </el-card>

    <!-- 填报表格 -->
    <ContentWrap v-if="selectedZoneId">
      <template #header>
        <div class="flex items-center">
          <Icon icon="ep:edit" class="mr-2" />
          <span>药品填报数据</span>
          <el-tag v-if="reportList.length > 0" class="ml-2" type="info">
            共 {{ reportList.length }} 个药品
          </el-tag>
        </div>
      </template>
      
      <el-table 
        v-loading="loading" 
        :data="reportList" 
        border
        class="report-table"
        :row-class-name="getRowClassName"
      >
        <el-table-column label="序号" type="index" width="60" fixed />
        <el-table-column label="药品名称" prop="drugName" width="200" fixed />
        <el-table-column label="剂型" prop="dosageForm" width="120" />
        <el-table-column label="最小剂量单位" prop="dosageUnit" width="100" />
        
        <el-table-column label="本周累计使用量" width="150" align="center">
          <template #default="scope">
            <el-input-number 
              v-model="scope.row.weekUsageAmount" 
              :min="0" 
              :precision="2"
              :disabled="!isInReportTime"
              style="width: 100%"
              placeholder="请输入"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="当日实时库存量" width="150" align="center">
          <template #default="scope">
            <el-input-number 
              v-model="scope.row.currentStockAmount" 
              :min="0" 
              :precision="2"
              :disabled="!isInReportTime"
              style="width: 100%"
              placeholder="请输入"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="供应情况" width="150" align="center">
          <template #default="scope">
            <el-select 
              v-model="scope.row.supplyStatus" 
              :disabled="!isInReportTime" 
              style="width: 100%"
              placeholder="请选择"
            >
              <el-option 
                v-for="status in SupplyStatusOptions"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag 
              :type="getSupplyStatusTagType(scope.row.supplyStatus)"
              size="small"
            >
              {{ getSupplyStatusLabel(scope.row.supplyStatus) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 提交区域 -->
      <div class="submit-area" v-if="selectedZoneId && reportList.length > 0">
        <el-alert
          v-if="!isInReportTime"
          title="当前不在填报时间内，无法提交数据"
          type="warning"
          :closable="false"
          class="mb-4"
        />
        
        <div class="flex items-center justify-between">
          <div class="info-text">
            <Icon icon="ep:info-filled" class="mr-1" />
            请检查填报数据，确保准确无误后提交
          </div>
          <div class="submit-buttons">
            <el-button 
              @click="handlePreview"
              :disabled="!isInReportTime"
            >
              预览数据
            </el-button>
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
    <el-empty 
      v-if="!selectedZoneId" 
      description="请选择填报专区开始填报"
      :image-size="100"
    />
  </ContentWrap>

  <!-- 预览对话框 -->
  <PreviewDialog ref="previewDialogRef" :data="reportList" />
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
import PreviewDialog from './components/PreviewDialog.vue'

/** 短缺药品数据填报页面 */
defineOptions({ name: 'ShortageReport' })

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const selectedZoneId = ref<number>()
const zoneList = ref<ReportZoneVO[]>([])
const reportList = ref<ReportRecordVO[]>([])
const zoneNotice = ref('')

// 供应状态选项
const SupplyStatusOptions = [
  { value: 1, label: '充足' },
  { value: 2, label: '较充足' },
  { value: 3, label: '短缺' },
  { value: 4, label: '严重短缺' }
]

// 当前周期
const currentWeek = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}-${week.toString().padStart(2, '0')}周`
})

// 填报时间控制
const isInReportTime = ref(false)
const remainingTime = ref('')

// 数据有效性检查
const isDataValid = computed(() => {
  if (!reportList.value.length) return false
  
  return reportList.value.every(item => {
    return item.weekUsageAmount !== undefined && 
           item.weekUsageAmount !== null &&
           item.currentStockAmount !== undefined && 
           item.currentStockAmount !== null &&
           item.supplyStatus !== undefined &&
           item.supplyStatus !== null
  })
})

// 检查填报时间
const checkReportTime = () => {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  
  isInReportTime.value = day === 5 && hour >= 12 && hour < 18
  
  if (isInReportTime.value) {
    const endTime = new Date()
    endTime.setHours(18, 0, 0, 0)
    const remaining = endTime.getTime() - now.getTime()
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    remainingTime.value = `${hours}小时${minutes}分钟`
  }
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
      pageSize: 100, 
      status: 1 
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
    const data = await ReportRecordApi.getReportList(selectedZoneId.value)
    reportList.value = data
    
    // 获取通知内容
    const zone = zoneList.value.find(z => z.id === selectedZoneId.value)
    zoneNotice.value = zone?.noticeContent || ''
  } catch (error) {
    console.error('加载药品列表失败:', error)
    message.error('加载药品列表失败')
  } finally {
    loading.value = false
  }
}

// 获取供应状态标签类型
const getSupplyStatusTagType = (status: number): string => {
  switch (status) {
    case 1: return 'success'
    case 2: return 'warning' 
    case 3: return 'danger'
    case 4: return 'danger'
    default: return 'info'
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
  previewDialogRef.value?.open()
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
    await ReportRecordApi.batchSave(reportList.value)
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
  checkReportTime()
  
  // 每分钟检查一次时间
  setInterval(checkReportTime, 60000)
})
</script>

<style scoped>
.zone-selector {
  margin-bottom: 20px;
}

.notice-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.notice-content {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
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
</style>
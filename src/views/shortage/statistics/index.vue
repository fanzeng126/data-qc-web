<template>
  <ContentWrap>
    <!-- 查询条件 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="专区">
          <el-select v-model="queryParams.zoneId" placeholder="全部" clearable style="width: 160px">
            <el-option label="全部" :value="undefined" />
            <el-option 
              v-for="zone in zoneList" 
              :key="zone.id" 
              :label="zone.zoneName" 
              :value="zone.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-select v-model="queryParams.reportWeek" placeholder="请选择周期" style="width: 160px">
            <el-option 
              v-for="week in weekOptions" 
              :key="week.value" 
              :label="week.label" 
              :value="week.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="行政区划">
          <el-select v-model="queryParams.administrativeRegion" placeholder="全部" clearable style="width: 160px">
            <el-option label="全部" :value="undefined" />
            <el-option label="北京市" value="北京市" />
            <el-option label="上海市" value="上海市" />
            <el-option label="广州市" value="广州市" />
            <el-option label="深圳市" value="深圳市" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadStatistics" :loading="loading">
            <Icon icon="ep:search" class="mr-1" />
            查询
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" class="mr-1" />
            重置
          </el-button>
          <el-button type="success" plain @click="handleExport" :loading="exportLoading">
            <Icon icon="ep:download" class="mr-1" />
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 总体概况 -->
    <el-card v-if="statistics" class="overview-card" shadow="never">
      <template #header>
        <div class="card-header">
          <Icon icon="ep:data-analysis" class="mr-2" />
          <span>总体概况</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="statistic-item">
            <div class="statistic-value">{{ statistics.overview.reportOrgCount }}</div>
            <div class="statistic-title">填报机构数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="statistic-item">
            <div class="statistic-value">{{ statistics.overview.reportDrugCount }}</div>
            <div class="statistic-title">填报药品数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="statistic-item">
            <div class="statistic-value text-red">{{ statistics.overview.shortageDrugCount }}</div>
            <div class="statistic-title">短缺药品数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="statistic-item">
            <div class="statistic-value text-green">{{ statistics.overview.completionRate }}%</div>
            <div class="statistic-title">填报完成率</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 供应状况分布 -->
    <el-card v-if="statistics" class="distribution-card" shadow="never">
      <template #header>
        <div class="card-header">
          <Icon icon="ep:pie-chart" class="mr-2" />
          <span>供应状况分布</span>
        </div>
      </template>
      
      <div class="distribution-content">
        <div class="chart-container">
          <div ref="pieChartRef" class="pie-chart"></div>
        </div>
        
        <div class="distribution-list">
          <div 
            v-for="item in statistics.supplyDistribution" 
            :key="item.supplyStatus"
            class="distribution-item"
          >
            <div class="item-indicator" :class="getStatusClass(item.supplyStatus)"></div>
            <div class="item-content">
              <div class="item-label">{{ item.statusName }}</div>
              <div class="item-stats">
                <span class="count">{{ item.count }}</span>
                <span class="percentage">{{ item.percentage }}%</span>
              </div>
            </div>
            <div class="item-bar">
              <div 
                class="bar-fill" 
                :class="getStatusClass(item.supplyStatus)"
                :style="{ width: item.percentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 短缺药品详情 -->
    <el-card v-if="statistics" class="shortage-card" shadow="never">
      <template #header>
        <div class="card-header">
          <Icon icon="ep:warning" class="mr-2" />
          <span>短缺药品详情</span>
        </div>
      </template>
      
      <el-table :data="statistics.shortageDetails" border>
        <el-table-column label="药品名称" prop="drugName" width="200" />
        <el-table-column label="剂型" prop="dosageForm" width="120" />
        <el-table-column label="短缺机构数" prop="shortageOrgCount" width="120" align="center">
          <template #default="scope">
            <el-tag type="warning">{{ scope.row.shortageOrgCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="严重短缺机构数" prop="severeShortageOrgCount" width="140" align="center">
          <template #default="scope">
            <el-tag type="danger">{{ scope.row.severeShortageOrgCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="平均库存天数" prop="avgStockDays" width="120" align="center">
          <template #default="scope">
            <span :class="{ 'text-red': scope.row.avgStockDays < 3 }">
              {{ scope.row.avgStockDays }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="风险等级" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getRiskLevel(scope.row).type">
              {{ getRiskLevel(scope.row).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="viewDetail(scope.row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 空状态 -->
    <el-empty 
      v-if="!loading && !statistics" 
      description="暂无统计数据"
      :image-size="120"
    />
  </ContentWrap>

  <!-- 详情对话框 -->
  <DetailDialog ref="detailDialogRef" />
</template>

<script setup lang="ts">
import { 
  ReportZoneApi, 
  ReportRecordApi, 
  type ReportZoneVO,
  type ReportStatisticsReqVO, 
  type ReportStatisticsRespVO,
  type ShortageDetail
} from '@/api/shortage'
import * as echarts from 'echarts'
import DetailDialog from './components/DetailDialog.vue'

/** 短缺药品统计分析页面 */
defineOptions({ name: 'ShortageStatistics' })

const message = useMessage()
const loading = ref(false)
const exportLoading = ref(false)
const statistics = ref<ReportStatisticsRespVO>()
const zoneList = ref<ReportZoneVO[]>([])
const pieChartRef = ref()
let pieChart: echarts.ECharts | null = null

const queryParams = reactive<ReportStatisticsReqVO>({
  zoneId: undefined,
  reportWeek: getCurrentWeek(),
  administrativeRegion: undefined
})

// 周期选项
const weekOptions = computed(() => {
  const options = []
  const now = new Date()
  
  // 生成最近8周的选项
  for (let i = 0; i < 8; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i * 7)
    const week = getWeekNumber(date)
    const year = date.getFullYear()
    const weekStr = `${year}-${week.toString().padStart(2, '0')}`
    
    options.push({
      value: weekStr,
      label: `${weekStr}周${i === 0 ? ' (本周)' : ''}`
    })
  }
  
  return options
})

// 获取当前周期
function getCurrentWeek(): string {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}-${week.toString().padStart(2, '0')}`
}

// 获取周数
function getWeekNumber(date: Date): number {
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

// 加载统计数据
const loadStatistics = async () => {
  loading.value = true
  try {
    const data = await ReportRecordApi.getStatistics(queryParams)
    statistics.value = data
    
    // 更新饼图
    nextTick(() => {
      updatePieChart()
    })
  } catch (error) {
    console.error('加载统计数据失败:', error)
    message.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

// 重置查询
const resetQuery = () => {
  queryParams.zoneId = undefined
  queryParams.reportWeek = getCurrentWeek()
  queryParams.administrativeRegion = undefined
  loadStatistics()
}

// 导出数据
const handleExport = async () => {
  exportLoading.value = true
  try {
    await ReportRecordApi.exportReport(queryParams)
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

// 获取状态样式类
const getStatusClass = (status: number): string => {
  switch (status) {
    case 1: return 'status-sufficient'
    case 2: return 'status-relatively-sufficient'
    case 3: return 'status-shortage'
    case 4: return 'status-severe-shortage'
    default: return ''
  }
}

// 获取风险等级
const getRiskLevel = (item: ShortageDetail) => {
  if (item.severeShortageOrgCount >= 10) {
    return { type: 'danger', label: '高风险' }
  } else if (item.shortageOrgCount >= 10) {
    return { type: 'warning', label: '中风险' }
  } else {
    return { type: 'info', label: '低风险' }
  }
}

// 查看详情
const detailDialogRef = ref()
const viewDetail = (item: ShortageDetail) => {
  detailDialogRef.value?.open(item)
}

// 更新饼图
const updatePieChart = () => {
  if (!pieChartRef.value || !statistics.value) return
  
  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '10%',
      left: 'center'
    },
    series: [
      {
        name: '供应状况',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        data: statistics.value.supplyDistribution.map(item => ({
          value: item.count,
          name: item.statusName,
          itemStyle: {
            color: getStatusColor(item.supplyStatus)
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  pieChart.setOption(option)
}

// 获取状态颜色
const getStatusColor = (status: number): string => {
  switch (status) {
    case 1: return '#67c23a'
    case 2: return '#e6a23c'
    case 3: return '#f56c6c'
    case 4: return '#f56c6c'
    default: return '#909399'
  }
}

// 初始化
onMounted(() => {
  loadZoneList()
  loadStatistics()
})

// 清理图表
onUnmounted(() => {
  if (pieChart) {
    pieChart.dispose()
    pieChart = null
  }
})
</script>

<style scoped>
.search-card,
.overview-card,
.distribution-card,
.shortage-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.statistic-item {
  text-align: center;
  padding: 16px;
}

.statistic-value {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 8px;
}

.statistic-title {
  font-size: 14px;
  color: #666;
}

.text-red {
  color: #f56c6c;
}

.text-green {
  color: #67c23a;
}

.distribution-content {
  display: flex;
  gap: 40px;
}

.chart-container {
  flex: 1;
  min-height: 300px;
}

.pie-chart {
  width: 100%;
  height: 300px;
}

.distribution-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-sufficient {
  background-color: #67c23a;
}

.status-relatively-sufficient {
  background-color: #e6a23c;
}

.status-shortage {
  background-color: #f56c6c;
}

.status-severe-shortage {
  background-color: #f56c6c;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-stats {
  display: flex;
  gap: 8px;
  align-items: center;
}

.count {
  font-size: 18px;
  font-weight: 600;
}

.percentage {
  font-size: 14px;
  color: #666;
}

.item-bar {
  width: 100px;
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-fill.status-sufficient {
  background-color: #67c23a;
}

.bar-fill.status-relatively-sufficient {
  background-color: #e6a23c;
}

.bar-fill.status-shortage {
  background-color: #f56c6c;
}

.bar-fill.status-severe-shortage {
  background-color: #f56c6c;
}
</style>
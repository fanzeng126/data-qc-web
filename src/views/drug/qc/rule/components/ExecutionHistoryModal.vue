<template>
  <el-dialog
    v-model="dialogVisible"
    title="执行历史"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="execution-history-container">
      <!-- 统计概览 -->
      <el-card class="stats-card" shadow="never" v-if="historyStats">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ historyStats.totalExecutions }}</div>
            <div class="stat-label">总执行次数</div>
          </div>
          <div class="stat-item success">
            <div class="stat-value">{{ historyStats.successCount }}</div>
            <div class="stat-label">成功次数</div>
          </div>
          <div class="stat-item error">
            <div class="stat-value">{{ historyStats.failureCount }}</div>
            <div class="stat-label">失败次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ historyStats.avgExecutionTime }}ms</div>
            <div class="stat-label">平均执行时间</div>
          </div>
        </div>
      </el-card>

      <!-- 筛选条件 -->
      <el-card class="filter-card" shadow="never">
        <el-form :model="filterForm" :inline="true" class="filter-form">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              @change="handleFilterChange"
            />
          </el-form-item>
          <el-form-item label="执行状态">
            <el-select
              v-model="filterForm.status"
              placeholder="全部状态"
              clearable
              @change="handleFilterChange"
            >
              <el-option label="全部" value="" />
              <el-option label="成功" value="1" />
              <el-option label="失败" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 执行历史列表 -->
      <el-card class="history-list-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>执行记录</span>
            <el-button size="small" @click="refreshHistory" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <el-table :data="historyList" stripe border>
          <el-table-column prop="executionNo" label="执行批次" width="160" />
          <el-table-column prop="taskId" label="任务ID" width="100" align="center" />
          <el-table-column prop="totalRecords" label="检查记录数" width="120" align="center" />
          <el-table-column prop="passedRecords" label="通过数" width="100" align="center">
            <template #default="{ row }">
              <span class="success-text">{{ row.passedRecords }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="failedRecords" label="失败数" width="100" align="center">
            <template #default="{ row }">
              <span class="error-text">{{ row.failedRecords }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="warningRecords" label="警告数" width="100" align="center">
            <template #default="{ row }">
              <span class="warning-text">{{ row.warningRecords }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="executionStatus" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.executionStatus)" size="small">
                {{ getStatusText(row.executionStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="executionTime" label="执行时长" width="120" align="center">
            <template #default="{ row }">
              {{ row.executionTime ? `${row.executionTime}ms` : '-' }}
            </template>
          </el-table-column>
          <el-table-column
            prop="startTime"
            label="执行时间"
            min-width="150"
            :formatter="dateFormatter"
          />
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewExecutionDetail(row)">
                <el-icon><View /></el-icon>
                查看详情
              </el-button>
              <el-button
                v-if="row.executionStatus === 1"
                type="success"
                link
                size="small"
                @click="downloadReport(row)"
              >
                <el-icon><Download /></el-icon>
                报告
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pageInfo.current"
            v-model:page-size="pageInfo.size"
            :page-sizes="[10, 20, 50]"
            :total="pageInfo.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadHistoryData"
            @current-change="loadHistoryData"
          />
        </div>
      </el-card>

      <!-- 执行趋势图表 -->
      <el-card class="chart-card" shadow="never" v-if="chartData">
        <template #header>
          <span>执行趋势</span>
        </template>
        <div ref="chartRef" style="height: 300px"></div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportHistory">
          <el-icon><Download /></el-icon>
          导出历史
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, View, Download } from '@element-plus/icons-vue'
import { dateFormatter } from '@/utils/formatTime'
import * as echarts from 'echarts'

interface Props {
  ruleId?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  viewDetail: [executionId: number]
}>()

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const loading = ref(false)

/** 历史统计数据 */
const historyStats = ref<any>(null)

/** 历史记录列表 */
const historyList = ref<any[]>([])

/** 筛选表单 */
const filterForm = reactive({
  dateRange: [],
  status: ''
})

/** 分页信息 */
const pageInfo = reactive({
  current: 1,
  size: 20,
  total: 0
})

/** 图表相关 */
const chartRef = ref<HTMLElement>()
const chartData = ref<any>(null)
let chart: echarts.ECharts | null = null

// ========================= 监听器 =========================

watch(dialogVisible, (visible) => {
  if (visible && props.ruleId) {
    initData()
  }
})

onMounted(() => {
  // 在组件挂载后初始化图表（如果对话框已打开）
  if (dialogVisible.value) {
    nextTick(() => {
      initChart()
    })
  }
})

onUnmounted(() => {
  // 清理图表实例
  if (chart) {
    chart.dispose()
  }
})

// ========================= 核心方法 =========================

/** 初始化数据 */
const initData = async () => {
  await Promise.all([loadHistoryStats(), loadHistoryData(), loadChartData()])

  // 等待DOM更新后初始化图表
  await nextTick()
  initChart()
}

/** 加载历史统计 */
const loadHistoryStats = async () => {
  try {
    // 模拟API调用 - 在实际项目中这里应该调用真实的API
    await new Promise((resolve) => setTimeout(resolve, 500))

    historyStats.value = {
      totalExecutions: 156,
      successCount: 142,
      failureCount: 14,
      avgExecutionTime: 1250
    }
  } catch (error) {
    console.error('加载历史统计失败:', error)
  }
}

/** 加载历史数据 */
const loadHistoryData = async () => {
  loading.value = true
  try {
    // 模拟API调用 - 在实际项目中这里应该调用真实的API
    await new Promise((resolve) => setTimeout(resolve, 600))

    // 模拟生成历史数据
    const mockData = generateMockHistoryData()
    historyList.value = mockData.list
    pageInfo.total = mockData.total
  } catch (error) {
    ElMessage.error('加载执行历史失败')
    console.error('加载执行历史失败:', error)
  } finally {
    loading.value = false
  }
}

/** 加载图表数据 */
const loadChartData = async () => {
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 400))

    chartData.value = {
      dates: ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05'],
      successCount: [23, 18, 25, 31, 28],
      failureCount: [2, 4, 1, 3, 2],
      executionTime: [1200, 1350, 1100, 1450, 1300]
    }
  } catch (error) {
    console.error('加载图表数据失败:', error)
  }
}

/** 生成模拟历史数据 */
function generateMockHistoryData() {
  const list = []
  const total = 156
  const pageSize = pageInfo.size
  const currentPage = pageInfo.current

  // 计算当前页应该显示的数据范围
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, total)

  for (let i = startIndex; i < endIndex; i++) {
    const isSuccess = Math.random() > 0.1 // 90%成功率
    const totalRecords = Math.floor(Math.random() * 1000) + 100
    const failedRecords = isSuccess
      ? Math.floor(Math.random() * 10)
      : Math.floor(Math.random() * 50) + 10
    const warningRecords = Math.floor(Math.random() * 20)
    const passedRecords = totalRecords - failedRecords - warningRecords

    list.push({
      id: total - i,
      executionNo: `EXEC_${String(total - i).padStart(6, '0')}`,
      taskId: Math.floor(Math.random() * 9999) + 1000,
      totalRecords,
      passedRecords,
      failedRecords,
      warningRecords,
      executionStatus: isSuccess ? 1 : 2,
      executionTime: Math.floor(Math.random() * 2000) + 500,
      startTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000 + Math.random() * 60000).toISOString()
    })
  }

  return { list, total }
}

// ========================= 图表相关方法 =========================

/** 初始化图表 */
const initChart = () => {
  if (!chartRef.value || !chartData.value) return

  // 清理现有图表
  if (chart) {
    chart.dispose()
  }

  chart = echarts.init(chartRef.value)

  const option = {
    title: {
      text: '执行趋势分析',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'normal' }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let html = `${params[0].axisValue}<br/>`
        params.forEach((param: any) => {
          html += `${param.seriesName}: ${param.value}<br/>`
        })
        return html
      }
    },
    legend: {
      data: ['成功次数', '失败次数', '执行时长(ms)'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: chartData.value.dates
    },
    yAxis: [
      {
        type: 'value',
        name: '执行次数',
        position: 'left'
      },
      {
        type: 'value',
        name: '执行时长(ms)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '成功次数',
        type: 'bar',
        yAxisIndex: 0,
        data: chartData.value.successCount,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '失败次数',
        type: 'bar',
        yAxisIndex: 0,
        data: chartData.value.failureCount,
        itemStyle: { color: '#f56c6c' }
      },
      {
        name: '执行时长(ms)',
        type: 'line',
        yAxisIndex: 1,
        data: chartData.value.executionTime,
        itemStyle: { color: '#409eff' }
      }
    ]
  }

  chart.setOption(option)
}

// ========================= 事件处理方法 =========================

/** 筛选条件变化 */
const handleFilterChange = () => {
  // 重置分页到第一页
  pageInfo.current = 1
  loadHistoryData()
}

/** 重置筛选条件 */
const resetFilter = () => {
  filterForm.dateRange = []
  filterForm.status = ''
  handleFilterChange()
}

/** 刷新历史数据 */
const refreshHistory = () => {
  loadHistoryData()
}

/** 查看执行详情 */
const viewExecutionDetail = (row: any) => {
  emit('viewDetail', row.id)
  dialogVisible.value = false
}

/** 下载报告 */
const downloadReport = async (row: any) => {
  try {
    // 这里应该调用真实的下载API
    ElMessage.success('报告下载已开始')
  } catch (error) {
    ElMessage.error('下载报告失败')
  }
}

/** 导出历史记录 */
const exportHistory = async () => {
  try {
    // 这里应该调用真实的导出API
    ElMessage.success('历史记录导出已开始')
  } catch (error) {
    ElMessage.error('导出历史记录失败')
  }
}

// ========================= 工具方法 =========================

/** 获取状态类型 */
const getStatusType = (status: number): string => {
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'danger'
    default:
      return 'info'
  }
}

/** 获取状态文本 */
const getStatusText = (status: number): string => {
  switch (status) {
    case 1:
      return '成功'
    case 2:
      return '失败'
    default:
      return '未知'
  }
}

// ========================= 对外方法 =========================

defineExpose({
  open: (ruleId: number) => {
    // 这里可以设置规则ID等初始化参数
    dialogVisible.value = true
  }
})
</script>

<style lang="scss" scoped>
.execution-history-container {
  max-height: 70vh;
  overflow-y: auto;
}

.stats-card,
.filter-card,
.history-list-card,
.chart-card {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  .stat-item {
    text-align: center;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #303133;
    }

    .stat-label {
      font-size: 14px;
      color: #606266;
    }

    &.success .stat-value {
      color: #67c23a;
    }

    &.error .stat-value {
      color: #f56c6c;
    }
  }
}

.filter-form {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.success-text {
  color: #67c23a;
  font-weight: 500;
}

.error-text {
  color: #f56c6c;
  font-weight: 500;
}

.warning-text {
  color: #e6a23c;
  font-weight: 500;
}

.pagination-wrapper {
  display: flex;
  justify-content: end;
  margin-top: 20px;
  padding: 20px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .execution-history-container {
    max-height: 60vh;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .filter-form :deep(.el-form-item) {
    width: 100%;
    margin-right: 0;
  }
}

/* 表格样式 */
:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}
</style>

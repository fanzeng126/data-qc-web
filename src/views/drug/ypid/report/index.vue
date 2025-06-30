<template>
  <div class="match-report-container">
    <!-- 页面头部 -->
    <PageHeader title="YPID匹配报告" content="查看药品编码匹配的详细报告，分析匹配质量和改进方向">
      <template #extra>
        <el-button type="success" @click="handleExport" :loading="exportLoading">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </template>
    </PageHeader>

    <!-- 报告列表 -->
    <el-card class="report-list-card" shadow="never">
      <template #header>
        <span class="card-title">匹配报告列表</span>
      </template>

      <el-form :model="queryParams" :inline="true" label-width="80px" class="search-form">
        <el-form-item label="任务ID" prop="taskId">
          <el-input
            v-model="queryParams.taskId"
            placeholder="请输入任务ID"
            clearable
            style="width: 150px"
          />
        </el-form-item>

        <el-form-item label="医院名称" prop="hospitalName">
          <el-input
            v-model="queryParams.hospitalName"
            placeholder="请输入医院名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="报告时间" prop="dateRange">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="reportList"
        stripe
        @row-click="handleViewReport"
        style="cursor: pointer"
      >
        <el-table-column prop="reportId" label="报告编号" width="180" />
        <el-table-column prop="taskNo" label="任务编号" width="180" />
        <el-table-column
          prop="hospitalName"
          label="医院名称"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          prop="reportTime"
          label="生成时间"
          width="160"
          :formatter="dateFormatter"
        />
        <el-table-column prop="totalDrugs" label="药品总数" width="100" align="center" />
        <el-table-column prop="matchRate" label="匹配率" width="120" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.matchRate" :stroke-width="6" :text-inside="true" />
          </template>
        </el-table-column>
        <el-table-column prop="matchQualityScore" label="质量评分" width="100" align="center">
          <template #default="{ row }">
            <el-rate
              v-model="row.matchQualityScore"
              disabled
              :max="10"
              show-score
              score-template="{value}"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="handleViewDetail(row)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
            <el-button type="success" link size="small" @click.stop="handleDownload(row)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="loadReportList"
      />
    </el-card>

    <!-- 报告详情 -->
    <el-card v-if="currentReport" class="report-detail-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">匹配报告详情</span>
          <el-button type="primary" size="small" @click="handlePrint">
            <el-icon><Printer /></el-icon>
            打印报告
          </el-button>
        </div>
      </template>

      <div class="report-content">
        <!-- 基本信息 -->
        <div class="report-section">
          <h3 class="section-title">基本信息</h3>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="报告编号">
              {{ currentReport.reportId }}
            </el-descriptions-item>
            <el-descriptions-item label="任务编号">
              {{ currentReport.taskNo }}
            </el-descriptions-item>
            <el-descriptions-item label="医院名称">
              {{ currentReport.hospitalName }}
            </el-descriptions-item>
            <el-descriptions-item label="生成时间">
              {{ formatDate(currentReport.reportTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="药品总数">
              {{ currentReport.totalDrugs }}
            </el-descriptions-item>
            <el-descriptions-item label="质量评分">
              <el-rate
                v-model="currentReport.matchQualityScore"
                disabled
                :max="10"
                show-score
                score-template="{value}分"
              />
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 匹配统计 -->
        <div class="report-section">
          <h3 class="section-title">匹配统计</h3>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="stat-card">
                <div class="stat-title">总体匹配率</div>
                <div class="stat-value">
                  <el-progress type="circle" :percentage="currentReport.matchRate" :width="120" />
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card">
                <div class="stat-title">匹配分布</div>
                <div class="stat-content">
                  <div class="stat-item">
                    <span class="label">已匹配：</span>
                    <span class="value success">{{ currentReport.matchedCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">未匹配：</span>
                    <span class="value danger">{{ currentReport.unmatchedCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">自动匹配：</span>
                    <span class="value primary">{{ currentReport.autoMatchCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">手动匹配：</span>
                    <span class="value warning">{{ currentReport.manualMatchCount }}</span>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card">
                <div class="stat-title">平均置信度</div>
                <div class="stat-value large"> {{ currentReport.averageConfidence }}% </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 类别分布 -->
        <div class="report-section">
          <h3 class="section-title">药品类别分布</h3>
          <div ref="categoryChartRef" style="height: 300px"></div>
        </div>

        <!-- 未匹配原因分析 -->
        <div class="report-section">
          <h3 class="section-title">未匹配原因分析</h3>
          <div ref="reasonChartRef" style="height: 300px"></div>
        </div>

        <!-- 改进建议 -->
        <div class="report-section">
          <h3 class="section-title">改进建议</h3>
          <el-alert
            v-for="(suggestion, index) in currentReport.suggestions"
            :key="index"
            :title="suggestion"
            type="info"
            :closable="false"
            style="margin-bottom: 12px"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Search, Refresh, View, Printer } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { YpidApi, type MatchReportVO } from '@/api/drug/ypid'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'

defineOptions({ name: 'YpidReportIndex' })

// ========================= 响应式数据 =========================

const loading = ref(false)
const exportLoading = ref(false)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  taskId: undefined as number | undefined,
  hospitalName: undefined,
  startTime: undefined,
  endTime: undefined
})

const dateRange = ref<[string, string]>()
const reportList = ref<MatchReportVO[]>([])
const total = ref(0)
const currentReport = ref<MatchReportVO>()

const categoryChartRef = ref<HTMLElement>()
const reasonChartRef = ref<HTMLElement>()

// ========================= 生命周期 =========================

onMounted(() => {
  loadReportList()
})

// ========================= 方法 =========================

const loadReportList = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await YpidApi.getReportList(queryParams)
    reportList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    console.error('加载报告列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  loadReportList()
}

const resetQuery = () => {
  Object.assign(queryParams, {
    pageNo: 1,
    pageSize: 20,
    taskId: undefined,
    hospitalName: undefined,
    startTime: undefined,
    endTime: undefined
  })
  dateRange.value = undefined
  handleQuery()
}

const handleDateChange = (value: [string, string] | null) => {
  if (value) {
    queryParams.startTime = value[0]
    queryParams.endTime = value[1]
  } else {
    queryParams.startTime = undefined
    queryParams.endTime = undefined
  }
}

const handleExport = async () => {
  exportLoading.value = true
  try {
    ElMessage.info('导出功能开发中...')
  } finally {
    exportLoading.value = false
  }
}

const handleViewReport = (row: MatchReportVO) => {
  handleViewDetail(row)
}

const handleViewDetail = async (row: MatchReportVO) => {
  try {
    currentReport.value = await YpidApi.getReportDetail(row.reportId)
    await nextTick()
    initCharts()
  } catch (error) {
    ElMessage.error('加载报告详情失败')
  }
}

const handleDownload = async (row: MatchReportVO) => {
  try {
    await YpidApi.exportReport(row.reportId)
    ElMessage.success('下载成功')
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

const handlePrint = () => {
  window.print()
}

const initCharts = () => {
  if (!currentReport.value) return

  // 初始化类别分布图
  if (categoryChartRef.value) {
    const categoryChart = echarts.init(categoryChartRef.value)
    const categoryData = Object.entries(currentReport.value.categoryDistribution || {}).map(
      ([name, value]) => ({ name: getCategoryLabel(name), value })
    )

    categoryChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: categoryData
        }
      ]
    })
  }

  // 初始化未匹配原因图
  if (reasonChartRef.value) {
    const reasonChart = echarts.init(reasonChartRef.value)
    const reasonData = Object.entries(currentReport.value.unmatchedReasons || {})
      .map(([name, value]) => ({ name: getReasonLabel(name), value }))
      .sort((a, b) => b.value - a.value)

    reasonChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: reasonData.map((item) => item.name)
      },
      series: [
        {
          type: 'bar',
          data: reasonData.map((item) => item.value),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          }
        }
      ]
    })
  }
}

// ========================= 工具方法 =========================

const getCategoryLabel = (category: string) => {
  const categoryMap = {
    western: '西药',
    chinese: '中成药',
    herbal: '中药饮片',
    biological: '生物制品'
  }
  return categoryMap[category] || category
}

const getReasonLabel = (reason: string) => {
  const reasonMap = {
    no_match: '无匹配项',
    multiple_match: '多个匹配项',
    low_confidence: '置信度过低',
    info_incomplete: '信息不完整',
    name_mismatch: '名称不匹配',
    spec_mismatch: '规格不匹配',
    manufacturer_mismatch: '生产企业不匹配'
  }
  return reasonMap[reason] || reason
}
</script>

<style scoped>
.match-report-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.report-list-card,
.report-detail-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.search-form {
  margin-bottom: 0;
}

.report-content {
  padding: 20px;
}

.report-section {
  margin-bottom: 40px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 12px;
}

.stat-card {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  height: 100%;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 16px;
}

.stat-value {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}

.stat-value.large {
  font-size: 48px;
  font-weight: 600;
  color: #409eff;
}

.stat-content {
  text-align: left;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e4e7ed;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item .label {
  color: #606266;
}

.stat-item .value {
  font-weight: 600;
}

.stat-item .value.success {
  color: #67c23a;
}

.stat-item .value.danger {
  color: #f56c6c;
}

.stat-item .value.primary {
  color: #409eff;
}

.stat-item .value.warning {
  color: #e6a23c;
}

/* 打印样式 */
@media print {
  .el-header,
  .el-aside,
  .report-list-card,
  .card-header .el-button {
    display: none !important;
  }

  .match-report-container {
    padding: 0;
    background-color: white;
  }

  .report-detail-card {
    box-shadow: none;
    border: none;
  }
}
</style>

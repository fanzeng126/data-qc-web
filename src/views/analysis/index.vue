<template>
  <div class="analysis-page">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="page-title">质控数据分析</div>
      <div class="page-actions">
        <button class="btn btn-outline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          导出报告
        </button>
      </div>
    </div>
    
    <!-- 分析过滤器 -->
    <div class="analysis-header">
      <div class="date-range-picker">
        <span class="date-range-title">分析周期:</span>
        <select v-model="selectedPeriod" @change="onPeriodChange">
          <option value="week">本周</option>
          <option value="month">本月</option>
          <option value="quarter">本季度</option>
          <option value="year">本年度</option>
          <option value="custom">自定义</option>
        </select>
      </div>
    </div>
    
    <!-- 面包屑导航 - 下钻分析时显示 -->
    <div v-show="showBreadcrumb" class="drill-down-breadcrumb">
      <span class="drill-down-link">全院</span>
      <span class="drill-down-separator">></span>
      <span class="drill-down-link">内科</span>
      <span class="drill-down-separator">></span>
      <span>心内科</span>
    </div>
    
    <!-- KPI指标卡片 -->
    <div class="kpi-cards">
      <div class="kpi-card">
        <div class="kpi-title">
          <span>数据质量指数</span>
          <div class="tooltip">
            <i>ℹ️</i>
            <span class="tooltip-text">综合评估病案首页数据的准确性、完整性和规范性，得分范围0-100，分数越高表示质量越好。包含诊断编码准确率、手术操作编码准确率、医疗费用准确率、数据项完整度等多项指标的加权平均值。</span>
          </div>
          <button class="kpi-edit-btn" @click="openQualityIndexModal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="kpi-data">
          <div class="kpi-value">85.3</div>
          <div class="kpi-target">目标: <span>{{ qualityIndexTarget }}</span></div>
        </div>
        <div class="progress-container">
          <div class="progress">
            <div class="progress-bar" :style="{ width: '85.3%', backgroundColor: '#FFA000' }"></div>
          </div>
          <div class="progress-target">
            <span>0</span>
            <span>100</span>
          </div>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-title">
          <span>问题处理率</span>
          <div class="tooltip">
            <i>ℹ️</i>
            <span class="tooltip-text">已处理的质控问题占总问题数的百分比。计算公式：已处理问题数 ÷ 系统发现总问题数 × 100%。包括已修正和已确认两种处理状态，反映质控问题的闭环处理效率。</span>
          </div>
        </div>
        <div class="gauge-container">
          <div class="gauge-outer-arc"></div>
          <div class="gauge-inner-arc">
            <div :style="{ transform: 'rotate(144deg)' }"></div>
          </div>
          <div class="gauge-value">86.2%</div>
        </div>
        <div class="gauge-min-max">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-title">
          <span>平均审核耗时</span>
          <div class="tooltip">
            <i>ℹ️</i>
            <span class="tooltip-text">质控人员平均每份病历的审核时间，以分钟计算。计算公式：总审核时长 ÷ 审核病历数量。该指标反映质控效率，耗时越短表示质控效率越高，但需平衡审核质量与效率关系。</span>
          </div>
        </div>
        <div class="kpi-data">
          <div class="kpi-value">1.8</div>
          <div class="kpi-target">分钟/份</div>
        </div>
        <div class="trend-line">
          <span class="text-success">↓ 0.3</span>
          <svg class="trend-indicator" viewBox="0 0 100 50" preserveAspectRatio="none">
            <polyline
              points="0,30 20,35 40,25 60,20 80,15 100,10"
              fill="none"
              stroke="#4CAF50"
              stroke-width="3"
            />
          </svg>
        </div>
      </div>
    </div>
    
    <!-- 汇总指标卡片 -->
    <div class="summary-metrics">
      <div class="metric-card" v-for="metric in summaryMetrics" :key="metric.title">
        <div class="metric-title">{{ metric.title }}</div>
        <div class="metric-value">{{ metric.value }}</div>
        <div class="metric-trend" :class="metric.trendClass">{{ metric.trend }}</div>
      </div>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">
          <span>质控问题趋势分析</span>
          <div class="chart-actions">
            <button 
              v-for="period in trendPeriods" 
              :key="period.value"
              :class="{ active: activeTrendPeriod === period.value }"
              @click="setActiveTrendPeriod(period.value)"
            >
              {{ period.label }}
            </button>
          </div>
        </div>
        <div class="chart-container">
          <div ref="trendChart" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
      
      <div class="chart-card">
        <div class="chart-title">
          <span>问题类型分布</span>
        </div>
        <div class="chart-container">
          <div ref="pieChart" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
    </div>
    
    <!-- 第二行图表 -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">
          <span>科室问题情况对比</span>
        </div>
        <div class="chart-container">
          <div ref="departmentChart" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
      
      <div class="chart-card">
        <div class="chart-title">
          <span>质控能力雷达图</span>
        </div>
        <div class="radar-container">
          <div ref="radarChart" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
    </div>
    
    <!-- 科室质控排名和问题热力分布 -->
    <div class="charts-layout-section">
      <!-- 科室质控排名 -->
      <div class="chart-card">
        <div class="chart-title">
          <span>科室质控排名</span>
          <div class="chart-actions">
            <button 
              v-for="sort in rankingSorts" 
              :key="sort.value"
              :class="{ active: activeRankingSort === sort.value }"
              @click="setActiveRankingSort(sort.value)"
            >
              {{ sort.label }}
            </button>
          </div>
        </div>
        <div class="chart-body p-0">
          <table class="top-departments">
            <thead>
              <tr>
                <th width="5%">排名</th>
                <th width="20%">科室</th>
                <th width="15%">审核病例数</th>
                <th width="15%">问题数</th>
                <th width="15%">问题率</th>
                <th width="15%">处理率</th>
                <th width="15%">趋势</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(dept, index) in departmentRanking" :key="dept.name">
                <td>
                  <div class="rank-number" :class="getRankClass(index + 1)">{{ index + 1 }}</div>
                </td>
                <td>{{ dept.name }}</td>
                <td>{{ dept.auditCases }}</td>
                <td>{{ dept.issues }}</td>
                <td>{{ dept.issueRate }}</td>
                <td>
                  <div class="progress" style="width: 80px;">
                    <div class="progress-bar" :class="getProgressBarClass(dept.processingRate)" :style="{ width: dept.processingRate }"></div>
                  </div>
                  <span class="ml-1">{{ dept.processingRate }}</span>
                </td>
                <td :class="dept.trendClass">{{ dept.trend }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 问题热力分布 -->
      <div class="chart-card">
        <div class="chart-title">
          <span>问题热力分布</span>
        </div>
        <div class="chart-body">
          <div class="heat-map-labels">
            <div v-for="dept in heatMapDepartments" :key="dept" class="heat-map-label">{{ dept }}</div>
          </div>
          <div class="heat-map">
            <div v-for="(row, rowIndex) in heatMapData" :key="rowIndex" class="heat-map-row">
              <div 
                v-for="(cell, cellIndex) in row" 
                :key="cellIndex" 
                class="heat-map-cell" 
                :style="{ backgroundColor: cell.color }" 
                :title="cell.tooltip"
              >
                {{ cell.value }}
              </div>
            </div>
          </div>
          <div class="heat-scale">
            <div class="heat-scale-label">低</div>
            <div class="heat-scale-bar"></div>
            <div class="heat-scale-label">高</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 质控趋势分析 -->
    <div class="card mt-3">
      <div class="card-header">
        <div class="card-title">质控趋势分析</div>
        <div class="chart-actions">
          <button 
            v-for="period in qualityTrendPeriods" 
            :key="period.value"
            :class="{ active: activeQualityTrendPeriod === period.value }"
            @click="setActiveQualityTrendPeriod(period.value)"
          >
            {{ period.label }}
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="chart-container" style="height: 350px;">
          <div ref="qualityTrendChart" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
    </div>

    <!-- KPI目标修改模态框 -->
    <div v-show="showQualityIndexModal" class="modal-backdrop" @click="closeQualityIndexModal">
      <div class="modal-container" style="width: 400px; max-width: 95%;" @click.stop>
        <div class="modal-header">
          <div class="modal-title">修改数据质量指数目标值</div>
          <button class="modal-close" @click="closeQualityIndexModal">×</button>
        </div>
        <div class="modal-body">
          <p>设置新的数据质量指数目标值，范围0-100。</p>
          
          <div class="form-explanation">
            <div class="explanation-header">数值含义说明：</div>
            <ul class="explanation-list">
              <li><span class="scale-value">90-100</span>: 优秀 - 病案数据质量非常好，几乎无需改进</li>
              <li><span class="scale-value">80-89</span>: 良好 - 病案数据质量较好，有少量待改进项</li>
              <li><span class="scale-value">70-79</span>: 合格 - 病案数据质量达到基本要求，但有明显改进空间</li>
              <li><span class="scale-value">60-69</span>: 基本合格 - 病案数据存在一定质量问题，需要改进</li>
              <li><span class="scale-value">≤59</span>: 不合格 - 病案数据质量较差，需要重点整改</li>
            </ul>
          </div>
          
          <div class="form-group">
            <label>当前目标值: <span>{{ qualityIndexTarget }}</span></label>
          </div>
          
          <div class="form-group">
            <label>新目标值:</label>
            <input 
              type="number" 
              v-model.number="newTargetValue" 
              min="0" 
              max="100" 
              step="0.1" 
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label>修改原因:</label>
            <select v-model="changeReason" class="form-control" @change="onChangeReasonChange">
              <option value="adjust">根据实际情况调整目标</option>
              <option value="improve">质控工作水平提升</option>
              <option value="periodic">周期性目标调整</option>
              <option value="leadership">领导要求调整</option>
              <option value="other">其他原因</option>
            </select>
          </div>
          
          <div v-show="changeReason === 'other'" class="form-group">
            <label>具体原因:</label>
            <textarea v-model="otherReason" class="form-control" placeholder="请输入具体原因..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeQualityIndexModal">取消</button>
          <button class="btn btn-primary" @click="updateQualityTarget">确认修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

// 响应式数据
const selectedPeriod = ref('month')
const showBreadcrumb = ref(false)
const qualityIndexTarget = ref(90)
const showQualityIndexModal = ref(false)
const newTargetValue = ref(90)
const changeReason = ref('adjust')
const otherReason = ref('')

// 图表期间控制
const activeTrendPeriod = ref('月')
const activeRankingSort = ref('按问题率')
const activeQualityTrendPeriod = ref('月')

// 图表引用
const trendChart = ref<HTMLElement>()
const pieChart = ref<HTMLElement>()
const departmentChart = ref<HTMLElement>()
const radarChart = ref<HTMLElement>()
const qualityTrendChart = ref<HTMLElement>()

// ECharts实例
let trendChartInstance: echarts.ECharts | null = null
let pieChartInstance: echarts.ECharts | null = null
let departmentChartInstance: echarts.ECharts | null = null
let radarChartInstance: echarts.ECharts | null = null
let qualityTrendChartInstance: echarts.ECharts | null = null

// 汇总指标数据
const summaryMetrics = reactive([
  {
    title: '本月审核病例',
    value: '1,286',
    trend: '↑ 12.5% 较上月',
    trendClass: 'text-success'
  },
  {
    title: '发现问题数',
    value: '243',
    trend: '↑ 8.7% 较上月',
    trendClass: 'text-danger'
  },
  {
    title: '问题病例率',
    value: '18.9%',
    trend: '↑ 2.3% 较上月',
    trendClass: 'text-danger'
  },
  {
    title: '严重问题占比',
    value: '32.5%',
    trend: '↓ 4.2% 较上月',
    trendClass: 'text-success'
  }
])

// 趋势图表配置
const trendPeriods = [
  { label: '日', value: '日' },
  { label: '周', value: '周' },
  { label: '月', value: '月' }
]

// 排名排序配置
const rankingSorts = [
  { label: '按问题率', value: '按问题率' },
  { label: '按处理率', value: '按处理率' }
]

// 质控趋势期间配置
const qualityTrendPeriods = [
  { label: '日', value: '日' },
  { label: '周', value: '周' },
  { label: '月', value: '月' },
  { label: '季', value: '季' },
  { label: '年', value: '年' }
]

// 科室排名数据
const departmentRanking = reactive([
  {
    name: '儿科',
    auditCases: 186,
    issues: 15,
    issueRate: '8.1%',
    processingRate: '96%',
    trend: '↓ 4.2%',
    trendClass: 'text-success'
  },
  {
    name: '妇产科',
    auditCases: 214,
    issues: 28,
    issueRate: '13.1%',
    processingRate: '92%',
    trend: '↓ 1.8%',
    trendClass: 'text-success'
  },
  {
    name: '内科',
    auditCases: 425,
    issues: 72,
    issueRate: '16.9%',
    processingRate: '85%',
    trend: '↓ 2.3%',
    trendClass: 'text-success'
  },
  {
    name: '外科',
    auditCases: 387,
    issues: 86,
    issueRate: '22.2%',
    processingRate: '68%',
    trend: '↑ 3.5%',
    trendClass: 'text-danger'
  },
  {
    name: '骨科',
    auditCases: 142,
    issues: 32,
    issueRate: '22.5%',
    processingRate: '54%',
    trend: '↑ 5.7%',
    trendClass: 'text-danger'
  }
])

// 热力图数据
const heatMapDepartments = ['内科', '外科', '妇产科', '儿科', '骨科']
const heatMapData = reactive([
  [
    { value: 15, color: 'rgba(244, 67, 54, 0.7)', tooltip: '诊断问题 - 内科' },
    { value: 12, color: 'rgba(244, 67, 54, 0.6)', tooltip: '诊断问题 - 外科' },
    { value: 8, color: 'rgba(255, 152, 0, 0.4)', tooltip: '诊断问题 - 妇产科' },
    { value: 4, color: 'rgba(76, 175, 80, 0.2)', tooltip: '诊断问题 - 儿科' },
    { value: 10, color: 'rgba(244, 67, 54, 0.5)', tooltip: '诊断问题 - 骨科' }
  ],
  [
    { value: 11, color: 'rgba(255, 152, 0, 0.5)', tooltip: '编码问题 - 内科' },
    { value: 18, color: 'rgba(244, 67, 54, 0.8)', tooltip: '编码问题 - 外科' },
    { value: 7, color: 'rgba(255, 152, 0, 0.3)', tooltip: '编码问题 - 妇产科' },
    { value: 3, color: 'rgba(76, 175, 80, 0.1)', tooltip: '编码问题 - 儿科' },
    { value: 14, color: 'rgba(244, 67, 54, 0.6)', tooltip: '编码问题 - 骨科' }
  ],
  [
    { value: 9, color: 'rgba(255, 152, 0, 0.4)', tooltip: '数据逻辑问题 - 内科' },
    { value: 13, color: 'rgba(255, 152, 0, 0.6)', tooltip: '数据逻辑问题 - 外科' },
    { value: 5, color: 'rgba(255, 152, 0, 0.2)', tooltip: '数据逻辑问题 - 妇产科' },
    { value: 2, color: 'rgba(76, 175, 80, 0.1)', tooltip: '数据逻辑问题 - 儿科' },
    { value: 8, color: 'rgba(255, 152, 0, 0.4)', tooltip: '数据逻辑问题 - 骨科' }
  ],
  [
    { value: 6, color: 'rgba(76, 175, 80, 0.3)', tooltip: '医保规则问题 - 内科' },
    { value: 7, color: 'rgba(255, 152, 0, 0.3)', tooltip: '医保规则问题 - 外科' },
    { value: 4, color: 'rgba(76, 175, 80, 0.2)', tooltip: '医保规则问题 - 妇产科' },
    { value: 2, color: 'rgba(76, 175, 80, 0.1)', tooltip: '医保规则问题 - 儿科' },
    { value: 4, color: 'rgba(76, 175, 80, 0.2)', tooltip: '医保规则问题 - 骨科' }
  ]
])

// 方法定义
const onPeriodChange = () => {
  console.log('选择的分析周期:', selectedPeriod.value)
  if (selectedPeriod.value === 'custom') {
    console.log('显示自定义日期选择器')
  }
}

const setActiveTrendPeriod = (period: string) => {
  activeTrendPeriod.value = period
  // 这里可以添加切换数据的逻辑
  updateTrendChart(period)
}

const setActiveRankingSort = (sort: string) => {
  activeRankingSort.value = sort
  // 这里可以添加切换排序的逻辑
}

const setActiveQualityTrendPeriod = (period: string) => {
  activeQualityTrendPeriod.value = period
  // 这里可以添加切换数据的逻辑
  updateQualityTrendChart(period)
}

const getRankClass = (rank: number): string => {
  if (rank === 1) return 'rank-1'
  if (rank === 2) return 'rank-2'
  if (rank === 3) return 'rank-3'
  return ''
}

const getProgressBarClass = (rate: string): string => {
  const numRate = parseInt(rate)
  if (numRate >= 90) return 'progress-bar-success'
  if (numRate >= 70) return 'progress-bar-warning'
  return 'progress-bar-danger'
}

const openQualityIndexModal = () => {
  newTargetValue.value = qualityIndexTarget.value
  showQualityIndexModal.value = true
}

const closeQualityIndexModal = () => {
  showQualityIndexModal.value = false
  changeReason.value = 'adjust'
  otherReason.value = ''
}

const onChangeReasonChange = () => {
  if (changeReason.value !== 'other') {
    otherReason.value = ''
  }
}

const updateQualityTarget = () => {
  if (newTargetValue.value < 0 || newTargetValue.value > 100) {
    alert('请输入0-100之间的数值')
    return
  }
  
  qualityIndexTarget.value = newTargetValue.value
  closeQualityIndexModal()
  alert('目标值已成功更新为: ' + newTargetValue.value)
}

// 更新趋势图表数据
const updateTrendChart = (period: string) => {
  if (!trendChartInstance) return
  
  const dataMap: { [key: string]: any } = {
    '日': {
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      data: [
        [15, 12, 18, 14, 16, 13, 11],
        [8, 10, 12, 9, 11, 7, 6],
        [5, 7, 8, 6, 7, 4, 5],
        [3, 4, 5, 3, 4, 2, 3]
      ]
    },
    '周': {
      labels: ['第1周', '第2周', '第3周', '第4周'],
      data: [
        [45, 52, 48, 56],
        [28, 32, 30, 36],
        [18, 22, 20, 24],
        [12, 15, 13, 17]
      ]
    },
    '月': {
      labels: ['1月', '2月', '3月', '4月', '5月'],
      data: [
        [65, 59, 80, 81, 56],
        [28, 48, 40, 19, 36],
        [17, 25, 30, 24, 22],
        [12, 18, 15, 9, 14]
      ]
    }
  }
  
  const currentData = dataMap[period]
  const option = trendChartInstance.getOption()
  
  option.xAxis[0].data = currentData.labels
  option.series[0].data = currentData.data[0]
  option.series[1].data = currentData.data[1]
  option.series[2].data = currentData.data[2]
  option.series[3].data = currentData.data[3]
  
  trendChartInstance.setOption(option)
}

// 更新质量趋势图表数据
const updateQualityTrendChart = (period: string) => {
  if (!qualityTrendChartInstance) return
  
  const dataMap: { [key: string]: any } = {
    '日': {
      labels: ['1日', '2日', '3日', '4日', '5日', '6日', '7日'],
      qualityData: [84.8, 85.0, 84.9, 85.2, 85.1, 85.4, 85.3],
      rateData: [19.2, 19.0, 19.1, 18.8, 18.9, 18.6, 18.9]
    },
    '周': {
      labels: ['第1周', '第2周', '第3周', '第4周'],
      qualityData: [83.5, 84.2, 84.8, 85.3],
      rateData: [20.3, 19.8, 19.2, 18.9]
    },
    '月': {
      labels: ['2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05'],
      qualityData: [78.2, 79.5, 82.1, 83.5, 84.8, 85.3],
      rateData: [24.5, 22.8, 21.5, 20.3, 19.6, 18.9]
    },
    '季': {
      labels: ['2024Q3', '2024Q4', '2025Q1', '2025Q2'],
      qualityData: [75.8, 78.2, 81.7, 85.1],
      rateData: [26.2, 24.5, 21.4, 19.2]
    },
    '年': {
      labels: ['2022年', '2023年', '2024年', '2025年'],
      qualityData: [68.5, 72.3, 78.2, 85.1],
      rateData: [32.1, 28.7, 24.5, 19.2]
    }
  }
  
  const currentData = dataMap[period]
  const option = qualityTrendChartInstance.getOption()
  
  option.xAxis[0].data = currentData.labels
  option.series[0].data = currentData.qualityData
  option.series[1].data = currentData.rateData
  
  qualityTrendChartInstance.setOption(option)
}

// 初始化ECharts图表
const initCharts = () => {
  // 趋势分析图表
  if (trendChart.value) {
    trendChartInstance = echarts.init(trendChart.value)
    const trendOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        data: ['诊断问题', '编码问题', '数据逻辑问题', '医保规则问题'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: ['1月', '2月', '3月', '4月', '5月'],
          axisLine: {
            lineStyle: {
              color: '#E0E0E0'
            }
          },
          axisTick: {
            show: false
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      ],
      series: [
        {
          name: '诊断问题',
          type: 'line',
          stack: '总量',
          smooth: true,
          lineStyle: {
            width: 2
          },
          areaStyle: {
            opacity: 0.1
          },
          itemStyle: {
            color: '#1976D2'
          },
          data: [65, 59, 80, 81, 56]
        },
        {
          name: '编码问题',
          type: 'line',
          stack: '总量',
          smooth: true,
          lineStyle: {
            width: 2
          },
          areaStyle: {
            opacity: 0.1
          },
          itemStyle: {
            color: '#4CAF50'
          },
          data: [28, 48, 40, 19, 36]
        },
        {
          name: '数据逻辑问题',
          type: 'line',
          stack: '总量',
          smooth: true,
          lineStyle: {
            width: 2
          },
          areaStyle: {
            opacity: 0.1
          },
          itemStyle: {
            color: '#FF9800'
          },
          data: [17, 25, 30, 24, 22]
        },
        {
          name: '医保规则问题',
          type: 'line',
          stack: '总量',
          smooth: true,
          lineStyle: {
            width: 2
          },
          areaStyle: {
            opacity: 0.1
          },
          itemStyle: {
            color: '#F44336'
          },
          data: [12, 18, 15, 9, 14]
        }
      ]
    }
    trendChartInstance.setOption(trendOption)
  }

  // 饼图
  if (pieChart.value) {
    pieChartInstance = echarts.init(pieChart.value)
    const pieOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          fontSize: 11
        }
      },
      series: [
        {
          name: '问题类型',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: 35, name: '诊断问题', itemStyle: { color: '#1976D2' } },
            { value: 25, name: '编码问题', itemStyle: { color: '#4CAF50' } },
            { value: 20, name: '数据逻辑问题', itemStyle: { color: '#FF9800' } },
            { value: 12, name: '医保规则问题', itemStyle: { color: '#F44336' } },
            { value: 8, name: '其他问题', itemStyle: { color: '#9E9E9E' } }
          ]
        }
      ]
    }
    pieChartInstance.setOption(pieOption)
  }

  // 科室对比柱状图
  if (departmentChart.value) {
    departmentChartInstance = echarts.init(departmentChart.value)
    const departmentOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['问题数', '处理数'],
        top: 0,
        textStyle: {
          fontSize: 11
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: ['内科', '外科', '妇产科', '儿科', '骨科'],
          axisTick: {
            alignWithLabel: true
          },
          axisLine: {
            show: false
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      ],
      series: [
        {
          name: '问题数',
          type: 'bar',
          barWidth: '35%',
          itemStyle: {
            color: 'rgba(25, 118, 210, 0.7)',
            borderRadius: [2, 2, 0, 0]
          },
          data: [72, 86, 28, 15, 32]
        },
        {
          name: '处理数',
          type: 'bar',
          barWidth: '35%',
          itemStyle: {
            color: 'rgba(76, 175, 80, 0.7)',
            borderRadius: [2, 2, 0, 0]
          },
          data: [61, 58, 26, 14, 17]
        }
      ]
    }
    departmentChartInstance.setOption(departmentOption)
  }

  // 雷达图
  if (radarChart.value) {
    radarChartInstance = echarts.init(radarChart.value)
    const radarOption = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['当前水平', '目标水平'],
        bottom: 0,
        textStyle: {
          fontSize: 11
        }
      },
      radar: {
        indicator: [
          { name: '诊断规范', max: 100 },
          { name: '编码准确', max: 100 },
          { name: '数据完整', max: 100 },
          { name: '逻辑一致', max: 100 },
          { name: '医保合规', max: 100 }
        ],
        splitArea: {
          areaStyle: {
            color: ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.05)']
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        name: {
          textStyle: {
            fontSize: 11
          }
        }
      },
      series: [
        {
          name: '质控能力',
          type: 'radar',
          data: [
            {
              value: [80, 75, 90, 85, 70],
              name: '当前水平',
              itemStyle: {
                color: '#1976D2'
              },
              areaStyle: {
                color: 'rgba(25, 118, 210, 0.2)'
              }
            },
            {
              value: [90, 90, 95, 90, 85],
              name: '目标水平',
              itemStyle: {
                color: '#4CAF50'
              },
              lineStyle: {
                type: 'dashed'
              },
              areaStyle: {
                color: 'rgba(76, 175, 80, 0.1)'
              }
            }
          ]
        }
      ]
    }
    radarChartInstance.setOption(radarOption)
  }

  // 质量趋势双轴图
  if (qualityTrendChart.value) {
    qualityTrendChartInstance = echarts.init(qualityTrendChart.value)
    const qualityTrendOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['数据质量指数', '问题病例率'],
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          axisTick: {
            alignWithLabel: true
          },
          data: ['2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05'],
          axisLine: {
            show: false
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '数据质量指数',
          min: 70,
          max: 100,
          position: 'left',
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          axisLabel: {
            formatter: '{value}'
          }
        },
        {
          type: 'value',
          name: '问题病例率 (%)',
          min: 0,
          max: 30,
          position: 'right',
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            formatter: '{value}%'
          }
        }
      ],
      series: [
        {
          name: '数据质量指数',
          type: 'line',
          yAxisIndex: 0,
          smooth: true,
          itemStyle: {
            color: '#1976D2'
          },
          areaStyle: {
            color: 'rgba(25, 118, 210, 0.1)'
          },
          data: [78.2, 79.5, 82.1, 83.5, 84.8, 85.3]
        },
        {
          name: '问题病例率',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          itemStyle: {
            color: '#F44336'
          },
          lineStyle: {
            type: 'dashed'
          },
          data: [24.5, 22.8, 21.5, 20.3, 19.6, 18.9]
        }
      ]
    }
    qualityTrendChartInstance.setOption(qualityTrendOption)
  }
}

// 窗口大小改变时重新调整图表
const resizeCharts = () => {
  trendChartInstance?.resize()
  pieChartInstance?.resize()
  departmentChartInstance?.resize()
  radarChartInstance?.resize()
  qualityTrendChartInstance?.resize()
}

// 组件挂载后初始化图表
onMounted(async () => {
  await nextTick()
  initCharts()
  
  // 监听窗口大小变化
  window.addEventListener('resize', resizeCharts)
})

// 组件卸载时清理
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  trendChartInstance?.dispose()
  pieChartInstance?.dispose()
  departmentChartInstance?.dispose()
  radarChartInstance?.dispose()
  qualityTrendChartInstance?.dispose()
})
</script>

<style scoped>
/* 响应式设计 */
@media (width <= 992px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .kpi-cards {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@media (width <= 768px) {
  .analysis-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .date-range-picker {
    width: 100%;
  }
  
  .summary-metrics {
    grid-template-columns: 1fr;
  }
  
  .charts-layout-section {
    grid-template-columns: 1fr;
  }
}

.analysis-page {
  min-height: 100vh;
  padding: 16px;
  font-family: "Microsoft YaHei", "Segoe UI", sans-serif;
  background-color: #F5F7FA;
}

/* 页面标题栏 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #212121;
}

.page-actions {
  display: flex;
}

/* 按钮样式 */
.btn {
  display: flex;
  padding: 8px 14px;
  margin-left: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  transition: all 0.3s;
  align-items: center;
}

.btn svg {
  margin-right: 6px;
}

.btn-primary {
  color: white;
  background-color: #1976D2;
}

.btn-primary:hover {
  background-color: #0D47A1;
}

.btn-outline {
  color: #1976D2;
  background-color: white;
  border: 1px solid #1976D2;
}

.btn-outline:hover {
  background-color: #F5F7FA;
}

/* 分析过滤器 */
.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.date-range-picker {
  display: flex;
  padding: 8px 12px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
  align-items: center;
}

.date-range-picker select {
  height: 38px;
  padding: 5px;
  margin-left: 8px;
  font-size: 13px;
  color: #1976D2;
  cursor: pointer;
  background-color: transparent;
  border: none;
}

.date-range-title {
  margin-right: 8px;
  font-size: 13px;
  color: #757575;
}

/* 面包屑导航 */
.drill-down-breadcrumb {
  display: flex;
  margin-bottom: 16px;
  font-size: 13px;
  color: #757575;
  align-items: center;
}

.drill-down-link {
  margin-right: 8px;
  color: #1976D2;
  cursor: pointer;
}

.drill-down-separator {
  margin: 0 8px;
}

/* KPI指标卡片 */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.kpi-card {
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgb(0 0 0 / 12%);
}

.kpi-title {
  display: flex;
  margin-bottom: 12px;
  font-size: 14px;
  color: #757575;
  align-items: center;
}

.kpi-title .tooltip {
  position: relative;
  display: inline-block;
  margin-left: 5px;
}

.kpi-title .tooltip-text {
  position: absolute;
  bottom: 125%;
  left: 35px;
  z-index: 10;
  width: 280px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: normal;
  line-height: 1.5;
  color: #fff;
  text-align: left;
  background-color: #616161;
  border-radius: 4px;
  opacity: 0;
  visibility: hidden;
  transform: none;
  box-shadow: 0 2px 8px rgb(0 0 0 / 20%);
  transition: opacity 0.3s;
}

.kpi-title .tooltip:hover .tooltip-text {
  opacity: 1;
  visibility: visible;
}

.kpi-edit-btn {
  display: flex;
  padding: 4px;
  margin-left: auto;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s;
  align-items: center;
  justify-content: center;
}

.kpi-edit-btn:hover {
  background-color: #F5F5F5;
}

.kpi-data {
  display: flex;
  align-items: flex-end;
}

.kpi-value {
  margin-right: 8px;
  font-size: 28px;
  font-weight: bold;
}

.kpi-target {
  font-size: 13px;
  color: #757575;
}

.progress-container {
  margin-top: 8px;
}

.progress {
  height: 8px;
  overflow: hidden;
  background-color: #E0E0E0;
  border-radius: 4px;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-target {
  display: flex;
  margin-top: 4px;
  font-size: 11px;
  color: #757575;
  justify-content: space-between;
}

/* 仪表盘样式 */
.gauge-container {
  position: relative;
  width: 120px;
  height: 60px;
  margin: 20px auto;
}

.gauge-outer-arc {
  position: absolute;
  width: 120px;
  height: 60px;
  background-color: #F5F7FA;
  border-radius: 60px 60px 0 0;
}

.gauge-inner-arc {
  position: absolute;
  width: 120px;
  height: 60px;
  overflow: hidden;
  clip: rect(0, 120px, 60px, 60px);
  border-radius: 60px 60px 0 0;
}

.gauge-inner-arc div {
  position: absolute;
  width: 120px;
  height: 60px;
  background-color: #1976D2;
  border-radius: 60px 60px 0 0;
  transform-origin: bottom center;
}

.gauge-value {
  position: absolute;
  right: 0;
  bottom: -20px;
  left: 0;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
}

.gauge-min-max {
  display: flex;
  justify-content: space-between;
  width: 120px;
  margin: 0 auto;
  font-size: 11px;
  color: #757575;
}

/* 趋势线样式 */
.trend-line {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.trend-indicator {
  width: 40px;
  height: 20px;
  margin-left: 8px;
}

/* 汇总指标卡片 */
.summary-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.metric-card {
  display: flex;
  padding: 20px;
  text-align: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
  flex-direction: column;
  align-items: center;
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgb(0 0 0 / 12%);
}

.metric-title {
  margin-bottom: 10px;
  font-size: 14px;
  color: #757575;
}

.metric-value {
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: bold;
}

.metric-trend {
  display: flex;
  margin-top: auto;
  font-size: 12px;
  align-items: center;
}

/* 图表区域 */
.chart-container {
  position: relative;
  width: 100%;
  height: 320px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card {
  height: 100%;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
}

.chart-title {
  display: flex;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #212121;
  justify-content: space-between;
  align-items: center;
}

.chart-actions {
  display: flex;
}

.chart-actions button {
  padding: 4px 10px;
  margin-left: 6px;
  font-size: 12px;
  cursor: pointer;
  background-color: white;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  transition: all 0.3s;
}

.chart-actions button.active {
  color: white;
  background-color: #1976D2;
  border-color: #1976D2;
}

/* 雷达图容器 */
.radar-container {
  position: relative;
  width: 100%;
  height: 300px;
}

/* 布局部分 */
.charts-layout-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-body {
  padding: 20px;
}

.chart-body.p-0 {
  padding: 0;
}

/* 科室排名表格 */
.top-departments {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.top-departments th, 
.top-departments td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #E0E0E0;
}

.top-departments th {
  font-weight: 600;
  color: #757575;
  background-color: #F5F7FA;
}

.top-departments tr:last-child td {
  border-bottom: none;
}

.top-departments tr:hover td {
  background-color: #F5F7FA;
}

.rank-number {
  display: flex;
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 600;
  background-color: #F5F7FA;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}

.rank-1 {
  color: #FFA000;
  background-color: #FFF9C4;
}

.rank-2 {
  color: #757575;
  background-color: #F5F5F5;
}

.rank-3 {
  color: #E64A19;
  background-color: #FFCCBC;
}

/* 进度条样式 */
.progress-bar-success { 
  background-color: #4CAF50; 
}

.progress-bar-warning { 
  background-color: #FF9800; 
}

.progress-bar-danger { 
  background-color: #F44336; 
}

/* 热力图样式 */
.heat-map {
  display: flex;
  flex-direction: column;
}

.heat-map-row {
  display: flex;
  height: 30px;
  margin-bottom: 1px;
}

.heat-map-cell {
  display: flex;
  margin-right: 1px;
  font-size: 11px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.heat-map-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 5px rgb(0 0 0 / 10%);
}

.heat-map-labels {
  display: flex;
  margin-bottom: 5px;
}

.heat-map-label {
  font-size: 11px;
  color: #757575;
  text-align: center;
  flex: 1;
}

.heat-scale {
  display: flex;
  align-items: center;
  margin-top: 10px;
  justify-content: center;
}

.heat-scale-bar {
  width: 200px;
  height: 12px;
  margin: 0 10px;
  background: linear-gradient(to right, #C8E6C9, #FFECB3, #FFCDD2);
  border-radius: 6px;
}

.heat-scale-label {
  font-size: 11px;
  color: #757575;
}

/* 卡片样式 */
.card {
  margin-bottom: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 8%);
}

.card-header {
  display: flex;
  padding: 15px 20px;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #212121;
}

.card-body {
  padding: 20px;
}

/* 模态框样式 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  background-color: rgb(0 0 0 / 50%);
  align-items: center;
  justify-content: center;
}

.modal-container {
  max-height: 90vh;
  overflow: auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 15%);
}

.modal-header {
  display: flex;
  padding: 16px 20px;
  border-bottom: 1px solid #E0E0E0;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #212121;
}

.modal-close {
  font-size: 20px;
  color: #757575;
  cursor: pointer;
  background: none;
  border: none;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  padding: 16px 20px;
  border-top: 1px solid #E0E0E0;
  justify-content: flex-end;
  gap: 10px;
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #424242;
}

.form-explanation {
  padding: 12px 15px;
  margin-bottom: 20px;
  background-color: #F5F7FA;
  border-left: 3px solid #1976D2;
  border-radius: 4px;
}

.explanation-header {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #424242;
}

.explanation-list {
  padding: 0;
  margin: 0;
  font-size: 12px;
  color: #616161;
  list-style-type: none;
}

.explanation-list li {
  margin-bottom: 5px;
  line-height: 1.5;
}

.scale-value {
  font-weight: 600;
  color: #1976D2;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
}

input[type="number"].form-control {
  height: 38px;
}

textarea.form-control {
  min-height: 80px;
  resize: vertical;
}

/* 工具类 */
.text-success { color: #4CAF50; }

.text-warning { color: #FF9800; }

.text-danger { color: #F44336; }

.text-info { color: #2196F3; }

.text-muted { color: #757575; }

.mt-3 { margin-top: 16px; }

.ml-1 { margin-left: 4px; }

/* 全局样式 */
</style>
<template>
  <div class="dashboard-container">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="page-title">数据概览</div>
      <div class="page-actions">
        <div class="date-picker">
          <el-select
            v-model="selectedPeriodType"
            placeholder="时间类型"
            size="default"
            style="width: 80px;"
            @change="handlePeriodTypeChange"
          >
            <el-option label="年" value="year"/>
            <el-option label="月" value="month"/>
            <el-option label="日" value="day"/>
          </el-select>
          <el-select
            v-model="selectedPeriodValue"
            :placeholder="getValuePlaceholder()"
            size="default"
            style="width: 140px; margin-left: 8px;"
          >
            <el-option
              v-for="option in currentPeriodOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <!-- <el-button type="default" class="ml-8px" @click="setToday">今天</el-button> -->
        </div>
        <el-button type="default" class="ml-8px">
          <el-icon class="mr-4px"><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="dashboard-cards">
      <div class="dashboard-card" v-for="(card, index) in dashboardCards" :key="index">
        <div class="card-header">
          <div class="card-title">{{ card.title }}</div>
          <div class="card-icon" :class="card.iconBg">{{ card.icon }}</div>
        </div>
        <div class="card-value">{{ card.value }}</div>
        <div class="card-description">
          <span :class="card.trendClass">{{ card.trend }}</span>&nbsp;{{ card.description }}
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-grid">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="chart-header">
            <div class="card-title">质控问题趋势</div>
            <div class="chart-actions">
              <el-button
                v-for="period in chartPeriods"
                :key="period.value"
                :type="selectedChartPeriod === period.value ? 'primary' : 'default'"
                size="small"
                @click="selectedChartPeriod = period.value"
              >
                {{ period.label }}
              </el-button>
            </div>
          </div>
        </template>
        <div class="chart-container">
          <el-skeleton :loading="loading" animated>
            <Echart :options="lineOptionsData" :height="320" />
          </el-skeleton>
        </div>
        <div class="trend-legend">
          <div class="legend-item" v-for="item in trendLegend" :key="item.name">
            <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
            <span>{{ item.name }}</span>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="card-title">问题类型分布</div>
        </template>
        <div class="chart-container">
          <el-skeleton :loading="loading" animated>
            <Echart :options="pieOptionsData" :height="320" />
          </el-skeleton>
        </div>
      </el-card>
    </div>

    <!-- 最近质控问题表格 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header-flex">
          <div class="card-title">最近质控问题</div>
          <div class="search-box">
            <el-input
              v-model="searchQuery"
              placeholder="搜索问题..."
              prefix-icon="Search"
              clearable
              size="default"
              style="width: 200px;"
            />
          </div>
        </div>
      </template>
      <div class="table-container">
        <el-skeleton :loading="loading" animated>
          <el-table :data="issuesData" stripe style="width: 100%">
            <el-table-column prop="caseNumber" label="病案号"  />
            <el-table-column prop="department" label="科室"  />
            <el-table-column prop="issueType" label="问题类型"  />
            <el-table-column prop="severity" label="严重程度" >
              <template #default="scope">
                <el-tag
                  :type="getSeverityType(scope.row.severity)"
                  size="small"
                >
                  {{ scope.row.severity }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="discoveryTime" label="发现时间"  />
            <el-table-column prop="status" label="状态" >
              <template #default="scope">
                <el-tag
                  :type="getStatusType(scope.row.status)"
                  size="small"
                >
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" >
              <template #default="scope">
                <el-button type="primary" size="small" link @click="handleView(scope.row)">
                  查看
                </el-button>
                <el-button
                  v-if="scope.row.status !== '已处理'"
                  type="primary"
                  size="small"
                  link
                  @click="handleProcess(scope.row)"
                >
                  处理
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-skeleton>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { EChartsOption } from 'echarts'
import { Download } from '@element-plus/icons-vue'

import { useRouter } from 'vue-router'

const router = useRouter()

defineOptions({ name: 'Index' })

// 响应式数据
const loading = ref(true)
const selectedPeriodType = ref('day')
const selectedPeriodValue = ref('today')
const selectedChartPeriod = ref('week')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 时间选择选项
const periodOptions = {
  year: [
    { label: '2025年', value: '2025' },
    { label: '2024年', value: '2024' },
    { label: '2023年', value: '2023' },
    { label: '2022年', value: '2022' },
    { label: '2021年', value: '2021' }
  ],
  month: [
    { label: '近一个月', value: 'recent1month' },
    { label: '近三个月', value: 'recent3months' },
    { label: '近半年', value: 'recent6months' }
  ],
  day: [
    { label: '今天', value: 'today' },
    { label: '近一天', value: 'recent1day' },
    { label: '近三天', value: 'recent3days' },
    { label: '近七天', value: 'recent7days' },
    { label: '近十五天', value: 'recent15days' }
  ]
}

// 计算当前时间段选项
const currentPeriodOptions = computed(() => {
  return periodOptions[selectedPeriodType.value] || []
})

// 仪表盘卡片数据
const dashboardCards = reactive([
  {
    title: '今日审核病例',
    icon: '📋',
    iconBg: 'bg-blue',
    value: '128',
    trend: '↑ 12.5%',
    trendClass: 'text-success',
    description: '较昨日'
  },
  {
    title: '未处理问题',
    icon: '⚠️',
    iconBg: 'bg-orange',
    value: '42',
    trend: '↑ 5.3%',
    trendClass: 'text-danger',
    description: '较昨日'
  },
  {
    title: '问题处理率',
    icon: '✓',
    iconBg: 'bg-green',
    value: '86.2%',
    trend: '↑ 2.1%',
    trendClass: 'text-success',
    description: '较上周'
  },
  {
    title: '平均审核时间',
    icon: '⏱',
    iconBg: 'bg-blue',
    value: '1.8分钟',
    trend: '↓ 0.3分钟',
    trendClass: 'text-success',
    description: '较上周'
  }
])

// 图表时间周期选项
const chartPeriods = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' }
]

// 趋势图例数据
const trendLegend = [
  { name: '诊断问题', color: '#1976D2' },
  { name: '编码问题', color: '#4CAF50' },
  { name: '数据逻辑问题', color: '#FF9800' }
]

// 折线图配置
const lineOptionsData = reactive<EChartsOption>({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    }
  },
  legend: {
    show: false
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['第1周', '第2周', '第3周', '第4周', '第5周', '本周'],
    axisLine: {
      show: false
    },
    axisTick: {
      show: false
    }
  },
  yAxis: {
    type: 'value',
    splitLine: {
      lineStyle: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    }
  },
  series: [
    {
      name: '诊断问题',
      type: 'line',
      data: [65, 59, 80, 81, 56, 55],
      smooth: true,
      lineStyle: {
        color: '#1976D2'
      },
      itemStyle: {
        color: '#1976D2'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(25, 118, 210, 0.1)' },
            { offset: 1, color: 'rgba(25, 118, 210, 0.01)' }
          ]
        }
      }
    },
    {
      name: '编码问题',
      type: 'line',
      data: [28, 48, 40, 19, 36, 27],
      smooth: true,
      lineStyle: {
        color: '#4CAF50'
      },
      itemStyle: {
        color: '#4CAF50'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(76, 175, 80, 0.1)' },
            { offset: 1, color: 'rgba(76, 175, 80, 0.01)' }
          ]
        }
      }
    },
    {
      name: '数据逻辑问题',
      type: 'line',
      data: [17, 25, 30, 24, 22, 15],
      smooth: true,
      lineStyle: {
        color: '#FF9800'
      },
      itemStyle: {
        color: '#FF9800'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(255, 152, 0, 0.1)' },
            { offset: 1, color: 'rgba(255, 152, 0, 0.01)' }
          ]
        }
      }
    }
  ]
})

// 饼图配置
const pieOptionsData = reactive<EChartsOption>({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b} : {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    right: '10%',
    top: 'center',
    textStyle: {
      fontSize: 12
    }
  },
  series: [
    {
      name: '问题类型',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      data: [
        { value: 35, name: '诊断问题' },
        { value: 25, name: '编码问题' },
        { value: 20, name: '数据逻辑问题' },
        { value: 12, name: '费用问题' },
        { value: 8, name: '其他问题' }
      ],
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '16',
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ],
  color: ['#1976D2', '#4CAF50', '#FF9800', '#F44336', '#9E9E9E']
})

// 表格数据
const issuesData = reactive([
  {
    caseNumber: '202504280001',
    department: '心内科',
    issueType: '主要诊断选择错误',
    severity: '严重',
    discoveryTime: '2025-05-18 09:23',
    status: '未处理'
  },
  {
    caseNumber: '202504280015',
    department: '神经外科',
    issueType: '手术编码错误',
    severity: '中等',
    discoveryTime: '2025-05-18 10:45',
    status: '处理中'
  },
  {
    caseNumber: '202504280023',
    department: '骨科',
    issueType: '诊断名称不完整',
    severity: '轻微',
    discoveryTime: '2025-05-18 11:37',
    status: '已处理'
  },
  {
    caseNumber: '202504280042',
    department: '肿瘤科',
    issueType: '费用逻辑矛盾',
    severity: '中等',
    discoveryTime: '2025-05-18 13:12',
    status: '未处理'
  },
  {
    caseNumber: '202504280056',
    department: '妇产科',
    issueType: '关键信息缺失',
    severity: '严重',
    discoveryTime: '2025-05-18 14:05',
    status: '未处理'
  }
])

// 方法
const handlePeriodTypeChange = () => {
  // 当时间类型改变时，重置时间值为第一个选项
  const options = currentPeriodOptions.value
  if (options.length > 0) {
    selectedPeriodValue.value = options[0].value
  }
  // 重新加载数据
  loadDataByPeriod()
}

const getValuePlaceholder = () => {
  const placeholders = {
    year: '选择年份',
    month: '选择月份范围',
    day: '选择日期范围'
  }
  return placeholders[selectedPeriodType.value] || '请选择'
}

const setToday = () => {
  selectedPeriodType.value = 'day'
  selectedPeriodValue.value = 'today'
  loadDataByPeriod()
}

const loadDataByPeriod = () => {
  console.log(`加载数据: ${selectedPeriodType.value} - ${selectedPeriodValue.value}`)
  // 这里可以根据选择的时间段重新加载数据
  // 例如：调用API获取对应时间段的数据
}

const getSeverityType = (severity: string) => {
  const typeMap: { [key: string]: string } = {
    '严重': 'danger',
    '中等': 'warning',
    '轻微': 'success'
  }
  return typeMap[severity] || 'info'
}

const getStatusType = (status: string) => {
  const typeMap: { [key: string]: string } = {
    '未处理': 'danger',
    '处理中': 'warning',
    '已处理': 'success'
  }
  return typeMap[status] || 'info'
}

const handleView = (row: any) => {
  // console.log('查看问题:', row)
  // 跳转到问题详情页
  router.push({ path: '/data' });
}

const handleProcess = (row: any) => {
  // console.log('处理问题:', row)
  // 跳转到问题处理页
  router.push({ path: '/audit' });
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  // 重新加载数据
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  // 重新加载数据
}

onMounted(() => {
  // 初始化时间选择默认值
  selectedPeriodType.value = 'day'
  selectedPeriodValue.value = 'today'

  // 模拟数据加载
  setTimeout(() => {
    loading.value = false
  }, 1000)
})

// 监听时间值变化
watch(selectedPeriodValue, () => {
  loadDataByPeriod()
})
</script>

<style scoped>


@media (width <= 992px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}

/* 响应式调整 */
@media (width <= 768px) {
  .dashboard-cards {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

.dashboard-container {
  min-height: calc(100vh - 60px);
  padding: 16px;
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
  align-items: center;
}

.date-picker {
  display: flex;
  align-items: center;
}

/* 统计卡片样式 */
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.dashboard-card {
  height: 100%;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
  transition: transform 0.2s, box-shadow 0.2s;
}

.dashboard-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #212121;
}

.card-icon {
  display: flex;
  width: 36px;
  height: 36px;
  font-size: 16px;
  color: white;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
}

.bg-blue {
  background-color: #1976D2;
}

.bg-green {
  background-color: #4CAF50;
}

.bg-orange {
  background-color: #FF9800;
}

.bg-red {
  background-color: #F44336;
}

.card-value {
  margin-bottom: 4px;
  font-size: 24px;
  font-weight: bold;
  color: #212121;
}

.card-description {
  display: flex;
  font-size: 12px;
  color: #757575;
  align-items: center;
}

.text-success {
  color: #4CAF50;
}

.text-danger {
  color: #F44336;
}

/* 图表区域样式 */
.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-card {
  border-radius: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-actions {
  display: flex;
  gap: 4px;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 320px;
}

.trend-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  margin-right: 5px;
  border-radius: 2px;
}

/* 表格样式 */
.table-card {
  border-radius: 8px;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-container {
  overflow-x: auto;
}

.pagination-container {
  display: flex;
  margin-top: 16px;
  justify-content: center;
}
</style>

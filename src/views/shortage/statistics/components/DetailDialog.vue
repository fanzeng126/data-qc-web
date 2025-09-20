<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="基本信息" name="basic">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="药品名称">
            {{ detailData?.drugName }}
          </el-descriptions-item>
          <el-descriptions-item label="药品分类">
            {{ drugDetailData?.drugCategory || detailData?.drugCategory || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="剂型">
            {{ detailData?.dosageForm }}
          </el-descriptions-item>
          <el-descriptions-item label="规格">
            {{ drugDetailData?.specification || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="生产厂家">
            {{ drugDetailData?.manufacturer || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="总机构数">
            {{ drugDetailData?.totalOrgCount || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="短缺机构数">
            <el-tag type="warning">{{ detailData?.shortageOrgCount }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="严重短缺机构数">
            <el-tag type="danger">{{ detailData?.severeShortageOrgCount }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="平均库存天数">
            <span :class="{ 'text-danger': (detailData?.avgStockDays || 0) < 3 }">
              {{ detailData?.avgStockDays }} 天
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="总库存量">
            {{ drugDetailData?.totalStock || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="周使用总量">
            {{ drugDetailData?.totalWeeklyUsage || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="riskLevel.type">{{ riskLevel.label }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="趋势分析" name="trend">
        <div class="trend-container">
          <div ref="trendChartRef" class="trend-chart"></div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="机构分布" name="distribution">
        <el-table :data="drugDetailData?.orgDistribution || []" border max-height="300" v-loading="loading">
          <el-table-column label="机构名称" prop="orgName" width="200" />
          <el-table-column label="地区" prop="region" width="120" />
          <el-table-column label="供应状态" prop="supplyStatus" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getSupplyTagType(scope.row.supplyStatus)">
                {{ scope.row.supplyStatusName }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="库存量" prop="stockAmount" width="100" align="right" />
          <el-table-column label="周使用量" prop="weekUsage" width="100" align="right" />
          <el-table-column label="库存天数" prop="stockDays" width="100" align="right">
            <template #default="scope">
              <span :class="{ 'text-danger': scope.row.stockDays < 3 }">
                {{ scope.row.stockDays }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="最后更新" prop="updateTime" width="150" />
        </el-table>
        <div v-if="!drugDetailData?.orgDistribution?.length && !loading" class="no-data">
          暂无机构分布数据
        </div>
      </el-tab-pane>
    </el-tabs>

<!--    <template #footer>
      <el-button @click="handleExport" type="success" plain>
        <Icon icon="ep:download" class="mr-1" />
        导出详情
      </el-button>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>-->
  </Dialog>
</template>

<script setup lang="ts">
import { type ShortageDetailVO, type DrugDetailVO, StatisticsApi } from '@/api/shortage/statistics'
import * as echarts from 'echarts'

const dialogVisible = ref(false)
const dialogTitle = ref('')
const activeTab = ref('basic')
const detailData = ref<ShortageDetailVO>()
const drugDetailData = ref<DrugDetailVO>()
const trendChartRef = ref()
let trendChart: echarts.ECharts | null = null
const loading = ref(false)

// 默认查询参数
const queryParams = ref({
  zoneId: null,
  reportWeek: '',
  areaCode: null,
  orgIds: []
})

// 删除模拟数据，这些数据现在从后端API获取
const riskLevel = computed(() => {
  if (!detailData.value) return { type: 'info', label: '未知' }

  const { severeShortageOrgCount, shortageOrgCount } = detailData.value
  if (severeShortageOrgCount >= 10) {
    return { type: 'danger', label: '高风险' }
  } else if (shortageOrgCount >= 10) {
    return { type: 'warning', label: '中风险' }
  } else {
    return { type: 'info', label: '低风险' }
  }
})

const open = async (data: ShortageDetailVO, params?: any) => {
  detailData.value = data
  drugDetailData.value = undefined
  dialogTitle.value = `${data.drugName} - 详细信息`
  dialogVisible.value = true
  activeTab.value = 'basic'

  // 合并查询参数
  if (params) {
    queryParams.value = { ...queryParams.value, ...params }
  }

  // 如果有drugId，获取详细信息
  if (data.drugId) {
    loading.value = true
    try {
      drugDetailData.value = await StatisticsApi.getDrugDetail(data.drugId, queryParams.value)
      nextTick(() => {
        initTrendChart()
      })
    } catch (error) {
      console.error('获取药品详细信息失败:', error)
    } finally {
      loading.value = false
    }
  } else {
    nextTick(() => {
      initTrendChart()
    })
  }
}

const getSupplyTagType = (status: number): string => {
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'warning'
    case 3:
      return 'danger'
    case 4:
      return 'danger'
    default:
      return 'info'
  }
}

const getSupplyStatusText = (status: number): string => {
  switch (status) {
    case 1:
      return '充足'
    case 2:
      return '较充足'
    case 3:
      return '短缺'
    case 4:
      return '严重短缺'
    default:
      return '未知'
  }
}

const initTrendChart = () => {
  if (!trendChartRef.value) return

  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }

  let option = {}

  // 如果有真实的趋势数据，使用真实数据
  if (drugDetailData.value?.trendData?.length) {
    const trendData = drugDetailData.value.trendData
    const dates = trendData.map(item => item.week)
    const shortageCount = trendData.map(item => item.shortageCount)
    const severeShortageCount = trendData.map(item => item.severeShortageCount)

    option = {
      title: {
        text: '短缺趋势分析',
        left: 'center',
        textStyle: {
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['短缺机构数', '严重短缺机构数'],
        bottom: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '机构数'
      },
      series: [
        {
          name: '短缺机构数',
          type: 'line',
          data: shortageCount,
          smooth: true,
          lineStyle: {
            color: '#e6a23c'
          },
          itemStyle: {
            color: '#e6a23c'
          }
        },
        {
          name: '严重短缺机构数',
          type: 'line',
          data: severeShortageCount,
          smooth: true,
          lineStyle: {
            color: '#f56c6c'
          },
          itemStyle: {
            color: '#f56c6c'
          }
        }
      ]
    }
  } else {
    // 使用模拟数据
    const dates = []
    const shortageCount = []
    const severeShortageCount = []

    for (let i = 7; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i * 7)
      dates.push(date.toLocaleDateString())
      shortageCount.push(Math.floor(Math.random() * 20) + 5)
      severeShortageCount.push(Math.floor(Math.random() * 10) + 2)
    }

    option = {
      title: {
        text: '短缺趋势分析（模拟数据）',
        left: 'center',
        textStyle: {
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['短缺机构数', '严重短缺机构数'],
        bottom: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '机构数'
      },
      series: [
        {
          name: '短缺机构数',
          type: 'line',
          data: shortageCount,
          smooth: true,
          lineStyle: {
            color: '#e6a23c'
          },
          itemStyle: {
            color: '#e6a23c'
          }
        },
        {
          name: '严重短缺机构数',
          type: 'line',
          data: severeShortageCount,
          smooth: true,
          lineStyle: {
            color: '#f56c6c'
          },
          itemStyle: {
            color: '#f56c6c'
          }
        }
      ]
    }
  }

  trendChart.setOption(option)
}

const handleExport = () => {
  console.log('导出详情数据:', detailData.value)
  // 这里实现导出逻辑
}

// 监听标签页切换
watch(activeTab, (newTab) => {
  if (newTab === 'trend') {
    nextTick(() => {
      if (trendChart) {
        trendChart.resize()
      }
    })
  }
})

onUnmounted(() => {
  if (trendChart) {
    trendChart.dispose()
    trendChart = null
  }
})

defineExpose({ open })
</script>

<style scoped>
.detail-tabs {
  min-height: 400px;
}

.trend-container {
  height: 350px;
}

.trend-chart {
  width: 100%;
  height: 100%;
}

.text-danger {
  color: #f56c6c;
  font-weight: 600;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 50px 0;
  font-size: 14px;
}

:deep(.el-descriptions__body .el-descriptions__table) {
  border-radius: 6px;
}

:deep(.el-tab-pane) {
  padding-top: 20px;
}
</style>

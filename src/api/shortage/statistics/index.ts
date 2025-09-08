import request from '@/config/axios'

// ========== 统计查询参数 ==========
export interface StatisticsQueryVO {
  zoneId?: number | null
  reportWeek?: string
  administrativeRegion?: string | null
  orgId?: number | null
  startDate?: string
  endDate?: string
}

// ========== 简化查询参数 ==========
export interface SimpleQueryVO {
  zoneId?: number | null
  reportWeek?: string
}

// ========== 简化概览数据 ==========
export interface SimpleOverviewVO {
  reportOrgCount: number
  reportDrugCount: number
  shortageDrugCount: number
  completionRate: number
}

// ========== 总体概况 ==========
export interface StatisticsOverviewVO {
  reportOrgCount: number
  reportDrugCount: number
  shortageDrugCount: number
  completionRate: number
  orgTrend?: number
  drugTrend?: number
  shortageTrend?: number
  completionTrend?: number
  dosageFormCount?: number
  weeklyUsageTotal?: number
  currentStockTotal?: number
  stockAlertCount?: number
}

// ========== 供应分布 ==========
export interface SupplyDistributionVO {
  supplyStatus: number
  statusName: string
  count: number
  percentage: number
  monthOnMonth?: number
}

// ========== 短缺详情 ==========
export interface ShortageDetailVO {
  drugId?: number
  drugName: string
  dosageForm: string
  dosageUnit?: string
  shortageOrgCount: number
  severeShortageOrgCount: number
  avgStockDays: number
  riskLevel?: number
  riskLevelName?: string
}

// ========== 剂型统计 ==========
export interface DosageFormChartVO {
  dosageForm: string
  drugCount: number
  percentage: number
  shortageCount: number
  shortageRate: number
}

// ========== 周使用量趋势 ==========
export interface WeeklyUsageTrendVO {
  weeks: string[]
  usageData: number[]
  growthRates: number[]
  avgUsage: number
  peakUsage: number
  minUsage: number
}

// ========== 库存分析 ==========
export interface StockAnalysisVO {
  distributions: StockDistribution[]
  alerts: StockAlert[]
  avgStockDays: number
  sufficientRate: number
}

export interface StockDistribution {
  range: string
  count: number
  percentage: number
}

export interface StockAlert {
  drugName: string
  dosageForm: string
  currentStock: number
  stockDays: number
  alertLevel: number
}

// ========== 机构排名 ==========
export interface OrgRankingVO {
  rank: number
  orgId: number
  orgName: string
  completionRate: number
  reportDrugCount: number
  shortageDrugCount: number
  timelyRate: number
}

// ========== 药品短缺趋势 ==========
export interface DrugShortageTrendVO {
  timeAxis: string[]
  shortageCountTrend: number[]
  severeShortageCountTrend: number[]
  shortageRateTrend: number[]
  forecastData?: number[]
}

// ========== API 接口定义 ==========
export const StatisticsApi = {
  // 获取简化概览（专用于指标卡片）
  getSimpleOverview: (params: SimpleQueryVO) =>
    request.get<SimpleOverviewVO>({
      url: '/shortage/statistics/simple-overview',
      params
    }),

  // 获取总体概况
  getOverview: (params: StatisticsQueryVO) =>
    request.get<StatisticsOverviewVO>({
      url: '/shortage/statistics/overview',
      params
    }),

  // 获取供应状况分布
  getSupplyDistribution: (params: StatisticsQueryVO) =>
    request.get<SupplyDistributionVO[]>({
      url: '/shortage/statistics/supply-distribution',
      params
    }),

  // 获取短缺药品详情
  getShortageDetails: (params: StatisticsQueryVO) =>
    request.get<ShortageDetailVO[]>({
      url: '/shortage/statistics/shortage-details',
      params
    }),

  // 获取剂型分类统计
  getDosageFormChart: (params: StatisticsQueryVO) =>
    request.get<DosageFormChartVO[]>({
      url: '/shortage/statistics/dosage-form-chart',
      params
    }),

  // 获取周使用量趋势
  getWeeklyUsageTrend: (params: StatisticsQueryVO) =>
    request.get<WeeklyUsageTrendVO>({
      url: '/shortage/statistics/weekly-usage-trend',
      params
    }),

  // 获取库存分析
  getStockAnalysis: (params: StatisticsQueryVO) =>
    request.get<StockAnalysisVO>({
      url: '/shortage/statistics/stock-analysis',
      params
    }),

  // 获取机构排名
  getOrgRanking: (params: StatisticsQueryVO) =>
    request.get<OrgRankingVO[]>({
      url: '/shortage/statistics/org-ranking',
      params
    }),

  // 获取药品短缺趋势
  getDrugShortageTrend: (params: StatisticsQueryVO) =>
    request.get<DrugShortageTrendVO>({
      url: '/shortage/statistics/drug-shortage-trend',
      params
    }),

  // 导出统计报告
  exportReport: (params: StatisticsQueryVO) =>
    request.download({
      url: '/shortage/statistics/export-report',
      params
    })
}

// ========== 工具函数 ==========
export const SupplyStatusConfig = {
  1: { label: '充足', color: '#67c23a', type: 'success' },
  2: { label: '较充足', color: '#e6a23c', type: 'warning' },
  3: { label: '短缺', color: '#f56c6c', type: 'danger' },
  4: { label: '严重短缺', color: '#f56c6c', type: 'danger' }
} as const

export const RiskLevelConfig = {
  1: { label: '低风险', color: '#409eff', type: 'info' },
  2: { label: '中风险', color: '#e6a23c', type: 'warning' },
  3: { label: '高风险', color: '#f56c6c', type: 'danger' }
} as const

export const AlertLevelConfig = {
  1: { label: '黄色预警', color: '#e6a23c', icon: 'Warning' },
  2: { label: '橙色预警', color: '#ff9800', icon: 'WarningFilled' },
  3: { label: '红色预警', color: '#f56c6c', icon: 'CircleCloseFilled' }
} as const

// 格式化数字
export const formatNumber = (num: number | undefined | null, decimals: number = 0): string => {
  if (num == null) return '0'

  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + '千'
  }

  return num.toFixed(decimals)
}

// 格式化百分比
export const formatPercentage = (value: number | undefined | null): string => {
  if (value == null) return '0%'
  return value.toFixed(1) + '%'
}

// 获取趋势图标
export const getTrendIcon = (trend: number | undefined | null): string => {
  if (trend == null || trend === 0) return 'Minus'
  return trend > 0 ? 'TopRight' : 'BottomRight'
}

// 获取趋势颜色
export const getTrendColor = (trend: number | undefined | null): string => {
  if (trend == null || trend === 0) return '#909399'
  return trend > 0 ? '#67c23a' : '#f56c6c'
}

/**
 * 数据分析工具方法集合
 * 职责：提供数据格式化、图表配置、业务计算等工具方法
 */

// ========== 数据格式化工具 ==========

/**
 * 格式化趋势数据为图表可用格式
 * 将后端返回的趋势数据转换为 ECharts 需要的格式
 */
export const formatTrendDataForChart = (trendData: Array<{month: string, usage: number, cost: number}>) => {
  return {
    categories: trendData.map(item => item.month),
    usageData: trendData.map(item => item.usage),
    costData: trendData.map(item => item.cost)
  }
}

/**
 * 计算环比增长率
 * @param current 当前值
 * @param previous 前期值
 * @returns 增长率百分比
 */
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100 * 100) / 100
}

/**
 * 格式化金额显示
 * @param amount 金额
 * @returns 格式化后的金额字符串
 */
export const formatAmount = (amount: number): string => {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  } else {
    return amount.toFixed(2)
  }
}

/**
 * 获取基药使用率的等级标识
 * @param rate 基药使用率
 * @returns 等级标识
 */
export const getBaseDrugRateLevel = (rate: number): 'excellent' | 'good' | 'warning' | 'danger' => {
  if (rate >= 70) return 'excellent'
  if (rate >= 60) return 'good'
  if (rate >= 40) return 'warning'
  return 'danger'
}

/**
 * 格式化百分比显示
 * @param value 数值
 * @param total 总数
 * @returns 百分比字符串
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%'
  return ((value / total) * 100).toFixed(1) + '%'
}

/**
 * 计算同比增长率
 * @param current 当前期间值
 * @param previous 同期值
 * @returns 同比增长率
 */
export const calculateYearOverYearGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// ========== 图表配置工具 ==========

/**
 * 生成颜色系列
 * 用于图表的颜色配置
 */
export const chartColors = {
  primary: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'],
  gradient: {
    blue: ['#409EFF', '#66B1FF'],
    green: ['#67C23A', '#85CE61'],
    orange: ['#E6A23C', '#F0A020'],
    red: ['#F56C6C', '#F78989'],
    purple: ['#9C88FF', '#B3A4FF']
  },
  business: {
    revenue: '#1890ff',
    cost: '#f5222d',
    profit: '#52c41a',
    warning: '#faad14',
    info: '#722ed1'
  }
}

/**
 * 统一的图表配置
 */
export const defaultChartOptions = {
  // 响应式配置
  responsive: true,
  maintainAspectRatio: false,

  // 图表边距
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },

  // 提示框配置
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#ccc',
    borderWidth: 1,
    textStyle: {
      color: '#333'
    }
  },

  // 图例配置
  legend: {
    type: 'scroll',
    orient: 'horizontal',
    left: 'center',
    top: 'top'
  }
}

/**
 * 生成饼图配置
 * @param data 数据数组
 * @param title 图表标题
 */
export const generatePieChartOption = (data: Array<{name: string, value: number}>, title: string) => {
  return {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: title,
        type: 'pie',
        radius: '50%',
        data: data,
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
}

/**
 * 生成柱状图配置
 * @param categories X轴分类
 * @param series 数据系列
 * @param title 图表标题
 */
export const generateBarChartOption = (
  categories: string[],
  series: Array<{name: string, data: number[]}>,
  title: string
) => {
  return {
    title: {
      text: title
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: series.map(s => s.name)
    },
    xAxis: {
      type: 'category',
      data: categories
    },
    yAxis: {
      type: 'value'
    },
    series: series.map(s => ({
      ...s,
      type: 'bar'
    }))
  }
}

// ========== 业务计算工具 ==========

/**
 * 计算库存周转率
 * @param usage 使用量
 * @param averageStock 平均库存
 * @returns 周转率
 */
export const calculateTurnoverRate = (usage: number, averageStock: number): number => {
  if (averageStock === 0) return 0
  return usage / averageStock
}

/**
 * 计算安全库存建议
 * @param averageDailyUsage 日均用量
 * @param leadTime 采购周期天数
 * @param safetyFactor 安全系数
 */
export const calculateSafetyStock = (
  averageDailyUsage: number,
  leadTime: number,
  safetyFactor: number = 1.5
): number => {
  return averageDailyUsage * leadTime * safetyFactor
}

/**
 * 评估药品风险等级
 * @param stock 当前库存
 * @param usage 月用量
 * @param expiryDays 距离过期天数
 */
export const assessDrugRiskLevel = (
  stock: number,
  usage: number,
  expiryDays: number
): 'high' | 'medium' | 'low' => {
  const monthsOfStock = usage > 0 ? stock / usage : 999

  if (expiryDays < 30 || monthsOfStock < 0.5) {
    return 'high'
  } else if (expiryDays < 90 || monthsOfStock < 1) {
    return 'medium'
  } else {
    return 'low'
  }
}

/**
 * 生成采购建议
 * @param currentStock 当前库存
 * @param monthlyUsage 月用量
 * @param minStock 最小库存
 * @param maxStock 最大库存
 */
export const generatePurchaseAdvice = (
  currentStock: number,
  monthlyUsage: number,
  minStock: number,
  maxStock: number
): {
  needPurchase: boolean
  suggestedQuantity: number
  urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW'
} => {
  const needPurchase = currentStock <= minStock
  const suggestedQuantity = needPurchase ? maxStock - currentStock : 0

  let urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'

  if (currentStock <= minStock * 0.5) {
    urgencyLevel = 'HIGH'
  } else if (currentStock <= minStock * 0.8) {
    urgencyLevel = 'MEDIUM'
  }

  return {
    needPurchase,
    suggestedQuantity,
    urgencyLevel
  }
}

// ========== 数据验证工具 ==========

/**
 * 验证日期格式
 * @param dateString 日期字符串
 * @returns 是否为有效日期
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * 验证数值范围
 * @param value 数值
 * @param min 最小值
 * @param max 最大值
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max
}

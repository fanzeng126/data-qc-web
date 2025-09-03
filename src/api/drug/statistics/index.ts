import request from '@/config/axios'

export function DrugStatisticsApi() {}

// ========== 数据类型定义 ==========

// 仪表板数据结构
export interface DashboardDataVO {
  basicStats: {
    totalDrugs: number
    totalInventoryValue: number
    monthlyUsage: number
    totalPrescriptions: number
    baseDrugRate: number
  }
  trendData: Array<{
    month: string
    usage: number
    cost: number
  }>
  categoryStats: Array<{
    category: string
    count: number
    percentage: number
  }>
  warnings: {
    expiryDrugs: number
    lowStock: number
    abnormalUsage: number
    overduePayments: number
  }
  updateTime: string
}

// 药品分析数据结构
export interface DrugAnalysisVO {
  drugStats: {
    totalCount: number
    baseDrugCount: number
    manufacturerCount: number
    formCount: number
  }
  topDrugs: Array<{
    hosDrugId: string
    productName: string
    useCount: number
    totalAmount: number
    percentage: number
  }>
  baseDrugAnalysis: {
    baseDrugAmount: number
    nonBaseDrugAmount: number
    baseDrugRate: number
  }
  supplierAnalysis: Array<{
    supplierName: string
    drugCount: number
    totalAmount: number
  }>
}

// 科室分析数据结构
export interface DepartmentAnalysisVO {
  departmentRanking: Array<{
    departmentName: string
    prescriptionCount: number
    totalAmount: number
    patientCount: number
  }>
  baseDrugComparison: Array<{
    department: string
    baseDrugRate: number
  }>
  departmentTrend: Array<{
    department: string
    trendData: Array<{
      date: string
      amount: number
    }>
  }>
}

// 库存分析数据结构
export interface InventoryAnalysisVO {
  stockSummary: {
    totalValue: number
    totalQuantity: number
    drugCount: number
  }
  expiryWarning: Array<{
    hosDrugId: string
    productName: string
    expiryDate: string
    currentStock: number
    daysToExpiry: number
  }>
  turnoverAnalysis: Array<{
    category: string
    turnoverRate: number
    averageDays: number
  }>
  purchaseAdvice: Array<{
    hosDrugId: string
    productName: string
    currentStock: number
    suggestedQuantity: number
    urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  }>
}

// 费用分析数据结构
export interface CostAnalysisVO {
  monthlyTrend: Array<{
    month: string
    totalCost: number
    baseDrugCost: number
    nonBaseDrugCost: number
  }>
  costStructure: {
    baseDrugPercentage: number
    nonBaseDrugPercentage: number
    topCategoryBreakdown: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  yearOverYear: {
    currentYearTotal: number
    previousYearTotal: number
    growthRate: number
    monthlyComparison: Array<{
      month: string
      currentYear: number
      previousYear: number
      growthRate: number
    }>
  }
}

// 分析查询参数
export interface AnalysisQueryParam {
  startDate?: string
  endDate?: string
  year?: string
}

// ========== API 接口方法 ==========

// 获取数据概览仪表板
export const getDashboard = () => {
  return request.get<DashboardDataVO>({ url: '/dataqc/analysis/dashboard' })
}

// 获取药品分析报告
export const getDrugAnalysis = (params?: AnalysisQueryParam) => {
  return request.get<DrugAnalysisVO>({
    url: '/dataqc/analysis/drug-analysis',
    params
  })
}

// 获取科室分析报告
export const getDepartmentAnalysis = (params?: AnalysisQueryParam) => {
  return request.get<DepartmentAnalysisVO>({
    url: '/dataqc/analysis/department-analysis',
    params
  })
}

// 获取库存分析报告
export const getInventoryAnalysis = () => {
  return request.get<InventoryAnalysisVO>({ url: '/dataqc/analysis/inventory-analysis' })
}

// 获取费用分析报告
export const getCostAnalysis = (params?: Pick<AnalysisQueryParam, 'year'>) => {
  return request.get<CostAnalysisVO>({
    url: '/dataqc/analysis/cost-analysis',
    params
  })
}

// 导出分析报告
export const exportAnalysisReport = (type: string, params?: any) => {
  return request.download({
    url: `/dataqc/analysis/export/${type}`,
    params
  })
}

// 获取分析配置信息
export const getAnalysisConfig = () => {
  return request.get({ url: '/dataqc/analysis/config' })
}

// 保存分析配置
export const saveAnalysisConfig = (data: any) => {
  return request.post({ url: '/dataqc/analysis/config', data })
}

// ========== 机构填报统计相关 API ==========

// 机构填报统计数据结构
export interface InstitutionReportStatsVO {
  // 基本统计
  basicStats: {
    totalInstitutions: number    // 应监测机构数
    reportRate: number           // 上报率
    openTime: string            // 开放时间
    deadlineTime: string        // 截止时间
    reportedInstitutions: number // 已上报数
    unreportedInstitutions: number // 未上报数  
    unregisteredInstitutions: number // 未注册数
  }
  // 三级医院等级统计
  levelStats: {
    level3: { count: number; rate: number }    // 三级医院
    level2: { count: number; rate: number }    // 二级医院
    baseLevel: { count: number; rate: number } // 基层医院
  }
  // 各市填报情况
  cityReports: Array<{
    cityName: string
    reportRate: number
    formula: string           // 级别：未注册数/未上报数/应监测机构数
    level3Stats: { reported: number; total: number }
    level2Stats: { reported: number; total: number } 
    baseStats: { reported: number; total: number }
  }>
  // 详细统计卡片
  detailCards: {
    totalInstitutions: number
    reportedCount: number
    unreportedCount: number
    unregisteredCount: number
    internalAuditCount: number
    managedUsers: number
  }
}

// 获取机构填报统计
export const getInstitutionReportStats = (year?: string) => {
  return request.get<InstitutionReportStatsVO>({
    url: '/dataqc/statistics/institution-report',
    params: year ? { year } : {}
  })
}

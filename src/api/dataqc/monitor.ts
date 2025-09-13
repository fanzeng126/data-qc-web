import request from '@/config/axios'

// 系统指标数据结构
export interface SystemMetricsVO {
  cpuUsage: number
  memoryUsage: number
  memoryTotal: number
  memoryUsed: number
  threadCount: number
  uptime: number
}

// 性能趋势数据点
export interface PerformanceDataVO {
  time: string
  cpuUsage: number
  memoryUsage: number
  taskCount: number
  successRate: number
  dataVolume: number
  processSpeed: number
}

// 告警信息
export interface AlertVO {
  id: number
  level: string
  message: string
  time: string
}

// 任务统计信息
export interface TaskStatisticsVO {
  totalTasks: number
  successTasks: number
  failedTasks: number
  processingTasks: number
  successRate: number
}

// 监控仪表板数据
export interface MonitorDashboardVO {
  systemMetrics: SystemMetricsVO
  businessMetrics: {
    todayTasks: number
    todaySuccessRate: number
    todayDataRows: number
    activeUsers: number
  }
  taskStatistics: TaskStatisticsVO
  performanceTrend: PerformanceDataVO[]
  alerts: AlertVO[]
  updateTime: string
}

// 实时监控数据
export interface RealTimeMetricsVO {
  systemMetrics: SystemMetricsVO
  runningTasks: any[]
  performanceData: any
  latestAlerts: AlertVO[]
  timestamp: number
}

// 性能报告
export interface PerformanceReportVO {
  resourceUsage: any
  taskPerformance: {
    avgExecutionTime: number
    maxExecutionTime: number
    minExecutionTime: number
    throughput: number
  }
  dataQuality: {
    dataIntegrityRate: number
    dataAccuracyRate: number
    duplicateRate: number
    errorRate: number
  }
  healthScore: {
    overallScore: number
    performanceScore: number
    reliabilityScore: number
    availabilityScore: number
  }
}

// 获取系统监控仪表板
export const getMonitorDashboard = () => {
  return request.get<MonitorDashboardVO>({ url: '/dataqc/monitor/dashboard' })
}

// 获取导入日志分页列表
export const getImportLogs = (params: PageParam) => {
  return request.get({ url: '/dataqc/monitor/import-logs', params })
}

// 获取批量导入任务列表
export const getBatchTasks = (params: any) => {
  return request.get({ url: '/dataqc/monitor/batch-tasks', params })
}

// 导出导入日志
export const exportImportLogs = (params: any) => {
  return request.download({ url: '/dataqc/monitor/export-logs', params })
}

// 获取系统性能报告
export const getPerformanceReport = (params?: { startTime?: string; endTime?: string }) => {
  return request.get<PerformanceReportVO>({ url: '/dataqc/monitor/performance-report', params })
}

// 获取实时监控数据
export const getRealTimeMetrics = () => {
  return request.get<RealTimeMetricsVO>({ url: '/dataqc/monitor/real-time-metrics' })
}

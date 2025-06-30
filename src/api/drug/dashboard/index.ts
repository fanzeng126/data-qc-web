import request from '@/config/axios'

// ========== 数据类型定义 ==========

/** 仪表盘统计数据 */
export interface DashboardStatisticsVO {
  todayTasks: number
  totalTasks: number
  qcPassRate: number
  dataIntegrity: number
  abnormalCount: number
  successTasks: number
  failedTasks: number
  runningTasks: number
}

/** 最近任务信息 */
export interface RecentTaskVO {
  id: number
  taskNo: string
  taskName: string
  fileName: string
  status: number
  statusDisplay: string
  progressPercent: number
  createTime: string
  creator: string
  duration?: number
}

/** 数据质量趋势 */
export interface QualityTrendVO {
  date: string
  passRate: number
  totalRecords: number
  passedRecords: number
  failedRecords: number
}

/** 系统告警信息 */
export interface SystemAlertVO {
  id: number
  alertType: 'ERROR' | 'WARNING' | 'INFO'
  title: string
  message: string
  createTime: string
  isRead: boolean
  level: 'HIGH' | 'MEDIUM' | 'LOW'
}

/** 数据分布统计 */
export interface DataDistributionVO {
  hospital: { count: number; percentage: number }
  catalog: { count: number; percentage: number }
  inbound: { count: number; percentage: number }
  outbound: { count: number; percentage: number }
  usage: { count: number; percentage: number }
}

/** 仪表盘查询参数 */
export interface DashboardQueryParams {
  period?: '7d' | '30d' | '90d'
  startDate?: string
  endDate?: string
}

// ========== API 接口方法 ==========

export const DashboardApi = {
  /**
   * 获取仪表盘统计数据
   */
  getStatistics: (params?: DashboardQueryParams) => {
    return request.get<DashboardStatisticsVO>({
      url: '/drug/dashboard/statistics',
      params
    })
  },

  /**
   * 获取最近导入任务列表
   */
  getRecentTasks: (limit: number = 10) => {
    return request.get<RecentTaskVO[]>({
      url: '/drug/dashboard/recent-tasks',
      params: { limit }
    })
  },

  /**
   * 获取数据质量趋势
   */
  getQualityTrend: (params?: DashboardQueryParams) => {
    return request.get<QualityTrendVO[]>({
      url: '/drug/dashboard/quality-trend',
      params
    })
  },

  /**
   * 获取系统告警列表
   */
  getSystemAlerts: (limit: number = 20) => {
    return request.get<SystemAlertVO[]>({
      url: '/drug/dashboard/system-alerts',
      params: { limit }
    })
  },

  /**
   * 获取数据分布统计
   */
  getDataDistribution: () => {
    return request.get<DataDistributionVO>({
      url: '/drug/dashboard/data-distribution'
    })
  },

  /**
   * 标记告警为已读
   */
  markAlertAsRead: (alertId: number) => {
    return request.post({
      url: `/drug/dashboard/alerts/${alertId}/read`
    })
  },

  /**
   * 批量标记告警为已读
   */
  markAlertsAsRead: (alertIds: number[]) => {
    return request.post({
      url: '/drug/dashboard/alerts/batch-read',
      data: { alertIds }
    })
  }
}

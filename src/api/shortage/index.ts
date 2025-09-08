import request from '@/config/axios'

// ========== 专区管理 ==========
export interface ReportZoneVO {
  id?: number
  zoneName: string
  zoneCode: string
  noticeContent?: string  // 富文本通知内容
  status: number
  remark?: string
  createTime?: Date
}

export interface ReportZonePageReqVO {
  pageNo?: number
  pageSize?: number
  zoneName?: string
  status?: number
}

export const ReportZoneApi = {
  // 获取分页
  getPage: (params: ReportZonePageReqVO) => 
    request.get({ url: '/shortage/report-zone/page', params }),
  
  // 获取详情
  get: (id: number) => 
    request.get({ url: `/shortage/report-zone/get?id=${id}` }),
  
  // 创建
  create: (data: ReportZoneVO) => 
    request.post({ url: '/shortage/report-zone/create', data }),
  
  // 更新
  update: (data: ReportZoneVO) => 
    request.put({ url: '/shortage/report-zone/update', data }),
  
  // 删除
  delete: (id: number) => 
    request.delete({ url: `/shortage/report-zone/delete?id=${id}` }),
  
  // 更新通知内容
  updateNotice: (id: number, noticeContent: string) => 
    request.put({ 
      url: `/shortage/report-zone/notice/${id}`, 
      data: { noticeContent } 
    }),
  
  // 导出Excel
  exportExcel: (params: ReportZonePageReqVO) =>
    request.download({ url: '/shortage/report-zone/export-excel', params })
}

// ========== 药品配置 ==========
export interface DrugConfigVO {
  id?: number
  zoneId: number
  drugName: string
  dosageForm: string
  dosageUnit: string
  status: number
  sortOrder: number
  createTime?: Date
}

export interface DrugConfigPageReqVO {
  pageNo?: number
  pageSize?: number
  zoneId?: number
  drugName?: string
  dosageForm?: string
  status?: number
}

export const DrugConfigApi = {
  // 获取分页
  getPage: (params: DrugConfigPageReqVO) => 
    request.get({ url: '/shortage/drug-config/page', params }),
  
  // 创建
  create: (data: DrugConfigVO) => 
    request.post({ url: '/shortage/drug-config/create', data }),
  
  // 更新
  update: (data: DrugConfigVO) => 
    request.put({ url: '/shortage/drug-config/update', data }),
  
  // 删除
  delete: (id: number) => 
    request.delete({ url: `/shortage/drug-config/delete?id=${id}` }),
  
  // 批量导入
  batchImport: (zoneId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('zoneId', zoneId.toString())
    return request.upload({ url: '/shortage/drug-config/import', data: formData })
  }
}

// ========== 填报记录 ==========
export interface ReportRecordVO {
  id?: number
  zoneId: number
  drugConfigId: number
  orgId?: number
  reportWeek: string
  reportDate: string
  weekUsageAmount: number
  currentStockAmount: number
  supplyStatus: number
  
  // 关联字段
  drugName?: string
  dosageForm?: string
  dosageUnit?: string
}

export interface ReportStatisticsReqVO {
  zoneId?: number | null
  reportWeek?: string
  administrativeRegion?: string | null
}

export interface OverviewData {
  reportOrgCount: number
  reportDrugCount: number
  shortageDrugCount: number
  completionRate: number
  // 新增趋势数据
  orgTrend?: number
  drugTrend?: number
  shortageTrend?: number
  completionTrend?: number
}

export interface SupplyStatusDistribution {
  supplyStatus: number
  statusName: string
  count: number
  percentage: number
}

export interface ShortageDetail {
  drugName: string
  dosageForm: string
  shortageOrgCount: number
  severeShortageOrgCount: number
  avgStockDays: number
}

export interface ReportStatisticsRespVO {
  overview: OverviewData
  supplyDistribution: SupplyStatusDistribution[]
  shortageDetails: ShortageDetail[]
  // 新增指标数据
  dosageFormCount?: number         // 剂型分类统计
  weeklyUsage?: number            // 本周使用量
  currentStock?: number           // 当日实时库存
  stockAlertCount?: number        // 库存预警数量
}

export const ReportRecordApi = {
  // 获取专区填报药品列表
  getReportList: (zoneId: number) => 
    request.get({ url: `/shortage/report-record/list?zoneId=${zoneId}` }),
  
  // 批量保存填报记录
  batchSave: (data: ReportRecordVO[]) => 
    request.post({ url: '/shortage/report-record/batch-save', data }),
  
  // 获取统计分析数据
  getStatistics: (params: ReportStatisticsReqVO) => 
    request.get({ url: '/shortage/report-record/statistics', params }),
  
  // 导出统计报告
  exportReport: (params: ReportStatisticsReqVO) => 
    request.download({ url: '/shortage/report-record/export-excel', params })
}

// ========== 供应状态枚举 ==========
export const SupplyStatusEnum = {
  SUFFICIENT: { value: 1, label: '充足', color: 'success' },
  RELATIVELY_SUFFICIENT: { value: 2, label: '较充足', color: 'warning' },
  SHORTAGE: { value: 3, label: '短缺', color: 'danger' },
  SEVERE_SHORTAGE: { value: 4, label: '严重短缺', color: 'danger' }
}

export const getSupplyStatusLabel = (status: number): string => {
  const statusMap = Object.values(SupplyStatusEnum).find(item => item.value === status)
  return statusMap?.label || '未知'
}

export const getSupplyStatusColor = (status: number): string => {
  const statusMap = Object.values(SupplyStatusEnum).find(item => item.value === status)
  return statusMap?.color || 'info'
}
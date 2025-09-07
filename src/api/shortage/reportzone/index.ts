import request from '@/config/axios'

// 短缺药品填报专区 VO
export interface ReportZoneVO {
  id: number // 编码
  zoneName: string // 专区名称
  zoneCode: string // 专区编码
  noticeContent: string // 填报通知内容(富文本)
  status: number // 状态: 0-停用 1-启用
  remark: string // 备注说明
}

// 短缺药品填报专区 API
export const ReportZoneApi = {
  // 查询短缺药品填报专区分页
  getReportZonePage: async (params: any) => {
    return await request.get({ url: `/shortage/report-zone/page`, params })
  },

  // 查询短缺药品填报专区详情
  getReportZone: async (id: number) => {
    return await request.get({ url: `/shortage/report-zone/get?id=` + id })
  },

  // 新增短缺药品填报专区
  createReportZone: async (data: ReportZoneVO) => {
    return await request.post({ url: `/shortage/report-zone/create`, data })
  },

  // 修改短缺药品填报专区
  updateReportZone: async (data: ReportZoneVO) => {
    return await request.put({ url: `/shortage/report-zone/update`, data })
  },

  // 删除短缺药品填报专区
  deleteReportZone: async (id: number) => {
    return await request.delete({ url: `/shortage/report-zone/delete?id=` + id })
  },

  // 导出短缺药品填报专区 Excel
  exportReportZone: async (params) => {
    return await request.download({ url: `/shortage/report-zone/export-excel`, params })
  },
}
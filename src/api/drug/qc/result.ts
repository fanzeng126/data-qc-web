import request from '@/config/axios'

// 质控结果明细 VO
export interface QcResultDetailVO {
  id: number // 结果ID
  executionId: number // 执行记录ID
  taskId: number // 任务ID
  ruleId: number // 规则ID
  ruleCode: string // 规则编码
  tableType: number // 表类型
  recordId: number // 原始记录ID
  checkField: string // 检查字段
  fieldValue: string // 字段值
  expectedValue: string // 期望值
  resultStatus: number // 结果:0-通过,1-失败,2-警告
  errorDetail: string // 错误详情
  fixSuggestion: string // 修复建议
  isFixed: boolean // 是否已修复
  fixTime: Date // 修复时间
}

// 质控结果明细 API
export const QcResultDetailApi = {
  // 查询质控结果明细分页
  getQcResultDetailPage: async (params: any) => {
    return await request.get({ url: `/drug/qc-result-detail/page`, params })
  },

  // 查询质控结果明细详情
  getQcResultDetail: async (id: number) => {
    return await request.get({ url: `/drug/qc-result-detail/get?id=` + id })
  },

  // 新增质控结果明细
  createQcResultDetail: async (data: QcResultDetailVO) => {
    return await request.post({ url: `/drug/qc-result-detail/create`, data })
  },

  // 修改质控结果明细
  updateQcResultDetail: async (data: QcResultDetailVO) => {
    return await request.put({ url: `/drug/qc-result-detail/update`, data })
  },

  // 删除质控结果明细
  deleteQcResultDetail: async (id: number) => {
    return await request.delete({ url: `/drug/qc-result-detail/delete?id=` + id })
  },

  // 导出质控结果明细 Excel
  exportQcResultDetail: async (params) => {
    return await request.download({ url: `/drug/qc-result-detail/export-excel`, params })
  },

  // 根据执行ID获取质控结果明细
  getResultDetailsByExecution: async (executionId: number, params: any) => {
    return await request.get({ url: `/drug/qc-result-detail/by-execution/${executionId}`, params })
  },

  // 按规则统计质控结果
  getResultStatisticsByRule: async (executionId?: number) => {
    return await request.get({
      url: `/drug/qc-result-detail/statistics/by-rule`,
      params: { executionId }
    })
  },

  // 获取质控失败记录
  getFailedRecords: async (params: any) => {
    return await request.get({ url: `/drug/qc-result-detail/failed-records`, params })
  },

  // 标记质控结果为已修复
  markAsFixed: async (id: number) => {
    return await request.put({ url: `/drug/qc-result-detail/fix/${id}` })
  },

  // 批量标记质控结果为已修复
  batchMarkAsFixed: async (ids: number[]) => {
    return await request.put({
      url: `/drug/qc-result-detail/batch-fix`,
      params: { ids: ids.join(',') }
    })
  }
}

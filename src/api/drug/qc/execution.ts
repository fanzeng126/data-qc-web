import request from '@/config/axios'

// 质控执行记录 VO
export interface QcExecutionVO {
  id: number // 执行ID
  taskId: number // 导入任务ID
  executionNo: string // 执行批次号
  qcType: number // 质控类型:1-前置,2-后置
  startTime: Date // 开始时间
  endTime: Date // 结束时间
  totalRecords: number // 总记录数
  checkedRecords: number // 已检查记录数
  passedRecords: number // 通过记录数
  failedRecords: number // 失败记录数
  warningRecords: number // 警告记录数
  executionStatus: number // 执行状态:0-进行中,1-成功,2-失败
  errorMessage: string // 执行错误信息
  resultSummary: string // 结果汇总
}

// 质控执行记录 API
export const QcExecutionApi = {
  // 查询质控执行记录分页
  getQcExecutionPage: async (params: any) => {
    return await request.get({ url: `/drug/qc-execution/page`, params })
  },

  // 查询质控执行记录详情
  getQcExecution: async (id: number) => {
    return await request.get({ url: `/drug/qc-execution/get?id=` + id })
  },

  // 新增质控执行记录
  createQcExecution: async (data: QcExecutionVO) => {
    return await request.post({ url: `/drug/qc-execution/create`, data })
  },

  // 修改质控执行记录
  updateQcExecution: async (data: QcExecutionVO) => {
    return await request.put({ url: `/drug/qc-execution/update`, data })
  },

  // 删除质控执行记录
  deleteQcExecution: async (id: number) => {
    return await request.delete({ url: `/drug/qc-execution/delete?id=` + id })
  },

  // 导出质控执行记录 Excel
  exportQcExecution: async (params) => {
    return await request.download({ url: `/drug/qc-execution/export-excel`, params })
  },

  // 获取质控执行统计信息
  getExecutionStatistics: async () => {
    return await request.get({ url: `/drug/qc-execution/statistics` })
  },

  // 获取最近的质控执行记录
  getRecentExecutions: async (limit?: number) => {
    return await request.get({ url: `/drug/qc-execution/recent`, params: { limit } })
  },

  // 获取正在执行的质控任务
  getRunningExecutions: async () => {
    return await request.get({ url: `/drug/qc-execution/running` })
  }
}

import request from '@/config/axios'

// 药品数据导入任务 VO
export interface ImportTaskVO {
  id: number // 任务ID
  taskNo: string // 任务编号（格式：DRUG_YYYYMMDD_XXXXXX）
  taskName: string // 任务名称
  importType: number // 导入类型:1-单文件,2-压缩包
  fileName: string // 原始文件名称
  filePath: string // 文件存储路径
  fileSize: number // 文件大小(字节)
  extractedFiles: string // 解压后的文件列表(JSON格式)
  status: number // 任务状态:0-待处理,1-解压中,2-数据导入中,3-质控中,4-完成,5-失败,6-部分成功
  extractStatus: number // 解压状态:0-未开始,1-进行中,2-成功,3-失败
  importStatus: number // 导入状态:0-未开始,1-进行中,2-成功,3-失败
  qcStatus: number // 质控状态:0-未开始,1-进行中,2-成功,3-失败
  totalFiles: number // 预期文件数量
  successFiles: number // 成功文件数
  failedFiles: number // 失败文件数
  totalRecords: number // 总记录数
  successRecords: number // 成功记录数
  failedRecords: number // 失败记录数
  progressPercent: number // 整体进度百分比
  tableProgress: string // 各表处理进度(JSON格式)
  startTime: Date // 开始处理时间
  extractEndTime: Date // 解压完成时间
  importEndTime: Date // 导入完成时间
  qcEndTime: Date // 质控完成时间
  endTime: Date // 任务结束时间
  errorMessage: string // 错误信息
  errorDetail: string // 详细错误信息(JSON格式)
}

// 药品数据导入任务 API
export const ImportTaskApi = {
  // 查询药品数据导入任务分页
  getImportTaskPage: async (params: any) => {
    return await request.get({ url: `/drug/import-task/page`, params })
  },

  // 查询药品数据导入任务详情
  getImportTask: async (id: number) => {
    return await request.get({ url: `/drug/import-task/get?id=` + id })
  },

  // 新增药品数据导入任务
  createImportTask: async (data: ImportTaskVO) => {
    return await request.post({ url: `/drug/import-task/create`, data })
  },

  // 修改药品数据导入任务
  updateImportTask: async (data: ImportTaskVO) => {
    return await request.put({ url: `/drug/import-task/update`, data })
  },

  // 删除药品数据导入任务
  deleteImportTask: async (id: number) => {
    return await request.delete({ url: `/drug/import-task/delete?id=` + id })
  },

  // 导出药品数据导入任务 Excel
  exportImportTask: async (params) => {
    return await request.download({ url: `/drug/import-task/export-excel`, params })
  },
}
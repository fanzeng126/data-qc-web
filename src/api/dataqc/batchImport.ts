import request from '@/config/axios'

export interface BatchImportTaskVO {
  id: number
  taskNo: string
  taskName: string
  fileName: string
  filePath: string
  status: number
  totalFiles: number
  successFiles: number
  failFiles: number
  startTime: Date
  endTime: Date
  errorMsg: string
  resultDetail: string
  createTime: Date
  message: string
  details: BatchImportTaskDetailVO[]
}

export interface BatchImportTaskDetailVO {
  id: number
  taskId: number
  taskNo: string
  fileType: string
  fileName: string
  tableName: string
  status: number
  totalRows: number
  successRows: number
  failRows: number
  startTime: Date
  endTime: Date
  errorMsg: string
  errorDetail: string
  importBatchNo: string
  createTime: Date
  fileTypeDisplay: string
  statusDisplay: string
}

export interface BatchImportProgressVO {
  taskId: number
  taskNo: string
  status: number
  statusDisplay: string
  totalFiles: number
  successFiles: number
  failFiles: number
  progressPercentage: number
  startTime: Date
  estimatedRemainingTime: number
  details: BatchImportTaskDetailVO[]
}

// 批量导入压缩包
export const batchImport = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post({
    url: '/dataqc/batch-import/upload',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获得导入任务分页列表
export const getBatchImportTaskPage = (params: PageParam) => {
  return request.get({ url: '/dataqc/batch-import/page', params })
}

// 获得导入任务详情
export const getBatchImportTask = (id: number) => {
  return request.get({ url: '/dataqc/batch-import/get?id=' + id })
}

// 获取导入进度
export const getBatchImportProgress = (taskId: number) => {
  return request.get({ url: '/dataqc/batch-import/progress?taskId=' + taskId })
}

// 重新导入失败的文件
export const retryBatchImport = (taskId: number, fileType?: string) => {
  const params: any = { taskId }
  if (fileType) {
    params.fileType = fileType
  }
  return request.put({ url: '/dataqc/batch-import/retry', data: params })
}

// 取消导入任务
export const cancelBatchImport = (taskId: number) => {
  return request.put({ url: '/dataqc/batch-import/cancel?taskId=' + taskId })
}

// 删除导入任务
export const deleteBatchImportTask = (id: number) => {
  return request.delete({ url: '/dataqc/batch-import/delete?id=' + id })
}

// 导出导入任务列表
export const exportBatchImportTask = (params: any) => {
  return request.download({ url: '/dataqc/batch-import/export', params })
}

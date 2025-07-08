import request from '@/config/axios'

// YPID匹配任务 VO
export interface YpidMatchTaskVO {
  id: number // 任务ID
  taskNo: string // 任务编号（格式：YPID_YYYYMMDD_XXXXXX）
  taskName: string // 任务名称
  taskType: number // 任务类型:1-质控导入,2-模板导入
  sourceId: number // 来源ID（质控任务ID等）
  sourceFile: string // 来源文件（模板导入时记录）
  status: number // 任务状态:0-待处理,1-处理中,2-已完成,3-已取消
  totalCount: number // 总待匹配数
  matchedCount: number // 已匹配数
  confirmedCount: number // 已确认数
  failedCount: number // 匹配失败数
  autoApplyEnabled: boolean // 是否启用自动应用
  autoApplyThreshold: number // 自动应用阈值(0-100)
  startTime: Date // 开始时间
  endTime: Date // 结束时间
}

// YPID匹配任务 API
export const YpidMatchTaskApi = {
  // 查询YPID匹配任务分页
  getYpidMatchTaskPage: async (params: any) => {
    return await request.get({ url: `/drug/ypid-match-task/page`, params })
  },

  // 查询YPID匹配任务详情
  getYpidMatchTask: async (id: number) => {
    return await request.get({ url: `/drug/ypid-match-task/get?id=` + id })
  },

  // 新增YPID匹配任务
  createYpidMatchTask: async (data: YpidMatchTaskVO) => {
    return await request.post({ url: `/drug/ypid-match-task/create`, data })
  },

  // 修改YPID匹配任务
  updateYpidMatchTask: async (data: YpidMatchTaskVO) => {
    return await request.put({ url: `/drug/ypid-match-task/update`, data })
  },

  // 删除YPID匹配任务
  deleteYpidMatchTask: async (id: number) => {
    return await request.delete({ url: `/drug/ypid-match-task/delete?id=` + id })
  },

  // 导出YPID匹配任务 Excel
  exportYpidMatchTask: async (params) => {
    return await request.download({ url: `/drug/ypid-match-task/export-excel`, params })
  },
}
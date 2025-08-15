import request from '@/config/axios'

// 部门扩展 VO
export interface DeptExtVO {
  id: number // 主键
  deptId: number // 部门ID
  deptType: string // 部门类型：NORMAL普通部门，PROVINCE省级，CITY市级，DISTRICT区县，HOSPITAL医院
  deptLevel: number // 行政层级：1省2市3区县4机构（仅行政类型需要）
  areaCode: string // 行政区域代码
  parentAreaCode: string // 上级行政区域代码
  institutionId: string // 医疗机构ID（关联drug_institution_standard）
  institutionCategory: string // 机构类别(A-医院,B1-社区,C-乡镇)
  socialCreditCode: string // 统一社会信用代码
  hospitalLevel: string // 医院等级
}

// 部门扩展 API
export const DeptExtApi = {
  // 查询部门扩展分页
  getDeptExtPage: async (params: any) => {
    return await request.get({ url: `/system/dept-ext/page`, params })
  },

  // 查询部门扩展详情
  getDeptExt: async (id: number) => {
    return await request.get({ url: `/system/dept-ext/get?id=` + id })
  },

  // 新增部门扩展
  createDeptExt: async (data: DeptExtVO) => {
    return await request.post({ url: `/system/dept-ext/create`, data })
  },

  // 修改部门扩展
  updateDeptExt: async (data: DeptExtVO) => {
    return await request.put({ url: `/system/dept-ext/update`, data })
  },

  // 删除部门扩展
  deleteDeptExt: async (id: number) => {
    return await request.delete({ url: `/system/dept-ext/delete?id=` + id })
  },

  // 导出部门扩展 Excel
  exportDeptExt: async (params) => {
    return await request.download({ url: `/system/dept-ext/export-excel`, params })
  },

  // 根据部门ID获取部门扩展信息
  getDeptExtByDeptId: async (deptId: number) => {
    return await request.get({ url: `/system/dept-ext/get-by-dept/${deptId}` })
  },

  // 从机构标准库同步部门扩展信息
  syncFromInstitutionStandard: async () => {
    return await request.post({ url: `/system/dept-ext/sync-from-institution-standard` })
  },

  // 同步指定的机构数据
  syncInstitutions: async (data: any) => {
    return await request.post({ url: `/drug/institution-sync/sync-institutions`, data })
  },

  // 同步用户数据
  syncUsers: async (data: any) => {
    return await request.post({ url: `/drug/institution-sync/sync-users`, data })
  },

  // 同步机构和用户数据
  syncInstitutionsAndUsers: async (data: any) => {
    return await request.post({ url: `/drug/institution-sync/sync-institutions-and-users`, data })
  },
}
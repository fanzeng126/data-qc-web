import request from '@/config/axios'

// 药品分类 VO
export interface DrugCategoryVO {
  id: number // 编码
  categoryName: string // 分类名称
  drugName: string // 药品名称
  sortOrder: number // 排序
  status: number // 启用状态: 0-启用 1-停用
  createTime: Date // 创建时间
}

// 药品分类 API
export const DrugCategoryApi = {
  // 查询药品分类分页
  getPage: async (params: any) => {
    return await request.get({ url: `/shortage/drug-category/page`, params })
  },

  // 查询药品分类详情
  get: async (id: number) => {
    return await request.get({ url: `/shortage/drug-category/get?id=` + id })
  },

  // 新增药品分类
  create: async (data: DrugCategoryVO) => {
    return await request.post({ url: `/shortage/drug-category/create`, data })
  },

  // 修改药品分类
  update: async (data: DrugCategoryVO) => {
    return await request.put({ url: `/shortage/drug-category/update`, data })
  },

  // 删除药品分类
  delete: async (id: number) => {
    return await request.delete({ url: `/shortage/drug-category/delete?id=` + id })
  },

  // 获取所有分类名称
  getCategoryNames: async () => {
    return await request.get({ url: `/shortage/drug-category/category-names` })
  },

  // 根据分类获取药品列表
  getDrugsByCategory: async (categoryName: string) => {
    return await request.get({ url: `/shortage/drug-category/drugs-by-category?categoryName=` + categoryName })
  }
}

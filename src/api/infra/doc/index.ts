import request from '@/config/axios'

// ========== 文档分类 ==========
export interface DocCategoryVO {
  id?: number
  name: string
  parentId: number
  sort: number
  status: number
}

export const createDocCategory = (data: DocCategoryVO) => {
  return request.post({ url: '/infra/doc/category/create', data })
}

export const updateDocCategory = (data: DocCategoryVO) => {
  return request.put({ url: '/infra/doc/category/update', data })
}

export const deleteDocCategory = (id: number) => {
  return request.delete({ url: '/infra/doc/category/delete?id=' + id })
}

export const getDocCategoryTree = () => {
  return request.get({ url: '/infra/doc/category/tree' })
}

// ========== 文档 ==========
export interface DocVO {
  id?: number
  categoryId: number
  name: string
  type: number
  fileUrl?: string
  fileType?: string
  externalUrl?: string
  fileSize?: number
  sort?: number
  status?: number
  remark?: string
}

export const createDoc = (data: DocVO) => {
  return request.post({ url: '/infra/doc/create', data })
}

export const updateDoc = (data: DocVO) => {
  return request.put({ url: '/infra/doc/update', data })
}

export const deleteDoc = (id: number) => {
  return request.delete({ url: '/infra/doc/delete?id=' + id })
}

export const getDoc = (id: number) => {
  return request.get({ url: '/infra/doc/get?id=' + id })
}

export const getDocPage = (params: any) => {
  return request.get({ url: '/infra/doc/page', params })
}

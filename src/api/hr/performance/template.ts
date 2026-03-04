import request from '@/config/axios'

/** 模板条目 */
export interface PerformanceTemplateItemVO {
  id?: number
  itemName: string
  maxScore: number
  scoringCriteria?: string
  evidenceDesc?: string
  notes?: string
  isFixedScore?: boolean
  fixedScoreCondition?: string
  sort?: number
}

/** 模板区块 */
export interface PerformanceTemplateSectionVO {
  id?: number
  sectionName: string
  sectionType: number // 1=基础指标 2=加分项 3=扣分项
  maxScore: number
  sort?: number
  items?: PerformanceTemplateItemVO[]
}

/** 模板保存请求 */
export interface PerformanceTemplateSaveReqVO {
  id?: number
  name: string
  description?: string
  performanceBaseRatio?: number
  coefficientRules?: string
  status?: number
  sections: PerformanceTemplateSectionVO[]
  userIds?: number[]
}

/** 模板响应 */
export interface PerformanceTemplateRespVO {
  id: number
  name: string
  description?: string
  performanceBaseRatio?: number
  coefficientRules?: string
  status: number
  createTime?: string
  sections?: PerformanceTemplateSectionVO[]
  userIds?: number[]
}

// 创建绩效模板
export const createPerformanceTemplate = (data: PerformanceTemplateSaveReqVO) => {
  return request.post<number>({ url: '/system/performance/template/create', data })
}

// 修改绩效模板
export const updatePerformanceTemplate = (data: PerformanceTemplateSaveReqVO) => {
  return request.put({ url: '/system/performance/template/update', data })
}

// 删除绩效模板
export const deletePerformanceTemplate = (id: number) => {
  return request.delete({ url: '/system/performance/template/delete?id=' + id })
}

// 获取模板详情
export const getPerformanceTemplate = (id: number) => {
  return request.get<PerformanceTemplateRespVO>({ url: '/system/performance/template/get?id=' + id })
}

// 获取所有启用的模板列表
export const getPerformanceTemplateList = () => {
  return request.get<PerformanceTemplateRespVO[]>({ url: '/system/performance/template/list' })
}

// 设置模板应用人员
export const setTemplateUsers = (templateId: number, userIds: number[]) => {
  return request.put({
    url: '/system/performance/template/set-users',
    params: { templateId },
    data: userIds
  })
}

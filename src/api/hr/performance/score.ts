import request from '@/config/axios'

/** 打分条目请求 */
export interface PerformanceScoreItemReqVO {
  templateItemId: number
  sectionType?: number
  selfScore?: number
  reviewScore?: number
  evidenceUrl?: string
  remark?: string
}

/** 打分保存请求 */
export interface PerformanceScoreSaveReqVO {
  id?: number
  userId: number
  yearMonth: number
  attendanceDeductionScore?: number
  items: PerformanceScoreItemReqVO[]
  reviewComment?: string
}

/** 打分条目详情 */
export interface PerformanceScoreItemDetailVO {
  id?: number
  templateItemId?: number
  itemName?: string
  maxScore?: number
  scoringCriteria?: string
  evidenceDesc?: string
  notes?: string
  isFixedScore?: boolean
  sectionType?: number
  selfScore?: number
  reviewScore?: number
  evidenceUrl?: string
  remark?: string
}

/** 打分记录响应 */
export interface PerformanceScoreRespVO {
  id: number
  userId: number
  nickname?: string
  templateId?: number
  templateName?: string
  yearMonth: number
  reviewerUserId?: number
  reviewerName?: string
  baseSectionScore?: number
  bonusSectionScore?: number
  deductionSectionScore?: number
  attendanceDeductionScore?: number
  finalScore?: number
  performanceCoefficient?: number
  performanceSalary?: number
  status: number // 0=草稿 1=已提交 2=审核通过 3=已驳回
  reviewComment?: string
  appealContent?: string
  appealResult?: string
  createTime?: string
  items?: PerformanceScoreItemDetailVO[]
}

// 创建/修改绩效打分
export const savePerformanceScore = (data: PerformanceScoreSaveReqVO) => {
  return request.post<number>({ url: '/system/performance/score/save', data })
}

// 提交绩效打分（草稿→待审核）
export const submitPerformanceScore = (id: number) => {
  return request.put({ url: '/system/performance/score/submit?id=' + id })
}

// 审核通过
export const approvePerformanceScore = (id: number, reviewComment?: string) => {
  return request.put({
    url: '/system/performance/score/approve',
    params: { id, reviewComment }
  })
}

// 驳回
export const rejectPerformanceScore = (id: number, reviewComment?: string) => {
  return request.put({
    url: '/system/performance/score/reject',
    params: { id, reviewComment }
  })
}

// 获取打分详情
export const getPerformanceScore = (id: number) => {
  return request.get<PerformanceScoreRespVO>({ url: '/system/performance/score/get?id=' + id })
}

// 分页查询打分列表
export const getPerformanceScorePage = (params: {
  pageNo: number
  pageSize: number
  yearMonth?: number
  userId?: number
  status?: number
}) => {
  return request.get<{ list: PerformanceScoreRespVO[]; total: number }>({
    url: '/system/performance/score/page',
    params
  })
}

// 个人中心-查询本人某月绩效打分
export const getMyPerformanceScore = (yearMonth: number) => {
  return request.get<PerformanceScoreRespVO>({
    url: '/system/performance/my-score',
    params: { yearMonth }
  })
}

// 个人中心-提交绩效申诉
export const submitMyAppeal = (id: number, appealContent: string) => {
  return request.put({
    url: '/system/performance/my-appeal',
    params: { id, appealContent }
  })
}

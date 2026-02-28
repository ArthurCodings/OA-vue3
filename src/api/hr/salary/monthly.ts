import request from '@/config/axios'

export interface SalaryMonthlyVO {
  id?: number
  userId: number
  yearMonth: number
  baseSalary?: number
  positionSalary?: number
  performance?: number
  commission?: number
  allowance?: number
  fullAttendanceBonus?: number
  totalSalary?: number
  shouldAttendDays?: number
  actualAttendDays?: number
  lateCount?: number
  absentCount?: number
  status?: number
  remark?: string
}

// 月度薪资分页列表
export const getSalaryMonthlyPage = (params: any) => {
  return request.get({ url: '/system/salary/monthly/page', params })
}

// 发起月结算
export const generateSalaryMonthly = (yearMonth?: number) => {
  return request.post({
    url: '/system/salary/monthly/generate',
    params: yearMonth ? { yearMonth } : undefined
  })
}

// 编辑薪资单（填写绩效/提成）
export const updateSalaryMonthly = (data: {
  id: number
  performance?: number
  commission?: number
  remark?: string
}) => {
  return request.put({ url: '/system/salary/monthly/update', data })
}

// 确认薪资单
export const confirmSalaryMonthly = (id: number) => {
  return request.put({ url: '/system/salary/monthly/confirm?id=' + id })
}

// 批量确认薪资单
export const batchConfirmSalaryMonthly = (ids: number[]) => {
  return request.put({
    url: '/system/salary/monthly/batch-confirm',
    params: { ids: ids.join(',') }
  })
}

// 导出月度薪资
export const exportSalaryMonthly = (params: any) => {
  return request.download({ url: '/system/salary/monthly/export-excel', params })
}

// 个人中心-最新薪资单
export const getMyLatestSalary = () => {
  return request.get({ url: '/system/salary/my-latest' })
}

// 个人中心-历史薪资列表
export const getMySalaryList = () => {
  return request.get({ url: '/system/salary/my-list' })
}

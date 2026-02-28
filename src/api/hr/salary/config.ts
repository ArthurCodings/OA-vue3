import request from '@/config/axios'

export interface SalaryConfigVO {
  id?: number
  enableBaseSalary?: boolean
  enablePositionSalary?: boolean
  enablePerformance?: boolean
  enableCommission?: boolean
  enableAllowance?: boolean
  enableFullAttendance?: boolean
  fullAttendanceAmount?: number
  commissionSource?: number
  performanceSource?: number
  remark?: string
}

// 获取薪资配置
export const getSalaryConfig = () => {
  return request.get({ url: '/system/salary/config/get' })
}

// 保存薪资配置
export const saveSalaryConfig = (data: SalaryConfigVO) => {
  return request.post({ url: '/system/salary/config/save', data })
}

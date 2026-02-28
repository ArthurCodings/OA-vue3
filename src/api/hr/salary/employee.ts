import request from '@/config/axios'

export interface EmployeeSalaryVO {
  id?: number
  userId: number
  baseSalary: number
  positionSalary: number
  allowance: number
  effectiveDate: string
  remark?: string
}

// 创建员工薪资档案
export const createEmployeeSalary = (data: EmployeeSalaryVO) => {
  return request.post({ url: '/system/salary/employee/create', data })
}

// 修改员工薪资档案
export const updateEmployeeSalary = (data: EmployeeSalaryVO) => {
  return request.put({ url: '/system/salary/employee/update', data })
}

// 员工薪资档案分页列表
export const getEmployeeSalaryPage = (params: any) => {
  return request.get({ url: '/system/salary/employee/page', params })
}

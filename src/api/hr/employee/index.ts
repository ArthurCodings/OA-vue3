import request from '@/config/axios'

export interface HrEmployeeVO {
  id?: number
  userId: number
  nickname: string
  deptId: number
  deptName?: string
  postId?: number
  postName?: string
  mobile?: string
  email?: string
  sex?: number
  avatar?: string
  employmentType?: number
  employmentStatus?: number
  defaultRuleId?: number
  joinDate?: string
  formalDate?: string
  leaveDate?: string
  idCard?: string
  emergencyContact?: string
  emergencyPhone?: string
  remark?: string
}

// 创建员工花名册
export const createHrEmployee = (data: HrEmployeeVO) => {
  return request.post({ url: '/system/hr-employee/create', data })
}

// 修改员工花名册
export const updateHrEmployee = (data: HrEmployeeVO) => {
  return request.put({ url: '/system/hr-employee/update', data })
}

// 删除员工花名册
export const deleteHrEmployee = (id: number) => {
  return request.delete({ url: '/system/hr-employee/delete?id=' + id })
}

// 获取员工花名册详情
export const getHrEmployee = (id: number) => {
  return request.get({ url: '/system/hr-employee/get?id=' + id })
}

// 员工花名册分页列表
export const getHrEmployeePage = (params: any) => {
  return request.get({ url: '/system/hr-employee/page', params })
}

// 导出员工花名册
export const exportHrEmployee = (params: any) => {
  return request.download({ url: '/system/hr-employee/export-excel', params })
}

// 个人中心-我的员工档案
export const getMyProfile = () => {
  return request.get({ url: '/system/hr-employee/my-profile' })
}

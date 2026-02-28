import request from '@/config/axios'

export interface AttendanceRuleVO {
  id?: number
  name: string
  shiftType: number
  workDaysPerWeek: number
  workStartTime: string
  workEndTime: string
  lateThresholdMinutes: number
  earlyLeaveThresholdMinutes: number
  isFollowHoliday: boolean
  status: number
  remark?: string
}

// 创建排班规则
export const createAttendanceRule = (data: AttendanceRuleVO) => {
  return request.post({ url: '/system/attendance-rule/create', data })
}

// 修改排班规则
export const updateAttendanceRule = (data: AttendanceRuleVO) => {
  return request.put({ url: '/system/attendance-rule/update', data })
}

// 删除排班规则
export const deleteAttendanceRule = (id: number) => {
  return request.delete({ url: '/system/attendance-rule/delete?id=' + id })
}

// 获取排班规则详情
export const getAttendanceRule = (id: number) => {
  return request.get({ url: '/system/attendance-rule/get?id=' + id })
}

// 排班规则分页列表
export const getAttendanceRulePage = (params: any) => {
  return request.get({ url: '/system/attendance-rule/page', params })
}

// 获取所有启用的排班规则（下拉选项）
export const getAttendanceRuleListEnabled = () => {
  return request.get({ url: '/system/attendance-rule/list-enabled' })
}

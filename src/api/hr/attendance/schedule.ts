import request from '@/config/axios'

export interface AttendanceScheduleVO {
  id?: number
  userId: number
  ruleId: number
  shiftType: number
  scheduleDate: string
  yearMonth: number
  dayType: number
  isNeedClock: boolean
}

// 排班分页列表
export const getAttendanceSchedulePage = (params: any) => {
  return request.get({ url: '/system/attendance-schedule/page', params })
}

// 手动生成排班
export const generateAttendanceSchedule = (yearMonth?: number) => {
  return request.post({
    url: '/system/attendance-schedule/generate',
    params: yearMonth ? { yearMonth } : undefined
  })
}

// 临时调班
export const changeAttendanceShift = (data: { id: number; ruleId: number }) => {
  return request.put({ url: '/system/attendance-schedule/change-shift', data })
}

// 个人中心-本月考勤汇总
export const getMyMonthlySummary = (yearMonth?: number) => {
  return request.get({
    url: '/system/attendance-schedule/my-monthly-summary',
    params: yearMonth ? { yearMonth } : undefined
  })
}

// 个人中心-本月每日排班
export const getMyMonthly = (yearMonth?: number) => {
  return request.get({
    url: '/system/attendance-schedule/my-monthly',
    params: yearMonth ? { yearMonth } : undefined
  })
}

import request from '@/config/axios'

// 打卡记录分页列表
export const getAttendanceRecordPage = (params: any) => {
  return request.get({ url: '/system/attendance-record/page', params })
}

// 签到
export const clockIn = () => {
  return request.post({ url: '/system/attendance-record/clock-in' })
}

// 签退
export const clockOut = () => {
  return request.post({ url: '/system/attendance-record/clock-out' })
}

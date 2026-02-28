import request from '@/config/axios'

export interface HolidayVO {
  id?: number
  name: string
  holidayDate: string
  type: number
  year: number
  remark?: string
}

// 创建节假日
export const createHoliday = (data: HolidayVO) => {
  return request.post({ url: '/system/holiday/create', data })
}

// 修改节假日
export const updateHoliday = (data: HolidayVO) => {
  return request.put({ url: '/system/holiday/update', data })
}

// 删除节假日
export const deleteHoliday = (id: number) => {
  return request.delete({ url: '/system/holiday/delete?id=' + id })
}

// 获取节假日详情
export const getHoliday = (id: number) => {
  return request.get({ url: '/system/holiday/get?id=' + id })
}

// 节假日分页列表
export const getHolidayPage = (params: any) => {
  return request.get({ url: '/system/holiday/page', params })
}

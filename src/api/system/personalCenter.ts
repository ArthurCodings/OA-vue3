import request from '@/config/axios'

export interface PersonalCenterPanelVO {
  currentYearMonth: number
  todayClockIn: boolean
  todayClockOut: boolean
  employee?: {
    id: number
    nickname: string
    deptName: string
    postName: string
    employmentStatus: number
    joinDate: string
    idCard?: string
  }
  attendance?: {
    shouldAttendDays: number
    actualAttendDays: number
    lateCount: number
    absentCount: number
    dailyList: Array<{ date: string; status: number }>
  }
  latestSalary?: {
    yearMonth: number
    totalSalary: number
    baseSalary: number
    positionSalary: number
    performance: number
    commission: number
    allowance: number
    fullAttendanceBonus: number
    status: number
  }
  salaryConfig?: {
    enableBaseSalary: boolean
    enablePositionSalary: boolean
    enablePerformance: boolean
    enableCommission: boolean
    enableAllowance: boolean
    enableFullAttendance: boolean
    fullAttendanceAmount: number
  }
  contracts?: Array<{
    id: number
    contractName: string
    amount: number
    commissionAmount: number
    status: number
    endDate: string
  }>
}

// 聚合面板：一次返回员工档案 + 本月考勤汇总 + 今日打卡状态 + 最新薪资单等
export const getPersonalCenterPanel = (yearMonth?: number) => {
  return request.get<PersonalCenterPanelVO>({
    url: '/system/personal-center/panel',
    params: yearMonth ? { yearMonth } : undefined
  })
}

// 快捷签到
export const personalCenterClockIn = () => {
  return request.post({ url: '/system/personal-center/clock-in' })
}

// 快捷签退
export const personalCenterClockOut = () => {
  return request.post({ url: '/system/personal-center/clock-out' })
}

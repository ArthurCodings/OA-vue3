<template>
  <div class="work-panel">
    <!-- 年月选择 -->
    <div class="mb-4 flex items-center gap-2">
      <span class="text-14px text-gray-600">查看月份：</span>
      <el-date-picker
        v-model="selectedYearMonth"
        type="month"
        value-format="YYYYMM"
        placeholder="选择年月"
        class="!w-140px"
        @change="fetchPanel"
      />
    </div>

    <!-- 打卡快捷入口 -->
    <el-card shadow="never" class="mb-4">
      <template #header>
        <span>今日打卡</span>
      </template>
      <div class="flex items-center gap-4">
        <el-button
          type="success"
          :loading="clockLoading"
          :disabled="panel?.todayClockIn"
          @click="handleClockIn"
        >
          <Icon icon="ep:check" class="mr-1" />
          {{ panel?.todayClockIn ? '已签到' : '签到' }}
        </el-button>
        <el-button
          type="warning"
          :loading="clockLoading"
          :disabled="panel?.todayClockOut || !panel?.todayClockIn"
          @click="handleClockOut"
        >
          <Icon icon="ep:close" class="mr-1" />
          {{ panel?.todayClockOut ? '已签退' : '签退' }}
        </el-button>
      </div>
    </el-card>

    <!-- 本月考勤 -->
    <el-card v-if="panel?.attendance" shadow="never" class="mb-4">
      <template #header>
        <span>本月考勤</span>
        <span class="text-14px text-gray-500 ml-2">
          应出勤 {{ panel.attendance.shouldAttendDays }} 天 · 实出勤 {{ panel.attendance.actualAttendDays }} 天
          · 迟到 {{ panel.attendance.lateCount }} 次 · 缺勤 {{ panel.attendance.absentCount }} 天
        </span>
      </template>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="d in panel.attendance.dailyList"
          :key="d.date"
          class="inline-flex w-7 h-7 items-center justify-center rounded text-12px"
          :class="dailyStatusClass(d.status)"
          :title="`${d.date} ${dailyStatusLabel(d.status)}`"
        >
          {{ new Date(d.date).getDate() }}
        </span>
      </div>
      <div class="mt-2 flex flex-wrap gap-4 text-12px text-gray-500">
        <span><span class="inline-block w-3 h-3 rounded bg-gray-300 mr-1"></span>休息</span>
        <span><span class="inline-block w-3 h-3 rounded bg-green-500 mr-1"></span>正常</span>
        <span><span class="inline-block w-3 h-3 rounded bg-yellow-500 mr-1"></span>迟到</span>
        <span><span class="inline-block w-3 h-3 rounded bg-orange-400 mr-1"></span>早退</span>
        <span><span class="inline-block w-3 h-3 rounded bg-red-500 mr-1"></span>缺勤</span>
      </div>
    </el-card>

    <!-- 待确认薪资通知单 -->
    <el-card v-if="confirmNotices.length > 0" shadow="never" class="mb-4">
      <template #header>
        <span>待确认薪资通知单</span>
        <el-tag type="warning" size="small" class="ml-2">{{ confirmNotices.length }} 条待确认</el-tag>
      </template>
      <el-table :data="confirmNotices" size="small">
        <el-table-column label="年月" prop="yearMonth" width="100">
          <template #default="{ row }">{{ formatYearMonth(row.yearMonth) }}</template>
        </el-table-column>
        <el-table-column label="应发金额" prop="totalSalary" width="110">
          <template #default="{ row }">¥{{ (row.totalSalary ?? 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="发送时间" prop="sendTime" width="160">
          <template #default="{ row }">{{ row.sendTime || row.send_time || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :loading="confirmLoading === row.id" @click="handleConfirmNotice(row)">
              确认
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 最新薪资 -->
    <el-card v-if="latestSalary" shadow="never" class="mb-4">
      <template #header>
        <span>最新薪资</span>
        <span class="text-14px text-gray-500 ml-2">{{ formatYearMonth(latestSalary.yearMonth) }}</span>
      </template>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="基本工资">¥{{ (latestSalary.baseSalary ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="岗位工资">¥{{ (latestSalary.positionSalary ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="绩效">¥{{ (latestSalary.performance ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="提成">¥{{ (latestSalary.commission ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="补贴">¥{{ (latestSalary.allowance ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="全勤奖">¥{{ (latestSalary.fullAttendanceBonus ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="应发合计" :span="2">
          <span class="font-medium text-primary">¥{{ (latestSalary.totalSalary ?? 0).toFixed(2) }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 我的绩效 -->
    <el-card shadow="never" class="mb-4">
      <template #header>
        <span>我的绩效</span>
        <span class="text-14px text-gray-500 ml-2">{{ formatYearMonth(selectedYearMonth) }}</span>
      </template>
      <div v-loading="myScoreLoading">
        <template v-if="myScore">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="模板">{{ myScore.templateName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="myScoreStatusTag(myScore.status)" size="small">
                {{ myScoreStatusLabel(myScore.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最终得分">{{ (myScore.finalScore ?? 0).toFixed(1) }}</el-descriptions-item>
            <el-descriptions-item label="绩效薪酬">¥{{ (myScore.performanceSalary ?? 0).toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="考核人">{{ myScore.reviewerName || '-' }}</el-descriptions-item>
          </el-descriptions>
        </template>
        <el-empty v-else-if="!myScoreLoading" description="该月暂无绩效打分" :image-size="60" />
      </div>
    </el-card>

    <!-- 历史薪资 -->
    <el-card shadow="never" class="mb-4">
      <template #header>
        <span>历史薪资</span>
      </template>
      <el-table v-loading="salaryListLoading" :data="salaryList" size="small">
        <el-table-column label="年月" prop="yearMonth" width="100">
          <template #default="{ row }">{{ formatYearMonth(row.yearMonth ?? row.year_month) }}</template>
        </el-table-column>
        <el-table-column label="应发合计" prop="totalSalary" width="110">
          <template #default="{ row }">
            ¥{{ (row.totalSalary ?? row.total_salary ?? 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="90">
          <template #default="{ row }">
            <el-tag :type="salaryStatusTag(getSalaryStatus(row))" size="small">
              {{ salaryStatusLabel(getSalaryStatus(row)) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="salaryListTotal > 0"
        class="mt-2"
        small
        layout="total, prev, pager, next"
        :total="salaryListTotal"
        v-model:current-page="salaryListPage"
        :page-size="10"
        @current-change="fetchSalaryList"
      />
      <el-empty v-else-if="!salaryListLoading && salaryListAll.length === 0" description="暂无历史薪资记录" />
    </el-card>

    <!-- 员工档案 -->
    <el-card v-if="panel?.employee" shadow="never" class="mb-4">
      <template #header>
        <span>我的员工档案</span>
      </template>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="姓名">{{ getEmployeeField(panel.employee, 'nickname') }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ getEmployeeField(panel.employee, 'deptName') }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ getEmployeeField(panel.employee, 'postName') }}</el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ panel.employee.joinDate ?? panel.employee?.join_date ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="身份证" v-if="panel.employee.idCard">{{ panel.employee.idCard }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 我的合同 -->
    <el-card v-if="panel?.contracts?.length" shadow="never">
      <template #header>
        <span>我负责的合同</span>
      </template>
      <ul class="space-y-2">
        <li
          v-for="c in panel.contracts"
          :key="c.id"
          class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
        >
          <span class="text-14px">{{ c.contractName }}</span>
          <span class="text-12px text-gray-500">
            ¥{{ (c.amount ?? 0).toLocaleString() }} · 到期 {{ c.endDate || '-' }}
          </span>
        </li>
      </ul>
    </el-card>

    <el-empty
      v-else-if="
        !loading &&
        !panel?.employee &&
        !panel?.attendance &&
        !latestSalary &&
        confirmNotices.length === 0 &&
        !panel?.contracts?.length
      "
      description="暂无工作台数据，请确保已录入花名册"
    />

  </div>
</template>
<script lang="ts" setup>
import * as PersonalCenterApi from '@/api/system/personalCenter'
import * as SalaryMonthlyApi from '@/api/hr/salary/monthly'
import * as PerformanceScoreApi from '@/api/hr/performance/score'

defineOptions({ name: 'WorkPanel' })

const loading = ref(true)
const clockLoading = ref(false)
const panel = ref<PersonalCenterApi.PersonalCenterPanelVO | null>(null)
const selectedYearMonth = ref<string>('')
const latestSalary = ref<any>(null)
const confirmNotices = ref<any[]>([])
const confirmLoading = ref<number | null>(null)
const myScore = ref<any>(null)
const myScoreLoading = ref(false)
const salaryListAll = ref<any[]>([])
const salaryListLoading = ref(false)
const salaryListPage = ref(1)
const salaryListPageSize = 10

/** 前端分页：当前页数据 */
const salaryList = computed(() => {
  const all = salaryListAll.value
  const start = (salaryListPage.value - 1) * salaryListPageSize
  return all.slice(start, start + salaryListPageSize)
})

const salaryListTotal = computed(() => salaryListAll.value.length)

const dailyStatusClass = (status: number) => {
  const map: Record<number, string> = {
    [-1]: 'bg-gray-200 text-gray-500',
    0: 'bg-green-500 text-white',
    1: 'bg-yellow-500 text-white',
    2: 'bg-orange-400 text-white',
    3: 'bg-red-500 text-white'
  }
  return map[status] ?? 'bg-gray-200'
}

const dailyStatusLabel = (status: number) => {
  const map: Record<number, string> = {
    [-1]: '休息',
    0: '正常',
    1: '迟到',
    2: '早退',
    3: '缺勤'
  }
  return map[status] ?? '未知'
}

const salaryStatusLabel = (v: number) => {
  const map: Record<number, string> = { 0: '待确认', 1: '已确认', 2: '已发放' }
  return map[v] ?? '-'
}

const salaryStatusTag = (v: number) => {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'info' }
  return map[v] ?? 'info'
}

const myScoreStatusLabel = (v: number) => {
  const map: Record<number, string> = { 0: '草稿', 1: '已提交', 2: '审核通过', 3: '已驳回' }
  return map[v] ?? '-'
}

const myScoreStatusTag = (v: number) => {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[v] ?? 'info'
}

const getSalaryStatus = (row: any) => row?.status ?? 0

/** 格式化年月：202602 -> 2026年2月 */
const formatYearMonth = (ym: number | string) => {
  if (ym === undefined || ym === null) return ''
  const s = String(ym)
  if (s.length >= 6) return `${s.slice(0, 4)}年${parseInt(s.slice(4, 6), 10)}月`
  return `${ym}月`
}

/** 兼容 snake_case 与 camelCase 获取员工字段 */
const getEmployeeField = (emp: any, camelKey: string) => {
  if (!emp) return '-'
  const snakeKey = camelKey.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
  return (emp[camelKey] ?? emp[snakeKey]) || '-'
}

/** 标准化 panel 数据（兼容后端 snake_case） */
const normalizePanel = (raw: any): PersonalCenterApi.PersonalCenterPanelVO | null => {
  if (!raw) return null
  const emp = raw.employee ?? raw.employee_
  const att = raw.attendance ?? raw.attendance_
  return {
    ...raw,
    todayClockIn: raw.todayClockIn ?? raw.today_clock_in ?? false,
    todayClockOut: raw.todayClockOut ?? raw.today_clock_out ?? false,
    employee: emp
      ? {
          id: emp.id,
          nickname: emp.nickname ?? emp.user_name ?? '-',
          deptName: emp.deptName ?? emp.dept_name ?? '-',
          postName: emp.postName ?? emp.post_name ?? '-',
          employmentStatus: emp.employmentStatus ?? emp.employment_status ?? 0,
          joinDate: emp.joinDate ?? emp.join_date ?? '',
          idCard: emp.idCard ?? emp.id_card
        }
      : undefined,
    attendance: att
      ? {
          shouldAttendDays: att.shouldAttendDays ?? att.should_attend_days ?? 0,
          actualAttendDays: att.actualAttendDays ?? att.actual_attend_days ?? 0,
          lateCount: att.lateCount ?? att.late_count ?? 0,
          absentCount: att.absentCount ?? att.absent_count ?? 0,
          dailyList: (att.dailyList ?? att.daily_list ?? []).map((d: any) => ({
            date: d.date,
            status: d.status ?? 0
          }))
        }
      : undefined,
    latestSalary: raw.latestSalary ?? raw.latest_salary,
    contracts: raw.contracts ?? []
  }
}

const fetchMyScore = async () => {
  const ym = Number(selectedYearMonth.value)
  if (!ym) return
  myScoreLoading.value = true
  try {
    myScore.value = await PerformanceScoreApi.getMyPerformanceScore(ym)
  } catch {
    myScore.value = null
  } finally {
    myScoreLoading.value = false
  }
}

const fetchPanel = async () => {
  loading.value = true
  try {
    let yearMonth: number
    if (selectedYearMonth.value) {
      yearMonth = Number(selectedYearMonth.value)
    } else {
      const now = new Date()
      yearMonth = now.getFullYear() * 100 + now.getMonth() + 1
      selectedYearMonth.value = String(yearMonth)
    }
    const data = await PersonalCenterApi.getPersonalCenterPanel(yearMonth)
    panel.value = normalizePanel(data)
    if (panel.value?.latestSalary) {
      latestSalary.value = panel.value.latestSalary
    } else {
      try {
        const sal = await SalaryMonthlyApi.getMyLatestSalary()
        latestSalary.value = sal ?? null
      } catch {
        latestSalary.value = null
      }
    }
  } catch {
    panel.value = null
    latestSalary.value = null
  } finally {
    loading.value = false
  }
  fetchMyScore()
}

const fetchSalaryList = async () => {
  salaryListLoading.value = true
  try {
    const data = await SalaryMonthlyApi.getMySalaryList()
    const items = Array.isArray(data) ? data : (data?.list ?? data?.data ?? [])
    const list = (items ?? []).slice()
    list.sort((a: any, b: any) => {
      const ymA = a.yearMonth ?? a.year_month ?? 0
      const ymB = b.yearMonth ?? b.year_month ?? 0
      return ymB - ymA
    })
    salaryListAll.value = list
  } catch {
    salaryListAll.value = []
  } finally {
    salaryListLoading.value = false
  }
}

const handleClockIn = async () => {
  clockLoading.value = true
  try {
    await PersonalCenterApi.personalCenterClockIn()
    useMessage().success('签到成功')
    await fetchPanel()
  } catch {
  } finally {
    clockLoading.value = false
  }
}

const handleClockOut = async () => {
  clockLoading.value = true
  try {
    await PersonalCenterApi.personalCenterClockOut()
    useMessage().success('签退成功')
    await fetchPanel()
  } catch {
  } finally {
    clockLoading.value = false
  }
}

const fetchConfirmNotices = async () => {
  try {
    const data = await SalaryMonthlyApi.getMyConfirmNotices()
    const items = Array.isArray(data) ? data : (data?.list ?? data?.data ?? [])
    confirmNotices.value = (items ?? []).filter((n: any) => (n.status ?? 0) === 0)
  } catch {
    confirmNotices.value = []
  }
}

const handleConfirmNotice = async (row: any) => {
  const noticeId = row.id
  if (!noticeId) return
  confirmLoading.value = noticeId
  try {
    await SalaryMonthlyApi.myConfirmSalary(noticeId)
    useMessage().success('薪资确认成功')
    confirmNotices.value = confirmNotices.value.filter((n) => n.id !== noticeId)
    await fetchSalaryList()
    await fetchPanel()
  } catch {
  } finally {
    confirmLoading.value = null
  }
}

onMounted(() => {
  const now = new Date()
  selectedYearMonth.value = String(now.getFullYear() * 100 + now.getMonth() + 1)
  fetchPanel()
  fetchSalaryList()
  fetchConfirmNotices()
})
</script>

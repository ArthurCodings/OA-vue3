<template>
  <div class="work-panel">
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
          :disabled="panel?.todayClockOut"
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
      <div class="mt-2 flex gap-4 text-12px text-gray-500">
        <span><span class="inline-block w-3 h-3 rounded bg-gray-300 mr-1"></span>休息</span>
        <span><span class="inline-block w-3 h-3 rounded bg-green-500 mr-1"></span>正常</span>
        <span><span class="inline-block w-3 h-3 rounded bg-yellow-500 mr-1"></span>迟到</span>
        <span><span class="inline-block w-3 h-3 rounded bg-red-500 mr-1"></span>缺勤</span>
      </div>
    </el-card>

    <!-- 最新薪资单 -->
    <el-card v-if="panel?.latestSalary" shadow="never" class="mb-4">
      <template #header>
        <span>最新薪资单</span>
        <span class="text-14px text-gray-500 ml-2">{{ panel.latestSalary.yearMonth }} 月</span>
      </template>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="基本工资">¥{{ (panel.latestSalary.baseSalary ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="岗位工资">¥{{ (panel.latestSalary.positionSalary ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="绩效">¥{{ (panel.latestSalary.performance ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="提成">¥{{ (panel.latestSalary.commission ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="补贴">¥{{ (panel.latestSalary.allowance ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="全勤奖">¥{{ (panel.latestSalary.fullAttendanceBonus ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="应发合计" :span="2">
          <span class="font-medium text-primary">¥{{ (panel.latestSalary.totalSalary ?? 0).toFixed(2) }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 员工档案 -->
    <el-card v-if="panel?.employee" shadow="never" class="mb-4">
      <template #header>
        <span>我的员工档案</span>
      </template>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="姓名">{{ panel.employee.nickname }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ panel.employee.deptName }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ panel.employee.postName }}</el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ panel.employee.joinDate || '-' }}</el-descriptions-item>
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

    <el-empty v-else-if="!loading && !panel?.employee && !panel?.attendance" description="暂无工作台数据" />
  </div>
</template>
<script lang="ts" setup>
import * as PersonalCenterApi from '@/api/system/personalCenter'

defineOptions({ name: 'WorkPanel' })

const loading = ref(true)
const clockLoading = ref(false)
const panel = ref<PersonalCenterApi.PersonalCenterPanelVO | null>(null)

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

const fetchPanel = async () => {
  loading.value = true
  try {
    const now = new Date()
    const yearMonth = now.getFullYear() * 100 + now.getMonth() + 1
    panel.value = await PersonalCenterApi.getPersonalCenterPanel(yearMonth)
  } catch {
    panel.value = null
  } finally {
    loading.value = false
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

onMounted(fetchPanel)
</script>

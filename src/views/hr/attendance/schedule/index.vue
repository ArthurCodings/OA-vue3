<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="年月" prop="yearMonth">
        <el-date-picker
          v-model="queryParams.yearMonth"
          type="month"
          value-format="YYYYMM"
          placeholder="选择年月"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="员工" prop="userId">
        <el-select
          v-model="queryParams.userId"
          placeholder="请选择员工"
          clearable
          filterable
          class="!w-200px"
        >
          <el-option
            v-for="u in userList"
            :key="u.id"
            :label="u.nickname"
            :value="u.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="班次" prop="shiftType">
        <el-select v-model="queryParams.shiftType" placeholder="请选择班次" clearable class="!w-200px">
          <el-option label="早班" :value="1" />
          <el-option label="晚班" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="handleGenerate"
          :loading="generateLoading"
          v-hasPermi="['system:attendance-schedule:update']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 生成排班
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="员工" align="center" prop="nickname" width="100" fixed="left" />
      <el-table-column label="部门" align="center" prop="deptName" width="100" fixed="left" />
      <el-table-column label="排班日期" align="center" prop="scheduleDate" width="110" />
      <el-table-column label="班次" align="center" prop="shiftType" width="80">
        <template #default="{ row }">
          <el-tag :type="row.shiftType === 1 ? 'success' : 'warning'" size="small">
            {{ row.shiftType === 1 ? '早班' : '晚班' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="日类型" align="center" prop="dayType" width="100">
        <template #default="{ row }">
          <el-tag :type="dayTypeTag(row.dayType)" size="small">
            {{ dayTypeLabel(row.dayType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="需打卡" align="center" prop="isNeedClock" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isNeedClock ? 'success' : 'info'" size="small">
            {{ row.isNeedClock ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.isNeedClock"
            link
            type="primary"
            size="small"
            @click="openChangeShift(row)"
            v-hasPermi="['system:attendance-schedule:update']"
          >
            调班
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <el-dialog v-model="changeShiftVisible" title="临时调班" width="400px">
    <el-form :model="changeShiftForm" label-width="80px">
      <el-form-item label="选择班次">
        <el-select v-model="changeShiftForm.ruleId" placeholder="请选择排班规则" style="width: 100%">
          <el-option
            v-for="r in ruleList"
            :key="r.id"
            :label="r.name"
            :value="r.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="changeShiftVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitChangeShift">确 定</el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import * as ScheduleApi from '@/api/hr/attendance/schedule'
import * as RuleApi from '@/api/hr/attendance/rule'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'HrAttendanceSchedule' })

const message = useMessage()
const loading = ref(true)
const generateLoading = ref(false)
const total = ref(0)
const list = ref([])
const userList = ref<any[]>([])
const ruleList = ref<any[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  yearMonth: undefined,
  userId: undefined,
  shiftType: undefined
})
const queryFormRef = ref()

const dayTypeLabel = (v: number) => {
  const map: Record<number, string> = {
    1: '工作日',
    2: '周末休息',
    3: '节假日休息',
    4: '调班工作日'
  }
  return map[v] ?? '-'
}

const dayTypeTag = (v: number) => {
  const map: Record<number, string> = {
    1: 'success',
    2: 'info',
    3: 'info',
    4: 'warning'
  }
  return map[v] ?? 'info'
}

const getList = async () => {
  loading.value = true
  try {
    const data = await ScheduleApi.getAttendanceSchedulePage(queryParams)
    list.value = data.list ?? []
    total.value = data.total ?? 0
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

const handleGenerate = async () => {
  const yearMonth = queryParams.yearMonth || undefined
  generateLoading.value = true
  try {
    await ScheduleApi.generateAttendanceSchedule(yearMonth)
    message.success('排班生成成功')
    await getList()
  } finally {
    generateLoading.value = false
  }
}

const changeShiftVisible = ref(false)
const changeShiftForm = ref<{ id: number; ruleId: number }>({ id: 0, ruleId: 0 })

const openChangeShift = (row: any) => {
  changeShiftForm.value = { id: row.id, ruleId: row.ruleId }
  changeShiftVisible.value = true
}

const submitChangeShift = async () => {
  try {
    await ScheduleApi.changeAttendanceShift(changeShiftForm.value)
    message.success('调班成功')
    changeShiftVisible.value = false
    await getList()
  } catch {}
}

onMounted(async () => {
  const now = new Date()
  queryParams.yearMonth = Number(now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0'))
  try {
    const [users, rules] = await Promise.all([
      UserApi.getSimpleUserList(),
      RuleApi.getAttendanceRuleListEnabled()
    ])
    userList.value = users ?? []
    ruleList.value = rules ?? []
  } catch {
    userList.value = []
    ruleList.value = []
  }
  getList()
})
</script>

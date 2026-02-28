<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
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
      <el-form-item label="考勤状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-200px">
          <el-option label="正常" :value="0" />
          <el-option label="迟到" :value="1" />
          <el-option label="早退" :value="2" />
          <el-option label="缺勤" :value="3" />
          <el-option label="请假" :value="4" />
          <el-option label="加班" :value="5" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围" prop="dateRange">
        <el-date-picker
          v-model="queryParams.dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="员工" align="center" prop="nickname" width="100" />
      <el-table-column label="考勤日期" align="center" prop="attendanceDate" width="120" />
      <el-table-column label="签到时间" align="center" prop="clockInTime" width="160">
        <template #default="{ row }">
          {{ row.clockInTime ? formatTime(row.clockInTime, 'yyyy-MM-dd HH:mm:ss') : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="签退时间" align="center" prop="clockOutTime" width="160">
        <template #default="{ row }">
          {{ row.clockOutTime ? formatTime(row.clockOutTime, 'yyyy-MM-dd HH:mm:ss') : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="考勤状态" align="center" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>
<script lang="ts" setup>
import { formatTime } from '@/utils/formatTime'
import * as RecordApi from '@/api/hr/attendance/record'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'HrAttendanceRecord' })

const loading = ref(true)
const total = ref(0)
const list = ref([])
const userList = ref<any[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  status: undefined,
  dateRange: [] as string[]
})
const queryFormRef = ref()

const statusLabel = (v: number) => {
  const map: Record<number, string> = {
    0: '正常',
    1: '迟到',
    2: '早退',
    3: '缺勤',
    4: '请假',
    5: '加班'
  }
  return map[v] ?? '-'
}

const statusTag = (v: number) => {
  const map: Record<number, string> = {
    0: 'success',
    1: 'warning',
    2: 'warning',
    3: 'danger',
    4: 'info',
    5: 'primary'
  }
  return map[v] ?? 'info'
}

const getList = async () => {
  loading.value = true
  try {
    const params: any = { ...queryParams }
    if (queryParams.dateRange?.length === 2) {
      params.beginDate = queryParams.dateRange[0]
      params.endDate = queryParams.dateRange[1]
    }
    delete params.dateRange
    const data = await RecordApi.getAttendanceRecordPage(params)
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

onMounted(async () => {
  try {
    userList.value = await UserApi.getSimpleUserList() ?? []
  } catch {
    userList.value = []
  }
  getList()
})
</script>

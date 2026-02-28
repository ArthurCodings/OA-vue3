<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="规则名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入规则名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-200px">
          <el-option label="启用" :value="0" />
          <el-option label="停用" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['system:attendance-rule:update']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="规则名称" align="center" prop="name" />
      <el-table-column label="班次类型" align="center" prop="shiftType" width="100">
        <template #default="{ row }">
          <el-tag :type="row.shiftType === 1 ? 'success' : 'warning'">
            {{ row.shiftType === 1 ? '早班' : '晚班' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="每周工作天数" align="center" prop="workDaysPerWeek" width="110">
        <template #default="{ row }">
          {{ row.workDaysPerWeek === 5 ? '周一至周五' : '含周六' }}
        </template>
      </el-table-column>
      <el-table-column label="上班时间" align="center" prop="workStartTime" width="100" />
      <el-table-column label="下班时间" align="center" prop="workEndTime" width="100" />
      <el-table-column label="迟到阈值(分钟)" align="center" prop="lateThresholdMinutes" width="120" />
      <el-table-column label="早退阈值(分钟)" align="center" prop="earlyLeaveThresholdMinutes" width="120" />
      <el-table-column label="遵循节假日" align="center" prop="isFollowHoliday" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isFollowHoliday ? 'success' : 'info'">
            {{ row.isFollowHoliday ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'danger'">
            {{ row.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openForm('update', row.id)"
            v-hasPermi="['system:attendance-rule:update']"
          >
            修改
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(row.id)"
            v-hasPermi="['system:attendance-rule:update']"
          >
            删除
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

  <AttendanceRuleForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import * as AttendanceRuleApi from '@/api/hr/attendance/rule'
import AttendanceRuleForm from './AttendanceRuleForm.vue'

defineOptions({ name: 'HrAttendanceRule' })

const message = useMessage()
const loading = ref(true)
const total = ref(0)
const list = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  status: undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await AttendanceRuleApi.getAttendanceRulePage(queryParams)
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

const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await AttendanceRuleApi.deleteAttendanceRule(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

getList()
</script>

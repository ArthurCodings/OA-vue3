<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="姓名" prop="nickname">
        <el-input
          v-model="queryParams.nickname"
          placeholder="请输入姓名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="部门" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          :data="deptTree"
          :props="{ label: 'name', value: 'id' }"
          check-strictly
          node-key="id"
          placeholder="请选择部门"
          clearable
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="雇佣类型" prop="employmentType">
        <el-select v-model="queryParams.employmentType" placeholder="请选择" clearable class="!w-200px">
          <el-option label="全职" :value="1" />
          <el-option label="实习" :value="2" />
          <el-option label="兼职" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="在职状态" prop="employmentStatus">
        <el-select v-model="queryParams.employmentStatus" placeholder="请选择" clearable class="!w-200px">
          <el-option label="在职" :value="1" />
          <el-option label="离职" :value="2" />
          <el-option label="待入职" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['system:hr-employee:update']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['system:hr-employee:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="姓名" align="center" prop="nickname" width="100" />
      <el-table-column label="部门" align="center" prop="deptName" width="120" />
      <el-table-column label="岗位" align="center" prop="postName" width="100" />
      <el-table-column label="手机号" align="center" prop="mobile" width="120" />
      <el-table-column label="雇佣类型" align="center" prop="employmentType" width="90">
        <template #default="{ row }">
          <el-tag size="small">{{ employmentTypeLabel(row.employmentType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="在职状态" align="center" prop="employmentStatus" width="90">
        <template #default="{ row }">
          <el-tag :type="employmentStatusTag(row.employmentStatus)" size="small">
            {{ employmentStatusLabel(row.employmentStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="入职日期" align="center" prop="joinDate" width="110" />
      <el-table-column label="离职日期" align="center" prop="leaveDate" width="110" />
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openForm('update', row.id)"
            v-hasPermi="['system:hr-employee:update']"
          >
            修改
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(row.id)"
            v-hasPermi="['system:hr-employee:update']"
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

  <HrEmployeeForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import { handleTree } from '@/utils/tree'
import download from '@/utils/download'
import * as HrEmployeeApi from '@/api/hr/employee'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import HrEmployeeForm from './HrEmployeeForm.vue'

defineOptions({ name: 'HrEmployee' })

const message = useMessage()
const loading = ref(true)
const exportLoading = ref(false)
const total = ref(0)
const list = ref([])
const deptTree = ref<any[]>([])
const postList = ref<any[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  nickname: undefined,
  deptId: undefined,
  employmentType: undefined,
  employmentStatus: undefined
})
const queryFormRef = ref()

const employmentTypeLabel = (v: number) => {
  const map: Record<number, string> = { 1: '全职', 2: '实习', 3: '兼职' }
  return map[v] ?? '-'
}

const employmentStatusLabel = (v: number) => {
  const map: Record<number, string> = { 1: '在职', 2: '离职', 3: '待入职' }
  return map[v] ?? '-'
}

const employmentStatusTag = (v: number) => {
  const map: Record<number, string> = { 1: 'success', 2: 'danger', 3: 'warning' }
  return map[v] ?? 'info'
}

const getList = async () => {
  loading.value = true
  try {
    const data = await HrEmployeeApi.getHrEmployeePage(queryParams)
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
    await HrEmployeeApi.deleteHrEmployee(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

const handleExport = async () => {
  exportLoading.value = true
  try {
    const data = await HrEmployeeApi.exportHrEmployee(queryParams)
    download.excel(data, '员工花名册.xlsx')
  } finally {
    exportLoading.value = false
  }
}

onMounted(async () => {
  try {
    const depts = await DeptApi.getSimpleDeptList()
    deptTree.value = handleTree(depts)
    postList.value = await PostApi.getSimplePostList() ?? []
  } catch {
    deptTree.value = []
    postList.value = []
  }
  getList()
})
</script>

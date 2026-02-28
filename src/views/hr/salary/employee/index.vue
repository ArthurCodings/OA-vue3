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
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['system:employee-salary:update']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="员工" align="center" prop="nickname" width="100" />
      <el-table-column label="基本工资" align="center" prop="baseSalary" width="100">
        <template #default="{ row }">¥{{ (row.baseSalary ?? 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="岗位工资" align="center" prop="positionSalary" width="100">
        <template #default="{ row }">¥{{ (row.positionSalary ?? 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="补贴" align="center" prop="allowance" width="100">
        <template #default="{ row }">¥{{ (row.allowance ?? 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="生效日期" align="center" prop="effectiveDate" width="120" />
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openForm('update', row.id, row)"
            v-hasPermi="['system:employee-salary:update']"
          >
            修改
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

  <EmployeeSalaryForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import * as EmployeeSalaryApi from '@/api/hr/salary/employee'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'HrEmployeeSalary' })

const message = useMessage()
const loading = ref(true)
const total = ref(0)
const list = ref([])
const userList = ref<any[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await EmployeeSalaryApi.getEmployeeSalaryPage(queryParams)
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
const openForm = (type: string, id?: number, row?: any) => {
  formRef.value?.open(type, id, row)
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

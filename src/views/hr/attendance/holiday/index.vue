<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="年份" prop="year">
        <el-date-picker
          v-model="queryParams.year"
          type="year"
          value-format="YYYY"
          placeholder="选择年份"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择类型" clearable class="!w-200px">
          <el-option label="休息日" :value="1" />
          <el-option label="调班工作日" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入节假日名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['system:holiday:update']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="节假日名称" align="center" prop="name" />
      <el-table-column label="日期" align="center" prop="holidayDate" width="120" />
      <el-table-column label="类型" align="center" prop="type" width="120">
        <template #default="{ row }">
          <el-tag :type="row.type === 1 ? 'success' : 'warning'">
            {{ row.type === 1 ? '休息日' : '调班工作日' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="年份" align="center" prop="year" width="80" />
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openForm('update', row.id)"
            v-hasPermi="['system:holiday:update']"
          >
            修改
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(row.id)"
            v-hasPermi="['system:holiday:update']"
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

  <HolidayForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import * as HolidayApi from '@/api/hr/attendance/holiday'

defineOptions({ name: 'HrHoliday' })

const message = useMessage()
const loading = ref(true)
const total = ref(0)
const list = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  year: undefined,
  type: undefined,
  name: undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await HolidayApi.getHolidayPage(queryParams)
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
    await HolidayApi.deleteHoliday(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

getList()
</script>

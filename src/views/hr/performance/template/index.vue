<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="模板名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入模板名称"
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
          v-hasPermi="['system:performance-template:update']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="模板名称" align="center" prop="name" min-width="140" />
      <el-table-column label="描述" align="center" prop="description" min-width="120" show-overflow-tooltip />
      <el-table-column label="绩效系数" align="center" prop="performanceBaseRatio" width="90">
        <template #default="{ row }">{{ row.performanceBaseRatio ?? 0.45 }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'info'">
            {{ row.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openForm('update', row.id)"
            v-hasPermi="['system:performance-template:update']"
          >
            修改
          </el-button>
          <el-button
            link
            type="primary"
            @click="openSetUsers(row)"
            v-hasPermi="['system:performance-template:update']"
          >
            应用人员
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(row.id)"
            v-hasPermi="['system:performance-template:update']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <PerformanceTemplateForm ref="formRef" @success="getList" />
  <el-dialog v-model="setUsersVisible" title="设置应用人员" width="500px">
    <el-select
      v-model="setUsersForm.userIds"
      multiple
      filterable
      placeholder="请选择应用此模板的员工"
      style="width: 100%"
    >
      <el-option
        v-for="u in userList"
        :key="u.id"
        :label="u.nickname"
        :value="u.id"
      />
    </el-select>
    <template #footer>
      <el-button @click="setUsersVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitSetUsers" :loading="setUsersLoading">确 定</el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import * as PerformanceTemplateApi from '@/api/hr/performance/template'
import * as UserApi from '@/api/system/user'
import PerformanceTemplateForm from './TemplateForm.vue'

defineOptions({ name: 'HrPerformanceTemplate' })

const message = useMessage()
const loading = ref(true)
const list = ref<any[]>([])
const queryParams = reactive({
  name: undefined,
  status: undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await PerformanceTemplateApi.getPerformanceTemplateList()
    list.value = Array.isArray(data) ? data : (data?.list ?? data?.data ?? [])
    if (queryParams.name || queryParams.status !== undefined) {
      list.value = list.value.filter((item: any) => {
        if (queryParams.name && !(item.name ?? '').includes(queryParams.name)) return false
        if (queryParams.status !== undefined && item.status !== queryParams.status) return false
        return true
      })
    }
  } finally {
    loading.value = false
  }
}

const handleQuery = () => getList()

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
    await PerformanceTemplateApi.deletePerformanceTemplate(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

const setUsersVisible = ref(false)
const setUsersLoading = ref(false)
const setUsersForm = ref<{ templateId?: number; userIds: number[] }>({ userIds: [] })
const userList = ref<any[]>([])

const openSetUsers = async (row: any) => {
  setUsersForm.value = {
    templateId: row.id,
    userIds: row.userIds ?? []
  }
  setUsersVisible.value = true
  if (userList.value.length === 0) {
    try {
      userList.value = (await UserApi.getSimpleUserList()) ?? []
    } catch {
      userList.value = []
    }
  }
}

const submitSetUsers = async () => {
  if (!setUsersForm.value.templateId) return
  setUsersLoading.value = true
  try {
    await PerformanceTemplateApi.setTemplateUsers(
      setUsersForm.value.templateId,
      setUsersForm.value.userIds
    )
    message.success('设置成功')
    setUsersVisible.value = false
    await getList()
  } finally {
    setUsersLoading.value = false
  }
}

onMounted(() => getList())
</script>

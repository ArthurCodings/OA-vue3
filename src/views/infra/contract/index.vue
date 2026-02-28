<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="合同名称" prop="contractName">
        <el-input
          v-model="queryParams.contractName"
          placeholder="请输入合同名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="合同类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择" clearable class="!w-200px">
          <el-option label="销售合同" :value="1" />
          <el-option label="采购合同" :value="2" />
          <el-option label="劳动合同" :value="3" />
          <el-option label="其他" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择" clearable class="!w-200px">
          <el-option label="草稿" :value="0" />
          <el-option label="生效" :value="1" />
          <el-option label="已完成" :value="2" />
          <el-option label="已终止" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="负责人" prop="responsibleUserId">
        <el-select
          v-model="queryParams.responsibleUserId"
          placeholder="请选择负责人"
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
          v-hasPermi="['infra:contract:update']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['infra:contract:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="合同编号" align="center" prop="contractNo" width="140">
        <template #default="{ row }">
          <span>{{ row.contractNo }}</span>
          <el-tooltip v-if="isMultiResponsible(row)" :content="`该合同有 ${multiResponsibleBases[getContractNoBase(row.contractNo)]} 人负责`" placement="top">
          <el-tag type="info" size="small" class="ml-1">多人负责</el-tag>
        </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="合同名称" align="center" prop="contractName" min-width="150" />
      <el-table-column label="类型" align="center" prop="type" width="100">
        <template #default="{ row }">
          <el-tag size="small">{{ contractTypeLabel(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="客户/乙方" align="center" prop="customerName" width="120" />
      <el-table-column label="合同金额" align="center" prop="amount" width="100">
        <template #default="{ row }">¥{{ (row.amount ?? 0).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="负责人" align="center" prop="responsibleUsername" width="100" />
      <el-table-column label="签订日期" align="center" prop="signDate" width="110" />
      <el-table-column label="结束日期" align="center" prop="endDate" width="110" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="contractStatusTag(row.status)" size="small">
            {{ contractStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="260" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
          <el-button link type="primary" @click="openForm('update', row.id)">修改</el-button>
          <el-button
            link
            type="success"
            @click="openFormForMulti(row.id)"
            v-hasPermi="['infra:contract:update']"
          >
            多人负责
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(row.id)"
            v-hasPermi="['infra:contract:update']"
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

  <ContractForm ref="formRef" @success="getList" />
  <ContractDetail ref="detailRef" @edit="(id) => openForm('update', id)" />
</template>
<script lang="ts" setup>
import download from '@/utils/download'
import * as ContractApi from '@/api/infra/contract'
import * as UserApi from '@/api/system/user'
import ContractForm from './ContractForm.vue'
import ContractDetail from './ContractDetail.vue'

defineOptions({ name: 'InfraContract' })

const message = useMessage()
const loading = ref(true)
const exportLoading = ref(false)
const total = ref(0)
const list = ref([])
const userList = ref<any[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  contractName: undefined,
  type: undefined,
  status: undefined,
  responsibleUserId: undefined
})
const queryFormRef = ref()

const contractTypeLabel = (v: number) => {
  const map: Record<number, string> = { 1: '销售合同', 2: '采购合同', 3: '劳动合同', 4: '其他' }
  return map[v] ?? '-'
}

const contractStatusLabel = (v: number) => {
  const map: Record<number, string> = { 0: '草稿', 1: '生效', 2: '已完成', 3: '已终止' }
  return map[v] ?? '-'
}

const contractStatusTag = (v: number) => {
  const map: Record<number, string> = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }
  return map[v] ?? 'info'
}

/** 标准化列表项字段（兼容后端 snake_case 与 camelCase） */
const normalizeListItem = (row: any) => {
  return {
    ...row,
    contractNo: row.contractNo ?? row.contract_no ?? '-',
    responsibleUsername: row.responsibleUsername ?? row.responsible_username ?? '-'
  }
}

/** 合同编号基（去掉末两位），用于识别多人负责组 */
const getContractNoBase = (no: string) => {
  const s = String(no || '').trim()
  return s.length >= 2 ? s.slice(0, -2) : ''
}

/** 计算当前列表中每个基对应的合同数量 */
const multiResponsibleBases = computed(() => {
  const count: Record<string, number> = {}
  for (const row of list.value) {
    const base = getContractNoBase(row.contractNo)
    if (base) count[base] = (count[base] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(count).filter(([, n]) => n >= 2))
})

/** 是否为多人负责合同（同一基下有 2 个及以上合同） */
const isMultiResponsible = (row: any) => {
  const base = getContractNoBase(row.contractNo)
  return base ? (multiResponsibleBases.value[base] ?? 0) >= 2 : false
}

const openFormForMulti = (sourceId: number) => {
  formRef.value?.open('create', undefined, sourceId)
}

const getList = async () => {
  loading.value = true
  try {
    const data = await ContractApi.getContractPage(queryParams)
    const rawList = data.list ?? []
    list.value = rawList.map(normalizeListItem)
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
const detailRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}
const openDetail = (id: number) => {
  detailRef.value?.open(id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ContractApi.deleteContract(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

const handleExport = async () => {
  exportLoading.value = true
  try {
    const data = await ContractApi.exportContract(queryParams)
    download.excel(data, '合同列表.xlsx')
  } finally {
    exportLoading.value = false
  }
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

<template>
  <ContentWrap>
    <el-form
      class="hr-search-form"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="年月" prop="yearMonth">
        <el-date-picker
          v-model="queryParams.yearMonth"
          type="month"
          value-format="YYYYMM"
          placeholder="选择年月"
          class="!w-180px"
        />
      </el-form-item>
      <el-form-item label="员工" prop="userId">
        <el-select
          v-model="queryParams.userId"
          placeholder="请选择员工"
          clearable
          filterable
          class="!w-180px"
        >
          <el-option
            v-for="u in userList"
            :key="u.id"
            :label="u.nickname"
            :value="u.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-180px">
          <el-option label="草稿" :value="0" />
          <el-option label="已提交" :value="1" />
          <el-option label="审核通过" :value="2" />
          <el-option label="已驳回" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item class="!mb-0">
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['system:performance-score:update']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增打分
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe class="hr-data-table">
      <el-table-column label="员工" align="center" prop="nickname" width="100" />
      <el-table-column label="年月" align="center" prop="yearMonth" width="90" />
      <el-table-column label="模板" align="center" width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ getTemplateName(row) }}</template>
      </el-table-column>
      <el-table-column label="最终得分" align="center" prop="finalScore" width="90">
        <template #default="{ row }">{{ (row.finalScore ?? 0).toFixed(1) }}</template>
      </el-table-column>
      <el-table-column label="绩效薪酬" align="center" prop="performanceSalary" width="100">
        <template #default="{ row }">¥{{ (row.performanceSalary ?? 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="考核人" align="center" prop="reviewerName" width="90" />
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 0"
            link
            type="primary"
            @click="openForm('update', row.id)"
            v-hasPermi="['system:performance-score:update']"
          >
            编辑
          </el-button>
          <el-button
            v-if="row.status === 0"
            link
            type="success"
            @click="handleSubmit(row.id)"
            v-hasPermi="['system:performance-score:update']"
          >
            提交
          </el-button>
          <el-button
            v-if="row.status === 1"
            link
            type="success"
            @click="handleApprove(row)"
            v-hasPermi="['system:performance-score:review']"
          >
            发布
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

  <PerformanceScoreForm ref="formRef" @success="getList" />
  <el-dialog v-model="detailVisible" title="绩效打分详情" width="700px">
    <el-descriptions v-if="detailRow" :column="2" border>
      <el-descriptions-item label="员工">{{ detailRow.nickname }}</el-descriptions-item>
      <el-descriptions-item label="年月">{{ formatYearMonth(detailRow.yearMonth) }}</el-descriptions-item>
      <el-descriptions-item label="模板">{{ getTemplateName(detailRow) }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{ statusLabel(detailRow.status) }}</el-descriptions-item>
      <el-descriptions-item label="最终得分">{{ (detailRow.finalScore ?? 0).toFixed(1) }}</el-descriptions-item>
      <el-descriptions-item label="绩效薪酬">¥{{ (detailRow.performanceSalary ?? 0).toFixed(2) }}</el-descriptions-item>
      <el-descriptions-item label="考核人">{{ detailRow.reviewerName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="审核意见">{{ detailRow.reviewComment || '-' }}</el-descriptions-item>
    </el-descriptions>
    <el-table v-if="detailRow?.items?.length" :data="detailRow.items" size="small" border class="mt-4">
      <el-table-column label="指标" prop="itemName" min-width="120" />
      <el-table-column label="满分" prop="maxScore" width="70" />
      <el-table-column label="初得分" prop="selfScore" width="80" />
      <el-table-column label="审核分" prop="reviewScore" width="80" />
    </el-table>
  </el-dialog>
  <el-dialog v-model="approveVisible" title="发布" width="400px">
    <el-form :model="approveForm" label-width="80px">
      <el-form-item label="审核意见">
        <el-input v-model="approveForm.reviewComment" type="textarea" placeholder="选填" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="approveVisible = false">取 消</el-button>
      <el-button type="success" @click="submitApprove">确 定</el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import * as PerformanceScoreApi from '@/api/hr/performance/score'
import * as PerformanceTemplateApi from '@/api/hr/performance/template'
import * as UserApi from '@/api/system/user'
import PerformanceScoreForm from './ScoreForm.vue'

defineOptions({ name: 'HrPerformanceScore' })

const message = useMessage()
const loading = ref(true)
const total = ref(0)
const list = ref<any[]>([])
const userList = ref<any[]>([])
/** 模板 ID -> 名称映射，用于列表和详情展示 */
const templateMap = ref<Record<number, string>>({})

const getTemplateName = (row: any) =>
  row.templateName || templateMap.value[row.templateId] || '-'
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  yearMonth: undefined,
  userId: undefined,
  status: undefined
})
const queryFormRef = ref()

const statusLabel = (v: number) => {
  const map: Record<number, string> = { 0: '草稿', 1: '已提交', 2: '审核通过', 3: '已驳回' }
  return map[v] ?? '-'
}

const statusTag = (v: number) => {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[v] ?? 'info'
}

const formatYearMonth = (ym: number) => {
  if (!ym) return ''
  const s = String(ym)
  return s.length >= 6 ? `${s.slice(0, 4)}年${parseInt(s.slice(4, 6), 10)}月` : ''
}

const getList = async () => {
  loading.value = true
  try {
    const params: any = { ...queryParams }
    if (params.yearMonth) params.yearMonth = Number(params.yearMonth)
    const data = await PerformanceScoreApi.getPerformanceScorePage(params)
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

const detailVisible = ref(false)
const detailRow = ref<any>(null)

const openDetail = async (row: any) => {
  detailVisible.value = true
  detailRow.value = null
  try {
    const data = await PerformanceScoreApi.getPerformanceScore(row.id)
    detailRow.value = data
  } catch {
    detailRow.value = row
  }
}

const handleSubmit = async (id: number) => {
  try {
    await PerformanceScoreApi.submitPerformanceScore(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

const approveVisible = ref(false)
const approveForm = ref({ id: 0, reviewComment: '' })

const handleApprove = (row: any) => {
  approveForm.value = { id: row.id, reviewComment: '' }
  approveVisible.value = true
}

const submitApprove = async () => {
  try {
    await PerformanceScoreApi.approvePerformanceScore(approveForm.value.id, approveForm.value.reviewComment)
    message.success('发布成功')
    approveVisible.value = false
    await getList()
  } catch {}
}

onMounted(async () => {
  try {
    const [users, templates] = await Promise.all([
      UserApi.getSimpleUserList(),
      PerformanceTemplateApi.getPerformanceTemplateList()
    ])
    userList.value = users ?? []
    const map: Record<number, string> = {}
    ;(templates ?? []).forEach((t: any) => { map[t.id] = t.name })
    templateMap.value = map
  } catch {
    userList.value = []
  }
  getList()
})
</script>
<style scoped>
.hr-search-form { margin-bottom: 16px; }
.hr-search-form :deep(.el-form-item) { margin-bottom: 12px; margin-right: 16px; }
.hr-data-table { border-radius: 6px; overflow: hidden; }
</style>

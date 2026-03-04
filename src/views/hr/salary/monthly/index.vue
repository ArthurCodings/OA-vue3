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
          <el-option label="待确认" :value="0" />
          <el-option label="已确认" :value="1" />
          <el-option label="已发放" :value="2" />
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
          @click="openGenerateDialog"
          v-hasPermi="['system:salary-monthly:update']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 发起结算
        </el-button>
        <el-button
          type="success"
          plain
          :disabled="checkedIds.length === 0"
          @click="handleBatchConfirm"
          v-hasPermi="['system:salary-monthly:update']"
        >
          批量确认
        </el-button>
        <el-button
          type="warning"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['system:salary-monthly:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe class="hr-data-table" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" :selectable="(row) => row.status !== 2" />
      <el-table-column label="员工" align="center" prop="nickname" width="100" />
      <el-table-column label="年月" align="center" prop="yearMonth" width="90" />
      <el-table-column label="应出勤" align="center" prop="shouldAttendDays" width="80" />
      <el-table-column label="实出勤" align="center" prop="actualAttendDays" width="80" />
      <el-table-column label="迟到" align="center" prop="lateCount" width="60" />
      <el-table-column label="缺勤" align="center" prop="absentCount" width="60" />
      <el-table-column label="应发合计" align="center" prop="totalSalary" width="100">
        <template #default="{ row }">¥{{ (row.totalSalary ?? 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button link type="primary" @click="openCalcDetail(row)">计算明细</el-button>
          <el-button
            v-if="row.status === 0"
            link
            type="primary"
            @click="openEdit(row)"
            v-hasPermi="['system:salary-monthly:update']"
          >
            编辑
          </el-button>
          <el-button
            v-if="row.status === 0"
            link
            type="success"
            @click="handleConfirm(row.id)"
            v-hasPermi="['system:salary-monthly:update']"
          >
            确认
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

  <el-dialog v-model="generateVisible" title="发起月结算" width="400px">
    <el-form :model="generateForm" label-width="90px">
      <el-form-item label="选择年月" required>
        <el-date-picker
          v-model="generateForm.yearMonth"
          type="month"
          value-format="YYYYMM"
          placeholder="请选择要发起结算的年月"
          style="width: 100%"
        />
      </el-form-item>
      <el-alert type="info" :closable="false" show-icon class="mt-2">
        <template #title>说明</template>
        将根据考勤排班和员工薪资档案，为指定月份生成薪资单草稿。若未选择年月，则生成下月薪资单。
      </el-alert>
    </el-form>
    <template #footer>
      <el-button @click="generateVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleGenerate" :loading="generateLoading">确 定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="detailVisible" title="薪资单详情" width="560px">
    <el-skeleton v-if="detailLoading" :rows="6" animated />
    <template v-else-if="detailRow">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="员工">{{ detailRow.nickname }}</el-descriptions-item>
        <el-descriptions-item label="年月">{{ detailRow.yearMonth }}</el-descriptions-item>
        <el-descriptions-item label="基本工资">¥{{ (detailRow.baseSalary ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="岗位工资">¥{{ (detailRow.positionSalary ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="绩效">¥{{ (detailRow.performance ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="提成">¥{{ (detailRow.commission ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="补贴">¥{{ (detailRow.allowance ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="全勤奖">¥{{ (detailRow.fullAttendanceBonus ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="应发合计">¥{{ (detailRow.totalSalary ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(detailRow.status) }}</el-descriptions-item>
      </el-descriptions>
    </template>
  </el-dialog>

  <el-dialog v-model="calcDetailVisible" title="薪资计算明细" width="800px" destroy-on-close>
    <div v-if="calcDetailLoading" class="py-8 text-center text-gray-500">加载中...</div>
    <template v-else-if="calcDetailRow">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="员工">{{ calcDetailRow.nickname }}</el-descriptions-item>
        <el-descriptions-item label="月份">{{ formatYearMonth(calcDetailRow.yearMonth) }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-if="calcDetailItems.length > 0" :data="calcDetailItems" border stripe class="mt-4">
        <el-table-column prop="label" label="项目" width="180" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">
            <span v-if="isAmountField(row.item)">¥{{ formatCalcAmount(row.amount) }}</span>
            <span v-else>{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="280">
          <template #default="{ row }">
            <span :class="{ 'text-gray-500': !row.description }">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无计算明细数据" :image-size="80" />
    </template>
  </el-dialog>

  <el-dialog v-model="editVisible" title="编辑薪资单" width="400px">
    <el-form v-if="editRow" :model="editForm" label-width="80px">
      <el-form-item label="绩效">
        <el-input-number v-model="editForm.performance" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>
      <el-form-item label="提成">
        <el-input-number v-model="editForm.commission" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="editForm.remark" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitEdit">保 存</el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import download from '@/utils/download'
import * as SalaryMonthlyApi from '@/api/hr/salary/monthly'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'HrSalaryMonthly' })

const message = useMessage()
const loading = ref(true)
const generateLoading = ref(false)
const exportLoading = ref(false)
const total = ref(0)
const list = ref([])
const userList = ref<any[]>([])
const checkedIds = ref<number[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  yearMonth: undefined,
  userId: undefined,
  status: undefined
})
const queryFormRef = ref()

const statusLabel = (v: number) => {
  const map: Record<number, string> = { 0: '待确认', 1: '已确认', 2: '已发放' }
  return map[v] ?? '-'
}

const statusTag = (v: number) => {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'info' }
  return map[v] ?? 'info'
}

const formatYearMonth = (ym: number) => {
  if (!ym) return ''
  const s = String(ym)
  return s.length >= 6 ? `${s.slice(0, 4)}年${parseInt(s.slice(4, 6), 10)}月` : ''
}

/** 薪资计算明细项 */
interface SalaryDetailItem {
  item: string
  label: string
  amount: number | string
  description: string
}

/** 解析薪资计算明细 JSON，兼容新格式 { items: [...] } 与旧格式扁平对象 */
const parseSalaryDetail = (jsonStr: string | null | undefined): SalaryDetailItem[] => {
  if (!jsonStr || typeof jsonStr !== 'string') return []
  try {
    const data = JSON.parse(jsonStr)
    // 新格式：{ items: [{ item, label, amount, description }, ...] }
    if (data.items && Array.isArray(data.items)) {
      return data.items
    }
    // 旧格式：{ totalDays: 31, baseSalary: 1200, ... }
    const labelMap: Record<string, string> = {
      totalDays: '当月总天数',
      sundayDays: '周日天数',
      holidayDays: '法定节假日休息天数',
      workingDays: '计薪工作日',
      baseSalary: '基本工资',
      dailySalary: '日薪',
      positionSalary: '岗位工资',
      performance: '绩效',
      commission: '提成',
      allowance: '补贴',
      fullAttendanceBonus: '全勤奖',
      shouldAttendDays: '应出勤天数',
      actualAttendDays: '实际出勤天数',
      lateCount: '迟到次数',
      lateDeduction: '迟到扣款',
      sickLeaveDays: '病假天数',
      sickLeaveDeduction: '病假扣款',
      casualLeaveDays: '事假天数',
      casualLeaveDeduction: '事假扣款',
      absentCount: '缺勤天数',
      absentDeduction: '缺勤扣款',
      attendanceDeduction: '考勤扣款合计',
      totalSalary: '应发合计'
    }
    return Object.entries(data).map(([key, value]) => ({
      item: key,
      label: labelMap[key] || key,
      amount: value as number | string,
      description: ''
    }))
  } catch {
    return []
  }
}

/** 需要显示为金额的字段 */
const amountFields = [
  'baseSalary', 'positionSalary', 'performance', 'commission', 'allowance',
  'fullAttendanceBonus', 'dailySalary', 'lateDeduction', 'sickLeaveDeduction',
  'casualLeaveDeduction', 'absentDeduction', 'attendanceDeduction', 'totalSalary'
]

const isAmountField = (item: string) => amountFields.includes(item)

const formatCalcAmount = (val: unknown) => {
  if (val == null) return '0.00'
  const num = Number(val)
  return isNaN(num) ? String(val) : num.toFixed(2)
}

const getList = async () => {
  loading.value = true
  try {
    const params: any = { ...queryParams }
    if (params.yearMonth) params.yearMonth = Number(params.yearMonth)
    const data = await SalaryMonthlyApi.getSalaryMonthlyPage(params)
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

const generateVisible = ref(false)
const generateForm = ref<{ yearMonth?: string }>({ yearMonth: undefined })

const openGenerateDialog = () => {
  const now = new Date()
  const defaultMonth = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0')
  generateForm.value = { yearMonth: defaultMonth }
  generateVisible.value = true
}

const handleGenerate = async () => {
  const yearMonth = generateForm.value.yearMonth ? Number(generateForm.value.yearMonth) : undefined
  generateLoading.value = true
  try {
    await SalaryMonthlyApi.generateSalaryMonthly(yearMonth)
    message.success('月结算发起成功')
    generateVisible.value = false
    await getList()
  } finally {
    generateLoading.value = false
  }
}

const handleSelectionChange = (rows: any[]) => {
  checkedIds.value = rows.filter((r) => r.status !== 2).map((r) => r.id)
}

const handleBatchConfirm = async () => {
  if (checkedIds.value.length === 0) {
    message.warning('请选择待确认的薪资单')
    return
  }
  try {
    await SalaryMonthlyApi.batchConfirmSalaryMonthly(checkedIds.value)
    message.success('批量确认成功')
    await getList()
  } catch {}
}

const handleConfirm = async (id: number) => {
  try {
    await SalaryMonthlyApi.confirmSalaryMonthly(id)
    message.success('确认成功')
    await getList()
  } catch {}
}

const handleExport = async () => {
  exportLoading.value = true
  try {
    const params: any = { ...queryParams }
    if (params.yearMonth) params.yearMonth = Number(params.yearMonth)
    const data = await SalaryMonthlyApi.exportSalaryMonthly(params)
    download.excel(data, `月度薪资_${params.yearMonth || '全部'}.xlsx`)
  } finally {
    exportLoading.value = false
  }
}

const detailVisible = ref(false)
const detailRow = ref<any>(null)
const detailLoading = ref(false)

const openDetail = async (row: any) => {
  detailVisible.value = true
  detailLoading.value = true
  detailRow.value = null
  try {
    const data = await SalaryMonthlyApi.getSalaryMonthlyDetail(row.id)
    detailRow.value = data ?? row
  } catch {
    detailRow.value = row
  } finally {
    detailLoading.value = false
  }
}

const calcDetailVisible = ref(false)
const calcDetailRow = ref<any>(null)
const calcDetailLoading = ref(false)

const calcDetailItems = computed(() => {
  const row = calcDetailRow.value
  if (!row?.salaryDetail) return []
  return parseSalaryDetail(row.salaryDetail)
})

const openCalcDetail = async (row: any) => {
  calcDetailVisible.value = true
  calcDetailLoading.value = true
  calcDetailRow.value = null
  try {
    const data = await SalaryMonthlyApi.getSalaryMonthlyDetail(row.id)
    calcDetailRow.value = data ?? row
  } catch {
    calcDetailRow.value = row
  } finally {
    calcDetailLoading.value = false
  }
}

const editVisible = ref(false)
const editRow = ref<any>(null)
const editForm = ref({ id: 0, performance: 0, commission: 0, remark: '' })

const openEdit = (row: any) => {
  editRow.value = row
  editForm.value = {
    id: row.id,
    performance: row.performance ?? 0,
    commission: row.commission ?? 0,
    remark: row.remark ?? ''
  }
  editVisible.value = true
}

const submitEdit = async () => {
  try {
    await SalaryMonthlyApi.updateSalaryMonthly(editForm.value)
    message.success('保存成功')
    editVisible.value = false
    await getList()
  } catch {}
}

onMounted(async () => {
  const now = new Date()
  queryParams.yearMonth = Number(now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0'))
  try {
    userList.value = await UserApi.getSimpleUserList() ?? []
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

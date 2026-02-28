<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="120px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="合同编号" prop="contractNo">
            <el-input v-model="formData.contractNo" placeholder="可自动生成或手动输入" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同名称" prop="contractName">
            <el-input v-model="formData.contractName" placeholder="请输入合同名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="合同类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择" style="width: 100%">
              <el-option label="销售合同" :value="1" />
              <el-option label="采购合同" :value="2" />
              <el-option label="劳动合同" :value="3" />
              <el-option label="其他" :value="4" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户/乙方名称" prop="customerName">
            <el-input v-model="formData.customerName" placeholder="请输入" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="合同金额(元)" prop="amount">
            <el-input-number v-model="formData.amount" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="提成比例" prop="commissionRate">
            <el-input-number
              v-model="formData.commissionRate"
              :min="0"
              :max="1"
              :precision="4"
              :step="0.01"
              style="width: 100%"
              placeholder="如 0.05 表示 5%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="签订日期" prop="signDate">
            <el-date-picker
              v-model="formData.signDate"
              type="date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              placeholder="选择签订日期"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开始日期" prop="startDate">
            <el-date-picker
              v-model="formData.startDate"
              type="date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              placeholder="选择开始日期"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="结束日期" prop="endDate">
            <el-date-picker
              v-model="formData.endDate"
              type="date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              placeholder="选择结束日期"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人" prop="responsibleUserId">
            <el-select
              v-model="formData.responsibleUserId"
              placeholder="请选择负责人"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="u in userList"
                :key="u.id"
                :label="u.nickname"
                :value="u.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="提成归属开始日期" prop="commissionStartDate">
            <el-date-picker
              v-model="formData.commissionStartDate"
              type="date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              placeholder="为空时取开始日期"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="提成归属结束日期" prop="commissionEndDate">
            <el-date-picker
              v-model="formData.commissionEndDate"
              type="date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              placeholder="为空时取结束日期"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择" style="width: 100%">
              <el-option label="草稿" :value="0" />
              <el-option label="生效" :value="1" />
              <el-option label="已完成" :value="2" />
              <el-option label="已终止" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="提成归属年月" prop="commissionYearMonth">
            <el-date-picker
              v-model="formData.commissionYearMonth"
              type="month"
              format="YYYY-MM"
              value-format="YYYYMM"
              placeholder="0=按签订日期（兼容）"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="合同附件" prop="fileUrl">
        <UploadFile v-model="formData.fileUrl" :limit="1" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import * as ContractApi from '@/api/infra/contract'
import * as UserApi from '@/api/system/user'
import type { ContractVO } from '@/api/infra/contract'
import { UploadFile } from '@/components/UploadFile'

/** 将后端返回的日期统一转为 YYYY-MM-DD，避免 el-date-picker 格式不匹配导致不显示、无法选择 */
const normalizeDate = (v: any): string => {
  if (v == null || v === '' || v === 0) return ''
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  const d = dayjs(v)
  return d.isValid() ? d.format('YYYY-MM-DD') : ''
}

/** 将提成归属年月转为 YYYYMM 字符串（el-date-picker type=month 需要），空则返回 '' */
const normalizeYearMonth = (v: any): string | number => {
  if (v == null || v === '' || v === 0) return ''
  if (typeof v === 'number' && v > 0) return String(v)
  const s = String(v).replace(/[-/]/g, '')
  if (/^\d{6}$/.test(s)) return s
  const d = dayjs(v)
  return d.isValid() ? d.format('YYYYMM') : ''
}

defineOptions({ name: 'ContractForm' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const userList = ref<any[]>([])
const formData = ref<ContractVO & { commissionYearMonth?: number | string }>({
  contractNo: '',
  contractName: '',
  type: 1,
  customerName: '',
  amount: 0,
  signDate: '',
  startDate: '',
  endDate: '',
  responsibleUserId: 0,
  fileUrl: '',
  commissionRate: 0,
  commissionStartDate: '',
  commissionEndDate: '',
  commissionYearMonth: '',
  status: 0,
  remark: ''
})
const formRules = reactive({
  contractName: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
  responsibleUserId: [{ required: true, message: '请选择负责人', trigger: 'change' }]
})
const formRef = ref()

/** 从合同编号生成「多人负责」新编号：保留除末两位外的部分，末两位随机 00-99 */
const deriveMultiContractNo = (sourceNo: string): string => {
  const s = String(sourceNo || '').trim()
  if (s.length < 2) return s + String(Math.floor(Math.random() * 100)).padStart(2, '0')
  const base = s.slice(0, -2)
  const suffix = String(Math.floor(Math.random() * 100)).padStart(2, '0')
  return base + suffix
}

const open = async (type: string, id?: number, sourceId?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  userList.value = await UserApi.getSimpleUserList() ?? []

  if (type === 'create' && sourceId) {
    // 多人负责：从源合同预填，负责人和提成比例留空，编号末两位随机
    dialogTitle.value = '多人负责 - 新增合同'
    formType.value = 'create'
    formLoading.value = true
    try {
      const data = await ContractApi.getContract(sourceId)
      const d = data as any
      const rawNo = data.contractNo ?? d.contract_no ?? ''
      formData.value = {
        ...data,
        id: undefined,
        contractNo: deriveMultiContractNo(rawNo),
        contractName: data.contractName ?? d.contract_name ?? '',
        type: data.type ?? d.type ?? 1,
        customerName: data.customerName ?? d.customer_name ?? '',
        amount: data.amount ?? d.amount ?? 0,
        signDate: normalizeDate(data.signDate ?? d.sign_date),
        startDate: normalizeDate(data.startDate ?? d.start_date),
        endDate: normalizeDate(data.endDate ?? d.end_date),
        responsibleUserId: 0,
        fileUrl: data.fileUrl ?? d.file_url ?? '',
        commissionRate: 0,
        commissionStartDate: normalizeDate(data.commissionStartDate ?? d.commission_start_date),
        commissionEndDate: normalizeDate(data.commissionEndDate ?? d.commission_end_date),
        commissionYearMonth: normalizeYearMonth(data.commissionYearMonth ?? d.commission_year_month),
        status: data.status ?? d.status ?? 0,
        remark: (data.remark ?? d.remark ?? '') + ((data.remark ?? d.remark) ? '' : ' [多人负责]')
      }
    } finally {
      formLoading.value = false
    }
    return
  }

  dialogTitle.value = type === 'create' ? '新增合同' : '修改合同'
  if (id) {
    formLoading.value = true
    try {
      const data = await ContractApi.getContract(id)
      const d = data as any
      formData.value = {
        ...data,
        contractNo: data.contractNo ?? d.contract_no ?? '',
        responsibleUserId: data.responsibleUserId ?? d.responsible_user_id ?? 0,
        signDate: normalizeDate(data.signDate ?? d.sign_date),
        startDate: normalizeDate(data.startDate ?? d.start_date),
        endDate: normalizeDate(data.endDate ?? d.end_date),
        commissionStartDate: normalizeDate(data.commissionStartDate ?? d.commission_start_date),
        commissionEndDate: normalizeDate(data.commissionEndDate ?? d.commission_end_date),
        commissionYearMonth: normalizeYearMonth(data.commissionYearMonth ?? d.commission_year_month)
      }
    } finally {
      formLoading.value = false
    }
  }
}

const resetForm = () => {
  formData.value = {
    contractNo: '',
    contractName: '',
    type: 1,
    customerName: '',
    amount: 0,
    signDate: '',
    startDate: '',
    endDate: '',
    responsibleUserId: 0,
    fileUrl: '',
    commissionRate: 0,
    commissionStartDate: '',
    commissionEndDate: '',
    commissionYearMonth: '',
    status: 0,
    remark: ''
  }
  formRef.value?.resetFields()
}

const submitForm = async () => {
  await formRef.value?.validate()
  formLoading.value = true
  try {
    const data = { ...formData.value } as any
    if (data.commissionYearMonth === '' || data.commissionYearMonth === undefined || data.commissionYearMonth === null) {
      data.commissionYearMonth = 0
    } else {
      data.commissionYearMonth = Number(data.commissionYearMonth) || 0
    }
    if (formType.value === 'create') {
      await ContractApi.createContract(data)
      message.success(t('common.createSuccess'))
    } else {
      await ContractApi.updateContract(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>

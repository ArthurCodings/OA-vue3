<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="员工" prop="userId">
        <el-select
          v-model="formData.userId"
          placeholder="请选择员工"
          filterable
          style="width: 100%"
          :disabled="formType === 'update'"
        >
          <el-option
            v-for="u in userList"
            :key="u.id"
            :label="u.nickname"
            :value="u.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="基本工资(元)" prop="baseSalary">
        <el-input-number v-model="formData.baseSalary" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>
      <el-form-item label="岗位工资(元)" prop="positionSalary">
        <el-input-number v-model="formData.positionSalary" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>
      <el-form-item label="补贴(元)" prop="allowance">
        <el-input-number v-model="formData.allowance" :min="0" :precision="2" style="width: 100%" />
      </el-form-item>
      <el-form-item label="生效日期" prop="effectiveDate">
        <el-date-picker
          v-model="formData.effectiveDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择生效日期"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="如调薪原因" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as EmployeeSalaryApi from '@/api/hr/salary/employee'
import type { EmployeeSalaryVO } from '@/api/hr/salary/employee'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'EmployeeSalaryForm' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const userList = ref<any[]>([])
const formData = ref<EmployeeSalaryVO>({
  userId: 0,
  baseSalary: 0,
  positionSalary: 0,
  allowance: 0,
  effectiveDate: '',
  remark: ''
})
const formRules = reactive({
  userId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }]
})
const formRef = ref()

const open = async (type: string, id?: number, row?: any) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增员工薪资档案' : '修改员工薪资档案'
  formType.value = type
  resetForm()
  userList.value = await UserApi.getSimpleUserList() ?? []
  if (row) {
    formData.value = {
      id: row.id,
      userId: row.userId,
      baseSalary: row.baseSalary ?? 0,
      positionSalary: row.positionSalary ?? 0,
      allowance: row.allowance ?? 0,
      effectiveDate: row.effectiveDate,
      remark: row.remark
    }
  }
}

const resetForm = () => {
  formData.value = {
    userId: 0,
    baseSalary: 0,
    positionSalary: 0,
    allowance: 0,
    effectiveDate: '',
    remark: ''
  }
  formRef.value?.resetFields()
}

const submitForm = async () => {
  await formRef.value?.validate()
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await EmployeeSalaryApi.createEmployeeSalary(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await EmployeeSalaryApi.updateEmployeeSalary(formData.value)
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

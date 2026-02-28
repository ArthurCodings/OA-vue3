<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="节假日名称" prop="name">
        <el-input v-model="formData.name" placeholder="如：春节、元旦" />
      </el-form-item>
      <el-form-item label="日期" prop="holidayDate">
        <el-date-picker
          v-model="formData.holidayDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio :value="1">休息日</el-radio>
          <el-radio :value="2">调班工作日</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="年份" prop="year">
        <el-date-picker
          v-model="formData.year"
          type="year"
          value-format="YYYY"
          placeholder="选择年份"
          style="width: 100%"
        />
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
import * as HolidayApi from '@/api/hr/attendance/holiday'
import type { HolidayVO } from '@/api/hr/attendance/holiday'

defineOptions({ name: 'HolidayForm' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref<HolidayVO>({
  name: '',
  holidayDate: '',
  type: 1,
  year: new Date().getFullYear(),
  remark: ''
})
const formRules = reactive({
  name: [{ required: true, message: '节假日名称不能为空', trigger: 'blur' }],
  holidayDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  year: [{ required: true, message: '请选择年份', trigger: 'change' }]
})
const formRef = ref()

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增节假日' : '修改节假日'
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const data = await HolidayApi.getHoliday(id)
      formData.value = { ...data }
    } finally {
      formLoading.value = false
    }
  } else {
    formData.value.year = new Date().getFullYear()
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    holidayDate: '',
    type: 1,
    year: new Date().getFullYear(),
    remark: ''
  }
  formRef.value?.resetFields()
}

const submitForm = async () => {
  await formRef.value?.validate()
  formLoading.value = true
  try {
    const data = formData.value as any
    if (data.holidayDate) {
      data.year = data.year || new Date(data.holidayDate).getFullYear()
    }
    if (formType.value === 'create') {
      await HolidayApi.createHoliday(data)
      message.success(t('common.createSuccess'))
    } else {
      await HolidayApi.updateHoliday(data)
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

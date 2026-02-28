<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="140px"
    >
      <el-form-item label="规则名称" prop="name">
        <el-input v-model="formData.name" placeholder="如：早班、晚班" />
      </el-form-item>
      <el-form-item label="班次类型" prop="shiftType">
        <el-select v-model="formData.shiftType" placeholder="请选择">
          <el-option label="早班" :value="1" />
          <el-option label="晚班" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="每周工作天数" prop="workDaysPerWeek">
        <el-select v-model="formData.workDaysPerWeek" placeholder="请选择">
          <el-option label="周一至周五" :value="5" />
          <el-option label="含周六" :value="6" />
        </el-select>
      </el-form-item>
      <el-form-item label="上班时间" prop="workStartTime">
        <el-time-picker
          v-model="formData.workStartTime"
          value-format="HH:mm:ss"
          format="HH:mm:ss"
          placeholder="选择上班时间"
        />
      </el-form-item>
      <el-form-item label="下班时间" prop="workEndTime">
        <el-time-picker
          v-model="formData.workEndTime"
          value-format="HH:mm:ss"
          format="HH:mm:ss"
          placeholder="选择下班时间"
        />
      </el-form-item>
      <el-form-item label="迟到阈值(分钟)" prop="lateThresholdMinutes">
        <el-input-number v-model="formData.lateThresholdMinutes" :min="0" :max="120" />
      </el-form-item>
      <el-form-item label="早退阈值(分钟)" prop="earlyLeaveThresholdMinutes">
        <el-input-number v-model="formData.earlyLeaveThresholdMinutes" :min="0" :max="120" />
      </el-form-item>
      <el-form-item label="遵循法定节假日" prop="isFollowHoliday">
        <el-switch v-model="formData.isFollowHoliday" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">启用</el-radio>
          <el-radio :value="1">停用</el-radio>
        </el-radio-group>
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
import * as AttendanceRuleApi from '@/api/hr/attendance/rule'
import type { AttendanceRuleVO } from '@/api/hr/attendance/rule'

defineOptions({ name: 'AttendanceRuleForm' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref<AttendanceRuleVO>({
  name: '',
  shiftType: 2,
  workDaysPerWeek: 5,
  workStartTime: '09:00:00',
  workEndTime: '18:00:00',
  lateThresholdMinutes: 15,
  earlyLeaveThresholdMinutes: 15,
  isFollowHoliday: true,
  status: 0,
  remark: ''
})
const formRules = reactive({
  name: [{ required: true, message: '规则名称不能为空', trigger: 'blur' }],
  shiftType: [{ required: true, message: '请选择班次类型', trigger: 'change' }],
  workStartTime: [{ required: true, message: '请选择上班时间', trigger: 'change' }],
  workEndTime: [{ required: true, message: '请选择下班时间', trigger: 'change' }]
})
const formRef = ref()

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增排班规则' : '修改排班规则'
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const data = await AttendanceRuleApi.getAttendanceRule(id)
      formData.value = {
        ...data,
        workStartTime: data.workStartTime || '09:00:00',
        workEndTime: data.workEndTime || '18:00:00',
        isFollowHoliday: data.isFollowHoliday !== false
      }
    } finally {
      formLoading.value = false
    }
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    shiftType: 2,
    workDaysPerWeek: 5,
    workStartTime: '09:00:00',
    workEndTime: '18:00:00',
    lateThresholdMinutes: 15,
    earlyLeaveThresholdMinutes: 15,
    isFollowHoliday: true,
    status: 0,
    remark: ''
  }
  formRef.value?.resetFields()
}

const submitForm = async () => {
  await formRef.value?.validate()
  formLoading.value = true
  try {
    const data = formData.value as any
    const submitData = {
      ...data,
      workStartTime: typeof data.workStartTime === 'string' ? data.workStartTime : '09:00:00',
      workEndTime: typeof data.workEndTime === 'string' ? data.workEndTime : '18:00:00'
    }
    if (formType.value === 'create') {
      await AttendanceRuleApi.createAttendanceRule(submitData)
      message.success(t('common.createSuccess'))
    } else {
      await AttendanceRuleApi.updateAttendanceRule(submitData)
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

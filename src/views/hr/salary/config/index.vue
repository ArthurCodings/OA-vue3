<template>
  <ContentWrap>
    <el-card v-loading="loading">
      <template #header>
        <span>薪资项目配置</span>
        <el-button
          v-hasPermi="['system:salary-config:update']"
          type="primary"
          style="float: right"
          @click="handleSave"
          :loading="saveLoading"
        >
          保存配置
        </el-button>
      </template>
      <el-form ref="formRef" :model="formData" label-width="160px">
        <el-divider content-position="left">薪资项目开关</el-divider>
        <el-form-item label="启用基本工资">
          <el-switch v-model="formData.enableBaseSalary" />
        </el-form-item>
        <el-form-item label="启用岗位工资">
          <el-switch v-model="formData.enablePositionSalary" />
        </el-form-item>
        <el-form-item label="启用绩效">
          <el-switch v-model="formData.enablePerformance" />
        </el-form-item>
        <el-form-item label="启用提成">
          <el-switch v-model="formData.enableCommission" />
        </el-form-item>
        <el-form-item label="启用补贴">
          <el-switch v-model="formData.enableAllowance" />
        </el-form-item>
        <el-form-item label="启用全勤奖">
          <el-switch v-model="formData.enableFullAttendance" />
        </el-form-item>
        <el-divider content-position="left">全勤奖金额</el-divider>
        <el-form-item label="全勤奖金额(元)" prop="fullAttendanceAmount">
          <el-input-number v-model="formData.fullAttendanceAmount" :min="0" :precision="2" />
        </el-form-item>
        <el-divider content-position="left">数据来源</el-divider>
        <el-form-item label="提成来源">
          <el-radio-group v-model="formData.commissionSource">
            <el-radio :value="1">合同管理</el-radio>
            <el-radio :value="2">手动录入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="绩效来源">
          <el-radio-group v-model="formData.performanceSource">
            <el-radio :value="1">绩效审核表</el-radio>
            <el-radio :value="2">手动录入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
    </el-card>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as SalaryConfigApi from '@/api/hr/salary/config'
import type { SalaryConfigVO } from '@/api/hr/salary/config'

defineOptions({ name: 'HrSalaryConfig' })

const { t } = useI18n()
const message = useMessage()
const loading = ref(true)
const saveLoading = ref(false)
const formRef = ref()
const formData = ref<SalaryConfigVO>({
  enableBaseSalary: true,
  enablePositionSalary: true,
  enablePerformance: true,
  enableCommission: true,
  enableAllowance: true,
  enableFullAttendance: true,
  fullAttendanceAmount: 200,
  commissionSource: 1,
  performanceSource: 2,
  remark: ''
})

const getConfig = async () => {
  loading.value = true
  try {
    const data = await SalaryConfigApi.getSalaryConfig()
    if (data) {
      formData.value = {
        ...formData.value,
        ...data,
        enableBaseSalary: data.enableBaseSalary !== false,
        enablePositionSalary: data.enablePositionSalary !== false,
        enablePerformance: data.enablePerformance !== false,
        enableCommission: data.enableCommission !== false,
        enableAllowance: data.enableAllowance !== false,
        enableFullAttendance: data.enableFullAttendance !== false,
        fullAttendanceAmount: data.fullAttendanceAmount ?? 200
      }
    }
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    await SalaryConfigApi.saveSalaryConfig(formData.value)
    message.success(t('common.updateSuccess'))
  } finally {
    saveLoading.value = false
  }
}

getConfig()
</script>

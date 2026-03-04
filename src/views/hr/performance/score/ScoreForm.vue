<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-form-item label="被考核员工" prop="userId">
        <el-select
          v-model="formData.userId"
          placeholder="请选择员工"
          filterable
          style="width: 100%"
          :disabled="formType === 'update'"
          @change="onUserChange"
        >
          <el-option
            v-for="u in userList"
            :key="u.id"
            :label="u.nickname"
            :value="u.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="考核年月" prop="yearMonth">
        <el-date-picker
          v-model="formData.yearMonth"
          type="month"
          value-format="YYYYMM"
          placeholder="选择年月"
          style="width: 100%"
          :disabled="formType === 'update'"
          @change="onYearMonthChange"
        />
      </el-form-item>
      <el-form-item label="绩效模板" prop="templateId" v-if="formType === 'create'">
        <el-select
          v-model="formData.templateId"
          placeholder="请选择模板（可选，不选则按员工应用模板）"
          clearable
          filterable
          style="width: 100%"
          @change="onTemplateChange"
        >
          <el-option
            v-for="t in templateList"
            :key="t.id"
            :label="t.name"
            :value="t.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="考勤扣分" prop="attendanceDeductionScore">
        <el-input-number v-model="formData.attendanceDeductionScore" :min="0" :precision="1" />
      </el-form-item>

      <el-divider content-position="left">打分条目</el-divider>
      <el-table :data="formData.items" size="small" border max-height="400">
        <el-table-column label="指标" prop="itemName" min-width="160">
          <template #default="{ row }">{{ row.itemName || '-' }}</template>
        </el-table-column>
        <el-table-column label="满分" prop="maxScore" width="90" align="center">
          <template #default="{ row }">{{ row.maxScore ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="审核分" min-width="140">
          <template #default="{ row }">
            <el-input-number
              v-model="row.reviewScore"
              :min="0"
              :max="row.maxScore ?? 100"
              :precision="1"
              size="small"
              controls-position="right"
              style="width: 120px"
            />
          </template>
        </el-table-column>
        <el-table-column label="佐证" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-input v-model="row.evidenceUrl" placeholder="佐证链接 URL" size="small" style="width: 100%" />
          </template>
        </el-table-column>
      </el-table>
      <el-form-item label="审核意见" prop="reviewComment" class="mt-4">
        <el-input v-model="formData.reviewComment" type="textarea" :rows="3" placeholder="选填" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">保 存</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as PerformanceScoreApi from '@/api/hr/performance/score'
import * as PerformanceTemplateApi from '@/api/hr/performance/template'
import * as UserApi from '@/api/system/user'
import type { PerformanceScoreSaveReqVO, PerformanceScoreItemReqVO } from '@/api/hr/performance/score'
import type { PerformanceTemplateRespVO, PerformanceTemplateSectionVO } from '@/api/hr/performance/template'

defineOptions({ name: 'PerformanceScoreForm' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref<PerformanceScoreSaveReqVO & { templateId?: number }>({
  userId: 0,
  yearMonth: 0,
  attendanceDeductionScore: 0,
  items: [],
  reviewComment: '',
  templateId: undefined
})
const formRules = reactive({
  userId: [{ required: true, message: '请选择被考核员工', trigger: 'change' }],
  yearMonth: [{ required: true, message: '请选择考核年月', trigger: 'change' }]
})
const formRef = ref()

const userList = ref<any[]>([])
const templateList = ref<PerformanceTemplateRespVO[]>([])

/** 从模板构建打分条目 */
const buildItemsFromTemplate = (template: PerformanceTemplateRespVO): any[] => {
  const items: any[] = []
  for (const sec of template.sections ?? []) {
    for (const it of sec.items ?? []) {
      items.push({
        templateItemId: it.id,
        sectionType: sec.sectionType ?? sec.section_type,
        selfScore: 0,
        reviewScore: 0,
        evidenceUrl: '',
        remark: '',
        itemName: it.itemName ?? it.item_name,
        maxScore: it.maxScore ?? it.max_score
      })
    }
  }
  return items
}

/** 查找用户应用的模板 */
const findTemplateForUser = (userId: number): PerformanceTemplateRespVO | null => {
  for (const t of templateList.value) {
    const ids = t.userIds ?? []
    if (ids.includes(userId)) return t
  }
  return templateList.value[0] ?? null
}

const onUserChange = () => {
  if (formType.value === 'create' && formData.value.userId && !formData.value.templateId) {
    const tpl = findTemplateForUser(formData.value.userId)
    if (tpl) {
      formData.value.templateId = tpl.id
      formData.value.items = buildItemsFromTemplate(tpl)
    }
  }
}

const onYearMonthChange = () => {}

const onTemplateChange = () => {
  if (!formData.value.templateId) {
    formData.value.items = []
    return
  }
  const tpl = templateList.value.find((t) => t.id === formData.value.templateId)
  if (tpl) {
    formData.value.items = buildItemsFromTemplate(tpl)
  }
}

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增绩效打分' : '编辑绩效打分'
  formType.value = type
  formData.value = {
    userId: 0,
    yearMonth: 0,
    attendanceDeductionScore: 0,
    items: [],
    reviewComment: '',
    templateId: undefined
  }
  userList.value = (await UserApi.getSimpleUserList()) ?? []
  templateList.value = (await PerformanceTemplateApi.getPerformanceTemplateList()) ?? []
  if (type === 'create') {
    const now = new Date()
    formData.value.yearMonth = now.getFullYear() * 100 + now.getMonth() + 1
  }
  if (id) {
    formLoading.value = true
    try {
      const data = await PerformanceScoreApi.getPerformanceScore(id)
      const d = data as any
      formData.value = {
        id: d.id,
        userId: d.userId ?? d.user_id,
        yearMonth: d.yearMonth ?? d.year_month,
        attendanceDeductionScore: d.attendanceDeductionScore ?? d.attendance_deduction_score ?? 0,
        reviewComment: d.reviewComment ?? d.review_comment ?? '',
        items: (d.items ?? []).map((it: any) => ({
          templateItemId: it.templateItemId ?? it.template_item_id,
          sectionType: it.sectionType ?? it.section_type,
          selfScore: 0,
          reviewScore: it.reviewScore ?? it.review_score ?? 0,
          evidenceUrl: it.evidenceUrl ?? it.evidence_url ?? '',
          remark: it.remark ?? '',
          itemName: it.itemName ?? it.item_name,
          maxScore: it.maxScore ?? it.max_score
        }))
      }
    } finally {
      formLoading.value = false
    }
  } else {
    const tpl = templateList.value[0]
    if (tpl) formData.value.items = buildItemsFromTemplate(tpl)
  }
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (!formData.value.items?.length) {
    message.warning('请先选择模板以加载打分条目')
    return
  }
  formLoading.value = true
  try {
    const payload: PerformanceScoreSaveReqVO = {
      id: formData.value.id,
      userId: formData.value.userId,
      yearMonth: Number(formData.value.yearMonth),
      attendanceDeductionScore: formData.value.attendanceDeductionScore ?? 0,
      items: formData.value.items.map((it) => ({
        templateItemId: it.templateItemId,
        sectionType: it.sectionType,
        selfScore: it.selfScore ?? 0,
        reviewScore: it.reviewScore ?? 0,
        evidenceUrl: it.evidenceUrl ?? '',
        remark: it.remark ?? ''
      })),
      reviewComment: formData.value.reviewComment ?? ''
    }
    await PerformanceScoreApi.savePerformanceScore(payload)
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>

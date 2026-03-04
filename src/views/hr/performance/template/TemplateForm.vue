<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="960px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="140px"
    >
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="formData.name" placeholder="如：销售岗位绩效模板" />
      </el-form-item>
      <el-form-item label="模板描述" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item label="绩效薪酬基准系数" prop="performanceBaseRatio">
        <el-input-number v-model="formData.performanceBaseRatio" :min="0" :max="1" :step="0.05" :precision="2" />
        <span class="ml-2 text-gray-500 text-12px">绩效薪酬=基本薪资×此系数×绩效系数，默认0.45</span>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">启用</el-radio>
          <el-radio :value="1">停用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-divider content-position="left">评分区块</el-divider>
      <div class="mb-4">
        <el-button type="primary" plain size="small" @click="addSection">
          <Icon icon="ep:plus" class="mr-1" /> 新增区块
        </el-button>
      </div>
      <el-collapse v-model="activeSections">
        <el-collapse-item
          v-for="(sec, sIdx) in formData.sections"
          :key="sIdx"
          :name="sIdx"
        >
          <template #title>
            <span class="font-medium">
              {{ sec.sectionName || '未命名区块' }}
              <el-tag size="small" class="ml-2">{{ sectionTypeLabel(sec.sectionType) }}</el-tag>
            </span>
          </template>
          <div class="pl-4">
            <el-form-item label="区块名称" :prop="`sections.${sIdx}.sectionName`" :rules="[{ required: true, message: '请输入区块名称', trigger: 'blur' }]">
              <el-input v-model="sec.sectionName" placeholder="如：一、基础指标（100分）" />
            </el-form-item>
            <el-form-item label="区块类型" :prop="`sections.${sIdx}.sectionType`">
              <el-select v-model="sec.sectionType" placeholder="请选择">
                <el-option label="基础指标" :value="1" />
                <el-option label="加分项" :value="2" />
                <el-option label="扣分项" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="区块最高分" :prop="`sections.${sIdx}.maxScore`">
              <el-input-number v-model="sec.maxScore" :min="0" :precision="1" style="width: 140px" controls-position="right" />
            </el-form-item>
            <el-form-item label="条目">
              <el-button type="primary" link size="small" @click="addItem(sIdx)">
                <Icon icon="ep:plus" /> 新增条目
              </el-button>
              <el-table :data="sec.items" size="small" border class="mt-2 template-items-table">
                <el-table-column label="指标名称" min-width="180">
                  <template #default="{ row }">
                    <el-input v-model="row.itemName" placeholder="评价指标" size="small" style="width: 100%" />
                  </template>
                </el-table-column>
                <el-table-column label="满分" width="140">
                  <template #default="{ row }">
                    <el-input-number v-model="row.maxScore" :min="0" :precision="1" size="small" style="width: 110px" controls-position="right" />
                  </template>
                </el-table-column>
                <el-table-column label="固定分" width="90" align="center">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.isFixedScore" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template #default="{ $index }">
                    <el-button link type="danger" size="small" @click="removeItem(sIdx, $index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-form-item>
            <el-button type="danger" link size="small" @click="removeSection(sIdx)">删除此区块</el-button>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as PerformanceTemplateApi from '@/api/hr/performance/template'
import type {
  PerformanceTemplateSaveReqVO,
  PerformanceTemplateSectionVO,
  PerformanceTemplateItemVO
} from '@/api/hr/performance/template'

defineOptions({ name: 'PerformanceTemplateForm' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const activeSections = ref<number[]>([])
const formData = ref<PerformanceTemplateSaveReqVO>({
  name: '',
  description: '',
  performanceBaseRatio: 0.45,
  status: 0,
  sections: []
})
const formRules = reactive({
  name: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }]
})
const formRef = ref()

const sectionTypeLabel = (v: number) => {
  const map: Record<number, string> = { 1: '基础指标', 2: '加分项', 3: '扣分项' }
  return map[v] ?? '-'
}

const addSection = () => {
  formData.value.sections.push({
    sectionName: '',
    sectionType: 1,
    maxScore: 100,
    sort: formData.value.sections.length,
    items: []
  })
  activeSections.value = [formData.value.sections.length - 1]
}

const removeSection = (idx: number) => {
  formData.value.sections.splice(idx, 1)
  activeSections.value = activeSections.value.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i))
}

const addItem = (sectionIdx: number) => {
  const sec = formData.value.sections[sectionIdx]
  if (!sec.items) sec.items = []
  sec.items.push({
    itemName: '',
    maxScore: 0,
    sectionType: sec.sectionType,
    isFixedScore: false,
    sort: sec.items.length
  })
}

const removeItem = (sectionIdx: number, itemIdx: number) => {
  formData.value.sections[sectionIdx].items?.splice(itemIdx, 1)
}

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增绩效模板' : '修改绩效模板'
  formType.value = type
  formData.value = {
    name: '',
    description: '',
    performanceBaseRatio: 0.45,
    status: 0,
    sections: []
  }
  activeSections.value = []
  if (id) {
    formLoading.value = true
    try {
      const data = await PerformanceTemplateApi.getPerformanceTemplate(id)
      const d = data as any
      formData.value = {
        id: d.id,
        name: d.name ?? '',
        description: d.description ?? '',
        performanceBaseRatio: d.performanceBaseRatio ?? 0.45,
        coefficientRules: d.coefficientRules,
        status: d.status ?? 0,
        sections: (d.sections ?? []).map((s: any) => ({
          id: s.id,
          sectionName: s.sectionName ?? s.section_name ?? '',
          sectionType: s.sectionType ?? s.section_type ?? 1,
          maxScore: s.maxScore ?? s.max_score ?? 100,
          sort: s.sort ?? 0,
          items: (s.items ?? []).map((it: any) => ({
            id: it.id,
            itemName: it.itemName ?? it.item_name ?? '',
            maxScore: it.maxScore ?? it.max_score ?? 0,
            scoringCriteria: it.scoringCriteria ?? it.scoring_criteria,
            evidenceDesc: it.evidenceDesc ?? it.evidence_desc,
            notes: it.notes,
            isFixedScore: it.isFixedScore ?? it.is_fixed_score ?? false,
            fixedScoreCondition: it.fixedScoreCondition ?? it.fixed_score_condition,
            sort: it.sort ?? 0
          }))
        }))
      }
      activeSections.value = formData.value.sections.map((_, i) => i)
    } finally {
      formLoading.value = false
    }
  }
}

const submitForm = async () => {
  await formRef.value?.validate()
  const sections = formData.value.sections
  if (!sections.length) {
    message.warning('请至少添加一个评分区块')
    return
  }
  for (const s of sections) {
    if (!s.sectionName?.trim()) {
      message.warning('请填写区块名称')
      return
    }
    if (!s.items?.length) {
      message.warning(`区块「${s.sectionName}」至少需要一条评价条目`)
      return
    }
    for (const it of s.items) {
      if (!it.itemName?.trim()) {
        message.warning(`区块「${s.sectionName}」中存在未填写的指标名称`)
        return
      }
    }
  }
  formLoading.value = true
  try {
    const data = { ...formData.value }
    data.sections = data.sections.map((s, i) => ({
      ...s,
      sort: i,
      items: (s.items ?? []).map((it, j) => ({
        ...it,
        sectionType: s.sectionType,
        sort: j
      }))
    }))
    if (formType.value === 'create') {
      await PerformanceTemplateApi.createPerformanceTemplate(data)
      message.success(t('common.createSuccess'))
    } else {
      await PerformanceTemplateApi.updatePerformanceTemplate(data)
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
<style scoped>
.template-items-table :deep(.el-input-number) { min-width: 100px; }
</style>

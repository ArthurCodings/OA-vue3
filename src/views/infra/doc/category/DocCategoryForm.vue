<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="450px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
      <el-form-item label="分类名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="父分类" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="categoryTree"
          :props="{ label: 'name', value: 'id' }"
          check-strictly
          node-key="id"
          placeholder="不选则为根分类"
          clearable
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">启用</el-radio>
          <el-radio :value="1">停用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { handleTree } from '@/utils/tree'
import * as DocApi from '@/api/infra/doc'
import type { DocCategoryVO } from '@/api/infra/doc'

defineOptions({ name: 'DocCategoryForm' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formType = ref('')
const categoryTree = ref<any[]>([])
const formData = ref<DocCategoryVO>({
  name: '',
  parentId: 0,
  sort: 0,
  status: 0
})
const formRules = reactive({
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
})
const formRef = ref()

const flattenTree = (arr: any[]): any[] => {
  const result: any[] = []
  const fn = (list: any[]) => {
    (list || []).forEach((x) => {
      const { children, ...rest } = x
      result.push(rest)
      if (children?.length) fn(children)
    })
  }
  fn(arr)
  return result
}

const open = async (type: string, id?: number, parentId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增分类' : '修改分类'
  formType.value = type
  const data = await DocApi.getDocCategoryTree()
  const list = Array.isArray(data) ? data : []
  const tree = list.some((x: any) => x.children) ? list : handleTree(list, 'id', 'parentId')
  categoryTree.value = [{ id: 0, name: '根分类', children: tree }]
  resetForm()
  if (id) {
    const flat = flattenTree(tree)
    const item = flat.find((x: any) => x.id === id)
    if (item) {
      formData.value = { ...item, parentId: item.parentId ?? 0 }
    }
  } else if (parentId !== undefined) {
    formData.value.parentId = parentId
  }
}

const resetForm = () => {
  formData.value = { name: '', parentId: 0, sort: 0, status: 0 }
  formRef.value?.resetFields()
}

const submitForm = async () => {
  await formRef.value?.validate()
  const data = formData.value as any
  if (data.parentId === 0 || data.parentId === undefined) data.parentId = 0
  if (formType.value === 'create') {
    await DocApi.createDocCategory(data)
    message.success(t('common.createSuccess'))
  } else {
    await DocApi.updateDocCategory(data)
    message.success(t('common.updateSuccess'))
  }
  dialogVisible.value = false
  emit('success')
}

defineExpose({ open })
</script>

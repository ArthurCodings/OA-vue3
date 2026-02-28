<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="所属分类" prop="categoryId">
        <el-tree-select
          v-model="formData.categoryId"
          :data="categoryTree"
          :props="{ label: 'name', value: 'id' }"
          check-strictly
          node-key="id"
          placeholder="请选择分类"
          clearable
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="文档名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入文档名称" />
      </el-form-item>
      <el-form-item label="文档类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio :value="1">上传文件预览</el-radio>
          <el-radio :value="2">外部链接</el-radio>
          <el-radio :value="3">下载附件</el-radio>
        </el-radio-group>
      </el-form-item>
      <template v-if="formData.type === 1 || formData.type === 3">
        <el-form-item label="上传文件" prop="fileUrl">
          <UploadFile
            v-model="formData.fileUrl"
            :limit="1"
            :file-type="['doc', 'docx', 'xls', 'xlsx', 'pdf', 'ppt', 'pptx', 'txt']"
            :file-size="20"
          />
        </el-form-item>
        <el-form-item label="文件类型" prop="fileType">
          <el-input v-model="formData.fileType" placeholder="如 docx/xlsx/pdf" />
        </el-form-item>
      </template>
      <el-form-item v-if="formData.type === 2" label="外部链接" prop="externalUrl">
        <el-input v-model="formData.externalUrl" placeholder="请输入外部链接URL" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">公开</el-radio>
          <el-radio :value="1">仅内部</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="简介说明" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入简介" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { handleTree } from '@/utils/tree'
import * as DocApi from '@/api/infra/doc'
import type { DocVO } from '@/api/infra/doc'
import { UploadFile } from '@/components/UploadFile'

defineOptions({ name: 'DocForm' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const categoryTree = ref<any[]>([])
const formData = ref<DocVO>({
  categoryId: 0,
  name: '',
  type: 1,
  fileUrl: '',
  fileType: '',
  externalUrl: '',
  sort: 0,
  status: 0,
  remark: ''
})
const formRules = reactive({
  name: [{ required: true, message: '请输入文档名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择文档类型', trigger: 'change' }]
})
const formRef = ref()

const open = async (type: string, id?: number, defaultCategoryId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增文档' : '修改文档'
  formType.value = type
  resetForm()
  const data = await DocApi.getDocCategoryTree()
  const list = Array.isArray(data) ? data : []
  categoryTree.value = list.some((x: any) => x.children) ? list : handleTree(list, 'id', 'parentId')
  if (defaultCategoryId) formData.value.categoryId = defaultCategoryId
  if (id) {
    formLoading.value = true
    try {
      const doc = await DocApi.getDoc(id)
      formData.value = {
        ...doc,
        categoryId: doc.categoryId ?? 0,
        fileUrl: doc.fileUrl ?? '',
        fileType: doc.fileType ?? '',
        externalUrl: doc.externalUrl ?? ''
      }
    } finally {
      formLoading.value = false
    }
  }
}

const resetForm = () => {
  formData.value = {
    categoryId: 0,
    name: '',
    type: 1,
    fileUrl: '',
    fileType: '',
    externalUrl: '',
    sort: 0,
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
    if (formData.value.type === 2) {
      data.fileUrl = ''
      data.fileType = ''
    } else {
      data.externalUrl = ''
    }
    if (formType.value === 'create') {
      await DocApi.createDoc(data)
      message.success(t('common.createSuccess'))
    } else {
      await DocApi.updateDoc(data)
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

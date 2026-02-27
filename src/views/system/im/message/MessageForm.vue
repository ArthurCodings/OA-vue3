<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="所属会话ID" prop="conversationId">
        <el-input v-model="formData.conversationId" placeholder="请输入所属会话ID" />
      </el-form-item>
      <el-form-item label="发送人用户ID" prop="senderId">
        <el-input v-model="formData.senderId" placeholder="请输入发送人用户ID" />
      </el-form-item>
      <el-form-item label="消息类型：1=文本 2=图片 3=文件 4=系统消息" prop="contentType">
        <el-select v-model="formData.contentType" placeholder="请选择消息类型：1=文本 2=图片 3=文件 4=系统消息">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="消息内容（文本存原文；图片/文件存 URL；系统消息存描述）" prop="content">
        <Editor v-model="formData.content" height="150px" />
      </el-form-item>
      <el-form-item label="文件原始名称（type=3时有效）" prop="fileName">
        <el-input v-model="formData.fileName" placeholder="请输入文件原始名称（type=3时有效）" />
      </el-form-item>
      <el-form-item label="文件大小字节（type=3时有效）" prop="fileSize">
        <el-input v-model="formData.fileSize" placeholder="请输入文件大小字节（type=3时有效）" />
      </el-form-item>
      <el-form-item label="消息状态：0=正常 1=已撤回" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { MessageApi, Message } from '@/api/system/im/message'

/** IM 消息 表单 */
defineOptions({ name: 'MessageForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  conversationId: undefined,
  senderId: undefined,
  contentType: undefined,
  content: undefined,
  fileName: undefined,
  fileSize: undefined,
  status: undefined,
})
const formRules = reactive({
  conversationId: [{ required: true, message: '所属会话ID不能为空', trigger: 'blur' }],
  senderId: [{ required: true, message: '发送人用户ID不能为空', trigger: 'blur' }],
  contentType: [{ required: true, message: '消息类型：1=文本 2=图片 3=文件 4=系统消息不能为空', trigger: 'change' }],
  content: [{ required: true, message: '消息内容（文本存原文；图片/文件存 URL；系统消息存描述）不能为空', trigger: 'blur' }],
  fileName: [{ required: true, message: '文件原始名称（type=3时有效）不能为空', trigger: 'blur' }],
  fileSize: [{ required: true, message: '文件大小字节（type=3时有效）不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '消息状态：0=正常 1=已撤回不能为空', trigger: 'blur' }],
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MessageApi.getMessage(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as Message
    if (formType.value === 'create') {
      await MessageApi.createMessage(data)
      message.success(t('common.createSuccess'))
    } else {
      await MessageApi.updateMessage(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    conversationId: undefined,
    senderId: undefined,
    contentType: undefined,
    content: undefined,
    fileName: undefined,
    fileSize: undefined,
    status: undefined,
  }
  formRef.value?.resetFields()
}
</script>
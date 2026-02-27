<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="类型：1=单聊 2=群聊" prop="type">
        <el-select v-model="formData.type" placeholder="请选择类型：1=单聊 2=群聊">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="会话名称（单聊为空，群聊必填）" prop="name">
        <el-input v-model="formData.name" placeholder="请输入会话名称（单聊为空，群聊必填）" />
      </el-form-item>
      <el-form-item label="会话头像（单聊为空，群聊可设）" prop="avatar">
        <el-input v-model="formData.avatar" placeholder="请输入会话头像（单聊为空，群聊可设）" />
      </el-form-item>
      <el-form-item label="群主ID（单聊为0）" prop="ownerId">
        <el-input v-model="formData.ownerId" placeholder="请输入群主ID（单聊为0）" />
      </el-form-item>
      <el-form-item label="群公告（单聊为空）" prop="notice">
        <el-input v-model="formData.notice" placeholder="请输入群公告（单聊为空）" />
      </el-form-item>
      <el-form-item label="最后一条消息ID（冗余，用于排序）" prop="lastMessageId">
        <el-input v-model="formData.lastMessageId" placeholder="请输入最后一条消息ID（冗余，用于排序）" />
      </el-form-item>
      <el-form-item label="最后一条消息摘要（冗余，用于会话列表展示）" prop="lastMessageContent">
        <Editor v-model="formData.lastMessageContent" height="150px" />
      </el-form-item>
      <el-form-item label="最后一条消息时间（冗余，用于排序）" prop="lastMessageTime">
        <el-date-picker
          v-model="formData.lastMessageTime"
          type="date"
          value-format="x"
          placeholder="选择最后一条消息时间（冗余，用于排序）"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ConversationApi, Conversation } from '@/api/system/im/conversation'

/** IM 会话 表单 */
defineOptions({ name: 'ConversationForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  type: undefined,
  name: undefined,
  avatar: undefined,
  ownerId: undefined,
  notice: undefined,
  lastMessageId: undefined,
  lastMessageContent: undefined,
  lastMessageTime: undefined,
})
const formRules = reactive({
  type: [{ required: true, message: '类型：1=单聊 2=群聊不能为空', trigger: 'change' }],
  name: [{ required: true, message: '会话名称（单聊为空，群聊必填）不能为空', trigger: 'blur' }],
  avatar: [{ required: true, message: '会话头像（单聊为空，群聊可设）不能为空', trigger: 'blur' }],
  ownerId: [{ required: true, message: '群主ID（单聊为0）不能为空', trigger: 'blur' }],
  notice: [{ required: true, message: '群公告（单聊为空）不能为空', trigger: 'blur' }],
  lastMessageId: [{ required: true, message: '最后一条消息ID（冗余，用于排序）不能为空', trigger: 'blur' }],
  lastMessageContent: [{ required: true, message: '最后一条消息摘要（冗余，用于会话列表展示）不能为空', trigger: 'blur' }],
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
      formData.value = await ConversationApi.getConversation(id)
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
    const data = formData.value as unknown as Conversation
    if (formType.value === 'create') {
      await ConversationApi.createConversation(data)
      message.success(t('common.createSuccess'))
    } else {
      await ConversationApi.updateConversation(data)
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
    type: undefined,
    name: undefined,
    avatar: undefined,
    ownerId: undefined,
    notice: undefined,
    lastMessageId: undefined,
    lastMessageContent: undefined,
    lastMessageTime: undefined,
  }
  formRef.value?.resetFields()
}
</script>
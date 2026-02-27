<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="会话ID" prop="conversationId">
        <el-input v-model="formData.conversationId" placeholder="请输入会话ID" />
      </el-form-item>
      <el-form-item label="成员用户ID" prop="userId">
        <el-input v-model="formData.userId" placeholder="请输入成员用户ID" />
      </el-form-item>
      <el-form-item label="角色：0=普通成员 1=群主 2=群管理员" prop="memberRole">
        <el-input v-model="formData.memberRole" placeholder="请输入角色：0=普通成员 1=群主 2=群管理员" />
      </el-form-item>
      <el-form-item label="该成员最后阅读的消息ID（用于计算未读数）" prop="lastReadMessageId">
        <el-input v-model="formData.lastReadMessageId" placeholder="请输入该成员最后阅读的消息ID（用于计算未读数）" />
      </el-form-item>
      <el-form-item label="是否被禁言" prop="isMuted">
        <el-radio-group v-model="formData.isMuted">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="是否置顶" prop="isPinned">
        <el-radio-group v-model="formData.isPinned">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="是否免打扰" prop="isDisturb">
        <el-radio-group v-model="formData.isDisturb">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="加入时间" prop="joinTime">
        <el-date-picker
          v-model="formData.joinTime"
          type="date"
          value-format="x"
          placeholder="选择加入时间"
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
import { ConversationMemberApi, ConversationMember } from '@/api/system/im/conversationmember'

/** IM 会话成员 表单 */
defineOptions({ name: 'ConversationMemberForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  conversationId: undefined,
  userId: undefined,
  memberRole: undefined,
  lastReadMessageId: undefined,
  isMuted: undefined,
  isPinned: undefined,
  isDisturb: undefined,
  joinTime: undefined,
})
const formRules = reactive({
  conversationId: [{ required: true, message: '会话ID不能为空', trigger: 'blur' }],
  userId: [{ required: true, message: '成员用户ID不能为空', trigger: 'blur' }],
  memberRole: [{ required: true, message: '角色：0=普通成员 1=群主 2=群管理员不能为空', trigger: 'blur' }],
  lastReadMessageId: [{ required: true, message: '该成员最后阅读的消息ID（用于计算未读数）不能为空', trigger: 'blur' }],
  isMuted: [{ required: true, message: '是否被禁言不能为空', trigger: 'blur' }],
  isPinned: [{ required: true, message: '是否置顶不能为空', trigger: 'blur' }],
  isDisturb: [{ required: true, message: '是否免打扰不能为空', trigger: 'blur' }],
  joinTime: [{ required: true, message: '加入时间不能为空', trigger: 'blur' }],
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
      formData.value = await ConversationMemberApi.getConversationMember(id)
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
    const data = formData.value as unknown as ConversationMember
    if (formType.value === 'create') {
      await ConversationMemberApi.createConversationMember(data)
      message.success(t('common.createSuccess'))
    } else {
      await ConversationMemberApi.updateConversationMember(data)
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
    userId: undefined,
    memberRole: undefined,
    lastReadMessageId: undefined,
    isMuted: undefined,
    isPinned: undefined,
    isDisturb: undefined,
    joinTime: undefined,
  }
  formRef.value?.resetFields()
}
</script>
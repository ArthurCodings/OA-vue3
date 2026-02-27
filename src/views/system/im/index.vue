<template>
  <div class="im-container">
    <!-- 左侧：会话列表 -->
    <div class="im-sidebar">
      <!-- 顶部搜索 + 新建按钮 -->
      <div class="sidebar-header">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索会话"
          prefix-icon="ep:search"
          clearable
          class="sidebar-search"
        />
        <el-dropdown trigger="click" @command="handleNewConversation">
          <el-button type="primary" :icon="Plus" circle size="small" class="new-btn" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="single">
                <Icon icon="ep:user" class="mr-6px" />发起单聊
              </el-dropdown-item>
              <el-dropdown-item command="group" v-hasPermi="['system:im:create-group']">
                <Icon icon="ep:user-filled" class="mr-6px" />发起群聊
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 会话列表 -->
      <div class="conversation-list" v-loading="conversationLoading">
        <div
          v-for="conv in filteredConversations"
          :key="conv.id"
          class="conversation-item"
          :class="{ active: activeConversationId === conv.id, pinned: conv.isPinned }"
          @click="selectConversation(conv)"
        >
          <div class="conv-avatar">
            <el-avatar :size="44" :src="getConvAvatar(conv)" shape="square">
              {{ getConvName(conv).charAt(0) }}
            </el-avatar>
            <span v-if="conv.unreadCount > 0" class="unread-badge">
              {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
            </span>
          </div>
          <div class="conv-info">
            <div class="conv-title-row">
              <span class="conv-name">{{ getConvName(conv) }}</span>
              <span class="conv-time">{{ formatMsgTime(conv.lastMessageTime) }}</span>
            </div>
            <div class="conv-last-msg">
              <Icon v-if="conv.isPinned" icon="ep:top" class="pin-icon" />
              <span>{{ conv.lastMessageContent || '暂无消息' }}</span>
            </div>
          </div>
        </div>

        <el-empty v-if="!conversationLoading && filteredConversations.length === 0" description="暂无会话" :image-size="60" />
      </div>
    </div>

    <!-- 右侧：消息区域 -->
    <div class="im-main" v-if="activeConversation">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <div class="chat-title">
          <span class="chat-name">{{ getConvName(activeConversation) }}</span>
          <span v-if="activeConversation.type === 2" class="member-count">
            {{ memberList.length }}人
          </span>
        </div>
        <div class="chat-actions">
          <!-- 群聊专属操作 -->
          <template v-if="activeConversation.type === 2">
            <el-tooltip content="群成员">
              <el-button
                :icon="UserFilled"
                circle
                text
                :type="showMemberPanel ? 'primary' : ''"
                @click="showMemberPanel = !showMemberPanel"
              />
            </el-tooltip>
            <!-- 更多操作下拉 -->
            <el-dropdown trigger="click" @command="handleGroupAction">
              <el-button :icon="MoreFilled" circle text />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rename">
                    <Icon icon="ep:edit" class="mr-6px" />修改群名称
                  </el-dropdown-item>
                  <el-dropdown-item command="notice" v-if="activeConversation.notice">
                    <Icon icon="ep:bell" class="mr-6px" />群公告
                  </el-dropdown-item>
                  <el-dropdown-item command="invite" divided v-hasPermi="['system:im:manage-member']">
                    <Icon icon="ep:user-filled" class="mr-6px" />邀请成员
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="dismiss"
                    divided
                    v-if="activeConversation.ownerId === currentUserId"
                    class="danger-item"
                  >
                    <Icon icon="ep:delete" class="mr-6px" />解散群聊
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </div>

      <!-- 消息列表 + 成员面板 -->
      <div class="chat-body">
        <div class="message-panel">
          <!-- 加载更多 -->
          <div class="load-more-area" v-if="hasMoreMessages">
            <el-button text size="small" :loading="msgLoading" @click="loadMoreMessages">
              加载更多消息
            </el-button>
          </div>

          <!-- 消息气泡列表 -->
          <div class="message-list" ref="messageListRef">
            <template v-for="msg in messageList" :key="msg.id">
              <!-- 系统消息 -->
              <div v-if="msg.contentType === 4" class="system-msg">
                <span>{{ msg.content }}</span>
              </div>

              <!-- 普通消息 -->
              <div v-else class="message-item" :class="{ self: msg.senderId === currentUserId }">
                <!-- 对方头像（左侧） -->
                <el-avatar
                  v-if="msg.senderId !== currentUserId"
                  :size="36"
                  :src="msg.senderAvatar"
                  class="msg-avatar"
                  shape="square"
                >
                  {{ (msg.senderNickname || '?').charAt(0) }}
                </el-avatar>

                <div class="msg-content-wrap">
                  <!-- 昵称（群聊中对方显示） -->
                  <div
                    v-if="activeConversation.type === 2 && msg.senderId !== currentUserId"
                    class="msg-sender-name"
                  >
                    {{ msg.senderNickname }}
                  </div>

                  <!-- 消息内容气泡 -->
                  <div class="msg-bubble-row" :class="{ recalled: msg.status === 1 }">
                    <!-- 已撤回 -->
                    <div v-if="msg.status === 1" class="msg-bubble recalled-bubble">
                      消息已撤回
                    </div>

                    <!-- 文本消息 -->
                    <div v-else-if="msg.contentType === 1" class="msg-bubble text-bubble">
                      {{ msg.content }}
                    </div>

                    <!-- 图片消息 -->
                    <div v-else-if="msg.contentType === 2" class="msg-bubble img-bubble">
                      <el-image
                        :src="msg.content"
                        :preview-src-list="[msg.content]"
                        fit="cover"
                        class="msg-image"
                        preview-teleported
                      />
                    </div>

                    <!-- 文件消息 -->
                    <div v-else-if="msg.contentType === 3" class="msg-bubble file-bubble" @click="downloadFile(msg)">
                      <Icon icon="ep:document" :size="28" class="file-icon" />
                      <div class="file-info">
                        <div class="file-name">{{ msg.fileName }}</div>
                        <div class="file-size">{{ formatFileSize(msg.fileSize) }}</div>
                      </div>
                      <Icon icon="ep:download" class="download-icon" />
                    </div>
                  </div>

                  <!-- 发送时间 + 操作 -->
                  <div class="msg-meta">
                    <span class="msg-time">{{ formatMsgTime(msg.createTime, true) }}</span>

                    <!-- 单聊已读/未读（仅在最后一条自己发出的消息上显示） -->
                    <span
                      v-if="activeConversation.type === 1 && msg.senderId === currentUserId && msg.status !== 1 && msg.id === lastSentMessageId"
                      class="read-status-tag"
                      :class="readStatusMap[msg.id]?.readCount >= 1 ? 'is-read' : 'is-unread'"
                    >
                      {{ readStatusMap[msg.id] ? (readStatusMap[msg.id].readCount >= 1 ? '已读' : '未读') : '' }}
                    </span>

                    <!-- 群聊已读详情（仅发送者看，点击展开） -->
                    <span
                      v-else-if="activeConversation.type === 2 && msg.senderId === currentUserId && msg.status !== 1"
                      class="read-status-tag group-read-tag"
                      @click="toggleReadStatus(msg)"
                    >
                      {{ getGroupReadStatusText(msg) }}
                    </span>

                    <!-- 撤回按钮（自己发的、5分钟内、未撤回） -->
                    <el-button
                      v-if="msg.senderId === currentUserId && msg.status !== 1 && canRecall(msg)"
                      text
                      size="small"
                      class="recall-btn"
                      @click="handleRecall(msg)"
                    >
                      撤回
                    </el-button>
                  </div>

                  <!-- 已读状态展开面板 -->
                  <div
                    v-if="expandedReadStatusMsgId === msg.id && readStatusMap[msg.id]"
                    class="read-status-panel"
                  >
                    <el-tabs v-model="readStatusMode" size="small">
                      <el-tab-pane
                        :label="`已读 ${readStatusMap[msg.id].readCount}`"
                        name="read"
                      >
                        <div class="read-user-list">
                          <el-avatar
                            v-for="u in readStatusMap[msg.id].readUserList"
                            :key="u.userId"
                            :size="28"
                            :src="u.avatar"
                            :title="u.nickname"
                          >
                            {{ u.nickname.charAt(0) }}
                          </el-avatar>
                          <span v-if="readStatusMap[msg.id].readUserList.length === 0" class="no-data">暂无</span>
                        </div>
                      </el-tab-pane>
                      <el-tab-pane
                        :label="`未读 ${readStatusMap[msg.id].unreadCount}`"
                        name="unread"
                      >
                        <div class="read-user-list">
                          <el-avatar
                            v-for="u in readStatusMap[msg.id].unreadUserList"
                            :key="u.userId"
                            :size="28"
                            :src="u.avatar"
                            :title="u.nickname"
                          >
                            {{ u.nickname.charAt(0) }}
                          </el-avatar>
                          <span v-if="readStatusMap[msg.id].unreadUserList.length === 0" class="no-data">暂无</span>
                        </div>
                      </el-tab-pane>
                    </el-tabs>
                  </div>
                </div>

                <!-- 自己的头像（右侧） -->
                <el-avatar
                  v-if="msg.senderId === currentUserId"
                  :size="36"
                  :src="currentUserAvatar"
                  class="msg-avatar"
                  shape="square"
                >
                  {{ currentUserNickname.charAt(0) }}
                </el-avatar>
              </div>
            </template>
          </div>
        </div>

        <!-- 群成员侧面板 -->
        <div class="member-panel" v-if="showMemberPanel && activeConversation.type === 2">
          <div class="member-panel-header">
            <span>群成员 ({{ memberList.length }})</span>
            <el-button
              text
              :icon="Plus"
              size="small"
              v-hasPermi="['system:im:manage-member']"
              @click="showInviteDialog = true"
            >
              邀请
            </el-button>
          </div>
          <div class="member-list">
            <div v-for="m in memberList" :key="m.userId" class="member-item">
              <el-avatar :size="32" :src="m.avatar" shape="square">{{ m.nickname.charAt(0) }}</el-avatar>
              <div class="member-info">
                <span class="member-name">{{ m.nickname }}</span>
                <el-tag v-if="m.memberRole === 1" size="small" type="warning" effect="plain">群主</el-tag>
                <el-tag v-else-if="m.memberRole === 2" size="small" type="info" effect="plain">管理员</el-tag>
                <el-tag v-if="m.isMuted" size="small" type="danger" effect="plain">禁言中</el-tag>
              </div>
              <el-button
                v-if="isGroupOwnerOrAdmin && m.userId !== currentUserId && m.memberRole !== 1"
                text
                type="danger"
                size="small"
                class="kick-btn"
                @click="handleKickMember(m)"
              >
                踢出
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <div class="input-toolbar">
          <!-- 图片上传 -->
          <el-upload
            :show-file-list="false"
            :before-upload="(f: File) => handleUpload(f, 2)"
            accept="image/*"
          >
            <el-tooltip content="发送图片">
              <el-button text :icon="Picture" />
            </el-tooltip>
          </el-upload>

          <!-- 文件上传 -->
          <el-upload
            :show-file-list="false"
            :before-upload="(f: File) => handleUpload(f, 3)"
          >
            <el-tooltip content="发送文件">
              <el-button text :icon="Paperclip" />
            </el-tooltip>
          </el-upload>
        </div>

        <div class="input-row">
          <el-input
            v-model="inputText"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            resize="none"
            class="msg-input"
            @keydown.enter.exact.prevent="handleSendText"
          />
          <el-button
            type="primary"
            :disabled="!inputText.trim() || sending"
            :loading="sending"
            class="send-btn"
            @click="handleSendText"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>

    <!-- 未选中会话时的占位 -->
    <div class="im-main im-empty" v-else>
      <el-empty description="请选择一个会话开始聊天" :image-size="120" />
    </div>
  </div>

  <!-- 群公告弹窗 -->
  <el-dialog v-model="showNotice" title="群公告" width="400px">
    <p class="notice-content">{{ activeConversation?.notice }}</p>
  </el-dialog>

  <!-- 修改群名弹窗 -->
  <el-dialog v-model="showRenameDialog" title="修改群名称" width="400px" @close="newGroupName = ''">
    <el-form label-width="80px" @submit.prevent="handleUpdateGroupName">
      <el-form-item label="群名称">
        <el-input
          v-model="newGroupName"
          placeholder="请输入新的群名称"
          maxlength="50"
          show-word-limit
          clearable
          autofocus
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showRenameDialog = false">取消</el-button>
      <el-button type="primary" :loading="renaming" @click="handleUpdateGroupName">保存</el-button>
    </template>
  </el-dialog>

  <!-- 发起单聊弹窗 -->
  <el-dialog v-model="showSingleDialog" title="发起单聊" width="400px" @close="singleTargetUserId = undefined">
    <el-form label-width="80px">
      <el-form-item label="用户ID">
        <el-input v-model.number="singleTargetUserId" placeholder="请输入目标用户ID" type="number" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showSingleDialog = false">取消</el-button>
      <el-button type="primary" :loading="creating" @click="confirmSingleChat">确定</el-button>
    </template>
  </el-dialog>

  <!-- 发起群聊弹窗 -->
  <el-dialog v-model="showGroupDialog" title="发起群聊" width="440px" @close="resetGroupForm">
    <el-form :model="groupForm" label-width="80px">
      <el-form-item label="群名称" required>
        <el-input v-model="groupForm.name" placeholder="请输入群名称" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="成员ID">
        <el-input
          v-model="groupForm.memberIdsText"
          type="textarea"
          :autosize="{ minRows: 2 }"
          placeholder="请输入用户ID，多个用英文逗号分隔&#10;如：1,2,3"
        />
        <div class="form-tip">注：会自动包含您自己</div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showGroupDialog = false">取消</el-button>
      <el-button type="primary" :loading="creating" @click="confirmCreateGroup">确定</el-button>
    </template>
  </el-dialog>

  <!-- 邀请成员弹窗 -->
  <el-dialog v-model="showInviteDialog" title="邀请成员" width="400px">
    <el-form label-width="80px">
      <el-form-item label="用户ID">
        <el-input
          v-model="inviteMemberIdsText"
          type="textarea"
          :autosize="{ minRows: 2 }"
          placeholder="请输入用户ID，多个用英文逗号分隔&#10;如：1,2,3"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showInviteDialog = false">取消</el-button>
      <el-button type="primary" :loading="creating" @click="confirmInvite">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Plus, UserFilled, MoreFilled, Picture, Paperclip } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { ConversationApi, type ConversationVO } from '@/api/system/im/conversation'
import { ConversationMemberApi, type ConversationMemberVO } from '@/api/system/im/conversationmember'
import { MessageApi, type MessageVO, type MessageReadStatusVO } from '@/api/system/im/message'
import request from '@/config/axios'

defineOptions({ name: 'ImIndex' })

const userStore = useUserStore()
const currentUserId = computed(() => userStore.getUser.id)
const currentUserNickname = computed(() => userStore.getUser.nickname)
const currentUserAvatar = computed(() => userStore.getUser.avatar)

// ─── 会话列表 ────────────────────────────────────────────────────────────────
const searchKeyword = ref('')
const conversationLoading = ref(false)
const conversationList = ref<ConversationVO[]>([])

const filteredConversations = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  const list = conversationList.value
  if (!kw) return list
  return list.filter((c) => getConvName(c).toLowerCase().includes(kw))
})

const loadConversations = async () => {
  conversationLoading.value = true
  try {
    conversationList.value = (await ConversationApi.getMyConversations()) || []
  } finally {
    conversationLoading.value = false
  }
}

// ─── 会话选中 ────────────────────────────────────────────────────────────────
const activeConversationId = ref<number | null>(null)
const activeConversation = computed<ConversationVO | undefined>(() =>
  conversationList.value.find((c) => c.id === activeConversationId.value)
)

const selectConversation = async (conv: ConversationVO) => {
  if (activeConversationId.value === conv.id) return
  activeConversationId.value = conv.id
  showMemberPanel.value = false
  expandedReadStatusMsgId.value = null
  readStatusMap.value = {}
  messageList.value = []
  msgPage.value = 1
  hasMoreMessages.value = true
  await loadMessages()
  if (conv.type === 2) loadMemberList()
  // 标记已读
  ConversationMemberApi.markAsRead(conv.id).then(() => {
    conv.unreadCount = 0
  })
  // 单聊：自动加载最后一条消息的已读状态
  if (conv.type === 1) autoLoadSingleReadStatus()
}

// ─── 消息列表 ────────────────────────────────────────────────────────────────
const messageListRef = ref<HTMLElement>()
const messageList = ref<MessageVO[]>([])
const msgLoading = ref(false)
const msgPage = ref(1)
const MSG_PAGE_SIZE = 30
const hasMoreMessages = ref(true)

const loadMessages = async () => {
  if (!activeConversationId.value || msgLoading.value) return
  msgLoading.value = true
  try {
    const data = await MessageApi.getMessageList(activeConversationId.value, {
      pageNo: msgPage.value,
      pageSize: MSG_PAGE_SIZE,
    })
    const newMsgs = data?.list || []
    if (newMsgs.length < MSG_PAGE_SIZE) hasMoreMessages.value = false
    messageList.value = [...newMsgs.reverse(), ...messageList.value]
    if (msgPage.value === 1) {
      await nextTick()
      scrollToBottom()
    }
    msgPage.value++
  } finally {
    msgLoading.value = false
  }
}

const loadMoreMessages = () => loadMessages()

const scrollToBottom = () => {
  const el = messageListRef.value
  if (el) el.scrollTop = el.scrollHeight
}

// ─── 成员列表 ────────────────────────────────────────────────────────────────
const memberList = ref<ConversationMemberVO[]>([])
const showMemberPanel = ref(false)

const isGroupOwnerOrAdmin = computed(() => {
  const me = memberList.value.find((m) => m.userId === currentUserId.value)
  return me && (me.memberRole === 1 || me.memberRole === 2)
})

const loadMemberList = async () => {
  if (!activeConversationId.value) return
  memberList.value = (await ConversationMemberApi.getMemberList(activeConversationId.value)) || []
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────
const getConvName = (conv: ConversationVO): string => conv.name || (conv.type === 2 ? '群聊' : `会话 ${conv.id}`)
const getConvAvatar = (conv: ConversationVO): string => conv.avatar || ''

const formatMsgTime = (time: string | undefined, full = false): string => {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  if (full) {
    return d.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  }
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

const canRecall = (msg: MessageVO): boolean => {
  if (!msg.createTime) return false
  return Date.now() - new Date(msg.createTime).getTime() < 5 * 60 * 1000
}

// ─── 已读状态 ────────────────────────────────────────────────────────────────
const expandedReadStatusMsgId = ref<number | null>(null)
const readStatusMode = ref<'read' | 'unread'>('read')
const readStatusMap = ref<Record<number, MessageReadStatusVO>>({})

/** 单聊：当前用户最后一条发出的消息 ID */
const lastSentMessageId = computed<number | null>(() => {
  const sent = messageList.value.filter((m) => m.senderId === currentUserId.value && m.status !== 1)
  return sent.length ? sent[sent.length - 1].id : null
})

/** 群聊：消息已读摘要文字 */
const getGroupReadStatusText = (msg: MessageVO): string => {
  const status = readStatusMap.value[msg.id]
  if (!status) return '查看已读'
  if (status.totalCount === 0) return '全部未读'
  if (status.readCount === 0) return '全部未读'
  if (status.readCount === status.totalCount) return '全部已读'
  return `${status.readCount}/${status.totalCount} 已读`
}

/** 单聊：自动为最后一条已发消息加载已读状态 */
const autoLoadSingleReadStatus = async () => {
  if (activeConversation.value?.type !== 1) return
  const msgId = lastSentMessageId.value
  if (!msgId || readStatusMap.value[msgId] !== undefined) return
  try {
    readStatusMap.value[msgId] = await MessageApi.getReadStatus(msgId)
  } catch {}
}

const toggleReadStatus = async (msg: MessageVO) => {
  if (expandedReadStatusMsgId.value === msg.id) {
    expandedReadStatusMsgId.value = null
    return
  }
  expandedReadStatusMsgId.value = msg.id
  if (!readStatusMap.value[msg.id]) {
    try {
      readStatusMap.value[msg.id] = await MessageApi.getReadStatus(msg.id)
    } catch {
      expandedReadStatusMsgId.value = null
    }
  }
}

// ─── 消息轮询（新消息实时到达） ─────────────────────────────────────────────
let msgPollingTimer: ReturnType<typeof setInterval> | null = null
let convPollingTimer: ReturnType<typeof setInterval> | null = null

/** 轮询当前会话的新消息（每 5s） */
const pollNewMessages = async () => {
  if (!activeConversationId.value || msgLoading.value || messageList.value.length === 0) return
  const lastId = messageList.value[messageList.value.length - 1]?.id
  if (!lastId) return
  try {
    const data = await MessageApi.getMessageList(activeConversationId.value, {
      pageNo: 1,
      pageSize: 20,
    })
    const newMsgs = (data?.list || []).reverse().filter((m) => m.id > lastId)
    if (newMsgs.length > 0) {
      messageList.value.push(...newMsgs)
      // 标记已读 + 清除未读数
      ConversationMemberApi.markAsRead(activeConversationId.value!)
      const conv = conversationList.value.find((c) => c.id === activeConversationId.value)
      if (conv) {
        conv.unreadCount = 0
        const lastNew = newMsgs[newMsgs.length - 1]
        conv.lastMessageContent = lastNew.content
        conv.lastMessageTime = lastNew.createTime
      }
      // 判断是否在底部附近才自动滚动
      const el = messageListRef.value
      if (el) {
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
        if (nearBottom) {
          await nextTick()
          scrollToBottom()
        }
      }
      // 刷新单聊已读状态（对方可能已读了之前的消息）
      if (activeConversation.value?.type === 1) autoLoadSingleReadStatus()
    }
  } catch {}
}

/** 轮询会话列表（每 15s），更新未读数和最新消息摘要 */
const pollConversations = async () => {
  try {
    const freshList = (await ConversationApi.getMyConversations()) || []
    freshList.forEach((fresh) => {
      const existing = conversationList.value.find((c) => c.id === fresh.id)
      if (existing) {
        // 对于当前已打开的会话，不覆盖未读数（已标记已读）
        if (fresh.id !== activeConversationId.value) {
          existing.unreadCount = fresh.unreadCount
        }
        existing.lastMessageContent = fresh.lastMessageContent
        existing.lastMessageTime = fresh.lastMessageTime
      } else {
        // 有新会话（被他人拉入群聊）
        conversationList.value.push(fresh)
      }
    })
    // 按置顶→最新消息时间排序
    conversationList.value.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
    })
  } catch {}
}

const startPolling = () => {
  stopPolling()
  msgPollingTimer = setInterval(pollNewMessages, 5000)
  convPollingTimer = setInterval(pollConversations, 15000)
}

const stopPolling = () => {
  if (msgPollingTimer) { clearInterval(msgPollingTimer); msgPollingTimer = null }
  if (convPollingTimer) { clearInterval(convPollingTimer); convPollingTimer = null }
}

// ─── 发送消息 ────────────────────────────────────────────────────────────────
const inputText = ref('')
const sending = ref(false)

const handleSendText = async () => {
  const text = inputText.value.trim()
  if (!text || !activeConversationId.value || sending.value) return
  sending.value = true
  try {
    const id = await MessageApi.sendMessage({
      conversationId: activeConversationId.value,
      contentType: 1,
      content: text,
    })
    inputText.value = ''
    const newMsg: MessageVO = {
      id: id as number,
      conversationId: activeConversationId.value,
      senderId: currentUserId.value,
      senderNickname: currentUserNickname.value,
      senderAvatar: currentUserAvatar.value,
      contentType: 1,
      content: text,
      fileName: '',
      fileSize: 0,
      status: 0,
      createTime: new Date().toISOString(),
    }
    messageList.value.push(newMsg)
    updateConvLastMsg(activeConversationId.value, text)
    await nextTick()
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

const updateConvLastMsg = (convId: number, content: string) => {
  const conv = conversationList.value.find((c) => c.id === convId)
  if (conv) {
    conv.lastMessageContent = content
    conv.lastMessageTime = new Date().toISOString()
  }
}

// ─── 文件/图片上传 ────────────────────────────────────────────────────────────
const handleUpload = async (file: File, contentType: 2 | 3): Promise<false> => {
  if (!activeConversationId.value) return false
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await request.upload({ url: '/infra/file/upload', data: formData })
    const url = (typeof (res as any).data === 'string' ? (res as any).data : (res as any).data?.url) || ''
    await MessageApi.sendMessage({
      conversationId: activeConversationId.value,
      contentType,
      content: url,
      fileName: file.name,
      fileSize: file.size,
    })
    const newMsg: MessageVO = {
      id: Date.now(),
      conversationId: activeConversationId.value,
      senderId: currentUserId.value,
      senderNickname: currentUserNickname.value,
      senderAvatar: currentUserAvatar.value,
      contentType,
      content: url,
      fileName: file.name,
      fileSize: file.size,
      status: 0,
      createTime: new Date().toISOString(),
    }
    messageList.value.push(newMsg)
    updateConvLastMsg(activeConversationId.value, contentType === 2 ? '[图片]' : `[文件] ${file.name}`)
    await nextTick()
    scrollToBottom()
  } catch (e) {
    ElMessage.error('上传失败，请重试')
  }
  return false
}

const downloadFile = (msg: MessageVO) => {
  const a = document.createElement('a')
  a.href = msg.content
  a.download = msg.fileName || 'download'
  a.target = '_blank'
  a.click()
}

// ─── 撤回消息 ────────────────────────────────────────────────────────────────
const handleRecall = async (msg: MessageVO) => {
  await ElMessageBox.confirm('确定要撤回这条消息吗？', '撤回消息', { type: 'warning' })
  await MessageApi.recallMessage(msg.id)
  const target = messageList.value.find((m) => m.id === msg.id)
  if (target) target.status = 1
}

// ─── 群操作入口（更多下拉） ──────────────────────────────────────────────────
const handleGroupAction = (cmd: string) => {
  switch (cmd) {
    case 'rename':
      newGroupName.value = activeConversation.value?.name || ''
      showRenameDialog.value = true
      break
    case 'notice':
      showNotice.value = true
      break
    case 'invite':
      showInviteDialog.value = true
      break
    case 'dismiss':
      handleDismissGroup()
      break
  }
}

// ─── 修改群名 ────────────────────────────────────────────────────────────────
const showRenameDialog = ref(false)
const newGroupName = ref('')
const renaming = ref(false)

const handleUpdateGroupName = async () => {
  const name = newGroupName.value.trim()
  if (!name) return ElMessage.warning('群名称不能为空')
  if (!activeConversationId.value) return
  if (name === activeConversation.value?.name) {
    showRenameDialog.value = false
    return
  }
  renaming.value = true
  try {
    await ConversationApi.updateGroupName(activeConversationId.value, name)
    const conv = conversationList.value.find((c) => c.id === activeConversationId.value)
    if (conv) conv.name = name
    showRenameDialog.value = false
    ElMessage.success('群名称已修改')
  } finally {
    renaming.value = false
  }
}

// ─── 解散群聊 ────────────────────────────────────────────────────────────────
const handleDismissGroup = async () => {
  if (!activeConversation.value) return
  await ElMessageBox.confirm('解散后所有聊天记录将无法恢复，确定解散该群聊吗？', '解散群聊', {
    type: 'warning',
    confirmButtonText: '确定解散',
    confirmButtonClass: 'el-button--danger',
  })
  await ConversationApi.dismissGroup(activeConversation.value.id)
  ElMessage.success('群聊已解散')
  stopPolling()
  conversationList.value = conversationList.value.filter((c) => c.id !== activeConversationId.value)
  activeConversationId.value = null
  startPolling()
}

// ─── 群公告 ────────────────────────────────────────────────────────────────
const showNotice = ref(false)

// ─── 新建单聊 ────────────────────────────────────────────────────────────────
const showSingleDialog = ref(false)
const singleTargetUserId = ref<number | undefined>()
const creating = ref(false)

const handleNewConversation = (cmd: 'single' | 'group') => {
  if (cmd === 'single') showSingleDialog.value = true
  else showGroupDialog.value = true
}

const confirmSingleChat = async () => {
  if (!singleTargetUserId.value) return ElMessage.warning('请输入目标用户ID')
  creating.value = true
  try {
    const convId = await ConversationApi.createSingleConversation(singleTargetUserId.value)
    showSingleDialog.value = false
    await loadConversations()
    const conv = conversationList.value.find((c) => c.id === convId)
    if (conv) selectConversation(conv)
  } finally {
    creating.value = false
  }
}

// ─── 新建群聊 ────────────────────────────────────────────────────────────────
const showGroupDialog = ref(false)
const groupForm = reactive({ name: '', memberIdsText: '' })

const resetGroupForm = () => {
  groupForm.name = ''
  groupForm.memberIdsText = ''
}

const confirmCreateGroup = async () => {
  if (!groupForm.name.trim()) return ElMessage.warning('请输入群名称')
  const ids = groupForm.memberIdsText
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n) && n > 0)
  creating.value = true
  try {
    const convId = await ConversationApi.createGroupConversation({
      name: groupForm.name.trim(),
      memberUserIds: ids,
    })
    showGroupDialog.value = false
    await loadConversations()
    const conv = conversationList.value.find((c) => c.id === convId)
    if (conv) selectConversation(conv)
  } finally {
    creating.value = false
  }
}

// ─── 邀请成员 ────────────────────────────────────────────────────────────────
const showInviteDialog = ref(false)
const inviteMemberIdsText = ref('')

const confirmInvite = async () => {
  if (!activeConversationId.value) return
  const ids = inviteMemberIdsText.value
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))
  if (!ids.length) return ElMessage.warning('请输入有效的用户ID')
  creating.value = true
  try {
    await ConversationMemberApi.inviteMembers({ conversationId: activeConversationId.value, userIds: ids })
    showInviteDialog.value = false
    inviteMemberIdsText.value = ''
    await loadMemberList()
    ElMessage.success('邀请成功')
  } finally {
    creating.value = false
  }
}

// ─── 踢人 ────────────────────────────────────────────────────────────────────
const handleKickMember = async (member: ConversationMemberVO) => {
  if (!activeConversationId.value) return
  await ElMessageBox.confirm(`确定将 ${member.nickname} 移出群聊吗？`, '移出成员', { type: 'warning' })
  await ConversationMemberApi.removeMember({
    conversationId: activeConversationId.value,
    userId: member.userId,
  })
  memberList.value = memberList.value.filter((m) => m.userId !== member.userId)
  ElMessage.success('已移出')
}

// ─── 初始化 ────────────────────────────────────────────────────────────────
onMounted(() => {
  loadConversations()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped lang="scss">
.im-container {
  display: flex;
  height: calc(100vh - 84px);
  background: #f5f6f7;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* ─── 左侧会话列表 ─── */
.im-sidebar {
  width: 280px;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e8e8e8;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px 10px;
  border-bottom: 1px solid #f0f0f0;

  .sidebar-search {
    flex: 1;
  }

  .new-btn {
    flex-shrink: 0;
  }
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
  border-left: 3px solid transparent;

  &:hover {
    background: #f5f7ff;
  }

  &.active {
    background: #e8efff;
    border-left-color: var(--el-color-primary);
  }

  &.pinned {
    background: #fafbff;
  }
}

.conv-avatar {
  position: relative;
  flex-shrink: 0;

  .unread-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #f56c6c;
    color: #fff;
    font-size: 10px;
    line-height: 1;
    padding: 2px 4px;
    border-radius: 8px;
    min-width: 16px;
    text-align: center;
  }
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conv-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.conv-time {
  font-size: 11px;
  color: #aaa;
  flex-shrink: 0;
}

.conv-last-msg {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;

  .pin-icon {
    color: var(--el-color-primary);
    font-size: 12px;
  }
}

/* ─── 右侧主体 ─── */
.im-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f5f6f7;

  &.im-empty {
    justify-content: center;
    align-items: center;
  }
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;

  .chat-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chat-name {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .member-count {
    font-size: 12px;
    color: #606266;
  }

  .chat-actions {
    display: flex;
    gap: 4px;

    :deep(.el-button) {
      color: #303133;

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}

/* ─── 聊天体 ─── */
.chat-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.message-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.load-more-area {
  text-align: center;
  padding: 8px 0 4px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
}

.system-msg {
  text-align: center;
  font-size: 12px;
  color: #bbb;
  span {
    background: rgba(0, 0, 0, 0.04);
    padding: 2px 10px;
    border-radius: 10px;
  }
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  &.self {
    flex-direction: row;
    justify-content: flex-end;

    .msg-content-wrap {
      align-items: flex-end;
    }

    .msg-meta {
      flex-direction: row-reverse;
    }

    .text-bubble {
      background: var(--el-color-primary);
      color: #fff;
      border-radius: 12px 2px 12px 12px;
    }
  }
}

.msg-avatar {
  flex-shrink: 0;
  margin-top: 4px;
}

.msg-content-wrap {
  display: flex;
  flex-direction: column;
  max-width: 60%;
}

.msg-sender-name {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
  padding-left: 2px;
}

.msg-bubble-row {
  max-width: 100%;
}

.msg-bubble {
  display: inline-block;
  word-break: break-word;
}

.recalled-bubble {
  color: #bbb;
  font-style: italic;
  font-size: 13px;
  padding: 6px 0;
}

.text-bubble {
  background: #fff;
  color: #1a1a1a;
  padding: 10px 14px;
  border-radius: 2px 12px 12px 12px;
  font-size: 14px;
  line-height: 1.6;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  white-space: pre-wrap;
}

.img-bubble {
  padding: 0;
  background: none;
  box-shadow: none;

  .msg-image {
    width: 180px;
    height: 180px;
    border-radius: 8px;
    cursor: pointer;
    object-fit: cover;
  }
}

.file-bubble {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  min-width: 200px;
  max-width: 300px;
  transition: background 0.15s;

  &:hover {
    background: #f5f7ff;
  }

  .file-icon {
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  .file-info {
    flex: 1;
    min-width: 0;

    .file-name {
      font-size: 13px;
      color: #1a1a1a;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size {
      font-size: 11px;
      color: #999;
      margin-top: 2px;
    }
  }

  .download-icon {
    color: #999;
    flex-shrink: 0;
  }
}

.msg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.msg-time {
  font-size: 11px;
  color: #bbb;
}

.read-status-tag {
  font-size: 11px;
  color: #bbb;

  &.is-read {
    color: var(--el-color-primary);
  }

  &.is-unread {
    color: #bbb;
  }

  &.group-read-tag {
    color: var(--el-color-primary);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

.recall-btn {
  font-size: 11px;
  padding: 0;
  height: auto;
  color: #bbb;
  &:hover {
    color: var(--el-color-danger);
  }
}

.read-status-panel {
  margin-top: 6px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-width: 200px;
  max-width: 320px;

  .read-user-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 0 2px;
    min-height: 36px;
    align-items: center;
  }

  .no-data {
    font-size: 12px;
    color: #bbb;
  }
}

/* ─── 成员面板 ─── */
.member-panel {
  width: 220px;
  border-left: 1px solid #e8e8e8;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.member-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.member-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
}

.member-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  font-size: 13px;
  transition: background 0.15s;

  &:hover {
    background: #f5f7ff;

    .kick-btn {
      opacity: 1;
    }
  }

  .member-info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
  }

  .member-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 80px;
    color: #1a1a1a;
    font-weight: 500;
  }

  :deep(.el-tag) {
    font-weight: 500;

    &.el-tag--warning {
      color: #b88230;
      background: #fdf6ec;
      border-color: #e6d4b8;
    }

    &.el-tag--info {
      color: #409eff;
      background: #ecf5ff;
      border-color: #d9ecff;
    }

    &.el-tag--danger {
      color: #c45656;
      background: #fef0f0;
      border-color: #fbc4c4;
    }
  }

  .kick-btn {
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s;
    font-size: 12px;
  }
}

:deep(.danger-item) {
  color: var(--el-color-danger) !important;
}

/* ─── 输入区域 ─── */
.chat-input-area {
  background: #fff;
  border-top: 1px solid #e8e8e8;
  padding: 8px 16px 16px;
}

.input-toolbar {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e8e8e8;

  :deep(.el-button) {
    color: #303133;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;

  .msg-input {
    flex: 1;

    :deep(.el-textarea__inner) {
      border: none;
      box-shadow: none;
      background: #f5f6f7;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      color: #1a1a1a;
      resize: none;

      &::placeholder {
        color: #666;
      }

      &:focus {
        background: #f0f2ff;
      }
    }
  }

  .send-btn {
    height: 60px;
    padding: 0 24px;
    border-radius: 8px;
  }
}

.notice-content {
  white-space: pre-wrap;
  color: #555;
  line-height: 1.8;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>

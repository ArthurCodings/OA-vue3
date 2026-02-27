import request from '@/config/axios'

/** 会话 VO（服务端返回，含未读数等聚合信息） */
export interface ConversationVO {
  id: number
  type: 1 | 2
  name: string
  avatar: string
  ownerId: number
  notice: string
  lastMessageContent: string
  lastMessageTime: string
  unreadCount: number
  otherUserId?: number
  isPinned: boolean
  isDisturb: boolean
  createTime?: string
}

export const ConversationApi = {
  /** 查询我的会话列表（含未读数） */
  getMyConversations: async () => {
    return await request.get<ConversationVO[]>({ url: `/system/im/conversation/list` })
  },

  /** 创建或获取单聊会话 */
  createSingleConversation: async (targetUserId: number) => {
    return await request.post<number>({ url: `/system/im/conversation/create-single`, data: { targetUserId } })
  },

  /** 创建群聊会话 */
  createGroupConversation: async (data: { name: string; memberUserIds: number[]; avatar?: string }) => {
    return await request.post<number>({ url: `/system/im/conversation/create-group`, data })
  },

  /** 修改群名 */
  updateGroupName: async (id: number, name: string) => {
    return await request.put({ url: `/system/im/conversation/update-name`, data: { id, name } })
  },

  /** 解散群聊 */
  dismissGroup: async (id: number) => {
    return await request.delete({ url: `/system/im/conversation/dismiss/${id}` })
  },
}

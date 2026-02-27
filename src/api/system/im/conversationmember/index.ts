import request from '@/config/axios'

/** 会话成员 VO */
export interface ConversationMemberVO {
  id: number
  userId: number
  nickname: string
  avatar: string
  memberRole: 0 | 1 | 2
  isMuted: boolean
  joinTime: string
}

export const ConversationMemberApi = {
  /** 查询群成员列表 */
  getMemberList: async (conversationId: number) => {
    return await request.get<ConversationMemberVO[]>({
      url: `/system/im/conversation-member/list/${conversationId}`,
    })
  },

  /** 邀请成员加入群聊 */
  inviteMembers: async (data: { conversationId: number; userIds: number[] }) => {
    return await request.post({ url: `/system/im/conversation-member/invite`, data })
  },

  /** 踢出成员（群主/管理员） */
  removeMember: async (data: { conversationId: number; userId: number }) => {
    return await request.delete({ url: `/system/im/conversation-member/remove`, data })
  },

  /** 标记该会话消息全部已读 */
  markAsRead: async (conversationId: number) => {
    return await request.put({ url: `/system/im/conversation-member/read/${conversationId}` })
  },
}

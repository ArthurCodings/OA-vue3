import request from '@/config/axios'

/** 消息 VO */
export interface MessageVO {
  id: number
  conversationId: number
  senderId: number
  senderNickname: string
  senderAvatar: string
  contentType: 1 | 2 | 3 | 4
  content: string
  fileName: string
  fileSize: number
  status: 0 | 1
  createTime: string
}

/** 发送消息请求体 */
export interface SendMessageReqVO {
  conversationId: number
  contentType: 1 | 2 | 3 | 4
  content: string
  fileName?: string
  fileSize?: number
}

/** 消息已读状态 VO */
export interface MessageReadStatusVO {
  readCount: number
  unreadCount: number
  totalCount: number
  readUserList: { userId: number; nickname: string; avatar?: string }[]
  unreadUserList: { userId: number; nickname: string; avatar?: string }[]
}

export const MessageApi = {
  /** 分页查询会话消息列表（最新在后，向上翻页加载历史） */
  getMessageList: async (conversationId: number, params: { pageNo: number; pageSize: number }) => {
    return await request.get<{ list: MessageVO[]; total: number }>({
      url: `/system/im/message/list/${conversationId}`,
      params,
    })
  },

  /** 发消息 */
  sendMessage: async (data: SendMessageReqVO) => {
    return await request.post<number>({ url: `/system/im/message/send`, data })
  },

  /** 撤回消息 */
  recallMessage: async (id: number) => {
    return await request.put({ url: `/system/im/message/recall/${id}` })
  },

  /** 获取群聊消息的已读/未读详情（发送者用） */
  getReadStatus: async (messageId: number) => {
    return await request.get<MessageReadStatusVO>({
      url: `/system/im/message/read-status/${messageId}`,
    })
  },
}

import request from '@/config/axios'

/** 合同保存/更新请求体（与 InfraContractSaveReqVO 对齐） */
export interface ContractVO {
  id?: number
  contractNo?: string
  contractName: string
  type: number
  customerName?: string
  amount: number
  signDate?: string
  startDate?: string
  endDate?: string
  responsibleUserId: number
  responsibleUsername?: string
  fileUrl?: string
  commissionRate?: number
  commissionAmount?: number
  commissionStartDate?: string
  commissionEndDate?: string
  commissionYearMonth?: number
  status: number
  remark?: string
  createTime?: string
}

// 创建合同
export const createContract = (data: ContractVO) => {
  return request.post({ url: '/infra/contract/create', data })
}

// 修改合同
export const updateContract = (data: ContractVO) => {
  return request.put({ url: '/infra/contract/update', data })
}

// 删除合同
export const deleteContract = (id: number) => {
  return request.delete({ url: '/infra/contract/delete?id=' + id })
}

// 获取合同详情
export const getContract = (id: number) => {
  return request.get({ url: '/infra/contract/get?id=' + id })
}

// 合同分页列表
export const getContractPage = (params: any) => {
  return request.get({ url: '/infra/contract/page', params })
}

// 导出合同
export const exportContract = (params: any) => {
  return request.download({ url: '/infra/contract/export-excel', params })
}

// 个人中心-我负责的合同列表
export const getMyContractList = () => {
  return request.get({ url: '/infra/contract/my-list' })
}

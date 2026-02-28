<template>
  <Dialog v-model="dialogVisible" :max-height="500" :scroll="true" title="合同详情" width="720px">
    <el-descriptions v-loading="detailLoading" :column="2" border>
      <el-descriptions-item label="合同编号" min-width="120">
        {{ detail.contractNo ?? (detail as any).contract_no ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="合同名称">
        {{ detail.contractName }}
      </el-descriptions-item>
      <el-descriptions-item label="合同类型">
        {{ contractTypeLabel(detail.type) }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="contractStatusTag(detail.status)" size="small">
          {{ contractStatusLabel(detail.status) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="客户/乙方">
        {{ detail.customerName ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="合同金额">
        ¥{{ (detail.amount ?? 0).toLocaleString() }}
      </el-descriptions-item>
      <el-descriptions-item label="负责人">
        {{ detail.responsibleUsername ?? (detail as any).responsible_username ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="签订日期">
        {{ detail.signDate ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="开始日期">
        {{ detail.startDate ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="结束日期">
        {{ detail.endDate ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="提成比例">
        {{ detail.commissionRate != null ? ((detail.commissionRate as number) * 100).toFixed(2) + '%' : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="提成金额">
        ¥{{ (detail.commissionAmount ?? 0).toLocaleString() }}
      </el-descriptions-item>
      <el-descriptions-item label="提成归属开始日期">
        {{ detail.commissionStartDate ?? (detail as any).commission_start_date ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="提成归属结束日期">
        {{ detail.commissionEndDate ?? (detail as any).commission_end_date ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="合同附件" :span="2">
        <el-link
          v-if="detail.fileUrl"
          type="primary"
          :href="fullFileUrl"
          target="_blank"
          download
        >
          下载附件
        </el-link>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item v-if="detail.remark" label="备注" :span="2">
        {{ detail.remark }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ detail.createTime ?? (detail as any).create_time ?? '-' }}
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
      <el-button type="primary" @click="handleEdit" v-hasPermi="['infra:contract:update']">
        修改
      </el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as ContractApi from '@/api/infra/contract'
import type { ContractVO } from '@/api/infra/contract'

defineOptions({ name: 'ContractDetail' })

const emit = defineEmits<{ (e: 'edit', id: number): void }>()

const dialogVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<ContractVO & Record<string, any>>({} as ContractVO)

const contractTypeLabel = (v: number) => {
  const map: Record<number, string> = { 1: '销售合同', 2: '采购合同', 3: '劳动合同', 4: '其他' }
  return map[v] ?? '-'
}

const contractStatusLabel = (v: number) => {
  const map: Record<number, string> = { 0: '草稿', 1: '生效', 2: '已完成', 3: '已终止' }
  return map[v] ?? '-'
}

const contractStatusTag = (v: number) => {
  const map: Record<number, string> = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }
  return map[v] ?? 'info'
}

const fullFileUrl = computed(() => {
  const url = detail.value?.fileUrl
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url
  const base = (import.meta.env.VITE_BASE_URL || '').replace(/\/$/, '')
  return url.startsWith('/') ? base + url : base + '/' + url
})

const open = async (id: number) => {
  dialogVisible.value = true
  detailLoading.value = true
  try {
    const data = await ContractApi.getContract(id)
    detail.value = data as ContractVO & Record<string, any>
  } finally {
    detailLoading.value = false
  }
}

const handleEdit = () => {
  if (detail.value?.id) {
    dialogVisible.value = false
    emit('edit', detail.value.id)
  }
}

defineExpose({ open })
</script>

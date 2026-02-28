<template>
  <el-row :gutter="20">
    <el-col :span="5">
      <ContentWrap class="h-1/1">
        <div class="mb-2 flex justify-between items-center">
          <span class="font-medium">文档分类</span>
          <el-button
            link
            type="primary"
            size="small"
            @click="openCategoryForm('create')"
            v-hasPermi="['infra:doc:update']"
          >
            新增
          </el-button>
        </div>
        <el-tree
          :data="categoryTree"
          :props="{ label: 'name', value: 'id' }"
          node-key="id"
          highlight-current
          default-expand-all
          @node-click="handleCategoryClick"
        >
          <template #default="{ node, data }">
            <span class="flex items-center justify-between w-full">
              <span>{{ node.label }}</span>
              <span v-if="data.id" class="mr-1">
                <el-button link type="primary" size="small" @click.stop="openCategoryForm('update', data)" v-hasPermi="['infra:doc:update']">编辑</el-button>
                <el-button link type="danger" size="small" @click.stop="handleDeleteCategory(data.id)" v-hasPermi="['infra:doc:update']">删</el-button>
              </span>
            </span>
          </template>
        </el-tree>
      </ContentWrap>
    </el-col>
    <el-col :span="19">
      <ContentWrap>
        <el-form
          class="-mb-15px"
          :model="queryParams"
          ref="queryFormRef"
          :inline="true"
          label-width="68px"
        >
          <el-form-item label="文档名称" prop="name">
            <el-input
              v-model="queryParams.name"
              placeholder="请输入文档名称"
              clearable
              @keyup.enter="handleQuery"
              class="!w-200px"
            />
          </el-form-item>
          <el-form-item label="类型" prop="type">
            <el-select v-model="queryParams.type" placeholder="请选择" clearable class="!w-200px">
              <el-option label="上传预览" :value="1" />
              <el-option label="外部链接" :value="2" />
              <el-option label="下载附件" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
            <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
            <el-button
              type="primary"
              plain
              @click="openDocForm('create')"
              v-hasPermi="['infra:doc:update']"
            >
              <Icon icon="ep:plus" class="mr-5px" /> 新增文档
            </el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list">
          <el-table-column label="文档名称" align="center" prop="name" min-width="150" />
          <el-table-column label="类型" align="center" prop="type" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ docTypeLabel(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="文件类型" align="center" prop="fileType" width="90" />
          <el-table-column label="浏览次数" align="center" prop="viewCount" width="90" />
          <el-table-column label="状态" align="center" prop="status" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'success' : 'info'" size="small">
                {{ row.status === 0 ? '公开' : '仅内部' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handlePreview(row)">预览/打开</el-button>
              <el-button
                link
                type="primary"
                @click="openDocForm('update', row.id)"
                v-hasPermi="['infra:doc:update']"
              >
                修改
              </el-button>
              <el-button
                link
                type="danger"
                @click="handleDeleteDoc(row.id)"
                v-hasPermi="['infra:doc:update']"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </ContentWrap>
    </el-col>
  </el-row>

  <DocCategoryForm ref="categoryFormRef" @success="getCategoryTree" />
  <DocForm ref="docFormRef" @success="getList" />
  <el-dialog v-model="previewVisible" title="文档预览" width="90%" top="5vh">
    <div v-if="previewDoc" class="min-h-400px">
      <div v-if="previewDoc.type === 2" class="py-4">
        <el-link type="primary" :href="previewDoc.externalUrl" target="_blank">
          打开外部链接：{{ previewDoc.externalUrl }}
        </el-link>
      </div>
      <div v-else-if="previewDoc.type === 3" class="py-4">
        <el-link type="primary" :href="fullFileUrl" target="_blank" download>
          下载文件
        </el-link>
      </div>
      <div v-else-if="isDocx" class="w-full doc-preview-wrap">
        <VueOfficeDocx
          v-if="fullFileUrl"
          :src="fullFileUrl"
          class="doc-preview"
          @error="onPreviewError"
        />
      </div>
      <div v-else-if="isExcel" class="w-full doc-preview-wrap">
        <VueOfficeExcel
          v-if="fullFileUrl"
          :src="fullFileUrl"
          class="doc-preview"
          @error="onPreviewError"
        />
      </div>
      <div v-else-if="isPdf" class="w-full pdf-preview-wrap relative">
        <div v-if="pdfLoading" class="flex items-center justify-center py-20">
          <el-icon class="is-loading text-4xl text-gray-400"><Icon icon="ep:loading" /></el-icon>
          <span class="ml-2 text-gray-500">PDF 加载中...</span>
        </div>
        <div v-else-if="pdfError" class="py-8 text-center text-gray-500">
          {{ pdfError }}
          <el-link type="primary" :href="fullFileUrl" target="_blank" download class="ml-2">下载查看</el-link>
        </div>
        <!-- 使用 v-show 保持容器始终挂载，避免 loadPdf 中 pdfLoading=true 时 ref 变为 null -->
        <div ref="pdfContainerRef" class="pdf-canvas-wrap" v-show="!pdfLoading && !pdfError"></div>
      </div>
      <div v-else class="py-4 text-gray-500">
        暂不支持在线预览，请
        <el-link type="primary" :href="fullFileUrl" target="_blank" download>下载</el-link>
        后查看
      </div>
    </div>
  </el-dialog>
</template>
<script lang="ts" setup>
import { handleTree } from '@/utils/tree'
import * as DocApi from '@/api/infra/doc'
import DocCategoryForm from '../category/DocCategoryForm.vue'
import DocForm from './DocForm.vue'
import VueOfficeDocx from '@vue-office/docx'
import VueOfficeExcel from '@vue-office/excel'
import '@vue-office/docx/lib/index.css'
import '@vue-office/excel/lib/index.css'
import * as pdfjsLib from 'pdfjs-dist'
import { getAccessToken, getTenantId, getVisitTenantId } from '@/utils/auth'

// PDF.js Worker 配置（带鉴权的文件需通过 axios 拉取后渲染）
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

defineOptions({ name: 'InfraDocList' })

const message = useMessage()
const loading = ref(true)
const total = ref(0)
const list = ref([])
const categoryTree = ref<any[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  categoryId: undefined,
  type: undefined,
  name: undefined
})
const queryFormRef = ref()

const docTypeLabel = (v: number) => {
  const map: Record<number, string> = { 1: '上传预览', 2: '外部链接', 3: '下载附件' }
  return map[v] ?? '-'
}

const getCategoryTree = async () => {
  try {
    const data = await DocApi.getDocCategoryTree()
    categoryTree.value = handleTree(data ?? [], 'id', 'parentId')
  } catch {
    categoryTree.value = []
  }
}

const handleCategoryClick = (data: any) => {
  queryParams.categoryId = data.id
  queryParams.pageNo = 1
  getList()
}

const getList = async () => {
  loading.value = true
  try {
    const res = await DocApi.getDocPage(queryParams)
    list.value = res.list ?? []
    total.value = res.total ?? 0
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.categoryId = undefined
  handleQuery()
}

const categoryFormRef = ref()
const openCategoryForm = (type: string, id?: number, parentId?: number) => {
  categoryFormRef.value?.open(type, id, parentId)
}

const handleDeleteCategory = async (id: number) => {
  try {
    await message.delConfirm()
    await DocApi.deleteDocCategory(id)
    message.success('删除成功')
    await getCategoryTree()
    if (queryParams.categoryId === id) {
      queryParams.categoryId = undefined
      getList()
    }
  } catch {}
}

const docFormRef = ref()
const openDocForm = (type: string, id?: number) => {
  docFormRef.value?.open(type, id, queryParams.categoryId)
}

const handleDeleteDoc = async (id: number) => {
  try {
    await message.delConfirm()
    await DocApi.deleteDoc(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

const previewVisible = ref(false)
const previewDoc = ref<any>(null)

/** 获取完整文件 URL（支持相对路径） */
const fullFileUrl = computed(() => {
  const url = previewDoc.value?.fileUrl
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url
  const base = (import.meta.env.VITE_BASE_URL || '').replace(/\/$/, '')
  return url.startsWith('/') ? base + url : base + '/' + url
})

/** 是否为 Word 文档 */
const isDocx = computed(() => {
  const ft = (previewDoc.value?.fileType || '').toLowerCase()
  return ft === 'docx' || ft === 'doc'
})

/** 是否为 Excel 文档 */
const isExcel = computed(() => {
  const ft = (previewDoc.value?.fileType || '').toLowerCase()
  return ft === 'xlsx' || ft === 'xls'
})

/** 是否为 PDF 文档 */
const isPdf = computed(() => {
  const ft = (previewDoc.value?.fileType || '').toLowerCase()
  return ft === 'pdf'
})

const pdfLoading = ref(false)
const pdfError = ref('')
const pdfContainerRef = ref<HTMLElement | null>(null)

/** 加载并渲染 PDF（通过 fetch 带鉴权拉取，避免 axios 对 blob 的二次处理） */
const loadPdf = async () => {
  const url = fullFileUrl.value
  if (!url || !pdfContainerRef.value) return
  pdfLoading.value = true
  pdfError.value = ''
  try {
    const token = getAccessToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = 'Bearer ' + token
    if (import.meta.env.VITE_APP_TENANT_ENABLE === 'true') {
      const tenantId = getTenantId()
      if (tenantId) headers['tenant-id'] = String(tenantId)
      const visitTenantId = getVisitTenantId()
      if (token && visitTenantId) headers['visit-tenant-id'] = String(visitTenantId)
    }
    const res = await fetch(url, { headers })
    if (!res.ok) {
      const text = await res.text()
      let errMsg = `请求失败 (${res.status})`
      try {
        const json = JSON.parse(text)
        errMsg = json.msg || json.message || errMsg
      } catch {}
      pdfError.value = errMsg + '，请尝试下载后查看'
      return
    }
    const blob = await res.blob()
    if (blob.type === 'application/json') {
      const text = await blob.text()
      let errMsg = '文件加载失败'
      try {
        const json = JSON.parse(text)
        errMsg = json.msg || json.message || errMsg
      } catch {}
      pdfError.value = errMsg + '，请尝试下载后查看'
      return
    }
    const arrayBuffer = await blob.arrayBuffer()
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
    const numPages = pdf.numPages
    // 再次获取容器（可能因异步期间组件重渲染而变化）
    const target = pdfContainerRef.value
    if (!target) return
    target.innerHTML = ''
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width
      canvas.className = 'pdf-page-canvas'
      target.appendChild(canvas)
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise
      }
    }
  } catch (e) {
    console.error('PDF 加载失败:', e)
    pdfError.value = 'PDF 加载失败，可能是文件不可访问或格式异常'
  } finally {
    pdfLoading.value = false
  }
}

const onPreviewError = () => {
  message.warning('文档加载失败，可能是跨域或文件不可访问，请尝试下载后查看')
}

const handlePreview = async (row: any) => {
  if (row.type === 2) {
    previewDoc.value = row
    previewVisible.value = true
    return
  }
  if (row.type === 3) {
    window.open(row.fileUrl, '_blank')
    return
  }
  try {
    const data = await DocApi.getDoc(row.id)
    previewDoc.value = data
    previewVisible.value = true
  } catch {}
}

watch(
  () => [previewVisible.value, fullFileUrl.value, isPdf.value] as const,
  ([visible, url, pdf]) => {
    if (visible && url && pdf) {
      nextTick(() => loadPdf())
    }
  }
)

onMounted(() => {
  getCategoryTree()
  getList()
})
</script>
<style scoped>
.doc-preview-wrap {
  min-height: 600px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}
.doc-preview {
  width: 100%;
  height: 75vh;
}

/* PDF 预览 */
.pdf-preview-wrap {
  min-height: 600px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: auto;
}
.pdf-canvas-wrap {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.pdf-canvas-wrap .pdf-page-canvas {
  max-width: 100%;
  height: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: #fff;
}

/* Word 文档预览 - 企业级样式增强 */
:deep(.doc-preview-wrap .vue-office-docx) {
  background: #fff;
  padding: 40px 60px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
:deep(.doc-preview-wrap .docx-wrapper) {
  background: #fff;
  max-width: 210mm;
  margin: 0 auto;
  padding: 24px 0;
}
:deep(.doc-preview-wrap .docx-wrapper > section.docx) {
  background: #fff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 32px 48px !important;
  margin-bottom: 24px;
  border-radius: 2px;
}
/* 表格样式 - 企业标准 */
:deep(.doc-preview-wrap table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
:deep(.doc-preview-wrap td),
:deep(.doc-preview-wrap th) {
  border: 1px solid #e0e0e0;
  padding: 10px 14px;
  text-align: left;
  vertical-align: middle;
}
:deep(.doc-preview-wrap th) {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}
:deep(.doc-preview-wrap tr:nth-child(even)) {
  background: #fafafa;
}
:deep(.doc-preview-wrap tr:hover) {
  background: #f5f7fa;
}
/* 标题层级 */
:deep(.doc-preview-wrap h1),
:deep(.doc-preview-wrap h2),
:deep(.doc-preview-wrap h3),
:deep(.doc-preview-wrap h4) {
  margin: 20px 0 12px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
}
:deep(.doc-preview-wrap h1) { font-size: 22px; }
:deep(.doc-preview-wrap h2) { font-size: 18px; }
:deep(.doc-preview-wrap h3) { font-size: 16px; }
:deep(.doc-preview-wrap h4) { font-size: 14px; }
/* 段落与列表 */
:deep(.doc-preview-wrap p) {
  margin: 8px 0;
  line-height: 1.75;
  color: #333;
  font-size: 14px;
}
:deep(.doc-preview-wrap ul),
:deep(.doc-preview-wrap ol) {
  margin: 8px 0;
  padding-left: 24px;
  line-height: 1.75;
}
</style>

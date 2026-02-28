/**
 * 从后端菜单缓存中解析快捷入口的实际路由路径
 * 解决硬编码路径与后端菜单 path 不一致导致的 404 问题
 */
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import { pathResolve } from '@/utils/routerHelper'

interface MenuItem {
  path?: string
  component?: string
  name?: string
  children?: MenuItem[]
}

/** 递归收集所有叶子菜单的完整路径 */
function collectMenuPaths(
  menus: MenuItem[],
  parentPath = '',
  result: Map<string, string> = new Map()
): Map<string, string> {
  for (const menu of menus || []) {
    const path = menu.path || ''
    if (!path || path.startsWith('http')) continue

    const fullPath = pathResolve(parentPath, path)

    if (menu.component) {
      // 叶子菜单：用 component 路径作为 key（不含 index、.vue）
      const compKey = menu.component.replace(/\/index$/, '').replace(/\.(vue|tsx)$/, '')
      result.set(compKey, fullPath)
      // 也存储带 index 的变体
      if (!compKey.endsWith('/index')) {
        result.set(compKey + '/index', fullPath)
      }
    }

    if (menu.children?.length) {
      collectMenuPaths(menu.children, fullPath, result)
    }
  }
  return result
}

/** 快捷入口与 component 匹配规则及默认路径 */
const SHORTCUT_CONFIG: Record<
  string,
  { patterns: string[]; fallback: string }
> = {
  processInstanceCreate: {
    patterns: ['processInstance/create', 'process-instance/create'],
    fallback: '/bpm/process-instance/create'
  },
  oaLeave: {
    patterns: ['oa/leave'],
    fallback: '/bpm/oa/leave'
  },
  taskTodo: {
    patterns: ['task/todo'],
    fallback: '/bpm/task/todo'
  },
  taskDone: {
    patterns: ['task/done'],
    fallback: '/bpm/task/done'
  },
  taskCopy: {
    patterns: ['task/copy', 'processInstance/copy', 'process-instance/copy'],
    fallback: '/bpm/task/copy'
  },
  processInstanceMy: {
    patterns: ['processInstance', 'process-instance'],
    fallback: '/bpm/process-instance'
  },
  systemUser: {
    patterns: ['system/user'],
    fallback: '/system/user'
  },
  systemDept: {
    patterns: ['system/dept'],
    fallback: '/system/dept'
  },
  systemNotice: {
    patterns: ['system/notice', 'notice'],
    fallback: '/system/messages/notice'
  }
}

export function useMenuPath() {
  const { wsCache } = useCache()

  /** 从菜单缓存解析路径 */
  function resolveShortcutPath(key: keyof typeof SHORTCUT_CONFIG): string {
    const menus = wsCache.get(CACHE_KEY.ROLE_ROUTERS) as MenuItem[] | undefined
    const config = SHORTCUT_CONFIG[key]
    if (!config) return '/'

    if (!menus?.length) {
      return config.fallback
    }

    const pathMap = collectMenuPaths(menus)

    // 精确匹配：遍历 pathMap 找包含 pattern 的
    let bestMatch: string | null = null
    for (const pattern of config.patterns) {
      for (const [compKey, fullPath] of pathMap) {
        if (!compKey.includes(pattern)) continue
        // processInstanceMy 需排除 create 子路径
        if (key === 'processInstanceMy' && compKey.includes('create')) continue
        bestMatch = fullPath
        break
      }
      if (bestMatch) break
    }

    return bestMatch ?? config.fallback
  }

  return { resolveShortcutPath }
}

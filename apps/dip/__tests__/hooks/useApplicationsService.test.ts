import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useApplicationsService } from '@/hooks/useApplicationsService'
import { getApplications } from '@/apis'
import { WENSHU_APP_KEY } from '@/routes/types'

vi.mock('@/apis', () => ({
  getApplications: vi.fn(),
}))

describe('useApplicationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty apps when autoLoad is false', () => {
    const { result } = renderHook(() => useApplicationsService({ autoLoad: false }))

    expect(result.current.apps).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should mark built-in wenshu app correctly', async () => {
    const mockApps = [
      { id: 1, key: 'normal-app', name: '普通应用' },
      { id: 2, key: WENSHU_APP_KEY, name: '问数' },
    ] as any
    ;(getApplications as vi.Mock).mockResolvedValue(mockApps)

    const { result } = renderHook(() => useApplicationsService({ autoLoad: true }))

    // Wait for the async fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.apps).toHaveLength(2)
    expect(result.current.apps[0].isBuiltIn).toBe(false)
    expect(result.current.apps[1].isBuiltIn).toBe(true)
  })

  it('should update existing app when updateApp is called', async () => {
    const mockApps = [
      { id: 1, name: '旧名称', key: 'test' },
      { id: 2, name: '第二个', key: 'test2' },
    ] as any
    ;(getApplications as vi.Mock).mockResolvedValue(mockApps)

    const { result } = renderHook(() => useApplicationsService({ autoLoad: true }))
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    act(() => {
      result.current.updateApp({ id: 1, name: '新名称', key: 'test' } as any)
    })

    expect(result.current.apps[0].name).toBe('新名称')
    expect(result.current.apps[1].name).toBe('第二个')
  })
})

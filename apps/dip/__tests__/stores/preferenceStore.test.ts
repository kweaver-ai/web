import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePreferenceStore } from '@/stores/preferenceStore'
import { getApplications, pinMicroAppApi } from '@/apis'
import { message } from 'antd'
import { WENSHU_APP_KEY } from '@/routes/types'

vi.mock('@/apis', () => ({
  getApplications: vi.fn(),
  pinMicroAppApi: vi.fn(),
}))

vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/routes/types', () => ({
  WENSHU_APP_KEY: 'wenshu',
}))

describe('preferenceStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置store状态
    usePreferenceStore.setState({
      pinnedMicroApps: [],
      wenshuAppInfo: null,
      loading: false,
    })
  })

  it('should have initial state', () => {
    const { pinnedMicroApps, wenshuAppInfo, loading } = usePreferenceStore.getState()
    expect(pinnedMicroApps).toEqual([])
    expect(wenshuAppInfo).toBeNull()
    expect(loading).toBe(false)
  })

  it('should have all methods available', () => {
    const state = usePreferenceStore.getState()
    expect('fetchPinnedMicroApps' in state).toBe(true)
    expect('pinMicroApp' in state).toBe(true)
    expect('unpinMicroApp' in state).toBe(true)
    expect('isPinned' in state).toBe(true)
    expect('togglePin' in state).toBe(true)
  })

  it('isPinned should return correct status', () => {
    const testApps = [
      { id: 1, name: '应用1', pinned: true, key: 'app1' },
    ]
    usePreferenceStore.setState({ pinnedMicroApps: testApps })

    const { isPinned } = usePreferenceStore.getState()
    expect(isPinned(1)).toBe(true)
    expect(isPinned(2)).toBe(false)
    expect(isPinned(3)).toBe(false)
  })

  it('fetchPinnedMicroApps should fetch and filter pinned apps', async () => {
    const mockApps = [
      { id: 1, name: '应用1', pinned: true, key: 'app1' },
      { id: 2, name: '应用2', pinned: false, key: 'app2' },
      { id: 3, name: '文书应用', pinned: true, key: 'wenshu' },
    ]
    ;(getApplications as vi.Mock).mockResolvedValue(mockApps)

    const { fetchPinnedMicroApps } = usePreferenceStore.getState()
    
    expect(usePreferenceStore.getState().loading).toBe(false)
    const promise = fetchPinnedMicroApps()
    expect(usePreferenceStore.getState().loading).toBe(true)
    
    await promise
    
    expect(getApplications).toHaveBeenCalled()
    const { pinnedMicroApps, wenshuAppInfo, loading } = usePreferenceStore.getState()
    expect(pinnedMicroApps).toEqual([mockApps[0], mockApps[2]])
    expect(wenshuAppInfo).toEqual(mockApps[2])
    expect(loading).toBe(false)
  })

  it('pinMicroApp should pin an app successfully', async () => {
    ;(pinMicroAppApi as vi.Mock).mockResolvedValue({})
    ;(getApplications as vi.Mock).mockResolvedValue([
      { id: 1, name: '应用1', pinned: true, key: 'app1' },
    ])

    const { pinMicroApp, isPinned } = usePreferenceStore.getState()
    
    const result = await pinMicroApp(1)
    
    expect(pinMicroAppApi).toHaveBeenCalledWith({ appId: 1, pinned: true })
    expect(getApplications).toHaveBeenCalled()
    expect(message.success).toHaveBeenCalledWith('固定成功')
    expect(result).toBe(true)
    expect(isPinned(1)).toBe(true)
  })

  it('pinMicroApp should return true if app is already pinned', async () => {
    const testApp = { id: 1, name: '应用1', pinned: true, key: 'app1' }
    usePreferenceStore.setState({ pinnedMicroApps: [testApp] })

    const { pinMicroApp } = usePreferenceStore.getState()
    const result = await pinMicroApp(1)
    
    expect(pinMicroAppApi).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('pinMicroApp should handle error', async () => {
    ;(pinMicroAppApi as vi.Mock).mockRejectedValue({ description: '固定失败' })

    const { pinMicroApp, isPinned } = usePreferenceStore.getState()
    const result = await pinMicroApp(1)
    
    expect(pinMicroAppApi).toHaveBeenCalled()
    expect(message.error).toHaveBeenCalledWith('固定失败')
    expect(result).toBe(false)
    expect(isPinned(1)).toBe(false)
  })

  it('unpinMicroApp should unpin an app successfully', async () => {
    const testApp = { id: 1, name: '应用1', pinned: true, key: 'app1' }
    usePreferenceStore.setState({ pinnedMicroApps: [testApp] })
    ;(pinMicroAppApi as vi.Mock).mockResolvedValue({})

    const { unpinMicroApp, isPinned } = usePreferenceStore.getState()
    const result = await unpinMicroApp(1)
    
    expect(pinMicroAppApi).toHaveBeenCalledWith({ appId: 1, pinned: false })
    expect(message.success).toHaveBeenCalledWith('已取消固定')
    expect(result).toBe(true)
    expect(isPinned(1)).toBe(false)
  })

  it('unpinMicroApp should return true if app is not pinned', async () => {
    const { unpinMicroApp } = usePreferenceStore.getState()
    const result = await unpinMicroApp(1)
    
    expect(pinMicroAppApi).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('unpinMicroApp should work without request when needRequest is false', async () => {
    const testApp = { id: 1, name: '应用1', pinned: true, key: 'app1' }
    usePreferenceStore.setState({ pinnedMicroApps: [testApp] })

    const { unpinMicroApp, isPinned } = usePreferenceStore.getState()
    const result = await unpinMicroApp(1, false)
    
    expect(pinMicroAppApi).not.toHaveBeenCalled()
    expect(result).toBe(true)
    expect(isPinned(1)).toBe(false)
  })

  it('togglePin should pin an unpinned app', async () => {
    ;(pinMicroAppApi as vi.Mock).mockResolvedValue({})
    ;(getApplications as vi.Mock).mockResolvedValue([
      { id: 1, name: '应用1', pinned: true, key: 'app1' },
    ])

    const { togglePin, isPinned } = usePreferenceStore.getState()
    expect(isPinned(1)).toBe(false)
    
    const result = await togglePin(1)
    
    expect(result).toBe(true)
    expect(isPinned(1)).toBe(true)
  })

  it('togglePin should unpin a pinned app', async () => {
    const testApp = { id: 1, name: '应用1', pinned: true, key: 'app1' }
    usePreferenceStore.setState({ pinnedMicroApps: [testApp] })
    ;(pinMicroAppApi as vi.Mock).mockResolvedValue({})

    const { togglePin, isPinned } = usePreferenceStore.getState()
    expect(isPinned(1)).toBe(true)
    
    const result = await togglePin(1)
    
    expect(result).toBe(true)
    expect(isPinned(1)).toBe(false)
  })

  it('fetchPinnedMicroApps should prevent duplicate requests', async () => {
    const mockApps = [{ id: 1, name: '应用1', pinned: true, key: 'app1' }]
    ;(getApplications as vi.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockApps), 10))
    )

    const { fetchPinnedMicroApps } = usePreferenceStore.getState()
    
    // 同时调用两次
    const promise1 = fetchPinnedMicroApps()
    const promise2 = fetchPinnedMicroApps()
    
    await Promise.all([promise1, promise2])
    
    // 应该只调用一次API
    expect(getApplications).toHaveBeenCalledTimes(1)
  })
})

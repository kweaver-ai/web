import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUserInfoStore } from '@/stores/userInfoStore'
import { getLogoutUrl, getUserInfo } from '@/apis'
import { getAccessToken } from '@/utils/http/token-config'

vi.mock('@/apis', () => ({
  getLogoutUrl: vi.fn().mockReturnValue('https://example.com/logout'),
  getUserInfo: vi.fn(),
}))

vi.mock('@/utils/http/token-config', () => ({
  getAccessToken: vi.fn().mockReturnValue('test-token'),
}))

describe('userInfoStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置store状态
    useUserInfoStore.setState({
      userInfo: null,
      isLoading: false,
    })
    // mock window.location.replace
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://test.example.com',
        replace: vi.fn(),
      },
      configurable: true,
      writable: true,
    })
  })

  it('should have initial state', () => {
    const { userInfo, isLoading } = useUserInfoStore.getState()
    expect(userInfo).toBeNull()
    expect(isLoading).toBe(false)
  })

  it('should have all methods available', () => {
    const state = useUserInfoStore.getState()
    expect('setUserInfo' in state).toBe(true)
    expect('logout' in state).toBe(true)
    expect('fetchUserInfo' in state).toBe(true)
    expect(typeof state.setUserInfo).toBe('function')
    expect(typeof state.logout).toBe('function')
    expect(typeof state.fetchUserInfo).toBe('function')
  })

  it('should update userInfo when setUserInfo is called', () => {
    const testUser = { id: '1', name: '测试用户', email: 'test@example.com' } as any
    const { setUserInfo } = useUserInfoStore.getState()
    
    setUserInfo(testUser)
    
    const { userInfo } = useUserInfoStore.getState()
    expect(userInfo).toEqual(testUser)
  })

  it('should redirect to logout url when logout is called', () => {
    const { logout } = useUserInfoStore.getState()
    
    logout()
    
    expect(getLogoutUrl).toHaveBeenCalled()
    expect(window.location.replace).toHaveBeenCalledWith('https://example.com/logout')
    
    const { userInfo } = useUserInfoStore.getState()
    expect(userInfo).toBeNull()
  })

  it('should not fetch user info when no token exists', async () => {
    ;(getAccessToken as vi.Mock).mockReturnValue('')
    const { fetchUserInfo } = useUserInfoStore.getState()
    
    await fetchUserInfo()
    
    expect(getUserInfo).not.toHaveBeenCalled()
    const { userInfo, isLoading } = useUserInfoStore.getState()
    expect(userInfo).toBeNull()
    expect(isLoading).toBe(false)
  })

  it('should fetch user info successfully', async () => {
    const testUser = { id: '1', name: '测试用户', email: 'test@example.com' } as any
    ;(getAccessToken as vi.Mock).mockReturnValue('test-token')
    ;(getUserInfo as vi.Mock).mockResolvedValue(testUser)
    const { fetchUserInfo } = useUserInfoStore.getState()
    
    await fetchUserInfo()
    
    expect(getUserInfo).toHaveBeenCalled()
    const { userInfo, isLoading } = useUserInfoStore.getState()
    expect(userInfo).toEqual(testUser)
    expect(isLoading).toBe(false)
  })
})

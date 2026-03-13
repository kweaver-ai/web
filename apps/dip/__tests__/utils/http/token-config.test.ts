import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Cookies from 'js-cookie'
import axios from 'axios'
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  defaultRefreshToken,
  clearAuthCookies,
  httpConfig,
} from '@/utils/http/token-config'

vi.mock('axios')
vi.mock('js-cookie')
vi.mock('@/routes/utils', () => ({
  removeBasePath: vi.fn((path) => path.replace('/dip-hub', '')),
}))
vi.mock('@/utils/config', () => ({
  BASE_PATH: '/dip-hub',
  getFullPath: vi.fn((path) => `/dip-hub${path}`),
  normalizePath: vi.fn((path) => path.replace(/\/$/, '')),
}))

describe('token-config', () => {
  const originalWindow = window
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    // 重置window.location
    delete (window as any).location
    window.location = new URL('http://example.com/dip-hub/dashboard') as Location
    // 重置import.meta.env
    vi.stubEnv('DEV', 'false')
    vi.stubEnv('PUBLIC_TOKEN', '')
    vi.stubEnv('PUBLIC_REFRESH_TOKEN', '')
    // 重置Cookies mock
    ;(Cookies.get as vi.Mock).mockImplementation((key: string) => {
      if (key === 'dip.oauth2_token') return 'test-access-token'
      if (key === 'dip.refresh_token') return 'test-refresh-token'
      return undefined
    })
  })

  afterEach(() => {
    window.location = originalLocation
    vi.unstubAllEnvs()
  })

  describe('getAccessToken', () => {
    it('should return access token from cookie', () => {
      expect(getAccessToken()).toBe('test-access-token')
      expect(Cookies.get).toHaveBeenCalledWith('dip.oauth2_token')
    })

    it('should return PUBLIC_TOKEN from env in dev mode when cookie is not present', () => {
      import.meta.env.DEV = true
      import.meta.env.PUBLIC_TOKEN = 'dev-public-token'
      ;(Cookies.get as vi.Mock).mockReturnValue(undefined)

      expect(getAccessToken()).toBe('dev-public-token')
    })

    it('should return empty string when no token available', () => {
      ;(Cookies.get as vi.Mock).mockReturnValue(undefined)
      expect(getAccessToken()).toBe('')
    })
  })

  describe('setAccessToken', () => {
    it('should set access token and refresh token to cookies', () => {
      setAccessToken('new-access-token', 'new-refresh-token')

      expect(Cookies.set).toHaveBeenCalledTimes(2)
      expect(Cookies.set).toHaveBeenCalledWith(
        'dip.oauth2_token',
        'new-access-token',
        expect.objectContaining({
          domain: 'example.com',
          path: '/',
        })
      )
      expect(Cookies.set).toHaveBeenCalledWith(
        'dip.refresh_token',
        'new-refresh-token',
        expect.objectContaining({
          domain: 'example.com',
          path: '/',
        })
      )
    })
  })

  describe('getRefreshToken', () => {
    it('should return refresh token from cookie', () => {
      expect(getRefreshToken()).toBe('test-refresh-token')
      expect(Cookies.get).toHaveBeenCalledWith('dip.refresh_token')
    })

    it('should return PUBLIC_REFRESH_TOKEN from env in dev mode when cookie is not present', () => {
      import.meta.env.DEV = true
      import.meta.env.PUBLIC_REFRESH_TOKEN = 'dev-public-refresh-token'
      ;(Cookies.get as vi.Mock).mockReturnValue(undefined)

      expect(getRefreshToken()).toBe('dev-public-refresh-token')
    })

    it('should return empty string when no refresh token available', () => {
      ;(Cookies.get as vi.Mock).mockReturnValue(undefined)
      expect(getRefreshToken()).toBe('')
    })
  })

  describe('defaultRefreshToken', () => {
    it('should send refresh token request and update access token', async () => {
      ;(axios.get as vi.Mock).mockResolvedValue({
        data: { access_token: 'new-refreshed-token' },
      })

      const result = await defaultRefreshToken()

      expect(axios.get).toHaveBeenCalledWith('/api/dip-hub/v1/refresh-token', {
        withCredentials: true,
      })
      expect(Cookies.set).toHaveBeenCalledWith(
        'dip.oauth2_token',
        'new-refreshed-token',
        expect.any(Object)
      )
      expect(result).toEqual({ accessToken: 'new-refreshed-token' })
    })

    it('should throw error when refresh token response has no access_token', async () => {
      ;(axios.get as vi.Mock).mockResolvedValue({ data: {} })

      await expect(defaultRefreshToken()).rejects.toThrow(
        '刷新 token 接口未返回 access_token'
      )
    })

    it('should only send one request even when called multiple times in parallel', async () => {
      ;(axios.get as vi.Mock).mockResolvedValue({
        data: { access_token: 'new-refreshed-token' },
      })

      const promises = [defaultRefreshToken(), defaultRefreshToken(), defaultRefreshToken()]
      const results = await Promise.all(promises)

      expect(axios.get).toHaveBeenCalledTimes(1)
      results.forEach((result) => {
        expect(result).toEqual({ accessToken: 'new-refreshed-token' })
      })
    })
  })

  describe('clearAuthCookies', () => {
    it('should remove all auth related cookies', () => {
      clearAuthCookies()

      expect(Cookies.remove).toHaveBeenCalledTimes(4)
      expect(Cookies.remove).toHaveBeenCalledWith('dip.oauth2_token', expect.any(Object))
      expect(Cookies.remove).toHaveBeenCalledWith('dip.refresh_token', expect.any(Object))
      expect(Cookies.remove).toHaveBeenCalledWith('dip.session_id', expect.any(Object))
      expect(Cookies.remove).toHaveBeenCalledWith('dip.userid', expect.any(Object))
    })
  })

  describe('httpConfig', () => {
    it('accessToken getter should return latest access token from cookie', () => {
      expect(httpConfig.accessToken).toBe('test-access-token')
      
      ;(Cookies.get as vi.Mock).mockReturnValue('updated-access-token')
      expect(httpConfig.accessToken).toBe('updated-access-token')
    })
  })
})

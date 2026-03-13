import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { microAppLoadFailureManager } from '@/utils/micro-app/loadFailureManager'

describe('loadFailureManager', () => {
  const originalSessionStorage = sessionStorage
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'production'
    
    // 清空sessionStorage
    sessionStorage.clear()
    sessionStorage.removeItem('DIP_HUB_MICRO_APP_FAILURES')
    sessionStorage.removeItem('DIP_HUB_PAGE_LOAD_TIME')
    
    // 清除所有现有的失败记录
    microAppLoadFailureManager.clearAll()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    microAppLoadFailureManager.clearAll()
  })

  describe('initialization', () => {
    it('should initialize with empty failures', () => {
      expect(microAppLoadFailureManager.hasFailed('test-app')).toBe(false)
      expect(microAppLoadFailureManager.getFailureInfo('test-app')).toBeNull()
    })
  })

  describe('recordFailure', () => {
    it('should record failure correctly', () => {
      const now = Date.now()
      vi.useFakeTimers().setSystemTime(now)

      microAppLoadFailureManager.recordFailure('test-app', '测试应用', '/test/app', '加载失败')

      expect(microAppLoadFailureManager.hasFailed('test-app')).toBe(true)
      const failureInfo = microAppLoadFailureManager.getFailureInfo('test-app')
      expect(failureInfo).toEqual({
        failedAt: now,
        error: '加载失败',
        appName: '测试应用',
        entry: '/test/app',
      })

      // 验证是否保存到sessionStorage
      const stored = JSON.parse(sessionStorage.getItem('DIP_HUB_MICRO_APP_FAILURES') || '{}')
      expect(stored['test-app']).toEqual(failureInfo)

      vi.useRealTimers()
    })

    it('should handle Error object correctly', () => {
      const testError = new Error('网络请求失败')
      microAppLoadFailureManager.recordFailure('test-app', '测试应用', '/test/app', testError)

      const failureInfo = microAppLoadFailureManager.getFailureInfo('test-app')
      expect(failureInfo?.error).toBe('网络请求失败')
    })
  })

  describe('hasFailed', () => {
    it('should return false for non-existent app', () => {
      expect(microAppLoadFailureManager.hasFailed('non-existent-app')).toBe(false)
    })

    it('should return false for expired failure', () => {
      const now = Date.now()
      
      // 记录一个5分半前的失败
      vi.useFakeTimers().setSystemTime(now - 5.5 * 60 * 1000)
      microAppLoadFailureManager.recordFailure('test-app', '测试应用', '/test/app', '加载失败')
      
      // 快进到现在
      vi.useFakeTimers().setSystemTime(now)
      expect(microAppLoadFailureManager.hasFailed('test-app')).toBe(false)

      vi.useRealTimers()
    })

    it('should return true for valid failure', () => {
      microAppLoadFailureManager.recordFailure('test-app', '测试应用', '/test/app', '加载失败')
      expect(microAppLoadFailureManager.hasFailed('test-app')).toBe(true)
    })
  })

  describe('getFailureInfo', () => {
    it('should return null for non-existent app', () => {
      expect(microAppLoadFailureManager.getFailureInfo('non-existent-app')).toBeNull()
    })

    it('should return null for expired failure', () => {
      const now = Date.now()
      
      vi.useFakeTimers().setSystemTime(now - 6 * 60 * 1000)
      microAppLoadFailureManager.recordFailure('test-app', '测试应用', '/test/app', '加载失败')
      
      vi.useFakeTimers().setSystemTime(now)
      expect(microAppLoadFailureManager.getFailureInfo('test-app')).toBeNull()

      vi.useRealTimers()
    })

    it('should return correct failure info for valid failure', () => {
      const now = Date.now()
      vi.useFakeTimers().setSystemTime(now)

      microAppLoadFailureManager.recordFailure('test-app', '测试应用', '/test/app', '加载失败')
      const failureInfo = microAppLoadFailureManager.getFailureInfo('test-app')
      
      expect(failureInfo).toEqual({
        failedAt: now,
        error: '加载失败',
        appName: '测试应用',
        entry: '/test/app',
      })

      vi.useRealTimers()
    })
  })

  describe('clearFailure', () => {
    it('should clear specific failure record', () => {
      microAppLoadFailureManager.recordFailure('app1', '应用1', '/app1', '失败1')
      microAppLoadFailureManager.recordFailure('app2', '应用2', '/app2', '失败2')

      microAppLoadFailureManager.clearFailure('app1')

      expect(microAppLoadFailureManager.hasFailed('app1')).toBe(false)
      expect(microAppLoadFailureManager.hasFailed('app2')).toBe(true)

      // 验证sessionStorage也更新了
      const stored = JSON.parse(sessionStorage.getItem('DIP_HUB_MICRO_APP_FAILURES') || '{}')
      expect(stored['app1']).toBeUndefined()
      expect(stored['app2']).toBeDefined()
    })
  })

  describe('clearAll', () => {
    it('should clear all failure records', () => {
      microAppLoadFailureManager.recordFailure('app1', '应用1', '/app1', '失败1')
      microAppLoadFailureManager.recordFailure('app2', '应用2', '/app2', '失败2')

      microAppLoadFailureManager.clearAll()

      expect(microAppLoadFailureManager.hasFailed('app1')).toBe(false)
      expect(microAppLoadFailureManager.hasFailed('app2')).toBe(false)
      expect(sessionStorage.getItem('DIP_HUB_MICRO_APP_FAILURES')).toBeNull()
    })
  })

  describe('page load detection', () => {
    it('should get page load time', () => {
      const pageLoadTime = microAppLoadFailureManager.getPageLoadTime()
      expect(pageLoadTime).toBeGreaterThan(0)
    })
  })
})

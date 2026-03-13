import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  setMicroAppGlobalState,
  onMicroAppGlobalStateChange,
  offMicroAppGlobalStateChange,
  getMicroAppGlobalState,
} from '@/utils/micro-app/globalState'
import { useLanguageStore } from '@/stores/languageStore'
import shallowEqual from '@/utils/handle-function/ShallowEqual'

vi.mock('@/stores/languageStore', () => ({
  useLanguageStore: {
    getState: vi.fn().mockReturnValue({ language: 'zh-CN' }),
  },
}))

vi.mock('@/utils/handle-function/ShallowEqual', () => ({
  default: vi.fn((a, b) => JSON.stringify(a) === JSON.stringify(b)),
}))

describe('micro-app globalState', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'production' // 默认关闭调试模式
    // 重置状态：先清空所有监听器，再重置状态为初始值
    offMicroAppGlobalStateChange()
    setMicroAppGlobalState(
      {
        language: 'zh-CN',
        breadcrumb: [],
        copilot: undefined,
      },
      { allowAllFields: true }
    )
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const state = getMicroAppGlobalState()
      expect(state).toEqual({
        language: 'zh-CN',
        breadcrumb: [],
      })
    })
  })

  describe('setMicroAppGlobalState', () => {
    it('should allow micro-app to update allowed fields (breadcrumb)', () => {
      const testBreadcrumb = [{ name: '首页', path: '/' }]
      const result = setMicroAppGlobalState({ breadcrumb: testBreadcrumb })
      
      expect(result).toBe(true)
      expect(getMicroAppGlobalState().breadcrumb).toEqual(testBreadcrumb)
    })

    it('should filter out disallowed fields when updated by micro-app', () => {
      const result = setMicroAppGlobalState({
        breadcrumb: [{ name: '首页' }],
        language: 'en-US', // 不允许微应用更新
        userId: '123', // 不允许的字段
      })
      
      expect(result).toBe(true)
      const state = getMicroAppGlobalState()
      expect(state.breadcrumb).toEqual([{ name: '首页' }])
      expect(state.language).toBe('zh-CN') // 没有被更新
      expect(state.userId).toBeUndefined() // 没有被添加
    })

    it('should return false when no valid fields to update', () => {
      const result = setMicroAppGlobalState({
        language: 'en-US', // 不允许的字段
        unknownField: 'test', // 不允许的字段
      })
      
      expect(result).toBe(false)
      expect(getMicroAppGlobalState().language).toBe('zh-CN')
    })

    it('should allow main-app to update all fields when allowAllFields is true', () => {
      const result = setMicroAppGlobalState(
        {
          language: 'en-US',
          breadcrumb: [{ name: '首页' }],
          userId: '123',
          copilot: { clickedAt: 123456 },
        },
        { allowAllFields: true }
      )
      
      expect(result).toBe(true)
      const state = getMicroAppGlobalState()
      expect(state.language).toBe('en-US')
      expect(state.breadcrumb).toEqual([{ name: '首页' }])
      expect(state.userId).toBe('123')
      expect(state.copilot).toEqual({ clickedAt: 123456 })
    })

    it('should return false when state does not change (shallow equal)', () => {
      const breadcrumb = [{ name: '首页' }]
      // 第一次更新
      setMicroAppGlobalState({ breadcrumb })
      // 第二次更新相同的内容
      const result = setMicroAppGlobalState({ breadcrumb })
      
      expect(result).toBe(false)
      expect(shallowEqual).toHaveBeenCalled()
    })
  })

  describe('onMicroAppGlobalStateChange', () => {
    it('should register listener and trigger on state change', () => {
      const mockListener = vi.fn()
      onMicroAppGlobalStateChange(mockListener)
      
      setMicroAppGlobalState({ breadcrumb: [{ name: '首页' }] })
      
      expect(mockListener).toHaveBeenCalledTimes(1)
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({ breadcrumb: [{ name: '首页' }] }),
        expect.objectContaining({ breadcrumb: [] })
      )
    })

    it('should fire immediately when fireImmediately is true', () => {
      const mockListener = vi.fn()
      onMicroAppGlobalStateChange(mockListener, true)
      
      expect(mockListener).toHaveBeenCalledTimes(1)
      const state = getMicroAppGlobalState()
      expect(mockListener).toHaveBeenCalledWith(state, state)
    })

    it('should return unsubscribe function that removes listener', () => {
      const mockListener = vi.fn()
      const unsubscribe = onMicroAppGlobalStateChange(mockListener)
      
      unsubscribe()
      setMicroAppGlobalState({ breadcrumb: [{ name: '首页' }] })
      
      expect(mockListener).not.toHaveBeenCalled()
    })

    it('should limit maximum number of listeners', () => {
      // 先注册50个监听器
      const listeners: (() => void)[] = []
      for (let i = 0; i < 50; i++) {
        const unsubscribe = onMicroAppGlobalStateChange(vi.fn())
        listeners.push(unsubscribe)
      }
      
      // 第51个监听器应该被拒绝，返回空函数
      const extraListener = vi.fn()
      const unsubscribeExtra = onMicroAppGlobalStateChange(extraListener)
      
      setMicroAppGlobalState({ breadcrumb: [{ name: '首页' }] })
      expect(extraListener).not.toHaveBeenCalled() // 不会被触发
      
      // 清理
      listeners.forEach((unsubscribe) => unsubscribe())
      unsubscribeExtra()
    })

    it('should call all listeners when state changes', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      
      onMicroAppGlobalStateChange(listener1)
      onMicroAppGlobalStateChange(listener2)
      
      setMicroAppGlobalState({ breadcrumb: [{ name: '首页' }] })
      
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('should not fail when a listener throws error', () => {
      const badListener = vi.fn(() => { throw new Error('Listener error') })
      const goodListener = vi.fn()
      
      onMicroAppGlobalStateChange(badListener)
      onMicroAppGlobalStateChange(goodListener)
      
      // 应该不会抛出异常
      expect(() => {
        setMicroAppGlobalState({ breadcrumb: [{ name: '首页' }] })
      }).not.toThrow()
      
      expect(goodListener).toHaveBeenCalledTimes(1)
    })
  })

  describe('offMicroAppGlobalStateChange', () => {
    it('should remove all listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      
      onMicroAppGlobalStateChange(listener1)
      onMicroAppGlobalStateChange(listener2)
      
      offMicroAppGlobalStateChange()
      
      setMicroAppGlobalState({ breadcrumb: [{ name: '首页' }] })
      
      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
    })
  })

  describe('getMicroAppGlobalState', () => {
    it('should return a copy of state, not the reference', () => {
      const state1 = getMicroAppGlobalState()
      state1.breadcrumb = [{ name: '修改的面包屑' }] // 修改返回的对象
      
      const state2 = getMicroAppGlobalState()
      expect(state2.breadcrumb).toEqual([]) // 原始状态没有被修改
    })
  })
})

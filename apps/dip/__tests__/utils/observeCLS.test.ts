import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { observeCLS } from '@/utils/observeCLS'

describe('observeCLS', () => {
  const originalConsoleLog = console.log
  const originalPerformanceObserver = window.PerformanceObserver
  const originalAddEventListener = window.addEventListener

  beforeEach(() => {
    console.log = vi.fn()
    window.addEventListener = vi.fn()
  })

  afterEach(() => {
    console.log = originalConsoleLog
    window.PerformanceObserver = originalPerformanceObserver
    window.addEventListener = originalAddEventListener
    vi.clearAllMocks()
  })

  it('should not run in non-browser environment', () => {
    // @ts-expect-error 模拟没有 window 的环境
    const originalWindow = window
    delete (global as any).window
    
    observeCLS()
    expect(console.log).not.toHaveBeenCalled()
    
    global.window = originalWindow
  })

  it('should not run when PerformanceObserver is not supported', () => {
    delete (window as any).PerformanceObserver
    observeCLS()
    expect(console.log).not.toHaveBeenCalled()
  })

  it('should initialize observer and log start message when supported', () => {
    const mockObserve = vi.fn()
    class MockPerformanceObserver {
      constructor(private callback: any) {}
      observe = mockObserve
    }
    window.PerformanceObserver = MockPerformanceObserver as any

    observeCLS()
    
    expect(mockObserve).toHaveBeenCalledWith({ type: 'layout-shift', buffered: true })
    expect(console.log).toHaveBeenCalledWith(
      '[CLS] 已开启观测，在页面内操作/滚动后可在控制台查看布局偏移与累计 CLS'
    )
  })

  it('should handle layout shift entries correctly', () => {
    let observerCallback: (list: any) => void = () => {}
    const mockObserve = vi.fn()
    
    class MockPerformanceObserver {
      constructor(callback: any) {
        observerCallback = callback
      }
      observe = mockObserve
    }
    window.PerformanceObserver = MockPerformanceObserver as any

    observeCLS()
    vi.clearAllMocks() // 清空初始化日志

    // 模拟一个布局偏移事件
    const mockEntry = {
      hadRecentInput: false,
      value: 0.05,
      sources: [
        {
          node: document.createElement('div'),
          previousRect: { x: 0, y: 0, width: 100, height: 100 },
          currentRect: { x: 0, y: 50, width: 100, height: 100 },
        },
      ],
    }

    observerCallback({
      getEntries: () => [mockEntry],
    })

    // 验证日志输出
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[CLS] 🟢 偏移 #1 value=0.0500 累计 CLS=0.0500'),
      mockEntry
    )
  })

  it('should ignore entries with recent input', () => {
    let observerCallback: (list: any) => void = () => {}
    const mockObserve = vi.fn()
    
    class MockPerformanceObserver {
      constructor(callback: any) {
        observerCallback = callback
      }
      observe = mockObserve
    }
    window.PerformanceObserver = MockPerformanceObserver as any

    observeCLS()
    vi.clearAllMocks() // 清空初始化日志

    // 模拟有用户输入的布局偏移，应该被忽略
    const mockEntry = {
      hadRecentInput: true,
      value: 0.3,
    }

    observerCallback({
      getEntries: () => [mockEntry],
    })

    // 不应该有偏移日志
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('偏移 #'))
  })

  it('should add event listeners for pagehide and visibilitychange', () => {
    class MockPerformanceObserver {
      constructor() {}
      observe = vi.fn()
    }
    window.PerformanceObserver = MockPerformanceObserver as any

    observeCLS()

    expect(window.addEventListener).toHaveBeenCalledTimes(2)
    expect(window.addEventListener).toHaveBeenCalledWith('pagehide', expect.any(Function))
    expect(window.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })
})

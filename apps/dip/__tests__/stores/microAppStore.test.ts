import { describe, it, expect, beforeEach } from 'vitest'
import { useMicroAppStore } from '@/stores/microAppStore'
import type { CurrentMicroAppInfo } from '@/stores/microAppStore'

describe('microAppStore', () => {
  beforeEach(() => {
    // 清空sessionStorage
    sessionStorage.clear()
    // 重置store到初始状态
    useMicroAppStore.setState({
      currentMicroApp: null,
      homeRoute: null,
      appSourceMap: {},
    })
  })

  it('should have correct initial state', () => {
    const { currentMicroApp, homeRoute, appSourceMap } = useMicroAppStore.getState()
    expect(currentMicroApp).toBeNull()
    expect(homeRoute).toBeNull()
    expect(appSourceMap).toEqual({})
  })

  it('should have all methods available', () => {
    const state = useMicroAppStore.getState()
    expect('setCurrentMicroApp' in state).toBe(true)
    expect('setHomeRoute' in state).toBe(true)
    expect('setAppSource' in state).toBe(true)
    expect('clearCurrentMicroApp' in state).toBe(true)
    expect(typeof state.setCurrentMicroApp).toBe('function')
    expect(typeof state.setHomeRoute).toBe('function')
    expect(typeof state.setAppSource).toBe('function')
    expect(typeof state.clearCurrentMicroApp).toBe('function')
  })

  it('should update currentMicroApp when setCurrentMicroApp is called', () => {
    const testMicroApp: CurrentMicroAppInfo = {
      id: 1,
      name: '测试应用',
      routeBasename: '/test/app',
    } as any
    const { setCurrentMicroApp } = useMicroAppStore.getState()

    setCurrentMicroApp(testMicroApp)

    const { currentMicroApp } = useMicroAppStore.getState()
    expect(currentMicroApp).toEqual(testMicroApp)
  })

  it('should update homeRoute when setHomeRoute is called', () => {
    const { setHomeRoute } = useMicroAppStore.getState()
    const testRoute = '/test/home'

    setHomeRoute(testRoute)

    const { homeRoute } = useMicroAppStore.getState()
    expect(homeRoute).toEqual(testRoute)
  })

  it('should add app source mapping when setAppSource is called', () => {
    const { setAppSource } = useMicroAppStore.getState()

    setAppSource(1, 'menu')
    setAppSource(2, 'favorite')

    const { appSourceMap } = useMicroAppStore.getState()
    expect(appSourceMap[1]).toBe('menu')
    expect(appSourceMap[2]).toBe('favorite')
  })

  it('should clear currentMicroApp and homeRoute when clearCurrentMicroApp is called', () => {
    const { setCurrentMicroApp, setHomeRoute, clearCurrentMicroApp } = useMicroAppStore.getState()

    setCurrentMicroApp({ id: 1, name: '测试', routeBasename: '/test' } as any)
    setHomeRoute('/test/home')
    clearCurrentMicroApp()

    const { currentMicroApp, homeRoute } = useMicroAppStore.getState()
    expect(currentMicroApp).toBeNull()
    expect(homeRoute).toBeNull()
  })

  it('should persist appSourceMap to sessionStorage', () => {
    const { setAppSource } = useMicroAppStore.getState()

    setAppSource(1, 'menu')
    setAppSource(2, 'history')

    const stored = sessionStorage.getItem('dip-micro-app-storage')
    expect(stored).toBeDefined()

    const parsed = JSON.parse(stored || '')
    expect(parsed.state.appSourceMap).toEqual({ 1: 'menu', 2: 'history' })
  })

  it('should not persist currentMicroApp and homeRoute to sessionStorage', () => {
    const { setCurrentMicroApp, setHomeRoute } = useMicroAppStore.getState()

    setCurrentMicroApp({ id: 1, name: '测试', routeBasename: '/test' } as any)
    setHomeRoute('/test/home')

    const stored = sessionStorage.getItem('dip-micro-app-storage')
    const parsed = JSON.parse(stored || '')
    expect(parsed.state.currentMicroApp).toBeUndefined()
    expect(parsed.state.homeRoute).toBeUndefined()
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { useLanguageStore } from '@/stores/languageStore'

describe('languageStore', () => {
  beforeEach(() => {
    // 清空localStorage
    localStorage.clear()
    // 重置store到初始状态，不要传replace: true，否则会覆盖方法
    useLanguageStore.setState({ language: 'zh-CN' })
  })

  it('should have default language as zh-CN', () => {
    const { language } = useLanguageStore.getState()
    expect(language).toBe('zh-CN')
  })

  it('should have setLanguage method', () => {
    const state = useLanguageStore.getState()
    expect('setLanguage' in state).toBe(true)
    expect(typeof state.setLanguage).toBe('function')
  })

  it('should update language when setLanguage is called', () => {
    const { setLanguage } = useLanguageStore.getState()
    setLanguage('en-US')
    
    const { language } = useLanguageStore.getState()
    expect(language).toBe('en-US')
  })

  it('should persist language to localStorage', () => {
    const { setLanguage } = useLanguageStore.getState()
    setLanguage('en-US')
    
    const stored = localStorage.getItem('dip.language')
    expect(stored).toBeDefined()
    
    const parsed = JSON.parse(stored || '')
    expect(parsed.state.language).toBe('en-US')
  })
})

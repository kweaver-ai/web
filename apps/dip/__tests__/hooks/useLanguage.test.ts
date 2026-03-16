import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLanguage } from '@/hooks/useLanguage'
import { useLanguageStore } from '@/stores/languageStore'
import { setMicroAppGlobalState } from '@/utils/micro-app/globalState'
import { DEFAULT_LOCALE } from '@/i18n/config'

vi.mock('react-intl-universal', () => ({
  default: {
    init: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/utils/micro-app/globalState', () => ({
  setMicroAppGlobalState: vi.fn(),
}))

const { mockGetState, mockSetState, mockSetLanguage } = vi.hoisted(() => {
  return {
    mockGetState: vi.fn(),
    mockSetState: vi.fn(),
    mockSetLanguage: vi.fn(),
  }
})

vi.mock('@/stores/languageStore', () => {
  const mockUseLanguageStore = vi.fn(() => ({
    setLanguage: mockSetLanguage,
  })) as any
  mockUseLanguageStore.getState = mockGetState
  mockUseLanguageStore.setState = mockSetState
  return {
    useLanguageStore: mockUseLanguageStore,
  }
})

describe('useLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetState.mockReturnValue({ language: null })
    setMicroAppGlobalState.mockClear()
  })

  it('should return initLanguage and updateLanguage methods', () => {
    const { result } = renderHook(() => useLanguage())

    expect(result.current.initLanguage).toBeDefined()
    expect(typeof result.current.initLanguage).toBe('function')
    expect(result.current.updateLanguage).toBeDefined()
    expect(typeof result.current.updateLanguage).toBe('function')
  })

  it('should init language with persisted language', async () => {
    mockGetState.mockReturnValue({ language: 'en-US' })

    const { result } = renderHook(() => useLanguage())
    await act(async () => {
      await result.current.initLanguage()
    })

    expect(setMicroAppGlobalState).toHaveBeenCalled()
    expect(setMicroAppGlobalState).toHaveBeenCalledWith(
      { language: 'en-US' },
      { allowAllFields: true },
    )
  })

  it('should use DEFAULT_LOCALE when no persisted language', async () => {
    // 必须在这里设置，因为 initLanguage 会立即读取
    mockGetState.mockReturnValue({ language: null })

    const { result } = renderHook(() => useLanguage())
    await act(async () => {
      await result.current.initLanguage()
    })

    expect(setMicroAppGlobalState).toHaveBeenCalled()
    // 实际 DEFAULT_LOCALE 就是 zh-CN，打log看看为什么错
    console.log('DEFAULT_LOCALE=', DEFAULT_LOCALE)
    expect(setMicroAppGlobalState).toHaveBeenCalledWith(
      { language: DEFAULT_LOCALE },
      { allowAllFields: true },
    )
  })

  it('should not throw when init fails', async () => {
    const intl = await import('react-intl-universal')
    ;(intl.default.init as vi.Mock).mockRejectedValue(new Error('init failed'))

    const { result } = renderHook(() => useLanguage())

    await expect(result.current.initLanguage()).resolves.not.toThrow()
  })

  it('should update language correctly', async () => {
    mockGetState.mockReturnValue({ language: null })

    const { result } = renderHook(() => useLanguage())

    await act(async () => {
      await result.current.updateLanguage('en-US')
    })

    expect(mockSetLanguage).toHaveBeenCalled()
    expect(setMicroAppGlobalState).toHaveBeenCalledWith(
      { language: 'en-US' },
      { allowAllFields: true },
    )
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAppInit } from '@/hooks/useAppInit'
import { useOEMConfigStore } from '@/stores/oemConfigStore'

// Mock dependencies
vi.mock('@/stores/oemConfigStore', () => ({
  useOEMConfigStore: vi.fn(),
}))

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    initLanguage: vi.fn(),
  }),
}))

vi.mock('@/utils/qiankun', () => ({
  initQiankun: vi.fn(),
}))

describe('useAppInit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset document.title
    document.title = 'Test'
    // Restore original document.title descriptor
    delete document.title
  })

  it('should initialize without throwing errors', () => {
    ;(useOEMConfigStore as unknown as vi.Mock)
      .mockReturnValueOnce({ initialize: vi.fn() }) // for initialize
      .mockReturnValue('DIP') // for productTitle

    expect(() => {
      renderHook(() => useAppInit())
    }).not.toThrow()

    // Should set document.title
    expect(document.title).toBe('DIP')
  })

  it('should use product title from OEM config when available', () => {
    ;(useOEMConfigStore as unknown as vi.Mock)
      .mockReturnValueOnce({ initialize: vi.fn() })
      .mockReturnValue('自定义产品标题')

    renderHook(() => useAppInit())

    expect(document.title).toBe('自定义产品标题')
  })

  it('should fallback to DIP when product title is empty', () => {
    ;(useOEMConfigStore as unknown as vi.Mock)
      .mockReturnValueOnce({ initialize: vi.fn() })
      .mockReturnValue('')

    renderHook(() => useAppInit())

    expect(document.title).toBe('DIP')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useOEMBranding } from '@/hooks/useOEMBranding'
import { useOEMConfigStore } from '@/stores/oemConfigStore'
import { themeColors } from '@/styles/themeColors'

const mockGetOEMBasicConfig = vi.fn()
vi.mock('@/stores/oemConfigStore', () => ({
  useOEMConfigStore: vi.fn(() => ({
    getOEMBasicConfig: mockGetOEMBasicConfig,
    initialize: vi.fn(),
  })),
}))

describe('useOEMBranding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset document head
    document.documentElement.style.removeProperty('--dip-primary-color')
    document.documentElement.style.removeProperty('--dip-primary-color-rgb')
    const existingLink = document.querySelector("link[rel='icon']" )
    if (existingLink) {
      existingLink.remove()
    }
  })

  it('should use default primary color from theme when no OEM config', () => {
    mockGetOEMBasicConfig.mockReturnValue(null)

    const { result } = renderHook(() => useOEMBranding())

    expect(result.current.primaryColor).toBe(themeColors.primary)
  })

  it('should use OEM theme color when provided in config', () => {
    mockGetOEMBasicConfig.mockReturnValue({
      theme: '#ff0000',
    })

    const { result } = renderHook(() => useOEMBranding())

    expect(result.current.primaryColor).toBe('#ff0000')
  })

  it('should set CSS variables on document root', () => {
    const testColor = '#00ff00'
    mockGetOEMBasicConfig.mockReturnValue({
      theme: testColor,
    })

    renderHook(() => useOEMBranding())

    expect(document.documentElement.style.getPropertyValue('--dip-primary-color')).toBe(testColor)
    expect(document.documentElement.style.getPropertyValue('--dip-primary-color-rgb')).toBe('0, 255, 0')
  })

  it('should set custom favicon when provided in config', () => {
    const testFavicon = 'data:image/x-icon;base64,test123'
    mockGetOEMBasicConfig.mockReturnValue({
      'favicon.ico': testFavicon,
    })

    renderHook(() => useOEMBranding())

    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']" )
    expect(link).toBeDefined()
    expect(link?.href).toContain('test123')
  })

  it('should not set favicon when no favicon config', () => {
    mockGetOEMBasicConfig.mockReturnValue({})

    renderHook(() => useOEMBranding())

    // No existing link before
    const link = document.querySelector("link[rel='icon']" )
    expect(link).toBeNull()
  })
})

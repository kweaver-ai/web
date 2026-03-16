import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useListService } from '@/hooks/useListService'

describe('useListService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockFetchFn = vi.fn()

  it('should initialize with empty items when autoLoad is false', () => {
    const { result } = renderHook(() => useListService({
      fetchFn: mockFetchFn,
      autoLoad: false,
    }))

    expect(result.current.items).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.searchValue).toBe('')
  })

  it('should auto fetch when autoLoad is true', async () => {
    const mockData = [{ name: 'Item 1' }, { name: 'Item 2' }]
    ;(mockFetchFn).mockResolvedValue(mockData)

    const { result } = renderHook(() => useListService({
      fetchFn: mockFetchFn,
      autoLoad: true,
    }))

    expect(result.current.loading).toBe(true)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockFetchFn).toHaveBeenCalled()
    expect(result.current.items).toEqual(mockData)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should filter items by name when searching', async () => {
    const mockData = [{ name: 'Apple' }, { name: 'Banana' }, { name: 'Cherry' }]
    ;(mockFetchFn).mockResolvedValue(mockData)

    const { result } = renderHook(() => useListService({
      fetchFn: mockFetchFn,
      autoLoad: true,
    }))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.items).toHaveLength(3)

    act(() => {
      result.current.handleSearch('na')
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].name).toBe('Banana')
  })

  it('should use custom filter function when provided', async () => {
    const mockData = [{ id: 1, value: 10 }, { id: 2, value: 20 }, { id: 3, value: 30 }]
    const customFilter = vi.fn((item, keyword) => item.value > parseInt(keyword))
    ;(mockFetchFn).mockResolvedValue(mockData)

    const { result } = renderHook(() => useListService({
      fetchFn: mockFetchFn,
      autoLoad: true,
      filterFn: customFilter as any,
    }))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    act(() => {
      result.current.handleSearch('15')
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(customFilter).toHaveBeenCalledTimes(3)
    expect(result.current.items).toHaveLength(2)
  })

  it('should refresh data with last arguments', async () => {
    const mockData = [{ name: 'Item 1' }]
    ;(mockFetchFn).mockResolvedValue(mockData)

    const { result } = renderHook(() => useListService({
      fetchFn: mockFetchFn,
      autoLoad: false,
    }))

    await act(async () => {
      await result.current.fetchList('arg1', 'arg2')
    })

    expect(mockFetchFn).toHaveBeenCalledWith('arg1', 'arg2')
    mockFetchFn.mockClear()

    act(() => {
      result.current.handleRefresh()
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockFetchFn).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should handle fetch error correctly', async () => {
    ;(mockFetchFn).mockRejectedValue({
      description: '网络错误',
    })

    const { result } = renderHook(() => useListService({
      fetchFn: mockFetchFn,
      autoLoad: true,
    }))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.error).toBe('网络错误')
    expect(result.current.loading).toBe(false)
  })
})

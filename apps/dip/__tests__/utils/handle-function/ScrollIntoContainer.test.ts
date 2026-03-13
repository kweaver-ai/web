import { describe, it, expect, beforeEach, vi } from 'vitest'
import { scrollIntoViewForContainer } from '@/utils/handle-function/ScrollIntoContainer'

describe('ScrollIntoContainer', () => {
  let container: HTMLElement
  let element: HTMLElement

  beforeEach(() => {
    // 创建模拟的DOM元素
    container = document.createElement('div')
    element = document.createElement('div')
    
    // mock getBoundingClientRect
    container.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      height: 500,
    } as DOMRect)
    
    element.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 200,
      height: 50,
    } as DOMRect)
    
    // mock scrollTo
    container.scrollTo = vi.fn()
  })

  it('should do nothing when container or element is null', () => {
    scrollIntoViewForContainer(null as any, element)
    scrollIntoViewForContainer(container, null as any)
    scrollIntoViewForContainer(null as any, null as any)
    
    expect(container.scrollTo).not.toHaveBeenCalled()
  })

  it('should scroll element to center of container', () => {
    container.scrollTop = 100
    
    scrollIntoViewForContainer(container, element)
    
    // 计算逻辑：
    // relativeTop = 200 - 100 = 100
    // scrollTop = 100 + 100 - (500 - 50)/2 = 200 - 225 = -25
    expect(container.scrollTo).toHaveBeenCalledWith({
      top: -25,
      behavior: 'smooth',
    })
  })

  it('should calculate correct scroll position when element is below viewport', () => {
    container.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      height: 300,
    } as DOMRect)
    
    element.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 500,
      height: 50,
    } as DOMRect)
    
    container.scrollTop = 100
    
    scrollIntoViewForContainer(container, element)
    
    // relativeTop = 500 - 100 = 400
    // scrollTop = 100 + 400 - (300 - 50)/2 = 500 - 125 = 375
    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 375,
      behavior: 'smooth',
    })
  })

  it('should calculate correct scroll position when element is above viewport', () => {
    container.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 200,
      height: 300,
    } as DOMRect)
    
    element.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      height: 50,
    } as DOMRect)
    
    container.scrollTop = 100
    
    scrollIntoViewForContainer(container, element)
    
    // relativeTop = 100 - 200 = -100
    // scrollTop = 100 + (-100) - (300 - 50)/2 = 0 - 125 = -125
    expect(container.scrollTo).toHaveBeenCalledWith({
      top: -125,
      behavior: 'smooth',
    })
  })
})

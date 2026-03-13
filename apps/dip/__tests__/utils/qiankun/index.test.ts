import { describe, it, expect, beforeEach, vi } from 'vitest'
import { start } from 'qiankun'
import { initQiankun } from '@/utils/qiankun'

vi.mock('qiankun', () => ({
  start: vi.fn(),
}))

describe('qiankun utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should start qiankun with correct config', () => {
    initQiankun()
    
    expect(start).toHaveBeenCalledTimes(1)
    expect(start).toHaveBeenCalledWith({
      sandbox: {
        strictStyleIsolation: false,
        experimentalStyleIsolation: true,
      },
      singular: false,
    })
  })
})

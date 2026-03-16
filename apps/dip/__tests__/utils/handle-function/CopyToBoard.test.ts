import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyToBoard, copyToBoardArea } from '@/utils/handle-function/CopyToBoard'

describe('CopyToBoard', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    // Clean up any DOM nodes added during tests
    document.body.innerHTML = ''
  })

  describe('copyToBoardArea', () => {
    it('should return true when copy succeeds', () => {
      // mock execCommand
      document.execCommand = vi.fn().mockReturnValue(true)

      const result = copyToBoardArea('test text')

      expect(document.execCommand).toHaveBeenCalledWith('copy')
      expect(result).toBe(true)
      // should clean up the input element
      expect(document.querySelectorAll('textarea')).toHaveLength(0)
    })

    it('should return false when copy fails', () => {
      document.execCommand = vi.fn().mockImplementation(() => {
        throw new Error('copy failed')
      })

      const result = copyToBoardArea('test text')

      expect(result).toBe(false)
      expect(document.querySelectorAll('textarea')).toHaveLength(0)
    })
  })

  describe('copyToBoard', () => {
    it('should use navigator.clipboard when available and succeed', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: mockWriteText,
        },
      })

      const result = await copyToBoard('test clipboard')

      expect(mockWriteText).toHaveBeenCalledWith('test clipboard')
      expect(result).toBe(true)
    })

    it('should fallback to execCommand when clipboard API fails', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('not allowed'))
      document.execCommand = vi.fn().mockReturnValue(true)
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: mockWriteText,
        },
      })

      const result = await copyToBoard('fallback test')

      expect(document.execCommand).toHaveBeenCalledWith('copy')
      expect(result).toBe(true)
    })

    it('should return false when neither method is available', async () => {
      vi.stubGlobal('navigator', {
        clipboard: undefined,
      })
      document.execCommand = undefined

      const result = await copyToBoard('no api')

      expect(result).toBe(false)
    })
  })
})

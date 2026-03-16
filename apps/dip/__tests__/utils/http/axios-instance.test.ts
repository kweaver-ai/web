import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockResponseUse, mockRequest, axiosInstance } from './mock-axios'
import { httpConfig } from '@/utils/http/token-config'

vi.mock('@/utils/http/token-config', () => ({
  httpConfig: {
    accessToken: 'initial-token',
    refreshToken: vi.fn(),
    onTokenExpired: vi.fn(),
  },
}))

describe('axios-instance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置httpConfig mock
    ;(httpConfig.refreshToken as vi.Mock).mockResolvedValue({ accessToken: 'new-refreshed-token' })
  })

  it('should create axios instance', () => {
    expect(axiosInstance).toBeDefined()
    expect(mockResponseUse).toHaveBeenCalledWith(expect.any(Function), expect.any(Function))
  })

  it('should pass through successful responses', () => {
    const successHandler = mockResponseUse.mock.calls[0][0]
    const mockResponse = { data: 'test data', status: 200 }

    expect(successHandler(mockResponse)).toBe(mockResponse)
  })

  it('should throw error for non-401 responses', async () => {
    const errorHandler = mockResponseUse.mock.calls[0][1]
    const mockError = {
      response: {
        status: 400,
        data: 'Bad Request',
      },
      config: {
        url: '/test',
        headers: {},
      },
    }

    await expect(errorHandler(mockError)).rejects.toEqual(mockError)
    expect(httpConfig.refreshToken).not.toHaveBeenCalled()
  })

  it('should refresh token and retry request when 401 occurs', async () => {
    const errorHandler = mockResponseUse.mock.calls[0][1]
    const mockError = {
      response: {
        status: 401,
      },
      config: {
        url: '/test',
        headers: {
          Authorization: 'Bearer old-token',
        },
      },
    }

    // 模拟请求成功返回
    mockRequest.mockResolvedValue({ data: 'retried data' })

    const result = await errorHandler(mockError)

    expect(httpConfig.refreshToken).toHaveBeenCalled()
    expect(mockRequest).toHaveBeenCalledWith({
      ...mockError.config,
      headers: {
        ...mockError.config.headers,
        Authorization: 'Bearer new-refreshed-token',
      },
    })
    expect(result).toEqual({ data: 'retried data' })
  })

  it('should queue multiple 401 requests while refreshing token', async () => {
    const errorHandler = mockResponseUse.mock.calls[0][1]
    
    // 第一个401请求
    const mockError1 = {
      response: { status: 401 },
      config: { url: '/test1', headers: {} },
    }
    // 第二个401请求
    const mockError2 = {
      response: { status: 401 },
      config: { url: '/test2', headers: {} },
    }

    // 模拟请求成功返回
    mockRequest.mockImplementation((config) => 
      Promise.resolve({ data: `data from ${config.url}` })
    )

    // 同时触发两个401错误
    const promise1 = errorHandler(mockError1)
    const promise2 = errorHandler(mockError2)

    const results = await Promise.all([promise1, promise2])

    // 只应该调用一次refreshToken
    expect(httpConfig.refreshToken).toHaveBeenCalledTimes(1)
    // 两个请求都应该被重试
    expect(mockRequest).toHaveBeenCalledTimes(2)
    expect(mockRequest).toHaveBeenNthCalledWith(1, expect.objectContaining({ url: '/test1' }))
    expect(mockRequest).toHaveBeenNthCalledWith(2, expect.objectContaining({ url: '/test2' }))
    expect(results[0]).toEqual({ data: 'data from /test1' })
    expect(results[1]).toEqual({ data: 'data from /test2' })
  })

  it('should throw error when token refresh fails', async () => {
    const errorHandler = mockResponseUse.mock.calls[0][1]
    const mockError = {
      response: { status: 401 },
      config: { url: '/test', headers: {} },
    }

    // 模拟刷新失败
    ;(httpConfig.refreshToken as vi.Mock).mockRejectedValue(new Error('Refresh failed'))

    await expect(errorHandler(mockError)).rejects.toThrow('Refresh failed')
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('should not retry when no new token is available after refresh', async () => {
    const errorHandler = mockResponseUse.mock.calls[0][1]
    const mockError = {
      response: { status: 401 },
      config: { url: '/test', headers: {} },
    }

    // 模拟刷新返回空token
    ;(httpConfig.refreshToken as vi.Mock).mockResolvedValue({ accessToken: '' })

    await expect(errorHandler(mockError)).rejects.toEqual(mockError)
    expect(mockRequest).not.toHaveBeenCalled()
  })
})

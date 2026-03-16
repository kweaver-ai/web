import { vi } from 'vitest'

// 先mock axios整个模块
vi.mock('axios', () => {
  const mockRequest = vi.fn()
  const mockResponseUse = vi.fn()
  
  const mockAxiosInstance = {
    interceptors: {
      response: {
        use: mockResponseUse,
      },
    },
    request: mockRequest,
  }

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      CancelToken: {
        source: vi.fn(() => ({
          token: 'mock-token',
          cancel: vi.fn(),
        })),
      },
      isCancel: vi.fn(),
    },
    CancelToken: {
      source: vi.fn(() => ({
        token: 'mock-token',
        cancel: vi.fn(),
      })),
    },
    isCancel: vi.fn(),
  }
})

// 导入axios后获取mock函数
import axios from 'axios'

export const mockRequest = vi.fn()
export const mockResponseUse = vi.fn()

// 重新设置axios.create的返回值，确保我们能拿到mock的request和response.use
const mockAxiosInstance = {
  interceptors: {
    response: {
      use: mockResponseUse,
    },
  },
  request: mockRequest,
}

;(axios.create as vi.Mock).mockReturnValue(mockAxiosInstance)

// 现在导入axiosInstance，确保它初始化正确
import axiosInstance from '@/utils/http/axios-instance'

export { axiosInstance }

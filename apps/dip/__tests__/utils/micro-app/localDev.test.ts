import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getMicroAppEntry,
  setLocalDevEntry,
  removeLocalDevEntry,
  clearLocalDevConfig,
  getAllLocalDevConfig,
} from '@/utils/micro-app/localDev'

describe('localDev', () => {
  const STORAGE_KEY = 'DIP_HUB_LOCAL_DEV_MICRO_APPS'

  beforeEach(() => {
    vi.clearAllMocks()
    // 清空localStorage
    localStorage.removeItem(STORAGE_KEY)
  })

  describe('getMicroAppEntry', () => {
    it('should return default entry when no local config exists', () => {
      const result = getMicroAppEntry('test-app', 'https://prod.example.com/test-app')
      expect(result).toBe('https://prod.example.com/test-app')
    })

    it('should return local entry when config exists for the app', () => {
      const testConfig = { 'test-app': 'http://localhost:8081' }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testConfig))

      const result = getMicroAppEntry('test-app', 'https://prod.example.com/test-app')
      expect(result).toBe('http://localhost:8081')
    })

    it('should return default entry when config does not exist for the app', () => {
      const testConfig = { 'other-app': 'http://localhost:8081' }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testConfig))

      const result = getMicroAppEntry('test-app', 'https://prod.example.com/test-app')
      expect(result).toBe('https://prod.example.com/test-app')
    })

    it('should return default entry when config is invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json')

      const result = getMicroAppEntry('test-app', 'https://prod.example.com/test-app')
      expect(result).toBe('https://prod.example.com/test-app')
    })

    it('should return default entry when config is not an object', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify('not an object'))

      const result = getMicroAppEntry('test-app', 'https://prod.example.com/test-app')
      expect(result).toBe('https://prod.example.com/test-app')
    })
  })

  describe('setLocalDevEntry', () => {
    it('should set local entry for app', () => {
      setLocalDevEntry('test-app', 'http://localhost:8081')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored['test-app']).toBe('http://localhost:8081')
    })

    it('should update existing entry', () => {
      const initialConfig = { 'test-app': 'http://localhost:8081' }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialConfig))

      setLocalDevEntry('test-app', 'http://localhost:8082')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored['test-app']).toBe('http://localhost:8082')
    })

    it('should add new entry without affecting existing ones', () => {
      const initialConfig = { 'app1': 'http://localhost:8081' }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialConfig))

      setLocalDevEntry('app2', 'http://localhost:8082')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored['app1']).toBe('http://localhost:8081')
      expect(stored['app2']).toBe('http://localhost:8082')
    })
  })

  describe('removeLocalDevEntry', () => {
    it('should remove specific entry', () => {
      const testConfig = {
        'app1': 'http://localhost:8081',
        'app2': 'http://localhost:8082',
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testConfig))

      removeLocalDevEntry('app1')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored['app1']).toBeUndefined()
      expect(stored['app2']).toBe('http://localhost:8082')
    })

    it('should do nothing when entry does not exist', () => {
      const testConfig = { 'app1': 'http://localhost:8081' }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testConfig))

      removeLocalDevEntry('non-existent-app')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored['app1']).toBe('http://localhost:8081')
    })
  })

  describe('clearLocalDevConfig', () => {
    it('should clear all local dev config', () => {
      const testConfig = {
        'app1': 'http://localhost:8081',
        'app2': 'http://localhost:8082',
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testConfig))

      clearLocalDevConfig()

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  describe('getAllLocalDevConfig', () => {
    it('should return all config entries', () => {
      const testConfig = {
        'app1': 'http://localhost:8081',
        'app2': 'http://localhost:8082',
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testConfig))

      const result = getAllLocalDevConfig()
      expect(result).toEqual(testConfig)
    })

    it('should return empty object when no config exists', () => {
      const result = getAllLocalDevConfig()
      expect(result).toEqual({})
    })

    it('should return empty object when config is invalid', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json')
      const result = getAllLocalDevConfig()
      expect(result).toEqual({})
    })
  })
})

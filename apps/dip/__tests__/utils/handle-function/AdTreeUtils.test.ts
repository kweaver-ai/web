import { describe, it, expect } from 'vitest'
import {
  adTreeUtils,
  type AdTreeDataNode,
  type CreateTreeDataOptions,
} from '@/utils/handle-function/AdTreeUtils'

const {
  createAdTreeNodeData,
  flatTreeData,
  flatToTreeData,
  addTreeNode,
  deleteTreeNode,
  updateTreeNode,
  getTreeNodeByKey,
  searchTreeNode,
} = adTreeUtils

describe('AdTreeUtils', () => {
  describe('createAdTreeNodeData', () => {
    it('should create tree nodes with default options', () => {
      const dataSource = [
        {
          name: '根节点',
          key: 'root',
          children: [
            { name: '子节点1', key: 'child1' },
            { name: '子节点2', key: 'child2' },
          ],
        },
      ]

      const result = createAdTreeNodeData(dataSource)

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('root')
      expect(result[0].title).toBe('根节点')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children[0].key).toBe('child1')
      expect(result[0].children[0].keyPath).toEqual(['root', 'child1'])
      expect(result[0].children[0].parentKey).toBe('root')
      expect(result[0].children[0].sourceData).toEqual(dataSource[0].children[0])
    })

    it('should use custom fields when provided', () => {
      const dataSource = [
        {
          label: '自定义标题',
          id: 'custom-id',
          children: [],
        },
      ]
      const options: CreateTreeDataOptions = {
        titleField: 'label',
        keyField: 'id',
      }

      const result = createAdTreeNodeData(dataSource, options)

      expect(result[0].title).toBe('自定义标题')
      expect(result[0].key).toBe('custom-id')
    })

    it('should use function for title and key fields', () => {
      const dataSource = [
        {
          firstName: 'Test',
          lastName: 'Node',
          uid: 123,
        },
      ]
      const options: CreateTreeDataOptions = {
        titleField: (item) => `${item.firstName} ${item.lastName}`,
        keyField: (item) => String(item.uid),
      }

      const result = createAdTreeNodeData(dataSource, options)

      expect(result[0].title).toBe('Test Node')
      expect(result[0].key).toBe('123')
    })
  })

  describe('flatTreeData', () => {
    it('should flatten tree data into array', () => {
      const treeData: AdTreeDataNode[] = [
        {
          key: 'root',
          title: 'root',
          children: [
            { key: 'child1', title: 'child1', children: [] },
            { key: 'child2', title: 'child2', children: [{ key: 'grandchild', title: 'grandchild', children: [] }] },
          ],
        },
      ]

      const result = flatTreeData(treeData)

      expect(result).toHaveLength(4)
      expect(result.map(n => n.key)).toEqual(['root', 'child1', 'child2', 'grandchild'])
      expect(result.every(n => n.children)).toEqual(true)
      expect(result.every(n => n.children.length === 0)).toBe(true)
    })
  })

  describe('flatToTreeData', () => {
    it('should convert flat data to tree structure', () => {
      const flatData: AdTreeDataNode[] = [
        { key: 'root', title: 'root', parentKey: '', children: [] },
        { key: 'child1', title: 'child1', parentKey: 'root', children: [] },
        { key: 'child2', title: 'child2', parentKey: 'root', children: [] },
        { key: 'grandchild', title: 'grandchild', parentKey: 'child1', children: [] },
      ]

      const result = flatToTreeData(flatData)

      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('root')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children[0].children).toHaveLength(1)
      expect(result[0].children[0].children[0].key).toBe('grandchild')
    })
  })

  describe('addTreeNode', () => {
    it('should add new node to existing tree', () => {
      const treeData: AdTreeDataNode[] = [
        { key: 'root', title: 'root', parentKey: '', children: [] },
      ]
      const newNode: AdTreeDataNode = { key: 'child1', title: 'child1', parentKey: 'root', children: [] }

      const result = addTreeNode(treeData, newNode)

      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].key).toBe('child1')
    })
  })

  describe('deleteTreeNode', () => {
    it('should delete node by key', () => {
      const treeData: AdTreeDataNode[] = [
        {
          key: 'root',
          title: 'root',
          children: [
            { key: 'child1', title: 'child1', children: [] },
            { key: 'child2', title: 'child2', children: [] },
          ],
        },
      ]

      const result = deleteTreeNode(treeData, 'child1')

      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].key).toBe('child2')
    })

    it('should delete multiple nodes by array of keys', () => {
      const treeData: AdTreeDataNode[] = [
        {
          key: 'root',
          title: 'root',
          children: [
            { key: 'child1', title: 'child1', children: [] },
            { key: 'child2', title: 'child2', children: [] },
          ],
        },
      ]

      const result = deleteTreeNode(treeData, ['child1', 'child2'])

      expect(result[0].children).toHaveLength(0)
    })
  })

  describe('updateTreeNode', () => {
    it('should update existing node', () => {
      const treeData: AdTreeDataNode[] = [
        {
          key: 'root',
          title: 'root',
          children: [
            { key: 'child1', title: 'old title', children: [] },
          ],
        },
      ]
      const updateNode: AdTreeDataNode = { key: 'child1', title: 'new title', children: [] }

      const result = updateTreeNode(treeData, updateNode)

      expect(result[0].children[0].title).toBe('new title')
    })

    it('should update multiple nodes', () => {
      const treeData: AdTreeDataNode[] = [
        {
          key: 'root',
          title: 'root',
          children: [
            { key: 'child1', title: 'old1', children: [] },
            { key: 'child2', title: 'old2', children: [] },
          ],
        },
      ]
      const updates: AdTreeDataNode[] = [
        { key: 'child1', title: 'new1', children: [] },
        { key: 'child2', title: 'new2', children: [] },
      ]

      const result = updateTreeNode(treeData, updates)

      expect(result[0].children[0].title).toBe('new1')
      expect(result[0].children[1].title).toBe('new2')
    })
  })

  describe('getTreeNodeByKey', () => {
    it('should return nodes matching the provided keys', () => {
      const treeData: AdTreeDataNode[] = [
        {
          key: 'root',
          title: 'root',
          children: [
            { key: 'child1', title: 'child1', children: [] },
            { key: 'child2', title: 'child2', children: [] },
          ],
        },
      ]

      const result = getTreeNodeByKey(treeData, ['root', 'child1'])

      expect(result).toHaveLength(2)
      expect(result.map(n => n.key)).toEqual(['root', 'child1'])
    })
  })

  describe('searchTreeNode', () => {
    it('should return original tree when search value is empty', () => {
      const treeData: AdTreeDataNode[] = [
        { key: 'root', title: 'root', children: [] },
      ]

      const result = searchTreeNode(treeData, '')

      expect(result).toBe(treeData)
    })

    it('should find matching nodes and include their parents', () => {
      const treeData: AdTreeDataNode[] = [
        {
          key: 'root',
          title: 'Root',
          parentKey: '',
          children: [
            {
              key: 'child',
              title: 'Child',
              parentKey: 'root',
              children: [
                { key: 'grandchild', title: 'SearchMatch', parentKey: 'child', children: [] },
              ],
            },
          ],
        },
      ]

      const result = searchTreeNode(treeData, 'Search')

      // Should include matched node and all ancestors
      expect(result[0].key).toBe('root')
      expect(result[0].children[0].key).toBe('child')
      expect(result[0].children[0].children[0].key).toBe('grandchild')
    })
  })
})

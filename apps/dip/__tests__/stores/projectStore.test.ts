import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProjectStore } from '@/stores/projectStore'
import { convertNodeInfoToTree, removeItem, setProperty } from '@/components/ProjectSider/utils'

vi.mock('@/components/ProjectSider/utils', () => ({
  convertNodeInfoToTree: vi.fn((nodes) => nodes.map(node => ({
    id: String(node.id),
    name: node.name,
    type: node.node_type,
    children: [],
  }))),
  removeItem: vi.fn((tree, nodeId) => tree.filter(item => item.id !== nodeId)),
  setProperty: vi.fn((tree, nodeId, prop, updater) => {
    return tree.map(item => {
      if (item.id === nodeId) {
        return {
          ...item,
          [prop]: prop === 'children' ? updater(item.children || []) : updater(item[prop]),
        }
      }
      return item
    })
  }),
}))

describe('projectStore', () => {
  const mockNodes = [
    { id: 1, name: '节点1', node_type: 'document', project_id: 'proj1', parent_id: null },
    { id: 2, name: '节点2', node_type: 'folder', project_id: 'proj1', parent_id: null },
    { id: 3, name: '子节点', node_type: 'document', project_id: 'proj1', parent_id: 2 },
  ] as any[]

  beforeEach(() => {
    vi.clearAllMocks()
    // 重置store状态
    useProjectStore.setState({
      selectedNode: null,
      currentProjectId: null,
      currentProjectInfo: null,
      treeData: [],
      nodeMap: new Map(),
    })
  })

  it('should have initial state', () => {
    const { selectedNode, currentProjectId, currentProjectInfo, treeData, nodeMap } = useProjectStore.getState()
    expect(selectedNode).toBeNull()
    expect(currentProjectId).toBeNull()
    expect(currentProjectInfo).toBeNull()
    expect(treeData).toEqual([])
    expect(nodeMap.size).toBe(0)
  })

  it('initProjectTree should initialize tree data and node map', () => {
    const { initProjectTree } = useProjectStore.getState()
    
    initProjectTree('proj1', mockNodes)
    
    expect(convertNodeInfoToTree).toHaveBeenCalledWith(mockNodes)
    const { currentProjectId, treeData, nodeMap } = useProjectStore.getState()
    expect(currentProjectId).toBe('proj1')
    expect(treeData.length).toBe(3)
    expect(nodeMap.size).toBe(3)
    expect(nodeMap.get('1')).toEqual(mockNodes[0])
    expect(nodeMap.get('2')).toEqual(mockNodes[1])
    expect(nodeMap.get('3')).toEqual(mockNodes[2])
  })

  it('setSelectedNode should set selected node correctly', () => {
    const { initProjectTree, setSelectedNode } = useProjectStore.getState()
    initProjectTree('proj1', mockNodes)
    
    setSelectedNode('1')
    
    const { selectedNode } = useProjectStore.getState()
    expect(selectedNode).toEqual({
      nodeId: '1',
      nodeType: 'document',
      nodeName: '节点1',
      projectId: 'proj1',
    })
  })

  it('setSelectedNode should set to null when node not found', () => {
    const { initProjectTree, setSelectedNode } = useProjectStore.getState()
    initProjectTree('proj1', mockNodes)
    
    setSelectedNode('999')
    
    expect(useProjectStore.getState().selectedNode).toBeNull()
  })

  it('clearSelectedNode should clear selected node', () => {
    const { initProjectTree, setSelectedNode, clearSelectedNode } = useProjectStore.getState()
    initProjectTree('proj1', mockNodes)
    setSelectedNode('1')
    
    clearSelectedNode()
    
    expect(useProjectStore.getState().selectedNode).toBeNull()
  })

  it('getNodeInfo should return node by id', () => {
    const { initProjectTree, getNodeInfo } = useProjectStore.getState()
    initProjectTree('proj1', mockNodes)
    
    const node = getNodeInfo('1')
    expect(node).toEqual(mockNodes[0])
    expect(getNodeInfo('999')).toBeUndefined()
  })

  it('updateNodeInfo should update node info and tree data', () => {
    const { initProjectTree, updateNodeInfo, getNodeInfo } = useProjectStore.getState()
    initProjectTree('proj1', mockNodes)
    
    updateNodeInfo('1', { name: '更新后的节点' })
    
    const updatedNode = getNodeInfo('1')
    expect(updatedNode?.name).toBe('更新后的节点')
    
    const { treeData } = useProjectStore.getState()
    const updatedTreeItem = treeData.find(item => item.id === '1')
    expect(updatedTreeItem?.name).toBe('更新后的节点')
  })

  it('addNode should add new node to tree', () => {
    const { initProjectTree, addNode, getNodeInfo } = useProjectStore.getState()
    initProjectTree('proj1', mockNodes)
    
    const newNode = {
      id: 4,
      name: '新节点',
      node_type: 'document',
      project_id: 'proj1',
      parent_id: 2,
    } as any
    
    addNode(newNode)
    
    expect(getNodeInfo('4')).toEqual(newNode)
    expect(setProperty).toHaveBeenCalledTimes(2) // 一次加children，一次展开父节点
    const { treeData, nodeMap } = useProjectStore.getState()
    expect(nodeMap.size).toBe(4)
  })

  it('addNode should add root node when parent_id is null', () => {
    const { initProjectTree, addNode, getNodeInfo } = useProjectStore.getState()
    initProjectTree('proj1', mockNodes)
    
    const newNode = {
      id: 4,
      name: '根节点',
      node_type: 'folder',
      project_id: 'proj1',
      parent_id: null,
    } as any
    
    addNode(newNode)
    
    expect(getNodeInfo('4')).toEqual(newNode)
    const { treeData } = useProjectStore.getState()
    expect(treeData.some(item => item.id === '4')).toBe(true)
  })

  it('removeNode should remove node from tree', () => {
    const { initProjectTree, removeNode, getNodeInfo } = useProjectStore.getState()
    initProjectTree('proj1', mockNodes)
    
    removeNode('1')
    
    expect(getNodeInfo('1')).toBeUndefined()
    expect(removeItem).toHaveBeenCalled()
    const { nodeMap } = useProjectStore.getState()
    expect(nodeMap.size).toBe(2)
  })

  it('clearTreeData should clear all project data', () => {
    const { initProjectTree, setProjectInfo, clearTreeData } = useProjectStore.getState()
    initProjectTree('proj1', mockNodes)
    setProjectInfo({ id: 'proj1', name: '测试项目' } as any)
    
    clearTreeData()
    
    const { currentProjectId, currentProjectInfo, treeData, nodeMap, selectedNode } = useProjectStore.getState()
    expect(currentProjectId).toBeNull()
    expect(currentProjectInfo).toBeNull()
    expect(treeData).toEqual([])
    expect(nodeMap.size).toBe(0)
    expect(selectedNode).toBeNull()
  })

  it('setProjectInfo and getProjectInfo should work correctly', () => {
    const { setProjectInfo, getProjectInfo } = useProjectStore.getState()
    const testProject = { id: 'proj1', name: '测试项目' } as any
    
    setProjectInfo(testProject)
    
    expect(getProjectInfo()).toEqual(testProject)
  })

  it('setTreeData should update tree data', () => {
    const { setTreeData } = useProjectStore.getState()
    const testTree = [{ id: '1', name: '测试', type: 'document', children: [] }]
    
    setTreeData(testTree)
    
    expect(useProjectStore.getState().treeData).toEqual(testTree)
  })

  it('initProjectTree should handle empty nodes', () => {
    const { initProjectTree } = useProjectStore.getState()
    
    initProjectTree('proj1', [])
    
    const { currentProjectId, treeData, nodeMap } = useProjectStore.getState()
    expect(currentProjectId).toBe('proj1')
    expect(treeData).toEqual([])
    expect(nodeMap.size).toBe(0)
  })

  it('initProjectTree should do nothing when projectId is empty', () => {
    const { initProjectTree } = useProjectStore.getState()
    
    initProjectTree('', mockNodes)
    
    const { currentProjectId } = useProjectStore.getState()
    expect(currentProjectId).toBeNull()
  })
})

import { useEffect, useState } from 'react';
import dagre from '@dagrejs/dagre';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { callFetchSkillTree } from '../../api';
import { Spin } from 'antd';

interface SkillTreeNode {
  id: string;
  parentId: string | null;
  name: string;
  description: string;
  level: number;
  currentXp: number;
  userSkillId: string | null;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

// Xác định màu sắc node theo trạng thái level
function getNodeStyle(level: number) {
  if (level >= 3) return { backgroundColor: '#4ade80', color: '#fff', fontWeight: 'bold', border: '2px solid #16a34a', borderRadius: 8 };
  if (level >= 1) return { backgroundColor: '#facc15', color: '#1a1a1a', border: '2px solid #ca8a04', borderRadius: 8 };
  return { backgroundColor: '#e5e7eb', color: '#9ca3af', border: '2px dashed #d1d5db', borderRadius: 8 };
}

// Dùng dagre để tự tính toán x/y cho cây từ trên xuống
function buildLayout(items: SkillTreeNode[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 }); // TB = Top to Bottom

  // Đăng ký tất cả nodes vào dagre
  items.forEach((item) => {
    g.setNode(item.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Đăng ký các edges (quan hệ cha → con)
  const edges: Edge[] = [];
  items.forEach((item) => {
    if (item.parentId) {
      g.setEdge(item.parentId, item.id);
      edges.push({
        id: `e-${item.parentId}-${item.id}`,
        source: item.parentId,
        target: item.id,
        animated: item.level > 0,
        style: { stroke: item.level > 0 ? '#4ade80' : '#d1d5db' },
      });
    }
  });

  // Dagre tự tính layout
  dagre.layout(g);

  // Map kết quả tọa độ từ dagre → React Flow nodes
  const nodes: Node[] = items.map((item) => {
    const nodeWithPosition = g.node(item.id);
    return {
      id: item.id,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
      data: {
        label: (
          <div style={{ textAlign: 'center', lineHeight: '1.4' }}>
            <div style={{ fontWeight: 600 }}>{item.name}</div>
            <div style={{ fontSize: 11 }}>
              {item.level > 0 ? `Lvl ${item.level} · ${item.currentXp} XP` : 'Chưa học'}
            </div>
          </div>
        ),
      },
      style: getNodeStyle(item.level),
    };
  });

  return { nodes, edges };
}

export default function SkillTreePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await callFetchSkillTree();
        const data: SkillTreeNode[] = res.data?.data ?? res.data ?? [];
        const { nodes: n, edges: e } = buildLayout(data);
        setNodes(n);
        setEdges(e);
      } catch (err) {
        console.error('Failed to load skill tree:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 100px)', padding: '20px' }}>
      <h2 className="text-2xl font-bold mb-1">My Skill Tree</h2>
      <p className="text-gray-500 mb-4 text-sm">
        Hoàn thành task có gắn kỹ năng để nhận XP và mở khoá node mới.
        <span style={{ marginLeft: 16 }}>
          <span style={{ color: '#4ade80' }}>●</span> Thành thạo (Lvl 3+) &nbsp;
          <span style={{ color: '#facc15' }}>●</span> Đang học (Lvl 1-2) &nbsp;
          <span style={{ color: '#9ca3af' }}>●</span> Chưa học
        </span>
      </p>
      <div
        className="border border-gray-300 rounded-lg overflow-hidden shadow-inner bg-gray-50"
        style={{ height: 'calc(100% - 80px)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spin size="large" tip="Đang tải Skill Tree..." />
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
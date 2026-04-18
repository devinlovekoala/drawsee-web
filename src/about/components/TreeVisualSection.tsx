import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

type NodeKind = 'query' | 'point' | 'detail';

interface TreeNode {
  id: string;
  title: string;
  kind: NodeKind;
  children?: TreeNode[];
}

type TreePointNode = d3.HierarchyPointNode<TreeNode>;

const NODE_COLOR: Record<NodeKind, string> = {
  query: '#2563EB',
  point: '#7C3AED',
  detail: '#DB2777'
};

const NODE_LABEL: Record<NodeKind, string> = {
  query: 'QUERY',
  point: 'ANALYSIS_POINT',
  detail: 'DETAIL'
};

const treeData: TreeNode = {
  id: 'root-query',
  title: '学生提交电路实验问题（班级知识库上下文）',
  kind: 'query',
  children: [
    {
      id: 'point-pdf',
      title: 'PDF 实验文档任务解析',
      kind: 'point',
      children: [
        {
          id: 'detail-pdf-1',
          title: '提取实验步骤与关键参数并生成分析点',
          kind: 'detail'
        },
        {
          id: 'detail-pdf-2',
          title: '根据班级知识库补齐背景知识与注意事项',
          kind: 'detail'
        }
      ]
    },
    {
      id: 'point-circuit',
      title: '电路推理解题链路',
      kind: 'point',
      children: [
        {
          id: 'detail-circuit-1',
          title: '直流工作点分析与偏置电流计算',
          kind: 'detail'
        },
        {
          id: 'detail-circuit-2',
          title: '交流增益与频率响应判断',
          kind: 'detail'
        }
      ]
    },
    {
      id: 'point-followup',
      title: '追问与复盘',
      kind: 'point',
      children: [
        {
          id: 'detail-followup-1',
          title: '学生继续追问误差来源与替代方案',
          kind: 'detail'
        },
        {
          id: 'detail-followup-2',
          title: '教师基于同一会话树进行课堂复盘反馈',
          kind: 'detail'
        }
      ]
    }
  ]
};

const splitLines = (text: string, maxChars: number, maxLines: number): string[] => {
  const chars = [...text];
  const lines: string[] = [];

  for (let i = 0; i < chars.length && lines.length < maxLines; i += maxChars) {
    lines.push(chars.slice(i, i + maxChars).join(''));
  }

  if (chars.length > maxChars * maxLines && lines.length > 0) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = `${last.slice(0, Math.max(0, last.length - 1))}…`;
  }

  return lines;
};

const TreeVisualSection: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 生成树状可视化
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // 清除先前的可视化
    d3.select(svgRef.current).selectAll("*").remove();

    const width = Math.max(containerRef.current.clientWidth, 960);
    const margin = { top: 70, right: 120, bottom: 70, left: 120 };
    const horizontalGap = 270;
    const verticalGap = 110;
    const baseNodeWidth = 220;
    const baseNodeHeight = 76;
    
    // 创建SVG
    const svg = d3.select(svgRef.current);
      
    // 创建树布局
    const tree = d3.tree<TreeNode>()
      .nodeSize([verticalGap, horizontalGap]);
      
    // 将数据转换为层次结构
    const root = d3.hierarchy(treeData);
    
    // 计算节点位置
    const layout = tree(root);
    const nodes = layout.descendants();
    const links = layout.links();

    const xExtent = d3.extent(nodes, (d) => d.x);
    const minX = xExtent[0] ?? 0;
    const maxX = xExtent[1] ?? 0;
    const maxY = d3.max(nodes, (d) => d.y) ?? 0;

    const innerHeight = maxX - minX + margin.top + margin.bottom;
    const innerWidth = Math.max(width, maxY + margin.left + margin.right + baseNodeWidth);

    svg
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('viewBox', `0 0 ${innerWidth} ${innerHeight}`);

    const canvas = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top - minX})`);

    // 创建连接线
    canvas.selectAll('.tree-link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'tree-link')
      .attr("d", d3.linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr('fill', 'none')
      .attr('stroke', (d) => NODE_COLOR[d.target.data.kind])
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.35);

    const nodeGroup = canvas.selectAll<SVGGElement, TreePointNode>('.tree-node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'tree-node')
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((_, i) => i * 50)
      .attr('opacity', 1);

    const nodesSelection = canvas.selectAll<SVGGElement, TreePointNode>('.tree-node');

    nodesSelection
      .append('rect')
      .attr('x', -baseNodeWidth / 2)
      .attr('y', -baseNodeHeight / 2)
      .attr('width', baseNodeWidth)
      .attr('height', baseNodeHeight)
      .attr('rx', 14)
      .attr('fill', '#FFFFFF')
      .attr('stroke', (d) => NODE_COLOR[d.data.kind])
      .attr('stroke-width', 2)
      .attr('filter', 'drop-shadow(0px 4px 8px rgba(15, 23, 42, 0.08))');

    nodesSelection
      .append('text')
      .attr('x', -baseNodeWidth / 2 + 14)
      .attr('y', -baseNodeHeight / 2 + 20)
      .attr('fill', (d) => NODE_COLOR[d.data.kind])
      .attr('font-size', 10)
      .attr('font-weight', 700)
      .text((d) => NODE_LABEL[d.data.kind]);

    nodesSelection.each(function(d) {
      const node = d3.select(this);
      const lines = splitLines(d.data.title, 11, 2);
      const title = node
        .append('text')
        .attr('x', -baseNodeWidth / 2 + 14)
        .attr('y', -2)
        .attr('fill', '#1E293B')
        .attr('font-size', 12)
        .attr('font-weight', 600);

      lines.forEach((line, index) => {
        title
          .append('tspan')
          .attr('x', -baseNodeWidth / 2 + 14)
          .attr('dy', index === 0 ? 0 : 16)
          .text(line);
      });
    });
  }, []);

  return (
    <section id="visual" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">更贴近真实会话流的导图结构</h2>
          
          <p className="text-xl text-gray-600 mb-8">
            DrawSee 以 Query、分析点与 Detail 组成的节点链路，串联班级知识库、任务解析、推理解题与复盘追问
          </p>
          
          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-indigo-600 mr-2"></div>
              <span className="text-gray-600">Query 节点</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
              <span className="text-gray-600">分析点节点</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-pink-500 mr-2"></div>
              <span className="text-gray-600">Detail 节点</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-600">持续追问</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-2xl shadow-lg p-6 mb-12" ref={containerRef}>
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            <svg ref={svgRef} className="min-w-full"></svg>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover-card">
              <div className="text-indigo-600 text-xl font-semibold mb-4">任务驱动对话</div>
              <p className="text-gray-700">
                不再依赖手动模式切换，系统根据问题与上下文自动路由任务类型，让答疑、分析和追问形成连续流程。
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover-card">
              <div className="text-indigo-600 text-xl font-semibold mb-4">过程可视化</div>
              <p className="text-gray-700">
                通过树状节点可以清晰回看每一步推理依据、知识引用与结果展开，便于课堂讲解、学生复习和工程复盘。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TreeVisualSection; 
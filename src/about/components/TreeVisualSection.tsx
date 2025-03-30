import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  color?: string;
  depth?: number;
}

type D3Node = d3.HierarchyPointNode<TreeNode>;

const TreeVisualSection: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 创建树状数据结构 - 线性代数问题示例
  const treeData: TreeNode = {
    id: "root",
    name: "线性代数基础",
    children: [
      {
        id: "matrices",
        name: "矩阵理论",
        color: "#4F46E5",
        children: [
          {
            id: "matrix-ops",
            name: "矩阵运算",
            color: "#4F46E5",
            children: [
              { id: "addition", name: "加法与减法", color: "#4F46E5" },
              { id: "multiplication", name: "矩阵乘法", color: "#4F46E5" }
            ]
          },
          {
            id: "determinant",
            name: "行列式",
            color: "#4F46E5",
            children: [
              { id: "properties", name: "行列式性质", color: "#4F46E5" },
              { id: "calculation", name: "计算方法", color: "#4F46E5" }
            ]
          }
        ]
      },
      {
        id: "vector-spaces",
        name: "向量空间",
        color: "#8B5CF6",
        children: [
          {
            id: "basis",
            name: "基与维数",
            color: "#8B5CF6",
            children: [
              { id: "standard-basis", name: "标准基", color: "#8B5CF6" },
              { id: "change-basis", name: "基变换", color: "#8B5CF6" }
            ]
          },
          {
            id: "linear-trans",
            name: "线性变换",
            color: "#8B5CF6"
          }
        ]
      },
      {
        id: "eigenvalues",
        name: "特征值与特征向量",
        color: "#EC4899",
        children: [
          { 
            id: "characteristic-poly", 
            name: "特征多项式", 
            color: "#EC4899",
            children: [
              { id: "roots", name: "多项式根", color: "#EC4899" }
            ]
          },
          { 
            id: "diagonalization", 
            name: "对角化", 
            color: "#EC4899",
            children: [
              { id: "similar-matrices", name: "相似矩阵", color: "#EC4899" }
            ]
          }
        ]
      },
      {
        id: "applications",
        name: "应用",
        color: "#0EA5E9",
        children: [
          { 
            id: "systems", 
            name: "线性方程组", 
            color: "#0EA5E9",
            children: [
              { id: "gauss-elim", name: "高斯消元法", color: "#0EA5E9" },
              { id: "cramer", name: "克莱默法则", color: "#0EA5E9" }
            ]
          },
          { 
            id: "least-squares", 
            name: "最小二乘法", 
            color: "#0EA5E9" 
          }
        ]
      }
    ]
  };

  // 生成树状可视化
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // 清除先前的可视化
    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.offsetWidth;
    const height = 1100; // 增加高度使节点布局更往下
    const margin = { top: 580, right: 120, bottom: 30, left: 120 }; // 增加顶部边距
    
    // 创建SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // 创建树布局
    const tree = d3.tree<TreeNode>()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right])
      .nodeSize([65, 240]); // 增加节点间距
      
    // 将数据转换为层次结构
    const root = d3.hierarchy(treeData);
    
    // 计算节点位置
    const treeData_d3 = tree(root);
    const nodes = treeData_d3.descendants();
    const links = treeData_d3.links();

    // 创建连接线
    svg.selectAll(".link")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr("fill", "none")
      .attr("stroke", d => d.target.data.color || "#ddd")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-dasharray", "5,5");
      
    // 创建节点组
    svg.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .attr("opacity", 0)
      .transition()
      .duration(500)
      .delay((_, i) => i * 50)
      .attr("opacity", 1);
      
    // 添加节点圆圈
    svg.selectAll(".node")
      .append("circle")
      .attr("r", function(d: unknown) { return (d as D3Node).children ? 35 : 28; })
      .attr("fill", function(d: unknown) { return (d as D3Node).data.color || "#4F46E5"; })
      .attr("fill-opacity", 0.2)
      .attr("stroke", function(d: unknown) { return (d as D3Node).data.color || "#4F46E5"; })
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("mouseover", function() {
        d3.select(this)
          .attr("fill-opacity", 0.5)
          .attr("r", function(this: SVGCircleElement) {
            const d = d3.select(this).datum() as d3.HierarchyPointNode<TreeNode>;
            return d.children ? 28 : 23;
          });
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("fill-opacity", 0.2)
          .attr("r", function(this: SVGCircleElement) {
            const d = d3.select(this).datum() as d3.HierarchyPointNode<TreeNode>;
            return d.children ? 25 : 20;
          });
      });
      
    // 添加节点文本
    svg.selectAll(".node")
      .append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("pointer-events", "none")
      .text(function(d: unknown) {
        // 文本长度限制
        const maxLen = 8;
        const name = (d as D3Node).data.name;
        return name.length > maxLen ? name.substring(0, maxLen) + "..." : name;
      });
      
    // 添加节点小标题
    svg.selectAll(".node")
      .filter(function(d: unknown) { return (d as D3Node).depth === 1; })
      .append("text")
      .attr("y", -35)
      .attr("text-anchor", "middle")
      .attr("fill", function(d: unknown) { return (d as D3Node).data.color || "#4F46E5"; })
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .attr("pointer-events", "none")
      .text(function(d: unknown) { return (d as D3Node).data.name; });
  }, []);

  return (
    <section id="visual" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">AI对话的层次化思维</h2>
          
          <p className="text-xl text-gray-600 mb-8">
            DrawSee突破传统AI对话模式，实现思维的多层次拓展与探索
          </p>
          
          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-indigo-600 mr-2"></div>
              <span className="text-gray-600">核心问题</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
              <span className="text-gray-600">思路分支</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-pink-500 mr-2"></div>
              <span className="text-gray-600">深入探索</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-600">应用拓展</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-2xl shadow-lg p-6 mb-12" ref={containerRef}>
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            <svg ref={svgRef} className="min-w-full"></svg>
          </div>
          
          <div className="flex justify-center mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl">
              <h4 className="text-lg font-medium text-blue-800 mb-2">多层次思维探索</h4>
              <p className="text-gray-700">
                如本例所示，DrawSee可以让您围绕线性代数等复杂主题，以树状结构展开多层次思维探索，轻松掌握知识脉络和关联。
              </p>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover-card">
              <div className="text-indigo-600 text-xl font-semibold mb-4">层次化对话</div>
              <p className="text-gray-700">
                传统AI对话是线性的，而DrawSee允许您同时探索多个思维分支，生成层次化知识树，从不同角度深入理解问题。
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover-card">
              <div className="text-indigo-600 text-xl font-semibold mb-4">思维可视化</div>
              <p className="text-gray-700">
                通过直观的可视化树状结构，您可以清晰地看到思维的发散过程，轻松回溯、比较不同思路，锻炼批判性思维能力。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TreeVisualSection; 
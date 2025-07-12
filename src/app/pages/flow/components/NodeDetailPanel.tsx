import React, { useMemo, useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { format } from 'date-fns';
import { X, Clock, Tag, MessageSquare, Circle, CheckCircle, AlertCircle, FileText, Zap, Brain, Search, Image, Play, BookOpen } from 'lucide-react';
import MarkdownWithLatex from './markdown/MarkdownWithLatex';
import { NodeData } from './node/types/node.types';
import { NodeType } from '@/api/types/flow.types';

// 动态导入电路组件，避免循环依赖
const CircuitFlowWithProvider = React.lazy(() => 
  import('@/app/pages/circuit/components/CircuitFlow').then(module => ({
    default: module.CircuitFlowWithProvider
  }))
);

interface NodeDetailPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
}

// 节点类型图标映射
const nodeTypeIcons: Record<NodeType, React.ReactNode> = {
  'root': <Circle className="w-4 h-4" />,
  'query': <MessageSquare className="w-4 h-4" />,
  'answer': <CheckCircle className="w-4 h-4" />,
  'answer-point': <AlertCircle className="w-4 h-4" />,
  'answer-detail': <FileText className="w-4 h-4" />,
  'ANSWER_POINT': <AlertCircle className="w-4 h-4" />,
  'ANSWER_DETAIL': <FileText className="w-4 h-4" />,
  'knowledge-head': <Brain className="w-4 h-4" />,
  'knowledge-detail': <BookOpen className="w-4 h-4" />,
  'circuit-canvas': <Zap className="w-4 h-4" />,
  'circuit-point': <Search className="w-4 h-4" />,
  'circuit-detail': <FileText className="w-4 h-4" />,
  'resource': <Image className="w-4 h-4" />,
  'PDF_DOCUMENT': <FileText className="w-4 h-4" />,
  'PDF_ANALYSIS_POINT': <Search className="w-4 h-4" />,
};

// 节点类型中文名映射
const nodeTypeNames: Record<NodeType, string> = {
  'root': '根节点',
  'query': '用户问题',
  'answer': '智能回答',
  'answer-point': '回答角度',
  'answer-detail': '详细回答',
  'ANSWER_POINT': '回答角度',
  'ANSWER_DETAIL': '详细回答',
  'knowledge-head': '知识要点',
  'knowledge-detail': '知识详情',
  'circuit-canvas': '电路画布',
  'circuit-point': '电路分析点',
  'circuit-detail': '电路详情',
  'resource': '资源节点',
  'PDF_DOCUMENT': 'PDF文档',
  'PDF_ANALYSIS_POINT': 'PDF分析点',
};

// 安全获取字符串字段
const getStringField = (obj: any, field: string): string | undefined => {
  return obj && typeof obj[field] === 'string' ? obj[field] : undefined;
};

// 安全获取数组字段
const getArrayField = (obj: any, field: string): any[] | undefined => {
  return obj && Array.isArray(obj[field]) ? obj[field] : undefined;
};

// 安全获取布尔字段
const getBooleanField = (obj: any, field: string): boolean | undefined => {
  return obj && typeof obj[field] === 'boolean' ? obj[field] : undefined;
};

// 安全获取数字字段
const getNumberField = (obj: any, field: string): number | undefined => {
  return obj && typeof obj[field] === 'number' ? obj[field] : undefined;
};

export default function NodeDetailPanel({ selectedNode, onClose }: NodeDetailPanelProps) {
  const nodeData = selectedNode?.data as NodeData<NodeType>;
  const [nodeContentKey, setNodeContentKey] = useState(0); // 用于强制重新渲染
  const [lastTextContent, setLastTextContent] = useState<string>(''); // 跟踪上次的文本内容
  
  // 监听节点数据变化，实现流式更新
  useEffect(() => {
    if (selectedNode && nodeData) {
      const currentText = getStringField(nodeData, 'text') || '';
      const currentUpdatedAt = nodeData.updatedAt;
      
      // 检查文本内容是否实际发生了变化
      if (currentText !== lastTextContent) {
        console.log('NodeDetailPanel检测到文本内容变化:', {
          nodeId: selectedNode.id,
          oldLength: lastTextContent.length,
          newLength: currentText.length,
          updatedAt: currentUpdatedAt
        });
        
        setLastTextContent(currentText);
        setNodeContentKey(prev => prev + 1);
      }
    }
  }, [selectedNode?.id, selectedNode?.data?.text, selectedNode?.data?.updatedAt, nodeData, lastTextContent]);

  // 当选中的节点改变时，重置文本内容跟踪
  useEffect(() => {
    if (selectedNode) {
      const currentText = getStringField(selectedNode.data, 'text') || '';
      setLastTextContent(currentText);
      setNodeContentKey(prev => prev + 1);
    } else {
      setLastTextContent('');
    }
  }, [selectedNode?.id]);

  // 格式化时间
  const formattedDate = useMemo(() => {
    if (!nodeData?.createdAt || typeof nodeData.createdAt !== 'number') return '';
    return format(new Date(nodeData.createdAt), 'yyyy年MM月dd日 HH:mm');
  }, [nodeData?.createdAt]);

  // 获取节点状态
  const nodeStatus = useMemo(() => {
    if (!nodeData) return null;
    
    const isGenerated = getBooleanField(nodeData, 'isGenerated');
    const process = getStringField(nodeData, 'process');
    
    if (isGenerated) {
      return { text: '已生成', color: 'text-green-600 bg-green-50' };
    }
    
    if (process === 'generating') {
      return { text: '生成中', color: 'text-blue-600 bg-blue-50' };
    }
    
    return { text: '待生成', color: 'text-gray-600 bg-gray-50' };
  }, [nodeData]);

  // 获取模式信息
  const modeInfo = useMemo(() => {
    const mode = getStringField(nodeData, 'mode');
    if (!mode) return null;
    
    const modeMap: Record<string, string> = {
      'deepseekV3': 'DeepSeek V3',
      'doubao': '豆包',
    };
    
    return modeMap[mode] || mode;
  }, [nodeData]);

  // 获取电路相关信息
  const circuitInfo = useMemo(() => {
    if (!nodeData) return null;
    
    const circuitDesign = nodeData.circuitDesign as any;
    const pointDescription = getStringField(nodeData, 'pointDescription');
    const detailContent = getStringField(nodeData, 'detailContent');
    const parentPointId = getStringField(nodeData, 'parentPointId');
    
    return {
      circuitDesign,
      pointDescription,
      detailContent,
      parentPointId
    };
  }, [nodeData]);

  // 检查是否为电路节点类型
  const isCircuitNode = useMemo(() => {
    const nodeType = selectedNode?.type as NodeType;
    return nodeType === 'circuit-canvas' || nodeType === 'circuit-point' || nodeType === 'circuit-detail';
  }, [selectedNode?.type]);

  // 获取文本内容和其他字段信息
  const nodeFields = useMemo(() => {
    if (!nodeData) return {};
    
    return {
      title: getStringField(nodeData, 'title'),
      text: getStringField(nodeData, 'text'),
      subtype: getStringField(nodeData, 'subtype'),
      angle: getStringField(nodeData, 'angle'),
      objectName: getStringField(nodeData, 'objectName'),
      urls: getArrayField(nodeData, 'urls'),
      parentId: getNumberField(nodeData, 'parentId')
    };
  }, [nodeData]);

  // 检查是否正在生成内容
  const isGenerating = useMemo(() => {
    const process = getStringField(nodeData, 'process');
    const isGenerated = getBooleanField(nodeData, 'isGenerated');
    const text = nodeFields.text;
    return process === 'generating' || (!isGenerated && text && text.length > 0);
  }, [nodeData, nodeFields.text]);

  // 渲染电路内容
  const renderCircuitContent = useMemo(() => {
    if (!isCircuitNode || !circuitInfo?.circuitDesign) return null;
    
    return (
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">电路图预览</h4>
        <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ height: '300px' }}>
          <React.Suspense fallback={
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>加载电路图...</p>
              </div>
            </div>
          }>
            <CircuitFlowWithProvider 
              selectedModel={getStringField(nodeData, 'mode') === 'doubao' ? 'doubao' : 'deepseekV3'}
              initialCircuitDesign={circuitInfo.circuitDesign}
              isReadOnly={true}
            />
          </React.Suspense>
        </div>
      </div>
    );
  }, [isCircuitNode, circuitInfo?.circuitDesign, nodeData]);

  // 早期返回：当没有选中节点时
  if (!selectedNode || !nodeData) {
    return (
      <div className="w-96 bg-white border-l border-gray-200 h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Circle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-400">未选择节点</p>
          <p className="text-sm text-gray-400 mt-2">点击左侧节点查看详细内容</p>
        </div>
      </div>
    );
  }

  const { title, text, subtype, angle, objectName, urls, parentId } = nodeFields;

  return (
    <div className="w-96 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          {nodeTypeIcons[selectedNode.type as NodeType] || <Circle className="w-4 h-4" />}
          <h2 className="text-lg font-semibold text-gray-800">
            {nodeTypeNames[selectedNode.type as NodeType] || '未知节点'}
          </h2>
          {/* 显示生成状态指示器 */}
          {isGenerating && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600">生成中...</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="关闭详情面板"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 基本信息 */}
        <div className="space-y-3">
          {/* 节点标题 */}
          {title && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {title}
              </h3>
            </div>
          )}

          {/* 状态和模式信息 */}
          <div className="flex flex-wrap gap-2">
            {nodeStatus && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${nodeStatus.color}`}>
                {nodeStatus.text}
              </div>
            )}
            {modeInfo && (
              <div className="px-3 py-1 rounded-full text-sm font-medium text-purple-600 bg-purple-50">
                <Tag className="w-3 h-3 mr-1 inline" />
                {modeInfo}
              </div>
            )}
          </div>

          {/* 创建时间 */}
          {formattedDate && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-2" />
              {formattedDate}
            </div>
          )}
        </div>

        {/* 电路图预览 */}
        {renderCircuitContent}

        {/* 节点内容 */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">节点内容</h4>
            {isGenerating && (
              <div className="flex items-center space-x-1 text-xs text-blue-600">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="ml-1">实时更新中</span>
              </div>
            )}
          </div>
          <div className="prose prose-sm max-w-none" key={`content-${nodeContentKey}-${selectedNode.id}`}>
            {text ? (
              <div className="relative">
                <MarkdownWithLatex 
                  text={text} 
                  isStreaming={Boolean(isGenerating)}
                />
                {/* 如果正在生成，显示闪烁光标 */}
                {isGenerating && (
                  <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1 align-text-bottom"></span>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>暂无内容</p>
              </div>
            )}
          </div>
        </div>

        {/* 特殊属性 */}
        {(subtype || angle || objectName || urls || circuitInfo?.pointDescription || circuitInfo?.detailContent) && (
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">附加信息</h4>
            <div className="space-y-2">
              {subtype && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">子类型</span>
                  <span className="font-medium text-gray-800">{subtype}</span>
                </div>
              )}
              {angle && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">分析角度</span>
                  <span className="font-medium text-gray-800">{angle}</span>
                </div>
              )}
              {objectName && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">对象名称</span>
                  <span className="font-medium text-gray-800">{objectName}</span>
                </div>
              )}
              {circuitInfo?.pointDescription && (
                <div className="text-sm">
                  <span className="text-gray-600">电路分析描述</span>
                  <p className="mt-1 text-gray-800">{circuitInfo.pointDescription}</p>
                </div>
              )}
              {circuitInfo?.detailContent && (
                <div className="text-sm">
                  <span className="text-gray-600">详细分析内容</span>
                  <p className="mt-1 text-gray-800">{circuitInfo.detailContent}</p>
                </div>
              )}
              {circuitInfo?.parentPointId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">关联分析点</span>
                  <span className="font-medium text-gray-800">{circuitInfo.parentPointId}</span>
                </div>
              )}
              {urls && urls.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600">相关链接</span>
                  <div className="mt-1 space-y-1">
                    {urls.map((url, index) => (
                      <a
                        key={index}
                        href={typeof url === 'string' ? url : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 hover:text-blue-800 truncate"
                      >
                        {typeof url === 'string' ? url : '无效链接'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 电路设计信息 */}
        {circuitInfo?.circuitDesign && (
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">电路设计信息</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">电路元件数量</span>
                <span className="font-medium text-gray-800">
                  {circuitInfo.circuitDesign.elements?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">连接数量</span>
                <span className="font-medium text-gray-800">
                  {circuitInfo.circuitDesign.connections?.length || 0}
                </span>
              </div>
              {circuitInfo.circuitDesign.title && (
                <div className="text-sm">
                  <span className="text-gray-600">设计标题</span>
                  <p className="mt-1 text-gray-800">{circuitInfo.circuitDesign.title}</p>
                </div>
              )}
              {circuitInfo.circuitDesign.description && (
                <div className="text-sm">
                  <span className="text-gray-600">设计描述</span>
                  <p className="mt-1 text-gray-800">{circuitInfo.circuitDesign.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 技术信息 */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">技术信息</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">节点ID</span>
              <p className="font-mono text-xs text-gray-800 mt-1">{selectedNode.id}</p>
            </div>
            <div>
              <span className="text-gray-600">节点类型</span>
              <p className="font-mono text-xs text-gray-800 mt-1">{selectedNode.type}</p>
            </div>
            {parentId && (
              <div className="col-span-2">
                <span className="text-gray-600">父节点ID</span>
                <p className="font-mono text-xs text-gray-800 mt-1">{parentId}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
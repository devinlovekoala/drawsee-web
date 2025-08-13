import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { format } from 'date-fns';
import { X, Clock, Tag, MessageSquare, Circle, CheckCircle, AlertCircle, FileText, Zap, Brain, Search, Image, BookOpen } from 'lucide-react';
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
  // 添加获取最新节点数据的函数
  getLatestNodeData?: (nodeId: string) => Node | null;
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
  'PDF_ANALYSIS_DETAIL': <FileText className="w-4 h-4" />,
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
  'PDF_ANALYSIS_DETAIL': 'PDF分析详情',
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

export default function NodeDetailPanel({ selectedNode, onClose, getLatestNodeData }: NodeDetailPanelProps) {
  const nodeData = selectedNode?.data as NodeData<NodeType>;
  const [nodeContentKey, setNodeContentKey] = useState(0); // 用于强制重新渲染
  const [lastTextContent, setLastTextContent] = useState<string>(''); // 跟踪上次的文本内容
  const [forceRefresh, setForceRefresh] = useState(0); // 添加强制刷新状态
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(0); // 跟踪上次更新时间
  const scrollRef = useRef<HTMLDivElement>(null); // 用于自动滚动
  
  // 安全地获取文本内容
  const getCurrentText = useCallback((node: Node | null): string => {
    if (!node?.data?.text) return '';
    return typeof node.data.text === 'string' ? node.data.text : String(node.data.text);
  }, []);
  
  // 监听选中节点变化，立即更新状态
  useEffect(() => {
    if (selectedNode) {
      const currentText = getCurrentText(selectedNode);
      const currentUpdatedAt = (selectedNode.data?.updatedAt as number) || 0;
      const currentForceRefresh = (selectedNode.data?.forceRefresh as number) || 0;
      
      console.log('selectedNode变化，立即更新状态:', {
        nodeId: selectedNode.id,
        textLength: currentText.length,
        updatedAt: currentUpdatedAt,
        forceRefresh: currentForceRefresh,
        process: selectedNode.data?.process
      });
      
      // 立即更新状态
      if (currentText !== lastTextContent) {
        setLastTextContent(currentText);
        setNodeContentKey(prev => prev + 1);
      }
      
      if (currentUpdatedAt !== lastUpdatedAt) {
        setLastUpdatedAt(currentUpdatedAt);
        setForceRefresh(prev => prev + 1);
      }
      
      if (currentForceRefresh && currentForceRefresh !== forceRefresh) {
        setForceRefresh(currentForceRefresh);
      }
      
      // 特别监听isGenerated状态变化
      const currentIsGenerated = (selectedNode.data?.isGenerated as boolean) || false;
      if (currentIsGenerated !== lastTextContent.includes('已生成')) {
        console.log(`检测到isGenerated状态变化，节点 ${selectedNode.id}:`, currentIsGenerated);
        setForceRefresh(prev => prev + 1);
      }
    }
  }, [selectedNode, getCurrentText, lastTextContent, lastUpdatedAt, forceRefresh]);

  // 额外的实时检测机制 - 针对正在生成的节点
  useEffect(() => {
    if (!selectedNode) return;
    
    const nodeType = selectedNode.type as NodeType;
    const process = getStringField(nodeData, 'process');
    const isDetailNode = nodeType === 'answer-detail' || nodeType === 'ANSWER_DETAIL' || 
                        nodeType === 'circuit-detail' || nodeType === 'knowledge-detail';
    
    // 只对正在生成的详情节点进行高频检测
    if (isDetailNode && process === 'generating') {
      console.log(`为正在生成的详情节点 ${selectedNode.id} 设置实时检测`);
      
      const realTimeCheck = setInterval(() => {
        // 使用getLatestNodeData获取最新的节点数据
        const latestNode = getLatestNodeData ? getLatestNodeData(selectedNode.id) : selectedNode;
        const currentText = getCurrentText(latestNode);
        const currentUpdatedAt = (latestNode?.data?.updatedAt as number) || 0;
        
        // 检查是否有新的文本内容
        if (currentText !== lastTextContent || currentUpdatedAt !== lastUpdatedAt) {
          console.log(`实时检测到内容变化，节点 ${selectedNode.id}，文本长度: ${currentText.length}，更新时间: ${currentUpdatedAt}`);
          setLastTextContent(currentText);
          setLastUpdatedAt(currentUpdatedAt);
          setForceRefresh(prev => prev + 1);
        }
      }, 100); // 100ms 间隔检测
      
      return () => clearInterval(realTimeCheck);
    }
  }, [selectedNode, nodeData, getCurrentText, lastTextContent, lastUpdatedAt, getLatestNodeData]);

  // 为正在生成的详情节点添加额外的高频检查
  useEffect(() => {
    if (!selectedNode || !nodeData) return;
    
    const nodeType = selectedNode?.type as NodeType;
    const process = getStringField(nodeData, 'process');
    const isDetailNode = nodeType === 'answer-detail' || nodeType === 'ANSWER_DETAIL' || 
                        nodeType === 'circuit-detail' || nodeType === 'knowledge-detail';
    
    if (isDetailNode && (process === 'generating' || !process)) {
      console.log(`为详情节点 ${selectedNode.id} 设置高频检查，当前process: ${process}`);
      
      let lastCheckedLength = 0;
      const interval = setInterval(() => {
        // 使用getLatestNodeData获取最新的节点数据
        const latestNode = getLatestNodeData ? getLatestNodeData(selectedNode.id) : selectedNode;
        const latestText = getStringField(latestNode?.data, 'text') || '';
        
        if (latestText.length !== lastCheckedLength) {
          console.log(`高频检查检测到文本变化，节点ID: ${selectedNode.id}，新长度: ${latestText.length}，旧长度: ${lastCheckedLength}`);
          lastCheckedLength = latestText.length;
          setLastTextContent(latestText);
          setNodeContentKey(prev => prev + 1);
          
          // 自动滚动到底部
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }
      }, 50); // 减少到50ms检查一次，提高实时性
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [selectedNode?.id, selectedNode?.type, getStringField(nodeData, 'process'), getLatestNodeData]);

  // 专门监听selectedNode的文本变化，确保最实时的更新
  useEffect(() => {
    if (selectedNode?.id) {
      // 使用getLatestNodeData获取最新的节点数据
      const latestNode = getLatestNodeData ? getLatestNodeData(selectedNode.id) : selectedNode;
      const currentText = latestNode?.data?.text;
      
      if (currentText && typeof currentText === 'string') {
        if (currentText !== lastTextContent) {
          console.log(`检测到文本变化，立即刷新UI，节点ID: ${selectedNode.id}，新长度: ${currentText.length}，旧长度: ${lastTextContent.length}`);
          setLastTextContent(currentText);
          setNodeContentKey(prev => prev + 1);
          
          // 自动滚动到底部
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }, 10);
        }
      }
    }
  }, [selectedNode?.data?.text, selectedNode?.id, getLatestNodeData, lastTextContent]);

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

  // 获取节点状态 - 使用最新的节点数据
  const nodeStatus = useMemo(() => {
    // 优先使用最新的节点数据
    const latestNode = selectedNode?.id && getLatestNodeData ? 
                      getLatestNodeData(selectedNode.id) : selectedNode;
    const currentNodeData = latestNode?.data as NodeData<NodeType> || nodeData;
    
    if (!currentNodeData) return null;
    
    const isGenerated = getBooleanField(currentNodeData, 'isGenerated');
    const process = getStringField(currentNodeData, 'process');
    const nodeType = selectedNode?.type as NodeType;
    
    console.log('节点状态计算:', {
      nodeId: selectedNode?.id,
      nodeType,
      isGenerated,
      process,
      timestamp: Date.now()
    });
    
    // 对于分点节点，优先检查是否已有子节点完成
    if (nodeType === 'answer-point' || nodeType === 'ANSWER_POINT' || 
        nodeType === 'knowledge-head' || nodeType === 'circuit-point' ||
        nodeType === 'PDF_ANALYSIS_POINT') {
      
      // 如果明确标记为已生成且process为completed，显示已完成
      if (isGenerated && process === 'completed') {
        return { text: '已完成', color: 'text-green-600 bg-green-50' };
      }
      
      // 如果process为generating，显示生成中
      if (process === 'generating') {
        return { text: '生成中', color: 'text-blue-600 bg-blue-50' };
      }
      
      // 默认状态
      return { text: '待生成', color: 'text-gray-600 bg-gray-50' };
    }
    
    // 对于详情节点（answer-detail, ANSWER_DETAIL, circuit-detail, knowledge-detail, PDF_ANALYSIS_DETAIL等）
    if (nodeType === 'answer-detail' || nodeType === 'ANSWER_DETAIL' || 
        nodeType === 'circuit-detail' || nodeType === 'knowledge-detail' ||
        nodeType === 'PDF_ANALYSIS_DETAIL') {
      
      // 如果明确标记为已完成
      if (process === 'completed') {
        return { text: '已生成完毕', color: 'text-green-600 bg-green-50' };
      }
      
      // 如果明确标记为已生成（兼容性处理）
      if (isGenerated && process !== 'generating') {
        return { text: '已生成完毕', color: 'text-green-600 bg-green-50' };
      }
      
      // 如果正在生成中
      if (process === 'generating') {
        return { text: '生成中', color: 'text-blue-600 bg-blue-50' };
      }
      
      // 如果生成失败
      if (process === 'failed') {
        return { text: '生成失败', color: 'text-red-600 bg-red-50' };
      }
      
      // 如果有内容但没有明确状态，可能还在生成
      const text = getStringField(currentNodeData, 'text');
      if (text && text.length > 0 && !isGenerated) {
        return { text: '生成中', color: 'text-blue-600 bg-blue-50' };
      }
      
      // 默认状态
      return { text: '待生成', color: 'text-gray-600 bg-gray-50' };
    }
    
    // 对于其他节点类型的处理
    if (isGenerated || process === 'completed') {
      return { text: '已生成', color: 'text-green-600 bg-green-50' };
    }
    
    if (process === 'generating') {
      return { text: '生成中', color: 'text-blue-600 bg-blue-50' };
    }
    
    if (process === 'failed') {
      return { text: '生成失败', color: 'text-red-600 bg-red-50' };
    }
    
    return { text: '待生成', color: 'text-gray-600 bg-gray-50' };
  }, [selectedNode?.id, selectedNode?.type, nodeData, getLatestNodeData, forceRefresh, lastUpdatedAt]);

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

  // 获取文本内容和其他字段信息 - 使用最新的节点数据
  const nodeFields = useMemo(() => {
    // 优先使用最新的节点数据
    const latestNode = selectedNode?.id && getLatestNodeData ? 
                      getLatestNodeData(selectedNode.id) : selectedNode;
    const currentNodeData = latestNode?.data as NodeData<NodeType> || nodeData;
    
    if (!currentNodeData) return {};
    
    return {
      title: getStringField(currentNodeData, 'title'),
      text: getStringField(currentNodeData, 'text'),
      subtype: getStringField(currentNodeData, 'subtype'),
      angle: getStringField(currentNodeData, 'angle'),
      objectName: getStringField(currentNodeData, 'objectName'),
      urls: getArrayField(currentNodeData, 'urls'),
      parentId: getNumberField(currentNodeData, 'parentId')
    };
  }, [selectedNode?.id, nodeData, getLatestNodeData, forceRefresh, lastUpdatedAt]);

  // 检查是否正在生成内容 - 使用最新的节点数据
  const isGenerating = useMemo(() => {
    // 优先使用最新的节点数据
    const latestNode = selectedNode?.id && getLatestNodeData ? 
                      getLatestNodeData(selectedNode.id) : selectedNode;
    const currentNodeData = latestNode?.data as NodeData<NodeType> || nodeData;
    
    const process = getStringField(currentNodeData, 'process');
    const isGenerated = getBooleanField(currentNodeData, 'isGenerated');
    const nodeType = selectedNode?.type as NodeType;
    
    // 对于已明确标记为已生成且process为completed的节点，直接返回false
    if (isGenerated && process === 'completed') {
      return false;
    }
    
    // 如果process明确为generating，返回true
    if (process === 'generating') {
      return true;
    }
    
    // 对于分点节点（answer-point, knowledge-head, circuit-point, PDF_ANALYSIS_POINT等），
    // 如果明确标记为已生成，则认为不再生成中
    if (nodeType === 'answer-point' || nodeType === 'ANSWER_POINT' || 
        nodeType === 'knowledge-head' || nodeType === 'circuit-point' ||
        nodeType === 'PDF_ANALYSIS_POINT') {
      return !isGenerated && process === 'generating'; // 只有在明确生成中状态才显示生成中
    }
    
    // 对于详情节点（answer-detail, ANSWER_DETAIL, circuit-detail, knowledge-detail, PDF_ANALYSIS_DETAIL等），
    // 检查是否正在流式生成内容
    if (nodeType === 'answer-detail' || nodeType === 'ANSWER_DETAIL' || 
        nodeType === 'circuit-detail' || nodeType === 'knowledge-detail' ||
        nodeType === 'PDF_ANALYSIS_DETAIL') {
      
      console.log(`详情节点 ${selectedNode?.id} 状态检查:`, {
        process,
        isGenerated,
        hasText: !!nodeFields.text,
        textLength: nodeFields.text?.length || 0
      });
      
      // 如果明确标记为已完成，则不再生成中
      if (process === 'completed') {
        return false;
      }
      
      // 如果明确标记为已生成，则不再生成中
      if (isGenerated === true) {
        return false;
      }
      
      // 如果正在生成中，返回true
      if (process === 'generating') {
        return true;
      }
      
      // 默认情况：如果没有明确的状态，且有文本内容，但process不是completed也不是generating，
      // 则认为已经完成（因为done消息可能没有正确更新状态）
      const text = nodeFields.text;
      if (text && text.length > 0) {
        // 如果有文本但process既不是generating也不是completed，很可能是已经完成的
        return process === 'generating';
      }
      
      // 完全没有内容的情况
      return false;
    }
    
    // 其他情况根据文本内容和状态判断
    const text = nodeFields.text;
    return process === 'generating' || (!isGenerated && text && text.length > 0 && process !== 'completed');
  }, [selectedNode?.id, selectedNode?.type, nodeData, nodeFields.text, getLatestNodeData, forceRefresh, lastUpdatedAt]);

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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
                <span className="ml-1">
                  {(() => {
                    const nodeType = selectedNode?.type as NodeType;
                    
                    // 根据节点类型显示不同的提示文字
                    if (nodeType === 'answer-detail' || nodeType === 'ANSWER_DETAIL' || 
                        nodeType === 'circuit-detail' || nodeType === 'knowledge-detail' ||
                        nodeType === 'PDF_ANALYSIS_DETAIL') {
                      return '内容生成中...';
                    } else if (nodeType === 'answer-point' || nodeType === 'ANSWER_POINT' || 
                               nodeType === 'knowledge-head' || nodeType === 'circuit-point' ||
                               nodeType === 'PDF_ANALYSIS_POINT') {
                      return '分析中...';
                    } else {
                      return '生成中...';
                    }
                  })()}
                </span>
              </div>
            )}
          </div>
          <div className="prose prose-sm max-w-none" key={`content-${nodeContentKey}-${selectedNode.id}-${forceRefresh}-${lastUpdatedAt}`}>
            {text ? (
              <div className="relative">
                <MarkdownWithLatex 
                  text={text} 
                  isStreaming={Boolean(isGenerating)}
                  key={`markdown-${selectedNode.id}-${forceRefresh}-${text.length}-${lastUpdatedAt}`}
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
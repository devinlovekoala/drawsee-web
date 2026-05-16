import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { format } from 'date-fns';
import { X, Clock, Tag, Circle, FileText, Zap, Sparkles, Eye, Loader2 } from 'lucide-react';
import { Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import MarkdownWithLatex, { type RagSource } from './markdown/MarkdownWithLatex';
import { NodeData } from './node/types/node.types';
import { NodeType, FollowUpSuggestionData, CreateAiTaskDTO } from '@/api/types/flow.types';
import { extractFileNameFromUrl, isHttpUrl } from '@/app/pages/flow/utils/document';
import { useAppContext } from '@/app/contexts/AppContext';
import { useFlowContext } from '@/app/contexts/FlowContext';
import { createAiTask } from '@/api/methods/flow.methods';
import type { CircuitDesign } from '@/api/types/circuit.types';
import {
  resolveWorkbenchRouteFromDesign,
  writeCircuitPrefill,
} from '@/app/pages/circuit/utils/circuitPrefill';
import { isCircuitDiagramIntent } from '@/app/pages/flow/utils/circuitIntent';

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
  onApplySuggestion?: (text: string) => void;
}

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

const normalizeSuggestionText = (value: string): string => {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_~`>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isNoisySuggestion = (raw: string): boolean => {
  const text = raw.trim();
  if (!text) return true;
  const hasMarkdownSignal = /[*_~`#>\n]/.test(text);
  const isTooLong = text.length > 140;
  const lineCount = text.split('\n').length;
  return isTooLong || lineCount > 2 || hasMarkdownSignal;
};

const clipSuggestionText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

const stripMarkdownText = (input: string): string => {
  return input
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$(.*?)\$/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractCircuitWarmupIntro = (rawText?: string): string => {
  if (!rawText) return '';
  const normalized = rawText.replace(/\r\n/g, '\n');

  // 优先提取“预热导语”章节
  const warmupMatch = normalized.match(/###\s*预热导语\s*\n([\s\S]*?)(?=\n\s*#{2,3}\s*|$)/);
  if (warmupMatch?.[1]) {
    return stripMarkdownText(warmupMatch[1]);
  }

  // 兜底：如果存在“追问方向概览”，取其前面的正文作为导语
  const splitByFollowup = normalized.split(/###\s*追问方向概览/);
  if (splitByFollowup[0]) {
    return stripMarkdownText(splitByFollowup[0]);
  }

  return stripMarkdownText(normalized);
};

const stripFollowupReferenceSections = (rawText?: string): string => {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\n{0,2}#{1,6}\s*(智推参考方向|追问方向概览|AI\s*追问推荐)\s*\n[\s\S]*?(?=\n\s*#{1,6}\s+|$)/g, '')
    .trim();
};

export default function NodeDetailPanel({ selectedNode, onClose, getLatestNodeData, onApplySuggestion }: NodeDetailPanelProps) {
  const latestSelectedNode = selectedNode?.id && getLatestNodeData
    ? getLatestNodeData(selectedNode.id) || selectedNode
    : selectedNode;
  const nodeData = latestSelectedNode?.data as NodeData<NodeType>;
  const [nodeContentKey, setNodeContentKey] = useState(0); // 用于强制重新渲染
  const [lastTextContent, setLastTextContent] = useState<string>(''); // 跟踪上次的文本内容
  const [forceRefresh, setForceRefresh] = useState(0); // 添加强制刷新状态
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(0); // 跟踪上次更新时间
  const scrollRef = useRef<HTMLDivElement>(null); // 用于自动滚动
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const autoScrollThreshold = 80;
  const { handleAiTaskCountPlus } = useAppContext();
  const { convId, chat, classId } = useFlowContext();
  const navigate = useNavigate();
  const [pdfDetailLoading, setPdfDetailLoading] = useState(false);
  const nodeTypeValue = selectedNode?.type ? String(selectedNode.type) : '';
  const isPdfAnalysisPointNode = nodeTypeValue === 'PDF_ANALYSIS_POINT' || nodeTypeValue === 'pdf-circuit-point';
  const isPdfAnalysisDetailNode = nodeTypeValue === 'PDF_ANALYSIS_DETAIL' || nodeTypeValue === 'pdf-circuit-detail';
  
  // 安全地获取文本内容
  const getCurrentText = useCallback((node: Node | null): string => {
    if (!node?.data?.text) return '';
    return typeof node.data.text === 'string' ? node.data.text : String(node.data.text);
  }, []);
  
  // 监听selectedNode变化和实时更新 - 优化防止无限循环
  useEffect(() => {
    if (!selectedNode) return;
    
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
    
    // 批量更新状态，避免多次触发
    let needsUpdate = false;
    const updates: Array<() => void> = [];
    
    if (currentText !== lastTextContent) {
      updates.push(() => setLastTextContent(currentText));
      updates.push(() => setNodeContentKey(prev => prev + 1));
      needsUpdate = true;
    }
    
    if (currentUpdatedAt !== lastUpdatedAt) {
      updates.push(() => setLastUpdatedAt(currentUpdatedAt));
      needsUpdate = true;
    }
    
    if (currentForceRefresh && currentForceRefresh !== forceRefresh) {
      updates.push(() => setForceRefresh(currentForceRefresh));
      needsUpdate = true;
    }
    
    // 批量执行更新
    if (needsUpdate) {
      updates.forEach(update => update());
    }
    
    // 特别监听isGenerated状态变化 - 添加防抖
    const currentIsGenerated = (selectedNode.data?.isGenerated as boolean) || false;
    const process = selectedNode.data?.process;
    
    // 只在状态真正变化且不是已完成状态时才触发更新
    if (currentIsGenerated !== lastTextContent.includes('已生成') && process !== 'completed') {
      console.log(`检测到isGenerated状态变化，节点 ${selectedNode.id}:`, currentIsGenerated);
      setForceRefresh(prev => prev + 1);
    }
  }, [selectedNode?.id, selectedNode?.data?.updatedAt, selectedNode?.data?.forceRefresh]); // 只监听关键属性变化  // 实时检测机制 - 仅针对正在生成的节点，优化性能
  useEffect(() => {
    if (!selectedNode) return;
    
    const nodeType = selectedNode.type ? String(selectedNode.type) : '';
    const process = getStringField(nodeData, 'process');
    const isDetailNode = nodeType === 'answer-detail' || nodeType === 'ANSWER_DETAIL' || 
                        nodeType === 'circuit-detail' || nodeType === 'knowledge-detail' ||
                        nodeType === 'PDF_ANALYSIS_DETAIL' || nodeType === 'pdf-circuit-detail';
    
    // 只对正在生成的详情节点进行检测，已完成的节点停止检测
    if (isDetailNode && process === 'generating') {
      console.log(`为正在生成的详情节点 ${selectedNode.id} 设置实时检测`);
      
      let lastCheckedText = lastTextContent;
      let lastCheckedUpdatedAt = lastUpdatedAt;
      
      const realTimeCheck = setInterval(() => {
        // 使用getLatestNodeData获取最新的节点数据
        const latestNode = getLatestNodeData ? getLatestNodeData(selectedNode.id) : selectedNode;
        if (!latestNode || !latestNode.data) return;
        
        const currentText = getCurrentText(latestNode);
        const currentUpdatedAt = (latestNode?.data?.updatedAt as number) || 0;
        const currentProcess = latestNode?.data?.process;
        
        // 如果进程已完成，停止检测
        if (currentProcess === 'completed') {
          console.log(`节点 ${selectedNode.id} 已完成，停止实时检测`);
          clearInterval(realTimeCheck);
          return;
        }
        
        // 检查是否有实际变化
        if (currentText !== lastCheckedText || currentUpdatedAt !== lastCheckedUpdatedAt) {
          console.log(`实时检测到内容变化，节点 ${selectedNode.id}，文本长度: ${currentText.length}，更新时间: ${currentUpdatedAt}`);
          lastCheckedText = currentText;
          lastCheckedUpdatedAt = currentUpdatedAt;
          
          setLastTextContent(currentText);
          setLastUpdatedAt(currentUpdatedAt);
          setForceRefresh(prev => prev + 1);
        }
      }, 200); // 降低检测频率到200ms，减少性能影响
      
      return () => clearInterval(realTimeCheck);
    }
  }, [selectedNode?.id, nodeData?.process]); // 只监听关键状态变化

  // 高频检查机制 - 仅对正在生成的详情节点，避免无限循环
  useEffect(() => {
    if (!selectedNode || !nodeData) return;
    
    const nodeType = selectedNode?.type ? String(selectedNode.type) : '';
    const process = getStringField(nodeData, 'process');
    const isDetailNode = nodeType === 'answer-detail' || nodeType === 'ANSWER_DETAIL' || 
                        nodeType === 'circuit-detail' || nodeType === 'knowledge-detail' ||
                        nodeType === 'PDF_ANALYSIS_DETAIL' || nodeType === 'pdf-circuit-detail';
    
    // 只对正在生成的详情节点进行高频检查，已完成或未开始的节点跳过
    if (isDetailNode && process === 'generating') {
      console.log(`为详情节点 ${selectedNode.id} 设置高频检查，当前process: ${process}`);
      
      let lastCheckedLength = getCurrentText(selectedNode).length;
      let intervalId: NodeJS.Timeout;
      
      const interval = setInterval(() => {
        // 使用getLatestNodeData获取最新的节点数据
        const latestNode = getLatestNodeData ? getLatestNodeData(selectedNode.id) : selectedNode;
        if (!latestNode || !latestNode.data) return;
        
        const latestText = getStringField(latestNode?.data, 'text') || '';
        const latestProcess = getStringField(latestNode?.data, 'process');
        
        // 如果进程已完成，停止高频检查
        if (latestProcess === 'completed') {
          console.log(`节点 ${selectedNode.id} 进程已完成，停止高频检查`);
          clearInterval(interval);
          return;
        }
        
        // 只在文本长度真正变化时才更新
        if (latestText.length !== lastCheckedLength) {
          console.log(`高频检查检测到文本变化，节点ID: ${selectedNode.id}，新长度: ${latestText.length}，旧长度: ${lastCheckedLength}`);
          lastCheckedLength = latestText.length;
          
          setLastTextContent(latestText);
          setNodeContentKey(prev => prev + 1);
          
          // 自动滚动到底部
          if (scrollRef.current && autoScrollEnabled) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }
      }, 300); // 降低频率到300ms，减少性能开销
      
      intervalId = interval;
      
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [selectedNode?.id, nodeData?.process, autoScrollEnabled]); // 只监听关键状态

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
            if (scrollRef.current && autoScrollEnabled) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }, 10);
        }
      }
    }
  }, [selectedNode?.data?.text, selectedNode?.id, getLatestNodeData, lastTextContent, autoScrollEnabled]);

  // 当选中的节点改变时，重置文本内容跟踪
  useEffect(() => {
    if (selectedNode) {
      const currentText = getStringField(selectedNode.data, 'text') || '';
      setLastTextContent(currentText);
      setNodeContentKey(prev => prev + 1);
      setAutoScrollEnabled(true);
    } else {
      setLastTextContent('');
      setAutoScrollEnabled(true);
    }
  }, [selectedNode?.id]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const nearBottom = scrollHeight - scrollTop - clientHeight <= autoScrollThreshold;
    setAutoScrollEnabled(nearBottom);
  }, [autoScrollThreshold]);

  const resolveSelectedModel = useCallback(() => {
    const latestNode = selectedNode?.id && getLatestNodeData ? getLatestNodeData(selectedNode.id) : selectedNode;
    const currentNodeData = latestNode?.data as NodeData<NodeType> | undefined;
    const mode = getStringField(currentNodeData, 'mode');
    return (mode && typeof mode === 'string') ? mode : 'deepseekV3';
  }, [selectedNode, getLatestNodeData]);

  // 格式化时间
  const formattedDate = useMemo(() => {
    if (!nodeData?.createdAt || typeof nodeData.createdAt !== 'number') return '';
    return format(new Date(nodeData.createdAt), 'yyyy年MM月dd日 HH:mm');
  }, [nodeData?.createdAt]);

  // 获取节点状态 - 使用最新的节点数据，优化避免无限重新计算
  const nodeStatus = useMemo(() => {
    // 优先使用最新的节点数据
    const latestNode = selectedNode?.id && getLatestNodeData ? 
                      getLatestNodeData(selectedNode.id) : selectedNode;
    const currentNodeData = latestNode?.data as NodeData<NodeType> || nodeData;
    
    if (!currentNodeData) return null;
    
    const isGenerated = getBooleanField(currentNodeData, 'isGenerated');
    const process = getStringField(currentNodeData, 'process');
    const nodeType = selectedNode?.type ? String(selectedNode.type) : '';
    
    // 减少日志输出频率，避免控制台被刷屏
    if (Math.random() < 0.1) { // 只在10%的计算中输出日志
      console.log('节点状态计算:', {
        nodeId: selectedNode?.id,
        nodeType,
        isGenerated,
        process,
        timestamp: Date.now()
      });
    }
    
    // 对于分点节点，优先检查是否已有子节点完成
    if (nodeType === 'answer-point' || nodeType === 'ANSWER_POINT' || 
        nodeType === 'knowledge-head' || nodeType === 'circuit-analyze' ||
        nodeType === 'PDF_ANALYSIS_POINT' || nodeType === 'pdf-circuit-point') {
      
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
        nodeType === 'PDF_ANALYSIS_DETAIL' || nodeType === 'pdf-circuit-detail') {
      
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
  }, [
    selectedNode?.id, 
    selectedNode?.type, 
    nodeData?.isGenerated, 
    nodeData?.process, 
    nodeData?.text, 
    lastUpdatedAt
  ]); // 优化依赖项，只监听真正影响状态的字段

  // 获取模式信息
  const modeInfo = useMemo(() => {
    const mode = getStringField(nodeData, 'mode');
    if (!mode) return null;
    
    const modeMap: Record<string, string> = {
      deepseekV3: 'DeepSeek V3',
      qwen: 'Qwen',
      qwenVision: 'Qwen Vision',
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
    return Boolean(circuitInfo?.circuitDesign) ||
      nodeTypeValue === 'circuit-canvas' ||
      nodeTypeValue === 'circuit-analyze' ||
      nodeTypeValue === 'circuit-detail';
  }, [nodeTypeValue, circuitInfo?.circuitDesign]);

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
      angle: getStringField(currentNodeData, 'angle'),
      objectName: getStringField(currentNodeData, 'objectName'),
      urls: getArrayField(currentNodeData, 'urls'),
      fileUrl: getStringField(currentNodeData, 'fileUrl'),
      fileType: getStringField(currentNodeData, 'fileType')
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
    const nodeType = nodeTypeValue;
    
    // 对于已明确标记为已生成且process为completed的节点，直接返回false
    if (isGenerated && process === 'completed') {
      return false;
    }
    
    // 如果process明确为generating，返回true
    if (process === 'generating') {
      return true;
    }
    
    // 对于分析节点（answer-point, knowledge-head, circuit-analyze, PDF_ANALYSIS_POINT等），
    // 如果明确标记为已生成，则认为不再生成中
    if (nodeType === 'answer-point' || nodeType === 'ANSWER_POINT' || 
        nodeType === 'knowledge-head' || nodeType === 'circuit-analyze' ||
        nodeType === 'PDF_ANALYSIS_POINT' || nodeType === 'pdf-circuit-point') {
      return !isGenerated && process === 'generating'; // 只有在明确生成中状态才显示生成中
    }
    
    // 对于详情节点（answer-detail, ANSWER_DETAIL, circuit-detail, knowledge-detail, PDF_ANALYSIS_DETAIL等），
    // 检查是否正在流式生成内容
    if (nodeType === 'answer-detail' || nodeType === 'ANSWER_DETAIL' || 
        nodeType === 'circuit-detail' || nodeType === 'knowledge-detail' ||
        nodeType === 'PDF_ANALYSIS_DETAIL' || nodeType === 'pdf-circuit-detail') {
      
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

  const ensureCircuitMetadata = useCallback((design?: CircuitDesign | null) => {
    if (!design) return null;
    const fallbackTitle = (nodeData && typeof (nodeData as any).title === 'string' ? (nodeData as any).title : '电路设计') || '电路设计';
    const nowIso = new Date().toISOString();
    return {
      ...design,
      metadata: {
        title: design.metadata?.title || fallbackTitle,
        description: design.metadata?.description || '',
        createdAt: design.metadata?.createdAt || nowIso,
        updatedAt: design.metadata?.updatedAt || nowIso
      }
    } as CircuitDesign;
  }, [nodeData]);

  const handleOpenCircuitPage = useCallback(() => {
    const circuitDesign = circuitInfo?.circuitDesign as CircuitDesign | undefined;
    const normalizedDesign = ensureCircuitMetadata(circuitDesign);
    if (normalizedDesign) {
      writeCircuitPrefill({
        design: normalizedDesign,
        ts: Date.now(),
        convId,
        source: 'flow',
      });
    }
    const targetPath = resolveWorkbenchRouteFromDesign(normalizedDesign);
    if (convId) {
      sessionStorage.setItem(
        `circuit_return_info_${convId}`,
        JSON.stringify({
          designId: normalizedDesign?.id,
          path: targetPath,
          from: 'flow',
          ts: Date.now()
        })
      );
    }
    try {
      (window as any).drawsee_suppressBeforeUnload = true;
      (window as any).drawsee_preConfirmedNavigation = true;
    } catch (error) {
      console.warn('设置画布跳转保护标记失败', error);
    }
    navigate(targetPath, {
      state: {
        prefillCircuitDesign: normalizedDesign,
        convId,
        fromFlow: true,
      },
    });
  }, [circuitInfo?.circuitDesign, convId, ensureCircuitMetadata, navigate]);

  const followUpInfo = useMemo(() => {
    const latestNode = selectedNode?.id && getLatestNodeData ? 
      getLatestNodeData(selectedNode.id) : selectedNode;
    const currentNodeData = latestNode?.data as NodeData<NodeType> | undefined;
    if (!currentNodeData) {
      return { suggestions: [] as FollowUpSuggestionData[], contextTitle: undefined as string | undefined };
    }
    const rawFollowUps = getArrayField(currentNodeData, 'followUps') as FollowUpSuggestionData[] | undefined;
    const suggestions = rawFollowUps?.filter((item) => {
      if (!item) return false;
      const source = (typeof item.followUp === 'string' && item.followUp.trim().length > 0 && item.followUp) ||
        (typeof item.hint === 'string' && item.hint.trim().length > 0 && item.hint) ||
        (typeof item.title === 'string' && item.title.trim().length > 0 && item.title) ||
        '';
      return source.trim().length > 0;
    }) ?? [];
    const contextTitle = getStringField(currentNodeData, 'contextTitle');
    return { suggestions, contextTitle };
  }, [selectedNode?.id, nodeData, getLatestNodeData, forceRefresh, lastUpdatedAt]);

  const { title, text, angle, objectName, urls, fileUrl, fileType } = nodeFields;
  const qaAnswerNodeId = getStringField(nodeData, 'qaAnswerNodeId');
  const qaAnswerText = getStringField(nodeData, 'qaAnswerText');
  const qaAnswerTitle = getStringField(nodeData, 'qaAnswerTitle');
  const ragSources = useMemo(() => {
    return (getArrayField(nodeData, 'ragSources') || []) as RagSource[];
  }, [nodeData]);
  const qaRagSources = useMemo(() => {
    return (getArrayField(nodeData, 'qaRagSources') || ragSources) as RagSource[];
  }, [nodeData, ragSources]);
  const hasFollowupSuggestions = followUpInfo.suggestions.length > 0;
  const displayText = useMemo(() => {
    return hasFollowupSuggestions ? stripFollowupReferenceSections(text) : text;
  }, [hasFollowupSuggestions, text]);
  const qaAnswerDisplayText = useMemo(() => {
    return hasFollowupSuggestions ? stripFollowupReferenceSections(qaAnswerText) : qaAnswerText;
  }, [hasFollowupSuggestions, qaAnswerText]);
  const shouldShowQaAnswerTitle = useMemo(() => {
    const normalized = qaAnswerTitle?.trim();
    return Boolean(normalized && !['AI解析', 'AI回答', '回答'].includes(normalized));
  }, [qaAnswerTitle]);
  const circuitWarmupIntro = useMemo(() => extractCircuitWarmupIntro(text), [text]);
  const isWaitingForCircuitCanvas = useMemo(() => {
    return Boolean(
      !circuitInfo?.circuitDesign &&
      isGenerating &&
      isCircuitDiagramIntent(title, text, qaAnswerTitle, qaAnswerText)
    );
  }, [circuitInfo?.circuitDesign, isGenerating, title, text, qaAnswerTitle, qaAnswerText]);

  // 渲染电路内容
  const renderCircuitContent = useMemo(() => {
    if (!circuitInfo?.circuitDesign) {
      if (!isWaitingForCircuitCanvas) return null;

      return (
        <div className="border-t border-gray-100 pt-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900">正在生成电路图</h4>
                <p className="mt-1 text-xs leading-relaxed text-blue-700">
                  AI 回答已开始返回，电路画布会在后端完成结构化生成后自动出现在这里。
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!isCircuitNode) return null;
    
    return (
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h4 className="text-sm font-medium text-gray-700">电路图预览</h4>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              onClick={handleOpenCircuitPage}
              type="primary"
            >
              在画布中打开
            </Button>
          </div>
        </div>
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
              selectedModel={getStringField(nodeData, 'mode') === 'qwen' ? 'qwen' : 'deepseekV3'}
              initialCircuitDesign={circuitInfo.circuitDesign}
              isReadOnly={true}
              showStatusBar={false}
              enhanceInitialLayout={true}
            />
          </React.Suspense>
        </div>
      </div>
    );
  }, [isCircuitNode, circuitInfo?.circuitDesign, isWaitingForCircuitCanvas, nodeData, handleOpenCircuitPage]);

  const shouldRenderCircuitWarmupOnly = useMemo(() => {
    if (nodeTypeValue !== 'circuit-analyze') return false;
    const raw = typeof text === 'string' ? text : '';
    const hasFollowupSection = /###\s*追问方向概览/.test(raw);
    const hasFollowupSuggestions = followUpInfo.suggestions.length > 0;
    return hasFollowupSection && hasFollowupSuggestions;
  }, [nodeTypeValue, text, followUpInfo.suggestions.length]);

  const pdfFollowUpLabel = useMemo(() => {
    const labelSource = (typeof title === 'string' && title.trim().length > 0) ? title.trim() :
      (typeof angle === 'string' && angle.trim().length > 0) ? angle.trim() : '该分析点';
    return labelSource;
  }, [title, angle]);

  const handlePdfFollowupPrefill = useCallback(() => {
    if (!onApplySuggestion) return;
    const template = `围绕「${pdfFollowUpLabel}」这个PDF分析点，我想进一步了解：`;
    onApplySuggestion(template);
  }, [onApplySuggestion, pdfFollowUpLabel]);

  const handlePdfDetailGeneration = useCallback(async () => {
    if (!selectedNode) return;
    const sanitizedText = typeof text === 'string' ? text.trim() : '';
    if (!sanitizedText) {
      message.error('分析点内容为空，无法生成详情');
      return;
    }
    if (pdfDetailLoading) return;
    const parentNodeId = Number(selectedNode.id);
    if (Number.isNaN(parentNodeId)) {
      message.error('节点ID无效，无法生成详情');
      return;
    }
    setPdfDetailLoading(true);
    try {
      const dto: CreateAiTaskDTO = {
        type: 'PDF_CIRCUIT_ANALYSIS_DETAIL',
        prompt: sanitizedText,
        promptParams: {},
        convId: typeof convId === 'number' ? convId : null,
        parentId: parentNodeId,
        model: resolveSelectedModel(),
        classId: classId
      };
      const response = await createAiTask(dto);
      handleAiTaskCountPlus();
      window.dispatchEvent(new CustomEvent('auto-select-detail-node', {
        detail: {
          parentNodeId: selectedNode.id,
          detailNodeType: 'PDF_ANALYSIS_DETAIL',
          detailNodeTypes: ['PDF_ANALYSIS_DETAIL', 'pdf-circuit-detail']
        }
      }));
      message.success('已发送PDF分析详情任务');
      if (response?.taskId) {
        chat(response.taskId);
      }
    } catch (error) {
      console.error('发送PDF分析详情任务失败:', error);
      message.error('发送PDF分析详情任务失败');
    } finally {
      setPdfDetailLoading(false);
    }
  }, [selectedNode, text, convId, handleAiTaskCountPlus, pdfDetailLoading, chat, resolveSelectedModel]);

  // 早期返回：当没有选中节点时
  if (!selectedNode || !nodeData) {
    return (
      <div className="w-full bg-white border-l border-gray-200 h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Circle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-400">未选择节点</p>
          <p className="text-sm text-gray-400 mt-2">点击左侧节点查看详细内容</p>
        </div>
      </div>
    );
  }

  const renderStreamContent = () => {
    return displayText ? (
      <div className="relative">
        <MarkdownWithLatex
          text={displayText}
          isStreaming={Boolean(isGenerating)}
          ragSources={ragSources}
          key={`markdown-${selectedNode?.id}-${forceRefresh}-${displayText.length}-${lastUpdatedAt}`}
        />
        {isGenerating && (
          <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1 align-text-bottom"></span>
        )}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>暂无内容</p>
      </div>
    );
  };

  return (
    <div 
      className="bg-white border-l border-gray-200 h-full flex flex-col flex-shrink-0" 
      style={{ 
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        zIndex: 10,
        position: 'relative',
        pointerEvents: 'auto',
        userSelect: 'text',
        WebkitUserSelect: 'text'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-800">
            节点详情
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
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
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
                    const nodeType = nodeTypeValue;
                    
                    // 根据节点类型显示不同的提示文字
                    if (nodeType === 'answer-detail' || nodeType === 'ANSWER_DETAIL' || 
                        nodeType === 'circuit-detail' || nodeType === 'knowledge-detail' ||
                        nodeType === 'PDF_ANALYSIS_DETAIL') {
                      return '内容生成中...';
                    } else if (nodeType === 'answer-point' || nodeType === 'ANSWER_POINT' || 
                               nodeType === 'knowledge-head' || nodeType === 'circuit-analyze' ||
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
            {(() => {
              if (shouldRenderCircuitWarmupOnly) {
                return (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        预热导语
                      </p>
                      <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {circuitWarmupIntro || '模型正在分析该电路，请稍候...'}
                      </p>
                    </div>
                  </div>
                );
              }

              if (qaAnswerNodeId) {
                return (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/60 shadow-sm">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        用户提问
                      </p>
                      <p className="mt-2 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                        {text || '追问内容为空'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                        AI 回答
                      </p>
                      {shouldShowQaAnswerTitle && qaAnswerTitle && (
                        <p className="mt-1 text-base font-semibold text-gray-900">
                          {qaAnswerTitle}
                        </p>
                      )}
                      <div className="mt-3 prose prose-sm max-w-none">
                        {qaAnswerDisplayText ? (
                          <MarkdownWithLatex
                            text={qaAnswerDisplayText}
                            isStreaming={Boolean(isGenerating)}
                            ragSources={qaRagSources}
                            key={`qa-answer-${qaAnswerNodeId}-${forceRefresh}-${qaAnswerDisplayText.length}-${lastUpdatedAt}`}
                          />
                        ) : (
                          <div className="text-sm text-gray-400 py-3">
                            AI 回答生成中...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              if (
                nodeTypeValue === 'circuit-detail' ||
                nodeTypeValue === 'answer-detail' ||
                nodeTypeValue === 'ANSWER_DETAIL' ||
                nodeTypeValue === 'knowledge-detail'
              ) {
                const detailLabel = nodeTypeValue === 'circuit-detail'
                  ? '电路分析详情'
                  : (nodeTypeValue === 'knowledge-detail' ? '知识点详情' : '详细解答');
                return (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {detailLabel}
                      </p>
                      {title && (
                        <p className="mt-1 text-base font-semibold text-gray-900">
                          {title}
                        </p>
                      )}
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 shadow-sm">
                      {renderStreamContent()}
                    </div>
                  </div>
                );
              }

              // PDF分析点/详情节点的专属展示
              if (isPdfAnalysisPointNode) {
                return (
                  <div className="space-y-3">
                    <div className="relative p-4 rounded-2xl border border-violet-100 bg-gradient-to-b from-white to-violet-50 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide">
                            PDF 分析分点
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-gray-900">
                            {title || 'PDF分析分点'}
                          </h3>
                        </div>
                        {nodeStatus && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${nodeStatus.color}`}>
                            {nodeStatus.text}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {text?.trim() || '分析点内容正在生成，请稍候...'}
                      </p>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button
                          type="primary"
                          block
                          onClick={handlePdfDetailGeneration}
                          loading={pdfDetailLoading}
                        >
                          生成详细解析
                        </Button>
                        <Button
                          block
                          onClick={handlePdfFollowupPrefill}
                          disabled={!onApplySuggestion}
                        >
                          引用此分点追问
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        在下方输入框继续提问会自动携带该分点的上下文。
                      </p>
                    </div>
                  </div>
                );
              }

              if (isPdfAnalysisDetailNode) {
                return (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                            PDF 分点详情
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-gray-900">
                            {title || '分析分点详情'}
                          </h3>
                        </div>
                        {angle && (
                          <span className="px-3 py-1 rounded-full bg-white text-indigo-600 text-xs font-medium shadow-sm">
                            {angle}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        该分点的详细说明已就绪，可继续追问以获取更深入的结论。
                      </p>
                    </div>
                    {renderStreamContent()}
                    {onApplySuggestion && (
                      <Button block onClick={handlePdfFollowupPrefill}>
                        引用该分点继续追问
                      </Button>
                    )}
                  </div>
                );
              }

              // 检测是否为PDF查询节点
              const nodeMode = getStringField(nodeData, 'mode');
              const pdfModes = ['PDF_CIRCUIT_ANALYSIS', 'PDF_CIRCUIT_DESIGN', 'PDF_CIRCUIT_ANALYSIS_DETAIL'];
              const shouldTreatAsPdfQuery = Boolean(nodeMode && pdfModes.includes(nodeMode));
              const textIsUrl = isHttpUrl(text);
              const previewUrl = fileUrl || (textIsUrl ? text : undefined);
              const shouldRenderDocumentCard = Boolean(
                previewUrl && (
                  nodeTypeValue === 'PDF_DOCUMENT' ||
                  (nodeTypeValue === 'query' && shouldTreatAsPdfQuery)
                )
              );

              if (shouldRenderDocumentCard && previewUrl) {
                const fileName = extractFileNameFromUrl(previewUrl);
                const badgeLabel = fileType || 'PDF实验文档';
                let hostLabel = '';
                try {
                  hostLabel = new URL(previewUrl).hostname;
                } catch {
                  hostLabel = '';
                }

                const handlePreview = () => {
                  if (typeof window !== 'undefined') {
                    window.open(previewUrl, '_blank', 'noopener,noreferrer');
                  }
                };

                return (
                  <div className="relative p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-[11px] font-medium text-indigo-700">
                          {badgeLabel}
                        </p>
                        <h3 className="mt-2 font-semibold text-base text-gray-800 truncate" title={fileName}>
                          {fileName}
                        </h3>
                        {hostLabel && (
                          <p className="text-xs text-gray-500 mt-1">
                            来源：{hostLabel}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 mt-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                      <div className="text-sm text-indigo-900 font-medium mb-1">实验任务文档</div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        包含实验要求、设计规范与技术参数，支持点击右上角的小眼睛在新标签页内预览。
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-[12px] text-gray-500">
                      <span>文档上传完成，可用于后续分析</span>
                      <span className="text-indigo-600 font-medium">PDF</span>
                    </div>

                    <Button
                      shape="circle"
                      size="middle"
                      type="text"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={handlePreview}
                      title="在新标签页预览文档"
                      className="absolute top-3 right-3 flex items-center justify-center text-gray-500 hover:!text-indigo-600"
                    />
                  </div>
                );
              }

              return renderStreamContent();
            })()}
          </div>
        </div>

        {/* 追问推荐 */}
        {followUpInfo.suggestions.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  AI 追问推荐
                </p>
                {followUpInfo.contextTitle && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    基于「{followUpInfo.contextTitle}」
                  </p>
                )}
              </div>
              <span className="text-[11px] text-emerald-500">点击条目即可填入输入框</span>
            </div>
            <div className="flex flex-col gap-2">
              {followUpInfo.suggestions.map((item, index) => {
                const rawFollowUp = typeof item.followUp === 'string' ? item.followUp : '';
                const rawHint = typeof item.hint === 'string' ? item.hint : '';
                const rawTitle = typeof item.title === 'string' ? item.title : '';
                const followUpText = normalizeSuggestionText(rawFollowUp);
                const hintText = normalizeSuggestionText(rawHint);
                const titleText = normalizeSuggestionText(rawTitle);
                const preferFollowUp = Boolean(followUpText) && !isNoisySuggestion(rawFollowUp);
                const primary = preferFollowUp ? followUpText : (titleText || hintText || followUpText);
                const secondaryCandidate = hintText && hintText !== primary ? hintText : '';
                const secondary = clipSuggestionText(secondaryCandidate, 80);
                const payload = clipSuggestionText(primary, 180);
                const displayPrimary = clipSuggestionText(primary, 120);
                return (
                  <button
                    key={`${item.title || 'suggestion'}-${index}`}
                    type="button"
                    disabled={!payload}
                    onClick={() => payload && onApplySuggestion?.(payload)}
                    className={`text-left rounded-2xl border px-3 py-2 transition-all ${
                      payload
                        ? 'bg-emerald-50/60 border-emerald-100 hover:border-emerald-300 hover:bg-white'
                        : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-800">
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-emerald-600 shadow-sm">
                        追问 {index + 1}
                      </span>
                      {item.intent && (
                        <span className="text-[10px] uppercase tracking-wide text-emerald-500">
                          {item.intent}
                        </span>
                      )}
                      {typeof item.confidence === 'number' && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white text-emerald-600 shadow-sm">
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    {displayPrimary && (
                      <p className="mt-1 text-sm leading-snug text-slate-800">
                        {displayPrimary}
                      </p>
                    )}
                    {secondary && (
                      <p className="mt-1 text-xs text-slate-500">
                        洞察：{secondary}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 特殊属性 */}
        {(angle || objectName || urls || circuitInfo?.pointDescription || circuitInfo?.detailContent) && (
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">附加信息</h4>
            <div className="space-y-2">
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

      </div>

    </div>
  );
}

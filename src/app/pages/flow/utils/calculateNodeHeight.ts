import { Node } from '@xyflow/react';
import { NodeType } from '@/api/types/flow.types';
import { NodeData } from '../components/node/types/node.types';
import { TEMP_QUERY_NODE_HEIGHT, NODE_WIDTH, TEMP_QUERY_NODE_ID_PREFIX } from '../constants';

/**
 * 根据节点类型和内容计算节点高度
 * @param node 节点对象
 * @param nodeWidth 可选的节点宽度，默认为常量NODE_WIDTH
 * @returns 计算出的节点高度
 */
export function calculateNodeHeight(node: Node<NodeData<NodeType>>, nodeWidth?: number): number {
  const data = node.data || {};
  const widthFromData = typeof data.layoutWidth === 'number' ? data.layoutWidth : undefined;
  const width = nodeWidth || widthFromData || NODE_WIDTH;
  
  if (node.id.toString().startsWith(TEMP_QUERY_NODE_ID_PREFIX)) {
    return TEMP_QUERY_NODE_HEIGHT;
  }
  
  const { type } = node;
  
  if (type === 'root') {
    return 50;
  }
  
  if (type === 'query') {
    const text = data.text as string;
    if (!text) return 100;
    
    const textLength = text.length;
    // 根据文本长度和宽度调整高度计算
    const charsPerLine = Math.floor(width / 8.5); // 平均每行能容纳的字符数，基于宽度调整
    const lines = Math.ceil(textLength / charsPerLine);
    const titleHeight = 40; // 标题高度
    const padding = 32; // 上下内边距
    const lineHeight = 20; // 每行文本高度
    
    return titleHeight + padding + lines * lineHeight;
  }
  
  if (type === 'answer') {
    const text = data.text as string;
    if (!text) return 120;
    
    // 考虑子类型，一些子类型可能需要额外的高度
    const { subtype } = data;
    let additionalHeight = 0;
    
    if (subtype === 'solver-first' || subtype === 'solver-continue') {
      additionalHeight += 50; // 解题器类型的节点需要额外高度
    }
    
    const textLength = text.length;
    // 根据文本长度和宽度调整高度计算
    const charsPerLine = Math.floor(width / 8); // 平均每行能容纳的字符数，基于宽度调整
    const lines = Math.ceil(textLength / charsPerLine);
    const titleHeight = 40; // 标题高度
    const padding = 32; // 上下内边距
    const lineHeight = 20; // 每行文本高度
    
    return titleHeight + padding + lines * lineHeight + additionalHeight;
  }
  
  if (type === 'answer-point' || type === 'ANSWER_POINT') {
    const text = data.text as string;
    if (!text) return 120;
    
    // 根据是否已生成详情调整高度
    const { isGenerated } = data;
    let additionalHeight = isGenerated ? 0 : 50; // 未生成详情时需要额外的高度用于显示按钮
    
    const textLength = text.length;
    // 根据文本长度和宽度调整高度计算
    const charsPerLine = Math.floor(width / 8.5); // 平均每行能容纳的字符数，基于宽度调整
    const lines = Math.ceil(textLength / charsPerLine);
    const titleHeight = 40; // 标题高度
    const padding = 32; // 上下内边距
    const lineHeight = 20; // 每行文本高度
    
    return titleHeight + padding + lines * lineHeight + additionalHeight;
  }
  
  if (type === 'answer-detail' || type === 'ANSWER_DETAIL') {
    const text = data.text as string;
    if (!text) return 120;
    
    const textLength = text.length;
    // 根据文本长度和宽度调整高度计算
    const charsPerLine = Math.floor(width / 8.5); // 平均每行能容纳的字符数，基于宽度调整
    const lines = Math.ceil(textLength / charsPerLine);
    const titleHeight = 40; // 标题高度
    const padding = 32; // 上下内边距
    const lineHeight = 20; // 每行文本高度
    
    // 如果有angle属性，需要增加一点高度
    const additionalHeight = data.angle ? 20 : 0;
    
    return titleHeight + padding + lines * lineHeight + additionalHeight;
  }
  
  if (type === 'knowledge-head') {
    const text = data.text as string;
    if (!text) return 120;
    
    // 根据是否已生成详情调整高度
    const { isGenerated } = data;
    let additionalHeight = isGenerated ? 0 : 50; // 未生成详情时需要额外的高度用于显示按钮
    
    const textLength = text.length;
    // 根据文本长度和宽度调整高度计算
    const charsPerLine = Math.floor(width / 8.5); // 平均每行能容纳的字符数，基于宽度调整
    const lines = Math.ceil(textLength / charsPerLine);
    const titleHeight = 40; // 标题高度
    const padding = 32; // 上下内边距
    const lineHeight = 20; // 每行文本高度
    
    return titleHeight + padding + lines * lineHeight + additionalHeight;
  }
  
  if (type === 'knowledge-detail') {
    const text = data.text as string;
    if (!text) return 120;
    
    const textLength = text.length;
    // 根据文本长度和宽度调整高度计算
    const charsPerLine = Math.floor(width / 8.5); // 平均每行能容纳的字符数，基于宽度调整
    const lines = Math.ceil(textLength / charsPerLine);
    const titleHeight = 40; // 标题高度
    const padding = 32; // 上下内边距
    const lineHeight = 20; // 每行文本高度
    
    return titleHeight + padding + lines * lineHeight;
  }
  
  // 电路画布节点 - 固定高度
  if (type === 'circuit-canvas') {
    return 350; // 电路画布需要足够的空间来显示电路设计
  }
  
  // 电路分析节点
  if (type === 'circuit-analyze') {
    const text = data.text as string || '';
    const followUps = Array.isArray(data.followUps) ? data.followUps.length : 0;
    const charsPerLine = Math.floor(width / 8.5);
    const lines = Math.ceil(text.length / charsPerLine);
    const base = 40 + 32 + lines * 20;
    const followUpHeight = followUps > 0 ? 60 + followUps * 36 : 0;
    return Math.max(220, base + followUpHeight);
  }
  
  // 电路分析详情节点
  if (type === 'circuit-detail') {
    const text = data.text as string;
    const detailContent = data.detailContent as string || '';
    // 使用文本或者详情内容中较长的一个计算高度
    const contentText = detailContent.length > text.length ? detailContent : text;
    
    // 如果有angle属性，需要增加一点高度
    const additionalHeight = data.angle ? 25 : 0;
    
    const textLength = contentText.length;
    // 根据文本长度和宽度调整高度计算
    const charsPerLine = Math.floor(width / 8.5); // 平均每行能容纳的字符数，基于宽度调整
    const lines = Math.ceil(textLength / charsPerLine);
    const titleHeight = 40; // 标题高度
    const padding = 32; // 上下内边距
    const lineHeight = 20; // 每行文本高度
    
    return titleHeight + padding + lines * lineHeight + additionalHeight;
  }
  
  if (type === 'resource') {
    // 对于资源节点，考虑子类型
    const { subtype } = data;
    if (subtype === 'bilibili') {
      return 320; // Bilibili资源节点大约需要这么高
    } else if (subtype === 'animation' || subtype === 'generated-animation') {
      return 400; // 动画资源节点需要更大的空间
    }
    return 300; // 默认高度
  }
  
  // 默认情况
  return 150;
} 

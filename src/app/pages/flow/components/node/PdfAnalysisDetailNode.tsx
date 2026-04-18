import { useEffect } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';

/**
 * PDF分析详情节点组件
 * 类似于AnswerDetailNode，显示详细分析内容
 * 支持两种节点类型：PDF_ANALYSIS_DETAIL 和 pdf-circuit-detail
 */
export default function PdfAnalysisDetailNode(props: ExtendedNodeProps<'PDF_ANALYSIS_DETAIL'> | ExtendedNodeProps<'pdf-circuit-detail'>) {
  const { data, id } = props;
  
  // 获取分析角度
  const angle = (data as any).angle || '';
  
  // 当节点挂载时，通知父节点更新isGenerated状态
  useEffect(() => {
    const parentId = data.parentId;
    if (parentId) {
      // 延迟一点时间确保节点完全渲染
      const timer = setTimeout(() => {
        // 发送事件通知父节点已生成详情
        window.dispatchEvent(new CustomEvent('detail-node-created', {
          detail: {
            parentNodeId: parentId.toString(),
            detailNodeId: id,
            detailNodeType: 'PDF_ANALYSIS_DETAIL'
          }
        }));
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [data.parentId, id]);

  // 自定义内容渲染
  const customContent = (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-indigo-600">PDF分析详情</span>
          {angle && (
            <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-600 rounded-full">
              {angle}
            </span>
          )}
        </div>
      </div>
      
      <div className="text-sm leading-relaxed text-gray-700">
        {data.text ? (
          <div dangerouslySetInnerHTML={{ __html: data.text.replace(/\n/g, '<br/>') }} />
        ) : (
          <span className="text-gray-400">正在生成详细分析...</span>
        )}
      </div>
    </div>
  );

  return (
    <BaseNode
      {...props}
      customContent={customContent}
    />
  );
}
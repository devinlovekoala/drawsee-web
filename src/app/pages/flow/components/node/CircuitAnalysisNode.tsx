import { useEffect, useState } from 'react';
import { BaseNode, ExtendedNodeProps } from './base/BaseNode';
import { CircuitAnalysisResult, CircuitDesign } from '@/api/types/circuit.types';

// 电路分析结果节点组件
function CircuitAnalysisNode({
  data,
  showSourceHandle,
  showTargetHandle,
  ...props
}: ExtendedNodeProps<'answer'>) {
  const [circuitResult, setCircuitResult] = useState<CircuitAnalysisResult | null>(null);
  const [circuitDesign, setCircuitDesign] = useState<CircuitDesign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 从节点数据中提取电路分析结果
  useEffect(() => {
    try {
      setLoading(true);
      
      if (data?.circuitResult) {
        // 转换并设置电路分析结果
        const resultData = typeof data.circuitResult === 'string' 
          ? JSON.parse(data.circuitResult) 
          : data.circuitResult;
        
        setCircuitResult(resultData as CircuitAnalysisResult);
      }
      
      if (data?.circuitDesign) {
        // 转换并设置电路设计数据
        const designData = typeof data.circuitDesign === 'string'
          ? JSON.parse(data.circuitDesign)
          : data.circuitDesign;
        
        setCircuitDesign(designData as CircuitDesign);
      }
      
      setError(null);
    } catch (err) {
      console.error('解析电路数据失败:', err);
      setError('无法加载电路分析结果，数据格式不正确');
    } finally {
      setLoading(false);
    }
  }, [data]);
  
  // 渲染电路分析结果
  const renderCircuitAnalysis = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          <span className="ml-2 text-blue-600">加载分析结果...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h4 className="font-medium">错误</h4>
          <p>{error}</p>
        </div>
      );
    }
    
    if (!circuitResult) {
      return <div className="text-neutral-500 italic">无电路分析结果</div>;
    }
    
    return (
      <div className="space-y-4">
        {/* 电路统计信息 */}
        {circuitResult.statistics && (
          <div className="flex flex-wrap gap-3 mb-2">
            <div className="px-3 py-2 bg-blue-50 rounded-lg">
              <span className="text-xs text-blue-500">节点数</span>
              <p className="text-sm font-semibold">{circuitResult.statistics.nodes}</p>
            </div>
            
            <div className="px-3 py-2 bg-blue-50 rounded-lg">
              <span className="text-xs text-blue-500">元件数</span>
              <p className="text-sm font-semibold">{circuitResult.statistics.components}</p>
            </div>
            
            <div className="px-3 py-2 bg-blue-50 rounded-lg">
              <span className="text-xs text-blue-500">求解时间</span>
              <p className="text-sm font-semibold">{circuitResult.statistics.solveTime}ms</p>
            </div>
          </div>
        )}
        
        {/* 电路参数表格 */}
        <div>
          <h4 className="text-lg font-semibold mb-2">电路参数</h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-blue-200 p-2 text-left">参数</th>
                <th className="border border-blue-200 p-2 text-left">值</th>
              </tr>
            </thead>
            <tbody>
              {circuitResult.voltages && Object.entries(circuitResult.voltages).map(([node, value]) => (
                <tr key={`voltage-${node}`}>
                  <td className="border border-blue-200 p-2">节点 {node} 电压</td>
                  <td className="border border-blue-200 p-2">{typeof value === 'number' ? value.toFixed(3) : value} V</td>
                </tr>
              ))}
              
              {circuitResult.currents && Object.entries(circuitResult.currents).map(([branch, value]) => (
                <tr key={`current-${branch}`}>
                  <td className="border border-blue-200 p-2">分支 {branch} 电流</td>
                  <td className="border border-blue-200 p-2">{typeof value === 'number' ? value.toFixed(3) : value} A</td>
                </tr>
              ))}
              
              {circuitResult.powerConsumption && Object.entries(circuitResult.powerConsumption).map(([component, value]) => (
                <tr key={`power-${component}`}>
                  <td className="border border-blue-200 p-2">元件 {component} 功耗</td>
                  <td className="border border-blue-200 p-2">{typeof value === 'number' ? value.toFixed(3) : value} W</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 频率响应图表 */}
        {circuitResult.frequencyResponse && (
          <div>
            <h4 className="text-lg font-semibold mb-2">频率响应</h4>
            <div className="bg-white p-4 border border-neutral-200 rounded-lg">
              <div className="h-40 bg-neutral-100 rounded flex items-center justify-center">
                <p className="text-neutral-500">频率响应图表</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 暂态响应图表 */}
        {circuitResult.transientResponse && (
          <div>
            <h4 className="text-lg font-semibold mb-2">暂态响应</h4>
            <div className="bg-white p-4 border border-neutral-200 rounded-lg">
              <div className="h-40 bg-neutral-100 rounded flex items-center justify-center">
                <p className="text-neutral-500">暂态响应图表</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 警告和错误信息 */}
        {((circuitResult.warnings && circuitResult.warnings.length > 0) || 
           (circuitResult.errors && circuitResult.errors.length > 0)) && (
          <div className="space-y-2 mt-4">
            {circuitResult.warnings && circuitResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <h5 className="font-medium text-yellow-800 mb-1">警告</h5>
                <ul className="list-disc pl-5 text-sm text-yellow-700">
                  {circuitResult.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {circuitResult.errors && circuitResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <h5 className="font-medium text-red-800 mb-1">错误</h5>
                <ul className="list-disc pl-5 text-sm text-red-700">
                  {circuitResult.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // 构建自定义内容
  const customContent = (
    <div className="p-4 space-y-4">
      {/* 电路分析内容 */}
      {renderCircuitAnalysis()}
      
      {/* 电路设计信息 */}
      {circuitDesign && !loading && !error && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <h4 className="text-lg font-semibold mb-2">电路设计</h4>
          <div className="bg-neutral-50 p-3 rounded-lg text-sm font-mono">
            <p>元件数量: {circuitDesign.elements.length}</p>
            <p>连接数量: {circuitDesign.connections.length}</p>
            {circuitDesign.metadata?.title && <p>标题: {circuitDesign.metadata.title}</p>}
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <BaseNode
      {...props}
      showSourceHandle={showSourceHandle}
      showTargetHandle={showTargetHandle}
      data={data}
      customContent={customContent}
    />
  );
}

export default CircuitAnalysisNode;
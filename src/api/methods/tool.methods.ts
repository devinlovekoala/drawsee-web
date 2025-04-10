import alova from "@/api";
import { CircuitAnalysisDTO, CircuitAnalysisResult, SpiceNetlistResponse } from "@/api/types/circuit.types";

// image 对应 springboot 中的MultipartFile
export const recognizeTextFromImage = (image: File) => {
  const formData = new FormData();
  formData.append('file', image);
  
  return alova.Post<{text: string}>('/tool/recognize_text', formData, {
    meta: {
      isFile: true
    }
  });
};

// 获取解题方法
export const getSolverWays = 
  (question: string) => alova.Post<string[]>('/tool/solve_ways', {question});

/**
 * 生成电路SPICE网表
 * @param circuitAnalysisDTO 电路设计数据
 * @returns SPICE网表内容
 */
export const generateSpiceNetlist = 
  (circuitAnalysisDTO: CircuitAnalysisDTO) => 
    alova.Post<SpiceNetlistResponse>('/tool/circuit/spice', circuitAnalysisDTO);

/**
 * 电路分析
 * @param circuitAnalysisDTO 电路设计数据
 * @returns 分析结果
 */
export const analyzeCircuit = 
  (circuitAnalysisDTO: CircuitAnalysisDTO) => 
    alova.Post<CircuitAnalysisResult>('/tool/circuit/analyze', circuitAnalysisDTO);

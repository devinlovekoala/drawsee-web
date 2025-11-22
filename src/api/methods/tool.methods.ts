import alova from "@/api";
import { CircuitDesign } from '@/api/types/circuit.types';

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

export const recognizeCircuitDesignFromImage = (image: File) => {
  const formData = new FormData();
  formData.append('file', image);

  return alova.Post<CircuitDesign>('/tool/recognize_circuit', formData, {
    meta: {
      isFile: true
    }
  });
};

// 获取解题方法
export const getSolverWays = 
  (question: string) => alova.Post<string[]>('/tool/solve_ways', {question});

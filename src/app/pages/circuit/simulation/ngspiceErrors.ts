export interface NgspiceErrorInfo {
  code: string;
  message: string;
  rawMessage: string;
  suggestion?: string;
}

interface ErrorPattern {
  code: string;
  message: string;
  suggestion?: string;
  patterns: RegExp[];
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    code: 'missing_ground',
    message: '电路缺少参考地 (GND)，无法建立方程。',
    suggestion: '请确保至少有一个地节点与电路其他节点相连。',
    patterns: [/no\s+ground/i, /reference\s+node/i, /need\s+ground/i],
  },
  {
    code: 'floating_node',
    message: '检测到悬空节点或节点未连接到任何直流路径。',
    suggestion: '检查每个节点是否通过元件连接到电路与参考地。',
    patterns: [/floating\s+node/i, /node\s+\w+\s+is\s+floating/i, /no\s+dc\s+path/i],
  },
  {
    code: 'open_circuit',
    message: '存在未闭合的支路或开路节点，无法建立正确的方程组。',
    suggestion: '确认每个激励源都形成闭合回路，并且测量仪表接线完整。',
    patterns: [/not\s+connected/i, /open\s+circuit/i, /has\s+no\s+path/i],
  },
  {
    code: 'isolated_subcircuit',
    message: '发现孤立的子电路或与主回路断开。',
    suggestion: '请将所有元件连接到同一参考系统，避免孤立模块。',
    patterns: [/isolated/i, /separate\s+subckt/i],
  },
  {
    code: 'singular_matrix',
    message: '方程矩阵奇异或不可逆，常见原因是短路/开路或元件参数异常。',
    suggestion: '检查是否存在 0Ω 短路、无负载支路，或重复的受控源。',
    patterns: [/singular\s+matrix/i, /matrix\s+is\s+singular/i, /ill-?conditioned/i],
  },
  {
    code: 'non_convergence',
    message: '仿真在迭代过程中未能收敛。',
    suggestion: '尝试调整初始条件、减小步长或检查非线性元件参数。',
    patterns: [/no\s+convergence/i, /iteration\s+limit/i, /failed\s+to\s+converge/i],
  },
  {
    code: 'invalid_component',
    message: '某些元件参数非法或模型缺失。',
    suggestion: '确认电阻/电容/电感数值为正，二极管/晶体管引用了有效的模型。',
    patterns: [/illegal\s+value/i, /parameter/i, /negative\s+(capacitance|inductance|resistance)/i, /model\s+not\s+found/i],
  },
  {
    code: 'floating_lc',
    message: '存在悬空的电感/电容支路，导致 DC 路径缺失。',
    suggestion: '为电感/电容提供等效电阻或确保它们连接到完整的回路中。',
    patterns: [/inductor.*floating/i, /capacitor.*floating/i],
  },
];

export const classifyNgspiceError = (raw?: string | null): NgspiceErrorInfo => {
  const rawMessage = (raw || '').trim();
  const normalized = rawMessage.toLowerCase();
  if (!rawMessage) {
    return {
      code: 'unknown',
      message: '仿真失败，请检查电路连接与参数设置。',
      rawMessage: '',
    };
  }

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.patterns.some(regex => regex.test(normalized))) {
      return {
        code: pattern.code,
        message: pattern.message,
        suggestion: pattern.suggestion,
        rawMessage,
      };
    }
  }

  return {
    code: 'unknown',
    message: 'ngspice 返回错误，建议检查电路拓扑和元件参数。',
    rawMessage,
  };
};

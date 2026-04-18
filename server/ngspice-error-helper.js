export const classifyNgspiceError = (raw = '') => {
  const rawMessage = raw.trim();
  const normalized = rawMessage.toLowerCase();
  const patterns = [
    {
      code: 'missing_ground',
      message: '电路缺少参考地 (GND)，请添加地线。',
      suggestion: '在电路中加入一个地节点，并确保与其余节点有连接。',
      tests: [/no\s+ground/i, /reference\s+node/i, /need\s+ground/i],
    },
    {
      code: 'floating_node',
      message: '检测到悬空节点，无法建立直流路径。',
      suggestion: '确认所有节点都与电路和地线形成通路。',
      tests: [/floating\s+node/i, /no\s+dc\s+path/i],
    },
    {
      code: 'open_circuit',
      message: '存在开路/未闭合分支，仿真无法继续。',
      suggestion: '检查连接是否遗漏，确保激励源形成闭合回路。',
      tests: [/open\s+circuit/i, /not\s+connected/i, /has\s+no\s+path/i],
    },
    {
      code: 'singular_matrix',
      message: 'MNA 矩阵奇异 (常见于短路/开路或重复元件)。',
      suggestion: '排查零阻抗短路或重复受控源。',
      tests: [/singular\s+matrix/i, /matrix\s+is\s+singular/i, /ill-?conditioned/i],
    },
    {
      code: 'non_convergence',
      message: '仿真未收敛，Newton 迭代失败。',
      suggestion: '尝试调整步长或元件初始条件。',
      tests: [/no\s+convergence/i, /iteration\s+limit/i, /failed\s+to\s+converge/i],
    },
    {
      code: 'invalid_component',
      message: '元件参数非法或模型不存在。',
      suggestion: '确认电阻/电容/电感为正值，并提供正确的模型。',
      tests: [/illegal\s+value/i, /parameter/i, /negative\s+(capacitance|inductance|resistance)/i, /model\s+not\s+found/i],
    },
  ];

  if (!rawMessage) {
    return { code: 'unknown', message: '仿真失败，请检查电路。', rawMessage: '' };
  }

  for (const pattern of patterns) {
    if (pattern.tests.some((regex) => regex.test(normalized))) {
      return { code: pattern.code, message: pattern.message, suggestion: pattern.suggestion, rawMessage };
    }
  }

  return { code: 'unknown', message: 'ngspice 返回错误，请检查电路拓扑/参数。', rawMessage };
};

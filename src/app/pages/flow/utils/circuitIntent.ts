const CIRCUIT_WORD_PATTERN = /(电路|电路图|等效电路|小信号|schematic|circuit|diagram)/i;
const DIAGRAM_ACTION_PATTERN = /(画|绘制|画出|生成|搭建|设计|标注|draw|generate|create|show)/i;

export const isCircuitDiagramIntent = (...values: Array<unknown>): boolean => {
  const text = values
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ');

  if (!text) return false;

  return CIRCUIT_WORD_PATTERN.test(text) && DIAGRAM_ACTION_PATTERN.test(text);
};

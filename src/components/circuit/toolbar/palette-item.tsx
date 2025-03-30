// import {useCircuitStore} from "../../../stores/useCircuitStore.ts";
import {ComponentVisualConfig} from "../../../config/componentVisual.ts";
import {CircuitElement} from "../../../api/types/element.types.ts";

interface PaletteItemProps {
    type: CircuitElement['type'];
    onSelect: (type: CircuitElement['type']) => void;
}

// 元件类型的中文名称映射
const typeNameMap: Record<CircuitElement['type'], string> = {
    ground: '接地',
    wire: '导线',
    resistor: '电阻',
    capacitor: '电容',
    inductor: '电感',
    diode: '二极管',
    bjt: '三极管',
    mosfet: 'MOSFET',
    opamp: '运放',
    dc_source: '直流源',
    ac_source: '交流源'
};

export const PaletteItem = ({ type, onSelect }: PaletteItemProps) => {
    const config = ComponentVisualConfig[type];

    const handleDragStart = (event: React.DragEvent) => {
        event.dataTransfer.setData('application/reactflow', type);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className="flex flex-col items-center p-1 rounded hover:bg-gray-50 cursor-grab transition-all duration-200 group w-16"
            onClick={() => onSelect(type)}
            onDragStart={handleDragStart}
            onDragEnd={() => {}}
            draggable
            title={typeNameMap[type]}
        >
            <div
                className="w-8 h-8 flex items-center justify-center rounded group-hover:scale-105 transition-transform"
                style={{ backgroundColor: config.color }}
            >
                {config.svg && (
                    <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 60 40" 
                        className="text-white"
                    >
                        <path d={config.svg} stroke="currentColor" fill="none" strokeWidth="2" />
                    </svg>
                )}
            </div>
            <span className="text-[10px] text-gray-600 group-hover:text-gray-900 mt-0.5 font-medium truncate w-full text-center">
                {typeNameMap[type] || type}
            </span>
        </div>
    );
};

const baseTemplate = {
    position: { x: 0, y: 0 },
    rotation: 0,
    properties: {},
    ports: []
};

// 元件模板生成器
// eslint-disable-next-line react-refresh/only-export-components
export const createElementTemplate = (type: CircuitElement['type']): Omit<CircuitElement, 'id'> => {

    switch (type) {
        case 'resistor':
            return {
                ...baseTemplate,
                type,
                ports: [
                    { id: 't1', name: 'Terminal 1', type: 'bidirectional', position: { side: 'left', x: 0, y: 45 } },
                    { id: 't2', name: 'Terminal 2', type: 'bidirectional', position: { side: 'right', x: 0, y: 45 } }
                ],
                properties: {
                    resistance: 1000, // 默认1kΩ
                    tolerance: 5      // 容差百分比
                }
            };

        case 'diode':
            return {
                ...baseTemplate,
                type,
                ports: [
                    { id: 'anode', name: 'Anode', type: 'input', position: { side: 'left', x: 0, y: 45 } },
                    { id: 'cathode', name: 'Cathode', type: 'output', position: { side: 'right', x: 0, y: 45 } }
                ],
                properties: {
                    model: '1N4148',
                    maxReverseVoltage: 100 // 最大反向电压
                }
            };

        case 'bjt':
            return {
                ...baseTemplate,
                type,
                ports: [
                    { id: 'base', name: 'Base', type: 'input', position: { side: 'left', x: 0, y: 45 } },
                    { id: 'collector', name: 'Collector', type: 'output', position: { side: 'right', x: 0, y: 10 } },
                    { id: 'emitter', name: 'Emitter', type: 'output', position: { side  : 'right', x: 0, y: 90 } }
                ],
                properties: {
                    type: 'npn',       // npn/pnp
                    beta: 100,         // 电流放大系数
                    maxVce: 40        // 最大集电极-发射极电压
                }
            };

        case 'mosfet':
            return {
                ...baseTemplate,
                type,
                ports: [
                    { id: 'gate', name: 'Gate', type: 'input', position: { side: 'left', x: 0, y: 45 } },
                    { id: 'drain', name: 'Drain', type: 'bidirectional', position: { side: 'right', x: 20, y: 10 } },
                    { id: 'source', name: 'Source', type: 'bidirectional', position: { side: 'right', x: 20, y: 90 } }
                ],
                properties: {
                    type: 'n-channel', // n-channel/p-channel
                    vth: 2.5,          // 阈值电压
                    rdsOn: 0.1         // 导通电阻（Ω）
                }
            };

        case 'opamp':
            return {
                ...baseTemplate,
                type,
                ports: [
                    { id: 'in+', name: 'Non-inv Input', type: 'input', position: { side: 'left', x: 0, y: 10 } },
                    { id: 'in-', name: 'Inv Input', type: 'input', position: { side: 'left', x: 0, y: 90 } },
                    { id: 'v+', name: 'V+', type: 'input', position: { side: 'right', x: 40, y: 10 } },
                    { id: 'v-', name: 'V-', type: 'input', position: { side: 'right', x: 40, y: 45 } },
                    { id: 'out', name: 'Output', type: 'output', position: { side: 'right', x: 40, y: 90 } }
                ],
                properties: {
                    model: 'LM741',
                    supplyVoltage: [15, -15] // 供电电压 [V+, V-]
                }
            };

        case 'capacitor':
            return {
                ...baseTemplate,
                type,
                ports: [
                    { id: 'pos', name: 'Positive', type: 'input', position: { side: 'left', x: 0, y: 45 } },
                    { id: 'neg', name: 'Negative', type: 'output', position: { side: 'right', x: 30, y: 45 } }
                ],
                properties: {
                    capacitance: 0.01,
                    voltageRating: 50
                }
            };

        case 'inductor':
            return {
                ...baseTemplate,
                type,
                ports: [
                    { id: 't1', name: 'Terminal 1', type: 'bidirectional', position: { side: 'left', x: 0, y: 45 } },
                    { id: 't2', name: 'Terminal 2', type: 'bidirectional', position: { side: 'right', x: 0, y: 45 } }
                ],
                properties: {
                    inductance: 0.001, // 默认1mH
                    maxCurrent: 1,     // 最大电流（A）
                    dcResistance: 0.1  // 直流电阻（Ω）
                }
            };
            case 'ground':
                return {
                    ...baseTemplate,
                    type,
                    ports: [
                        { id: 't1', name: 'Terminal', type: 'bidirectional', position: { side: 'top', x: 50, y: 0 ,align: 'center'} }
                    ],
                    properties: {}  // 接地符号不需要特殊属性
                };

        case 'dc_source':
            return {
                ...baseTemplate,
                type,
                ports: [
                    { id: 'pos', name: 'Positive', type: 'output', position: { side: 'left', x: 0, y: 45 } },
                    { id: 'neg', name: 'Negative', type: 'output', position: { side: 'right', x: 30, y: 45 } }
                ],
                properties: {
                    voltage: 12        // 默认12V
                }
            };

        case 'ac_source':
            return {
                ...baseTemplate,
                type,
                ports: [
                    { id: 'pos', name: 'Positive', type: 'output', position: { side: 'left', x: 0, y: 45 } },
                    { id: 'neg', name: 'Negative', type: 'output', position: { side: 'right', x: 30, y: 45 } }
                ],
                properties: {
                    waveform: {
                        type: 'sine',    // sine/square
                        amplitude: 5,    // 峰值5V
                        frequency: 1000  // 1kHz
                    },
                    dcOffset: 0        // 直流偏置
                }
            };

        default:
            throw new Error(`Unknown component type: ${type}`);
    }
};

export default PaletteItem;
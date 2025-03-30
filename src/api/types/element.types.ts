// 基础坐标类型
export type Vector2D = { x: number; y: number };

// 元件端口定义
export type PortType = 'input' | 'output' | 'bidirectional';


interface PortPosition {
    side: 'left' | 'right' | 'top' | 'bottom';
    x: number;  // 相对于元件边界的百分比位置 (0-100)
    y: number;  // 相对于元件边界的百分比位置 (0-100)
    offset?: number; // 可选的偏移量，用于微调位置
    align?: 'start' | 'center' | 'end'; // 可选的对齐方式
}

interface Port {
    id: string;
    name: string;
    type: PortType;
    position: PortPosition;
}

// 元件基础类型
export interface CircuitElement {
    id: string;
    type: ElementType;
    position: Vector2D;
    rotation: number;
    ports: Port[];
    properties: Record<string, any>;
}

// 元件类型枚举
export type ElementType = 
    | 'ground'
    | 'wire'
    | 'resistor'
    | 'capacitor'
    | 'inductor'
    | 'diode'
    | 'bjt'
    | 'mosfet'
    | 'opamp'
    | 'dc_source'
    | 'ac_source';
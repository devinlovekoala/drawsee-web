import { Vector2D } from './element.types';

// 连接线定义
export interface CircuitConnection {
    id: string;
    source: {
        elementId: string;
        portId: string;
    };
    target: {
        elementId: string;
        portId: string;
    };
    path?: Vector2D[];
}
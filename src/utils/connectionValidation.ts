import { CircuitConnection } from '../api/types/connection.types';
import { Connection } from 'reactflow';

export const validateConnection = (
    connection: Connection,
    existingConnections: CircuitConnection[]
) => {
    const errors = [];

    // 验证规则1：检查相同端口
    if (connection.source === connection.target) {
        errors.push('不能连接相同的端口');
    }

    // 验证规则2：检查端口是否已被使用
    const isPortAlreadyConnected = existingConnections.some(conn => 
        (conn.source.elementId === connection.source && conn.source.portId === connection.sourceHandle) ||
        (conn.target.elementId === connection.target && conn.target.portId === connection.targetHandle)
    );
    if (isPortAlreadyConnected) {
        errors.push('端口已经被连接');
    }

    // 验证规则3：检查是否是同一个元件的连接（如果需要）
    if (connection.source === connection.target) {
        errors.push('不能连接同一个元件的端口');
    }

    // 可以添加更多验证规则，比如：
    // - 检查端口类型的兼容性
    // - 检查连接数量限制
    // - 检查特定元件的连接规则
    // 等等...

    return {
        isValid: errors.length === 0,
        errors
    };
};
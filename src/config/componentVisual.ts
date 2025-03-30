import { ElementType } from '../api/types/element.types';

interface ComponentVisualConfig {
    width: number;
    height: number;
    color: string;
    svg?: string;
}

export const ComponentVisualConfig: Record<ElementType, ComponentVisualConfig> = {
    ground: {
        width: 40,
        height: 40,
        color: '#4B5563',
        svg: 'M20 10 L20 20 M10 20 L30 20 M13 24 L27 24 M16 28 L24 28'
    },
    wire: {
        width: 40,
        height: 40,
        color: '#6B7280',
        svg: 'M10 20 L30 20'
    },
    resistor: {
        width: 40,
        height: 40,
        color: '#EF4444',
        svg: 'M10 20 L15 20 L17 15 L21 25 L25 15 L29 25 L31 20 L35 20'
    },
    capacitor: {
        width: 40,
        height: 40,
        color: '#3B82F6',
        svg: 'M18 10 L18 30 M22 10 L22 30'
    },
    inductor: {
        width: 40,
        height: 40,
        color: '#8B5CF6',
        svg: 'M10 20 C15 20 15 15 20 15 C25 15 25 25 30 25'
    },
    diode: {
        width: 40,
        height: 40,
        color: '#10B981',
        svg: 'M15 20 L25 20 M25 15 L25 25 L15 20 L15 15 L15 25 Z'
    },
    bjt: {
        width: 40,
        height: 40,
        color: '#F59E0B',
        svg: 'M20 10 L20 30 M15 20 L20 20 M15 25 L25 15'
    },
    mosfet: {
        width: 40,
        height: 40,
        color: '#6366F1',
        svg: 'M15 20 L20 20 L20 10 M20 15 L25 15 L25 25 M20 25 L25 25'
    },
    opamp: {
        width: 40,
        height: 40,
        color: '#EC4899',
        svg: 'M10 10 L10 30 L30 20 Z M12 15 L16 15 M14 13 L14 17'
    },
    dc_source: {
        width: 40,
        height: 40,
        color: '#14B8A6',
        svg: 'M20 10 L20 30 M15 15 L25 15 M15 25 L25 25'
    },
    ac_source: {
        width: 40,
        height: 40,
        color: '#F472B6',
        svg: 'M20 10 L20 30 M10 20 Q15 10 20 20 Q25 30 30 20'
    }
};
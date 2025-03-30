import { create } from 'zustand';
import { CircuitElement } from '../api/types/element.types';
import { CircuitConnection } from '../api/types/connection.types';

interface CircuitState {
    elements: CircuitElement[];
    connections: CircuitConnection[];
    selectedPort: {
        elementId: string;
        portId: string;
    } | null;
    draggingPort: {
        elementId: string;
        portId: string;
    } | null;
    placingElement: Omit<CircuitElement, 'id'> | null;
    targetPort: {
        elementId: string;
        portId: string;
    } | null;
    actions: {
        addElement: (element: CircuitElement | Omit<CircuitElement, 'id'>) => void;
        updateElementPosition: (id: string, position: { x: number; y: number }) => void;
        updateElementProperties: (id: string, properties: Record<string, any>) => void;
        removeElement: (id: string) => void;
        startConnection: (elementId: string, portId: string) => void;
        connectPorts: () => void;
        removeConnection: (id: string) => void;
        addConnection: (connection: CircuitConnection) => void;
        selectPort: (elementId: string, portId: string) => void;
        startPlacingElement: (element: Omit<CircuitElement, 'id'>) => void;
        placeElement: (position: { x: number; y: number }) => void;
        cancelPlacingElement: () => void;
        selectTargetPort: (elementId: string, portId: string) => void;
        clearAll: () => void;
    };
}

export const useCircuitStore = create<CircuitState>((set, get) => ({
    elements: [],
    connections: [],
    selectedPort: null,
    draggingPort: null,
    placingElement: null,
    targetPort: null,
    actions: {
        addElement: (element) => {
            set((state) => {
                const hasId = 'id' in element && typeof element.id === 'string';
                const id = hasId ? element.id as string : `element-${Date.now()}`;
                
                const newElement = {
                    ...element,
                    id
                } as CircuitElement;
                
                return {
                    elements: [...state.elements, newElement]
                };
            });
        },
        updateElementPosition: (id, position) => {
            set((state) => ({
                elements: state.elements.map((el) =>
                    el.id === id ? { ...el, position } : el
                ),
            }));
        },
        updateElementProperties: (id, properties) => {
            set((state) => ({
                elements: state.elements.map((el) =>
                    el.id === id ? { ...el, properties } : el
                ),
            }));
        },
        removeElement: (id) => {
            set((state) => ({
                elements: state.elements.filter((el) => el.id !== id),
                connections: state.connections.filter(
                    (conn) => conn.source.elementId !== id && conn.target.elementId !== id
                ),
            }));
        },
        startConnection: (elementId, portId) => {
            set({ selectedPort: { elementId, portId } });
        },
        connectPorts: () => {
            const { selectedPort, targetPort } = get();
            if (!selectedPort || !targetPort) return;

            set((state) => ({
                connections: [
                    ...state.connections,
                    {
                        id: `connection-${Date.now()}`,
                        source: selectedPort,
                        target: targetPort,
                    },
                ],
                selectedPort: null,
                targetPort: null,
            }));
        },
        removeConnection: (id) => {
            set((state) => ({
                connections: state.connections.filter((conn) => conn.id !== id),
            }));
        },
        addConnection: (connection) => {
            set((state) => {
                const hasId = 'id' in connection && typeof connection.id === 'string';
                const id = hasId ? connection.id as string : `connection-${Date.now()}`;
                
                const newConnection = {
                    ...connection,
                    id
                } as CircuitConnection;
                
                return {
                    connections: [...state.connections, newConnection]
                };
            });
        },
        selectPort: (elementId, portId) => {
            set({ selectedPort: { elementId, portId } });
        },
        startPlacingElement: (element) => {
            set({ placingElement: element });
        },
        placeElement: (position) => {
            const { placingElement } = get();
            if (!placingElement) return;
            
            set((state) => ({
                elements: [...state.elements, { ...placingElement, id: `element-${Date.now()}`, position }],
                placingElement: null
            }));
        },
        cancelPlacingElement: () => {
            set({ placingElement: null });
        },
        selectTargetPort: (elementId, portId) => {
            set({ targetPort: { elementId, portId } });
        },
        clearAll: () => {
            set({
                elements: [],
                connections: [],
                selectedPort: null,
                draggingPort: null,
                targetPort: null,
                placingElement: null
            });
        },
    },
}));
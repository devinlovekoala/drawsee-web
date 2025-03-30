import { CircuitElement } from './element.types';
import { CircuitConnection } from "./connection.types";

export interface CircuitDesign {
    elements: CircuitElement[];
    connections: CircuitConnection[];
    metadata: {
        title: string;
        description?: string;
        createdAt: string;
        updatedAt: string;
    };
}
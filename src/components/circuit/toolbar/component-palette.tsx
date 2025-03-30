import { useState } from 'react';
import PaletteItem from './palette-item';
import ComponentForm from './component-form';
import { ElementType } from '../../../api/types/element.types';

interface ComponentPaletteProps {
    className?: string;
}

// 元件分类
const categories = [
    {
        name: '基础元件',
        types: ['resistor', 'capacitor', 'inductor', 'ground'] as ElementType[]
    },
    {
        name: '半导体',
        types: ['diode', 'bjt', 'mosfet'] as ElementType[]
    },
    {
        name: '电源',
        types: ['dc_source', 'ac_source'] as ElementType[]
    },
    {
        name: '其他',
        types: ['opamp'] as ElementType[]
    }
];

const ComponentPalette = ({ className = '' }: ComponentPaletteProps) => {
    const [selectedType, setSelectedType] = useState<ElementType | null>(null);

    const handleSelect = (type: ElementType) => {
        setSelectedType(type);
    };

    const handleClose = () => {
        setSelectedType(null);
    };

    return (
        <div className={className}>
            <div className="flex space-x-8">
                {categories.map(category => (
                    <div key={category.name} className="flex flex-col">
                        <h3 className="text-xs font-medium text-gray-500 mb-2">{category.name}</h3>
                        <div className="flex space-x-1">
                            {category.types.map(type => (
                                <PaletteItem
                                    key={type}
                                    type={type}
                                    onSelect={handleSelect}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {selectedType && (
                <ComponentForm
                    type={selectedType}
                    onClose={handleClose}
                />
            )}
        </div>
    );
};

export default ComponentPalette;
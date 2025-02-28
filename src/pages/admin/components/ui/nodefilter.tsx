interface NodeFilterProps {
    onFilterChange: (level: number | null) => void;
}

const NodeFilter = ({ onFilterChange }: NodeFilterProps) => {
    const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        onFilterChange(value === 'all' ? null : parseInt(value, 10));
    };

    return (
        <select onChange={handleFilter} className="border rounded p-2 w-full">
            <option value="all">所有等级</option>
            <option value="1">初级</option>
            <option value="2">中级</option>
            <option value="3">高级</option>
        </select>
    );
};

export default NodeFilter;

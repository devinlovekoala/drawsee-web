interface NodeSearchProps {
    onSearch: (query: string) => void;
}

const Nodesearch = ({ onSearch }: NodeSearchProps) => {
    return (
        <input
            type="text"
            className="border rounded p-2 w-full"
            placeholder="🔍 搜索..."
            onChange={(e) => onSearch(e.target.value)}
        />
    );
};

export default Nodesearch;

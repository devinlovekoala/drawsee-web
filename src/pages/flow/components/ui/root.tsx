import React from "react";
import { Handle, Position } from "reactflow";

const RootNode: React.FC = () => {
    return (
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg flex justify-center items-center border-4 border-white">
            <img
                src="/昭析.svg"
                alt="昭析"
                className="w-12 h-12"
            />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default RootNode;

import { Handle, Position } from "@xyflow/react";
import {FC} from "react";

const CustomNode: FC<{ data: { title: string; description: string; onSelect: () => void } }> = ({ data }) => {
    return (
        <div style={{
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "white",
            minWidth: "200px",
            textAlign: "center"
        }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>{data.title}</h3>
            <p style={{ fontSize: "12px", color: "#666" }}>{data.description}</p>
            <button
                style={{ background: "#007BFF", color: "white", padding: "5px 10px" }}
                onClick={() => data.onSelect()}
            >
                追问
            </button>
            <Handle type="source" position={Position.Right} />
            <Handle type="target" position={Position.Left} />
        </div>
    );
};

export default CustomNode;

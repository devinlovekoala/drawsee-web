import {useState} from "react";
import {Input} from "@/pages/flow/components/ui/input";
import {Button} from "@/pages/flow/components/ui/button";
import ModeSelector from "@/pages/flow/components/ui/mode-selector.tsx";

const MODES = [
    {label: "简单问答", value: "general"},
    {label: "知识问答", value: "knowledge"},
];

interface ChatInputProps {
    onSubmit: (question: string, mode: string) => void,
    disabled?: boolean
}

const ChatInput: React.FC<ChatInputProps> = ({onSubmit}) => {
    const [question, setQuestion] = useState("");
    const [mode, setMode] = useState("general");
    const [isDisabled] = useState(false);

    return (
        <div className="flex items-center border rounded-lg p-2 bg-gray-50">
            <ModeSelector options={MODES} value={mode} onChange={setMode} disabled={isDisabled}/>
            <Input
                type="text"
                placeholder="请输入内容..."
                className="flex-1 mx-2"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
            />
            <Button
                onClick={() => onSubmit(question, mode)}
                variant="default"
                size="default"
                className="ml-2"
            >
                提交
            </Button>
        </div>
    );
};

export default ChatInput;

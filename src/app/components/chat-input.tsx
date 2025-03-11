import {useState} from "react";
import {Input} from "@/app/components/ui/input.tsx";
import {Button} from "@/app/components/ui/button.tsx";
import ModeSelector from "@/app/components/ui/mode-selector.tsx";

const MODES = [
    {label: "简单问答", value: "general"},
    {label: "知识问答", value: "knowledge"},
];

interface ChatInputProps {
    onSubmit: (question: string, mode: string) => void,
    disabled?: boolean
}

export default function ChatInput({ onSubmit }: ChatInputProps) {
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
            {/* !可以考虑换成昭析的主题色 */}
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


import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Mode {
    label: string;
    value: string;
}

interface ModeSelectorProps {
    options: Mode[];
    value: string;
    onChange: (mode: string) => void;
    disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ options, value, onChange, disabled = false }) => {
    // const [isOpen, setIsOpen] = useState(false);
    // const [openUpwards, setOpenUpwards] = useState(false);
    // const buttonRef = useRef<HTMLButtonElement>(null);

    // useEffect(() => {
    //     if (buttonRef.current) {
    //         const rect = buttonRef.current.getBoundingClientRect();
    //         const spaceBelow = window.innerHeight - rect.bottom;
    //         setOpenUpwards(spaceBelow < 150);
    //     }
    // }, [isOpen]);

    return (
        <Select onValueChange={(value) => { onChange(value) }}>
            <SelectTrigger
                className={cn(
                    "flex items-center justify-between px-3 py-2 border rounded-lg w-36 bg-white",
                    disabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100"
                )}
                disabled={disabled}
            >
                <SelectValue placeholder="选择模式" />
            </SelectTrigger>
            <SelectContent>
                {options.map((mode) => (
                    <SelectItem
                        // key={mode.value}
                        value={mode.value}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                        {mode.label}
                    </SelectItem>
                ))}
            </SelectContent>
            {/* 原版本 */}
            {/* <button
                ref={buttonRef}
                className={cn(
                    "flex items-center justify-between px-3 py-2 border rounded-lg w-36 bg-white",
                    disabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100"
                )}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span>{options.find((m) => m.value === value)?.label || "选择模式"}</span>
                <span className={cn("block transition-[transform] duration-300", isOpen ? "rotate-180" : "rotate-0")}>▼</span>
            </button>
            {isOpen && !disabled && (
                <ul
                    className={cn(
                        "absolute left-0 w-36 bg-white border rounded-lg shadow-lg z-50",
                        openUpwards ? "bottom-full mb-2" : "top-full mt-2"
                    )}
                >
                    {options.map((mode) => (
                        <li
                            key={mode.value}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                                onChange(mode.value);
                                setIsOpen(false);
                            }}
                        >
                            {mode.label}
                        </li>
                    ))}
                </ul>
            )} */}
        </Select>
    );
};

export default ModeSelector;

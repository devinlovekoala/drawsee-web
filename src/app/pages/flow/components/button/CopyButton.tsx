import { Copy, Check } from "lucide-react";
import { useState } from "react";
//import { toast } from "sonner";
import copy from 'copy-to-clipboard';

const CopyButton = ({ getText, size = 16, text}: { getText: () => string, size?: number, text?: string }) => {
  const [copied, setCopited] = useState(false);

  const onCopy = () => {
    const text = getText();
    copy(text);
    setCopited(true);
    setTimeout(() => {
      setCopited(false);
    }, 1000);
  };

  return (
    <button
      onClick={onCopy}
      className="inline-flex rounded-md p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800"
    >
      <Copy
        size={size}
        className={`transition-all
        ${copied ? "scale-0" : "scale-100"}
      `}
      />
      <Check
        size={size}
        className={`absolute transition-all ${
          copied ? "scale-100" : "scale-0"
        }`}
      />
      {
        text &&
        <span className="text-sm">{text}</span>
      }
    </button>
  );
};

export default CopyButton;

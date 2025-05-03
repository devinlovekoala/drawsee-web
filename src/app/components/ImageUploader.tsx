import React, { useState, useRef } from 'react';
import { recognizeTextFromImage } from '@/api/methods/tool.methods';
import { ImageIcon, LoaderIcon, XIcon, FunctionSquareIcon } from 'lucide-react';
import LaTeXRenderer from '@/app/components/ui/latex-renderer';

interface ImageUploaderProps {
  onTextRecognized: (text: string) => void;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onTextRecognized,
  className = ''
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [hasMathFormula, setHasMathFormula] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 检查文本是否包含数学公式
  const checkForMathFormulas = (text: string): boolean => {
    // 检查常见的LaTeX语法特征
    const mathPatterns = [
      /\\frac{.*?}{.*?}/,  // 分数
      /\\sqrt{.*?}/,       // 平方根
      /\^{.*?}/,           // 上标（带花括号）
      /_{.*?}/,            // 下标（带花括号）
      /\\int/,             // 积分符号
      /\\sum/,             // 求和符号
      /\\lim/,             // 极限符号
      /\\alpha|\\beta|\\gamma|\\delta|\\epsilon|\\zeta|\\eta|\\theta|\\iota|\\kappa|\\lambda|\\mu|\\nu|\\xi|\\omicron|\\pi|\\rho|\\sigma|\\tau|\\upsilon|\\phi|\\chi|\\psi|\\omega/, // 希腊字母
      /\\left|\\right/,    // 括号
      /\\begin{.*?}|\\end{.*?}/, // 环境
      /\\hat{.*?}|\\bar{.*?}|\\vec{.*?}/, // 装饰符号
    ];

    return mathPatterns.some(pattern => pattern.test(text));
  };

  // 处理文件选择
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    // 验证文件是否为图片
    if (!file.type.match('image.*')) {
      setError('请上传图片文件');
      return;
    }

    // 重置状态
    setError(null);
    setRecognizedText(null);
    setHasMathFormula(false);
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // 开始识别文字
    recognizeImage(file);
  };

  // 处理图片拖放
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files[0];
    if (!file) return;
    
    // 验证文件是否为图片
    if (!file.type.match('image.*')) {
      setError('请上传图片文件');
      return;
    }
    
    // 重置状态
    setError(null);
    setRecognizedText(null);
    setHasMathFormula(false);
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // 开始识别文字
    recognizeImage(file);
  };

  // 处理拖拽进入区域
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // 清除已上传的图片
  const clearImage = () => {
    setImagePreview(null);
    setRecognizedText(null);
    setHasMathFormula(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 识别图片中的文字
  const recognizeImage = async (file: File) => {
    setIsLoading(true);
    try {
      const response = await recognizeTextFromImage(file);
      // 保存识别的文本
      setRecognizedText(response.text);
      
      // 检查是否包含数学公式
      const containsMath = checkForMathFormulas(response.text);
      setHasMathFormula(containsMath);
      
      // 传递识别结果给父组件
      onTextRecognized(response.text);
    } catch (err) {
      console.error('文字识别失败:', err);
      setError('文字识别失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 图片上传区域 */}
      <div 
        className={`
          group relative flex flex-col items-center justify-center rounded-lg 
          border-2 border-dashed p-4 transition-all duration-300
          ${imagePreview ? 'border-indigo-400 bg-indigo-50/50' : 'border-neutral-300 bg-neutral-50/50 hover:border-indigo-300 hover:bg-indigo-50/30'}
          ${error ? 'border-red-400' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* 预览区域 */}
        {imagePreview ? (
          <div className="w-full">
            <div className="relative flex justify-center mb-3">
              <img 
                src={imagePreview} 
                alt="题目图片" 
                className="max-h-32 max-w-full rounded object-contain"
              />
              
              {/* 删除按钮 */}
              <button
                type="button"
                onClick={clearImage}
                className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform duration-200 hover:scale-110"
              >
                <XIcon size={14} />
              </button>
              
              {/* 加载指示器 */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded bg-black/30">
                  <LoaderIcon className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
            
            {/* 识别结果预览 */}
            {recognizedText && !isLoading && (
              <div className="mt-2 p-2 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xs font-medium text-indigo-700">识别结果</h3>
                  {hasMathFormula && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                      <FunctionSquareIcon size={12} className="mr-1" />
                      包含数学公式
                    </span>
                  )}
                </div>
                
                <div className="max-h-20 overflow-y-auto p-2 bg-white rounded text-xs border border-indigo-100">
                  {hasMathFormula ? (
                    <LaTeXRenderer latex={recognizedText} className="text-xs" />
                  ) : (
                    <p className="whitespace-pre-wrap text-gray-700">{recognizedText}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 上传图标和文字 */}
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200 group-hover:text-indigo-700">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="mb-1 text-sm font-medium text-neutral-700">
              {isLoading ? '正在识别文字...' : '拖放图片或点击上传'}
            </p>
            <p className="text-xs text-neutral-500">支持含数学公式的图片</p>
            
            {/* 加载指示器 */}
            {isLoading && (
              <div className="mt-2 flex items-center gap-2">
                <LoaderIcon className="h-4 w-4 animate-spin text-indigo-500" />
                <span className="text-xs text-indigo-500">识别中...</span>
              </div>
            )}
            
            {/* 错误提示 */}
            {error && (
              <p className="mt-2 text-xs text-red-500">{error}</p>
            )}
          </>
        )}
        
        {/* 文件输入框（隐藏） */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
};

export default ImageUploader; 
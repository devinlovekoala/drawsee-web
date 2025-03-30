import React, { useState, useRef } from 'react';
import { recognizeTextFromImage } from '@/api/methods/tool.methods';
import { ImageIcon, LoaderIcon, XIcon } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 识别图片中的文字
  const recognizeImage = async (file: File) => {
    setIsLoading(true);
    try {
      const response = await recognizeTextFromImage(file);
      // 响应处理
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
          <div className="relative">
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
        ) : (
          <>
            {/* 上传图标和文字 */}
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200 group-hover:text-indigo-700">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="mb-1 text-sm font-medium text-neutral-700">
              {isLoading ? '正在识别文字...' : '拖放图片或点击上传'}
            </p>
            <p className="text-xs text-neutral-500">支持 JPG, PNG 格式</p>
            
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
export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        {/* 主要动画 */}
        <div className="relative w-16 h-16">
          {/* 外圈 */}
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          {/* 动态圆弧 */}
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin-slow"
               style={{
                 borderRightColor: 'transparent',
                 borderBottomColor: 'transparent',
                 borderLeftColor: 'transparent'
               }}></div>
          {/* 内圈 */}
          <div className="absolute inset-2 border-4 border-gray-200 rounded-full"></div>
          {/* 中心点 */}
          <div className="absolute inset-[30%] bg-blue-500 rounded-full animate-pulse"></div>
        </div>
        
        {/* 文字 */}
        <div className="text-gray-600 font-medium tracking-wider animate-pulse">
          正在加载流程图...
        </div>
      </div>
    </div>
  );
} 
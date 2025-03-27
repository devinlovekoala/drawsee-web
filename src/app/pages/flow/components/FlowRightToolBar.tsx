import { MapPin, RefreshCcw } from 'lucide-react';
import { useState } from 'react';

interface FlowToolBarProps {
  nodeWidth: number;
  onRelayout: () => void;
  onNodeWidthChange: (width: number) => void;
  showMiniMap: boolean;
  setShowMiniMap: (show: boolean) => void;
}

function FlowRightToolBar({ onRelayout, onNodeWidthChange, nodeWidth, showMiniMap, setShowMiniMap }: FlowToolBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 控制下拉框的显示状态

  const handleWidthChange = (width: number) => {
    setIsDropdownOpen(false); // 选择后关闭下拉框
    if (width !== nodeWidth) {
      onNodeWidthChange(width);
    }
  };

  return (
    <div className="bg-white rounded-lg text-[12px] font-[550] px-1.5 py-1.5 flex items-center space-x-2 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]">
      {/* 重新布局 */}
      <button 
        onClick={onRelayout}
        className="flex items-center text-gray-800 bg-white hover:bg-gray-100 active:bg-gray-200 transition duration-200 rounded-lg px-2 py-1 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] transform hover:scale-105 h-8">
        <RefreshCcw className="mr-2" size={16} />
        重新布局
      </button>
      {/* 选择节点宽度 */}
      <div className="relative flex items-center bg-white rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.1)] h-8">
        <label className="text-gray-700 px-2 border-r border-gray-200 h-full flex items-center">节点宽度</label>
        <div>
          <button
            type="button"
            className="inline-flex justify-between items-center rounded-lg bg-white text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1 h-full"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}  
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} // 切换下拉框显示状态
          >
            {nodeWidth}
            <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06 0L10 10.293l3.71-3.08a.75.75 0 111.06 1.06l-4.25 3.5a.75.75 0 01-1.06 0l-4.25-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div
          className={`absolute right-0 z-10 top-12 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-in-out ${
            isDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-10px] pointer-events-none'
          }`}
        >
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {[800, 1000, 1200, 1400, 1600].map((width) => (
              <button
                key={width}
                onClick={() => handleWidthChange(width)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors duration-200"
              >
                {width}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* 小地图 */}
      <button
        onClick={() => setShowMiniMap(!showMiniMap)}
        className="flex items-center text-gray-800 bg-white hover:bg-gray-100 active:bg-gray-200 transition duration-200 rounded-lg px-2 py-1 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] transform hover:scale-105 h-8"
      >
        <MapPin className="" size={16} />
        小地图
      </button>
    </div>
  );
}

export default FlowRightToolBar;

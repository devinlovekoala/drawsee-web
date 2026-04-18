import React, { useState, useEffect } from 'react';

interface MathKeyboardProps {
  onInsert: (symbol: string) => void;
  onClose: () => void;
}

const MathKeyboard: React.FC<MathKeyboardProps> = ({ onInsert, onClose }) => {
  const [activeTab, setActiveTab] = useState('common');

  // 定义所有标签页的数据
  const commonButtons = [
    { text: '平方', latex: '^2', desc: '平方' },
    { text: '次方', latex: '^{n}', desc: '次方' },
    { text: '下标', latex: '_{i}', desc: '下标' },
    { text: '根号', latex: '\\sqrt{}', desc: '根号' },
    { text: '分数', latex: '\\frac{}{}', desc: '分数' },
    { text: 'π', latex: '\\pi', desc: '圆周率' },
    { text: '无穷', latex: '\\infty', desc: '无穷大' },
    { text: '多重根', latex: '\\sqrt[]{}', desc: '多重根' },
  ];

  const greekButtons = [
    { text: 'α', latex: '\\alpha', desc: 'alpha' },
    { text: 'β', latex: '\\beta', desc: 'beta' },
    { text: 'γ', latex: '\\gamma', desc: 'gamma' },
    { text: 'δ', latex: '\\delta', desc: 'delta' },
    { text: 'θ', latex: '\\theta', desc: 'theta' },
    { text: 'λ', latex: '\\lambda', desc: 'lambda' },
    { text: 'μ', latex: '\\mu', desc: 'mu' },
    { text: 'π', latex: '\\pi', desc: 'pi' },
  ];

  const operatorButtons = [
    { text: '+', latex: '+', desc: '加' },
    { text: '−', latex: '-', desc: '减' },
    { text: '×', latex: '\\times', desc: '乘' },
    { text: '÷', latex: '\\div', desc: '除' },
    { text: '=', latex: '=', desc: '等于' },
    { text: '≈', latex: '\\approx', desc: '约等于' },
    { text: '<', latex: '<', desc: '小于' },
    { text: '>', latex: '>', desc: '大于' },
  ];

  const calculusButtons = [
    { text: '∫', latex: '\\int', desc: '积分' },
    { text: '定积分', latex: '\\int_{}^{}', desc: '定积分' },
    { text: '导数', latex: '\\frac{d}{d}', desc: '导数' },
    { text: '偏导', latex: '\\frac{\\partial}{\\partial}', desc: '偏导数' },
    { text: '∑', latex: '\\sum', desc: '求和' },
    { text: 'lim', latex: '\\lim', desc: '极限' },
  ];
  
  const physicsButtons = [
    { text: 'F=ma', latex: 'F = ma', desc: '牛顿第二定律' },
    { text: 'E=mc²', latex: 'E = mc^2', desc: '质能方程' },
    { text: 'V=IR', latex: 'V = IR', desc: '欧姆定律' },
    { text: '速度', latex: 'v = \\frac{s}{t}', desc: '速度公式' },
    { text: '功', latex: 'W = Fs', desc: '功的计算' },
    { text: '热量', latex: 'Q = mc\\Delta t', desc: '热量计算' },
  ];

  // 获取活动标签页的按钮
  const getActiveButtons = () => {
    switch(activeTab) {
      case 'common': return commonButtons;
      case 'greek': return greekButtons;
      case 'operators': return operatorButtons;
      case 'calculus': return calculusButtons;
      case 'physics': return physicsButtons;
      default: return commonButtons;
    }
  };

  // 阻止点击事件冒泡
  const handleKeyboardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // 监听ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center pt-[40vh] z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[50vh] overflow-auto animate-slide-up"
        onClick={handleKeyboardClick}
        style={{ maxHeight: '300px' }}
      >
        {/* 头部 */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium text-gray-900">数学公式键盘</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* 选项卡 */}
        <div className="flex overflow-x-auto py-2 px-4 border-b border-gray-200 bg-gray-50">
          <button 
            onClick={() => setActiveTab('common')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md mr-2 whitespace-nowrap ${activeTab === 'common' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            常用符号
          </button>
          <button 
            onClick={() => setActiveTab('greek')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md mr-2 whitespace-nowrap ${activeTab === 'greek' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            希腊字母
          </button>
          <button 
            onClick={() => setActiveTab('operators')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md mr-2 whitespace-nowrap ${activeTab === 'operators' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            运算符
          </button>
          <button 
            onClick={() => setActiveTab('calculus')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md mr-2 whitespace-nowrap ${activeTab === 'calculus' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            微积分
          </button>
          <button 
            onClick={() => setActiveTab('physics')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md mr-2 whitespace-nowrap ${activeTab === 'physics' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            物理公式
          </button>
        </div>

        {/* 符号网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4">
          {getActiveButtons().map((button, index) => (
            <button
              key={index}
              onClick={() => onInsert(button.latex)}
              className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-all"
            >
              <span className="text-lg mb-1 font-math">{button.text}</span>
              <span className="text-xs text-gray-500">{button.desc}</span>
            </button>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 bg-gray-50 text-right border-t border-gray-200">
          <p className="text-sm text-gray-500">
            提示：您也可以直接输入LaTeX语法，例如输入\sqrt表示根号
          </p>
        </div>
      </div>
    </div>
  );
};

export default MathKeyboard; 
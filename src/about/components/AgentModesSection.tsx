import React, { useState } from 'react';

const agentModes = [
  {
    id: 'general',
    name: '常规问答模式',
    description: '最基础的AI生成能力，直观高效，能够回答各类常见问题，轻松应对日常咨询需求。',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    color: 'from-blue-500 to-cyan-400',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    example: "用户: 什么是自然语言处理?\n\nAI: 自然语言处理(NLP)是人工智能的一个子领域，专注于计算机与人类语言之间的交互。它使计算机能够理解、解释和生成人类语言，应用于机器翻译、语音识别、文本分析等领域。"
  },
  {
    id: 'knowledge',
    name: '知识问答模式',
    description: '基于知识库的AI生成模式，能识别用户提问中的相关知识点，提供更加权威和准确的回答。',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
    color: 'from-indigo-500 to-purple-400',
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    example: "用户: 量子计算的基本原理是什么?\n\n知识库匹配: 找到3个相关知识点\n\nAI: 量子计算利用量子力学原理进行信息处理。其基本单位是量子比特(qubit)，不同于经典比特的0或1状态，qubit可以处于0、1的叠加态。量子计算利用叠加态和量子纠缠实现并行计算，理论上可以解决经典计算机难以处理的复杂问题。"
  },
  {
    id: 'solver',
    name: '推理解题模式',
    description: '基于解题引擎，能够基于用户提问生成解题过程，帮助用户理解复杂问题的解决思路。',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    ),
    color: 'from-amber-500 to-orange-400',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    example: "用户: 解决一元二次方程 2x² - 5x + 2 = 0\n\n解题方法: 求根公式\n\nAI: \n步骤1: 确认方程形式为ax² + bx + c = 0，其中a=2, b=-5, c=2\n\n步骤2: 使用求根公式 x = (-b ± √(b² - 4ac)) / (2a)\n\n步骤3: 代入数值 x = (5 ± √(25 - 16)) / 4 = (5 ± √9) / 4 = (5 ± 3) / 4\n\n步骤4: 计算两个解 x₁ = 2, x₂ = 0.5\n\n验证: 将解代入原方程检查..."
  },
  {
    id: 'planner',
    name: '目标解析模式',
    description: '基于目标解析引擎，能够对用户目标进行有效拆解，帮助用户制定实现路径和行动计划。',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="6"></circle>
        <circle cx="12" cy="12" r="2"></circle>
      </svg>
    ),
    color: 'from-emerald-500 to-teal-400',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    example: "用户: 我想学习前端开发，制定一个学习计划\n\nAI: \n目标拆解:\n1. 基础知识学习\n   - HTML/CSS基础 (2周)\n   - JavaScript基础 (3周)\n   - 响应式设计原则 (1周)\n\n2. 进阶技能\n   - 现代JavaScript特性 (2周)\n   - React/Vue框架学习 (4周)\n   - 状态管理 (1周)\n\n3. 实战项目\n   - 个人网站开发 (2周)\n   - ToDo应用开发 (1周)\n   - 电商前端开发 (3周)\n\n每周学习计划详情..."
  },
  {
    id: 'html-maker',
    name: '网页生成模式',
    description: '基于网页生成引擎，能够基于用户提问生成可预览的HTML页面，实现从文本描述到可视化页面的转换。',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="9" y1="21" x2="9" y2="9"></line>
      </svg>
    ),
    color: 'from-rose-500 to-pink-400',
    textColor: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    example: "用户: 生成一个简单的登录页面\n\nAI: 已生成HTML页面，可点击预览\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>登录</title>\n  <style>\n    body { font-family: Arial; background-color: #f5f5f5; }\n    .login-container { ... }\n    /* 更多样式 */\n  </style>\n</head>\n<body>\n  <div class=\"login-container\">\n    <h2>账号登录</h2>\n    <form>\n      <input type=\"text\" placeholder=\"用户名\" required>\n      <input type=\"password\" placeholder=\"密码\" required>\n      <button type=\"submit\">登录</button>\n    </form>\n  </div>\n</body>\n</html>\n```"
  }
];

const AgentModesSection: React.FC = () => {
  const [activeMode, setActiveMode] = useState(agentModes[0].id);
  
  // 获取当前激活的模式
  const currentMode = agentModes.find(mode => mode.id === activeMode) || agentModes[0];

  return (
    <section id="agents" className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* 标题部分 */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              多元智能助手
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            一站式解决方案，满足不同场景需求
          </p>
          
          {/* 装饰线 */}
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-6"></div>
        </div>
        
        {/* 模式选择器和内容展示 */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧模式选择器 */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-24">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {agentModes.map((mode) => (
                    <li key={mode.id}>
                      <button
                        className={`w-full px-6 py-5 flex items-center gap-4 text-left transition-all duration-300 ${
                          activeMode === mode.id
                            ? `${mode.bgColor} ${mode.textColor} ${mode.borderColor} border-l-4`
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveMode(mode.id)}
                      >
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${mode.color} text-white`}>
                          {mode.icon}
                        </div>
                        <div>
                          <h3 className={`font-medium ${activeMode === mode.id ? mode.textColor : 'text-gray-800'}`}>
                            {mode.name}
                          </h3>
                          <p className={`text-sm mt-1 line-clamp-2 ${activeMode === mode.id ? 'text-gray-700' : 'text-gray-500'}`}>
                            {mode.description}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* 右侧内容展示 */}
          <div className="w-full lg:w-2/3">
            <div className={`bg-white/70 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border-t-4 ${currentMode.borderColor} transition-all duration-500`}>
              {/* 模式详情 */}
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${currentMode.color} text-white`}>
                    {currentMode.icon}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${currentMode.textColor}`}>
                      {currentMode.name}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {currentMode.description}
                    </p>
                  </div>
                </div>
                
                {/* 交互示例 */}
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-700 mb-4">交互示例</h4>
                  <div className={`bg-gray-900 rounded-xl scrollbar-hide p-6 font-mono text-sm text-gray-300 overflow-auto max-h-[500px] shadow-inner`}>
                    <pre className="whitespace-pre-wrap">{currentMode.example}</pre>
                  </div>
                </div>
                
                {/* 使用场景 */}
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-700 mb-4">适用场景</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      // 根据不同的模式生成不同的场景标签
                      const scenarios = {
                        general: ['日常问答', '信息查询', '常识咨询', '简单解释'],
                        knowledge: ['学术研究', '专业咨询', '深度解析', '背景调研'],
                        solver: ['数学解题', '物理问题', '编程难题', '逻辑推理'],
                        planner: ['学习规划', '职业发展', '项目管理', '任务分解'],
                        'html-maker': ['网页设计', '原型制作', '界面展示', '交互演示']
                      };
                      
                      return (scenarios[currentMode.id as keyof typeof scenarios] || []).map((scenario, index) => (
                        <div key={index} className={`px-4 py-3 rounded-lg ${currentMode.bgColor} ${currentMode.textColor}`}>
                          {scenario}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full translate-x-1/3 -translate-y-1/3 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-50 rounded-full -translate-x-1/3 translate-y-1/3 opacity-50"></div>
    </section>
  );
};

export default AgentModesSection; 
import { SparklesIcon, Cog, BrainCircuit, Wand2, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible';
import { AiTaskType } from '@/api/types/flow.types';

// 定义Agent类型，用于侧边栏展示
const agents = [
  {
    id: 'ai-solver',
    name: 'AI推理解题',
    description: '提供强大的数学、物理等多学科推理解题能力',
    icon: SparklesIcon,
    type: 'solver-first',
    isActive: true,
  },
  {
    id: 'ai-animation',
    name: 'AI动画生成',
    description: '将复杂概念转换为生动直观的动画形式',
    icon: Wand2,
    type: 'animation',
    isActive: true,
  },
  {
    id: 'ai-circuit',
    name: 'AI电子电路分析',
    description: '电子电路分析与仿真，帮助理解电路原理',
    icon: BrainCircuit,
    type: 'circuit-analyze',
    isActive: true,
  }
];

// 定义学习工具类型，用于侧边栏展示
const learningTools = [
  {
    id: 'course-center',
    name: '课程中心',
    description: '加入班级、查看课程、学习进度管理',
    icon: GraduationCap,
    path: '/course',
    isActive: true,
  }
];

// const agentModes = [
//   {
//     id: 'general',
//     name: '通用对话',
//     description: '基础AI对话，回答各类问题',
//     icon: 'message-circle',
//     type: 'general' as AiTaskType
//   },
//   {
//     id: 'knowledge',
//     name: '知识问答',
//     description: '基于知识库的AI对话',
//     icon: 'book-open',
//     type: 'knowledge' as AiTaskType
//   },
//   {
//     id: 'solver',
//     name: '解题推理',
//     description: '复杂问题求解、推理和证明',
//     icon: 'sparkles',
//     type: 'solver-first' as AiTaskType
//   },
//   {
//     id: 'html-maker',
//     name: '网页生成',
//     description: '生成HTML网页，预览效果',
//     icon: 'code',
//     type: 'html-maker' as AiTaskType
//   },
//   {
//     id: 'planner',
//     name: '目标解析',
//     description: '分解目标、任务规划与指导',
//     icon: 'target',
//     type: 'planner' as AiTaskType
//   },
//   {
//     id: 'animation',
//     name: '动画生成',
//     description: '创建教学动画，生动演示',
//     icon: 'tv',
//     type: 'animation' as AiTaskType,
//     isNew: true
//   },
//   {
//     id: 'circuit',
//     name: '电路分析',
//     description: '设计分析电子电路',
//     icon: 'circuit-board',
//     type: 'circuit-analyze' as AiTaskType,
//     isNew: true
//   }
// ];

export function AgentMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [isLearningToolsOpen, setIsLearningToolsOpen] = useState(true);

  const handleAgentClick = (agent: typeof agents[0]) => {
    if (!agent.isActive) {
      toast.info(`${agent.name}功能即将上线，敬请期待！`);
      return;
    }

    // 根据不同的agent类型导航到相应页面，并携带参数
    navigate('/blank', { 
      state: { 
        agentType: agent.type,
        agentName: agent.name 
      } 
    });
  };
  
  const handleLearningToolClick = (tool: typeof learningTools[0]) => {
    if (!tool.isActive) {
      toast.info(`${tool.name}功能即将上线，敬请期待！`);
      return;
    }
    
    navigate(tool.path);
  };

  return (
    <>
      <Collapsible defaultOpen={true} open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-1.5 mb-0 mt-6">
          <CollapsibleTrigger className="w-full" asChild>
            <button className="flex items-center gap-1 group select-none hover:text-neutral-900 w-full">
              <span className="text-[15px] font-medium hover:text-black opacity-80">智能助手</span>
              <Cog size="18px" className="group-data-[state=open]:animate-spin transition duration-200"/>
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-2.5 space-y-1">
          <div className="grid grid-cols-1 gap-1">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleAgentClick(agent)}
                className={`
                  group relative flex select-none items-center gap-2 rounded-lg mx-1 px-3 py-2.5 text-sm
                  ${agent.isActive 
                    ? 'text-neutral-700 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-neutral-200 cursor-pointer' 
                    : 'text-neutral-500 hover:bg-neutral-100/50 cursor-not-allowed opacity-80'
                  }
                  transition-all duration-200
                `}
              >
                <agent.icon size="16px" className="text-neutral-500 transition-colors group-hover:text-neutral-700"/>
                <div className="flex flex-col">
                  <span className="select-none truncate group-hover:font-medium pl-1 transition-colors">
                    {agent.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 truncate max-w-40">
                    {agent.description}
                  </span>
                </div>
                {!agent.isActive && (
                  <div className="absolute right-2 top-2 text-[10px] px-1.5 py-0.5 bg-neutral-100 rounded-full text-neutral-500">
                    待开发
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* 学习工具区域 */}
      <Collapsible defaultOpen={true} open={isLearningToolsOpen} onOpenChange={setIsLearningToolsOpen}>
        <div className="flex items-center gap-1.5 mb-0 mt-6">
          <CollapsibleTrigger className="w-full" asChild>
            <button className="flex items-center gap-1 group select-none hover:text-neutral-900 w-full">
              <span className="text-[15px] font-medium hover:text-black opacity-80">学习工具</span>
              <GraduationCap size="18px" className="transition duration-200"/>
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-2.5 space-y-1">
          <div className="grid grid-cols-1 gap-1">
            {learningTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => handleLearningToolClick(tool)}
                className={`
                  group relative flex select-none items-center gap-2 rounded-lg mx-1 px-3 py-2.5 text-sm
                  ${tool.isActive 
                    ? 'text-neutral-700 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-neutral-200 cursor-pointer' 
                    : 'text-neutral-500 hover:bg-neutral-100/50 cursor-not-allowed opacity-80'
                  }
                  transition-all duration-200
                `}
              >
                <tool.icon size="16px" className="text-neutral-500 transition-colors group-hover:text-neutral-700"/>
                <div className="flex flex-col">
                  <span className="select-none truncate group-hover:font-medium pl-1 transition-colors">
                    {tool.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 truncate max-w-40">
                    {tool.description}
                  </span>
                </div>
                {!tool.isActive && (
                  <div className="absolute right-2 top-2 text-[10px] px-1.5 py-0.5 bg-neutral-100 rounded-full text-neutral-500">
                    待开发
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}

export default AgentMenu;
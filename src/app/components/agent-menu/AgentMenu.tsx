import { SparklesIcon, Cog, BrainCircuit, Wand2, GraduationCap, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible';

// 定义Agent类型，用于侧边栏展示
const agents = [
  {
    id: 'ai-general',
    name: 'AI通用问答',
    description: '支持各种问题的通用智能对话系统',
    icon: MessageCircle,
    type: 'GENERAL',
    isActive: true,
  },
  {
    id: 'ai-solver',
    name: 'AI推理解题',
    description: '提供强大的数学、物理等多学科推理解题能力',
    icon: SparklesIcon,
    type: 'SOLVER_FIRST',
    isActive: true,
  },
  {
    id: 'ai-animation',
    name: 'AI动画生成',
    description: '将复杂概念转换为生动直观的动画形式',
    icon: Wand2,
    type: 'ANIMATION',
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
    if (agent.type === 'CIRCUIT_ANALYSIS') {
      // 电路分析模式直接导航到电路分析页面
      navigate('/circuit');
    } else {
      // 其他模式导航到blank页面
      navigate('/blank', {
        state: {
          agentType: agent.type,
          agentName: agent.name
        }
      });
    }
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
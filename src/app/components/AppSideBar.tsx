import {
  Sidebar,
  SidebarContent, SidebarFooter,
  SidebarHeader
} from "@/app/components/ui/sidebar.tsx";
import {NavUser} from "@/app/components/nav-user.tsx";
import {
  ChevronRight,
  MessageCirclePlus, Sparkles
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible.tsx";
import DrawSeeIcon from '@/assets/svg/昭析.svg';
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
import { useAppContext } from "@/app/contexts/AppContext";
import { FlowLocationState } from "@/app/contexts/FlowContext";

interface AppSideBarProps {
  activeConversationId: number | null;
  setActiveConversationId: (id: number | null) => void;
}

function AppSideBar({activeConversationId, setActiveConversationId}: AppSideBarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const {conversations, isLogin} = useAppContext();

    // 从location中获取当前会话ID
    useEffect(() => {
      if (location.pathname === '/flow' && location.state) {
        const { convId } = location.state as FlowLocationState;
        setActiveConversationId(convId);
      } else {
        setActiveConversationId(null);
      }
    }, [location, setActiveConversationId]);

    const handleConversationClick = useCallback((convId: number) => {
      setActiveConversationId(convId);
      navigate('/flow', {state: {convId} as FlowLocationState});
    }, [navigate, setActiveConversationId]);

    return (
			<Sidebar className="pr-4 bg-gradient-to-b from-neutral-50 to-neutral-100" variant="inset">
					{/* 头部标志 */}
					<SidebarHeader className="border-b border-neutral-200">
					<div className="cursor-pointer relative m-3 mb-3 hidden transition-all md:flex justify-start items-center shrink-0">
							<div className="pointer-events-none select-none relative flex items-center gap-1">
							<img className="h-[32px] transition-transform hover:scale-110" src={DrawSeeIcon} alt="DrawSee" />
							<div className="ml-2 text-[32px] font-bold overflow-hidden whitespace-nowrap bg-gradient-to-r from-neutral-950 to-neutral-500 bg-clip-text text-transparent">
									昭析
							</div>
							</div>
					</div>
					</SidebarHeader>

					{/* 中间内容 */}
					<SidebarContent className="overflow-y-auto max-h-[calc(100vh-100px)] scrollbar-hide">
					<div className="pl-4 pr-1.5 mt-6">
							<button
							onClick={() => {
								setActiveConversationId(null);
								navigate('/blank');
							}}
							className="group px-[12px] text-[14px] select-none h-12 items-center leading-5 tracking-normal gap-2 flex w-full cursor-pointer justify-between rounded-lg bg-white py-4 text-left font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200 transition duration-200 hover:shadow-md hover:ring-neutral-300">
							<span className="transition-colors group-hover:text-neutral-700">新建对话</span>
							<MessageCirclePlus size="18px" className="transition-transform group-hover:scale-110" />
							</button>

							<Collapsible defaultOpen={true}>
							<div className="flex items-center gap-1.5 mb-0 mt-10">
									<CollapsibleTrigger className="w-full" asChild>
									<button className="flex items-center gap-1 group select-none hover:text-neutral-900 w-full">
											<span className="text-[15px] font-medium hover:text-black opacity-80">历史会话</span>
											<ChevronRight size="18px" className="group-data-[state=open]:rotate-90 transition duration-200"/>
									</button>
									</CollapsibleTrigger>
							</div>
							<CollapsibleContent className="mt-2.5 space-y-1 overflow-y-auto max-h-[calc(100vh-300px)] scrollbar-hide">
									{conversations.map((conversation, index) => (
									<div
										key={conversation.id}
										onClick={() => handleConversationClick(conversation.id)}
										className={`
										group relative flex select-none items-center justify-between gap-1 rounded-lg mx-1 px-3 py-2.5 text-sm
										${activeConversationId === conversation.id 
											? 'bg-white shadow-sm ring-1 ring-neutral-300 font-medium text-neutral-900' 
											: 'text-neutral-700 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-neutral-200'}
										${index === 0 ? 'mt-1' : ''}
										transition-all duration-200 cursor-pointer
										`}
									>
										<div className="flex items-center gap-2">
										<Sparkles size="16px" className={`${activeConversationId === conversation.id ? 'text-neutral-700' : 'text-neutral-500'} transition-colors group-hover:text-neutral-700`}/>
										<span className={`select-none truncate ${activeConversationId === conversation.id ? 'font-medium' : 'group-hover:font-medium'} pl-1 max-w-52 transition-colors`}>
												{conversation.title}
										</span>
										</div>
									</div>
									))}
									{/* 占位 */}
									<div className="h-12" />
							</CollapsibleContent>
							</Collapsible>
					</div>
					</SidebarContent>

					{/* 底部用户 */}
					<SidebarFooter className="border-t border-neutral-200">
					{isLogin && (
							<NavUser user={{name: 'Jason', avatar: 'https://avatars.githubusercontent.com/u/10216806?v=4'}}/>
					)}
					</SidebarFooter>
			</Sidebar>
    );
}

export default AppSideBar;

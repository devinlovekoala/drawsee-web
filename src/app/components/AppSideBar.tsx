import {
  Sidebar,
  SidebarContent, SidebarFooter,
  SidebarHeader
} from "@/app/components/ui/sidebar.tsx";
import {NavUser} from "@/app/components/nav-user.tsx";
import {
  ChevronRight,
  MessageCirclePlus, Sparkles, BrainCircuit, CircuitBoard, Save
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible.tsx";
import DrawSeeIcon from '@/assets/svg/昭析.svg';
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "@/app/contexts/AppContext";
import { FlowLocationState } from "@/app/contexts/FlowContext";
import { LOGIN_FLAG_KEY } from "@/common/constant/storage-key.constant";
import { AgentMenu } from "./agent-menu/AgentMenu";

// 定义一个导航事件类型
interface NavigationEvent {
  path: string;
  state?: any;
  callback?: (canProceed: boolean) => void;
}

interface AppSideBarProps {
  activeConversationId: number | null;
  setActiveConversationId: (id: number | null) => void;
  className?: string;
}

function AppSideBar({activeConversationId, setActiveConversationId, className}: AppSideBarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const {conversations, isLogin} = useAppContext();
    const [circuitMenuOpen, setCircuitMenuOpen] = useState(true);

		// 从location中获取当前会话ID
		useEffect(() => {
			if (location.pathname === '/flow' && location.state) {
				const { convId } = location.state as FlowLocationState;
				setActiveConversationId(convId);
			} else {
				setActiveConversationId(null);
			}
		}, [location, setActiveConversationId]);

		// 创建自定义导航处理函数
		const handleCustomNavigation = useCallback(async (path: string, state?: any) => {
			// 检查当前是否在电路编辑页面
			const isCircuitEditPage = location.pathname.includes('/circuit/edit/');

			const confirmMsg = '您有尚未保存的电路设计，确定要离开并放弃更改吗？';

			// 优先做一个同步的全局检查（避免事件监听尚未就绪时丢失拦截）
			let preConfirmed = false;
			try {
				const globalChecker = (window as any).drawsee_hasUnsavedCircuitChanges;
				if (typeof globalChecker === 'function' && globalChecker()) {
					const ok = window.confirm(confirmMsg);
					if (!ok) return; // 取消导航
					preConfirmed = true;
					try { (window as any).drawsee_preConfirmedNavigation = true; } catch (err) {}
					try { (window as any).drawsee_suppressBeforeUnload = true; } catch (err) {}
				}
			} catch (err) {
				// continue
			}

			if (isCircuitEditPage) {
				// 使用 Promise 等待编辑页通过回调决定是否继续导航
				const result = await new Promise<boolean>((resolve) => {
					let resolved = false;
					const cb = (canProceed: boolean) => {
						if (resolved) return;
						resolved = true;
						resolve(Boolean(canProceed));
					};

					const navigationEvent = new CustomEvent('app:navigation-request', {
						detail: {
							path,
							state,
							callback: cb,
							preConfirmed,
						} as any,
						cancelable: true,
					});

					// dispatch 同步触发监听器
					  console.log('[AppSideBar] dispatching app:navigation-request', path);
					  document.dispatchEvent(navigationEvent);
					  console.log('[AppSideBar] dispatched app:navigation-request', path);

					// 后备：如果没有监听者响应（例如非编辑页或监听尚未挂载），在 500ms 后默认允许导航
					const fallback = window.setTimeout(() => {
						if (!resolved) {
							resolved = true;
							try { (window as any).drawsee_preConfirmedNavigation = false; } catch (err) {}
							try { (window as any).drawsee_suppressBeforeUnload = false; } catch (err) {}
							resolve(true);
						}
					}, 500);

					// 当 resolve 调用后清理定时器
					const wrappedResolve = (v: boolean) => {
						if (fallback) window.clearTimeout(fallback);
						resolve(v);
					};
				});

					console.log('[AppSideBar] navigation decision for', path, '=>', result);
					if (result) {
						navigate(path, { state });
						try { (window as any).drawsee_preConfirmedNavigation = false; } catch (err) {}
						try { (window as any).drawsee_suppressBeforeUnload = false; } catch (err) {}
					}
			} else {
				// 不在电路编辑页面，直接导航
				navigate(path, { state });
			}
		}, [location.pathname, navigate]);

    const handleConversationClick = useCallback((convId: number) => {
      setActiveConversationId(convId);
      
      // 强制会话切换：无论当前在什么页面，都确保能正确切换
      if (location.pathname === '/flow') {
        // 如果已经在flow页面，使用replace确保state更新
        navigate('/flow', { state: {convId} as FlowLocationState, replace: true });
      } else {
        // 如果不在flow页面，正常导航
        handleCustomNavigation('/flow', {convId} as FlowLocationState);
      }
    }, [handleCustomNavigation, setActiveConversationId, location.pathname, navigate]);

		const { openSideBar } = useAppContext();

    return (
			<Sidebar className={`pr-4 bg-gradient-to-b from-neutral-50 to-neutral-100 ${className}`} variant="inset">
					{/* 头部标志 */}
					<SidebarHeader className={`border-b border-neutral-200 ${openSideBar ? '' : 'hidden'}`}>
					<div className="cursor-pointer relative m-3 mb-3 hidden transition-all md:flex justify-start items-center shrink-0"
						onClick={() => {
							setActiveConversationId(null);
							sessionStorage.removeItem(LOGIN_FLAG_KEY);
							handleCustomNavigation('/about');
						}}
					>
							<div className="pointer-events-none select-none relative flex items-center gap-1">
							<img className="h-[32px] transition-transform hover:scale-110" src={DrawSeeIcon} alt="DrawSee" />
							<div className="ml-2 text-[32px] font-bold overflow-hidden whitespace-nowrap bg-gradient-to-r from-neutral-950 to-neutral-500 bg-clip-text text-transparent">
									昭析
							</div>
							</div>
					</div>
					</SidebarHeader>

					{/* 中间内容 */}
					<SidebarContent className={`overflow-y-auto max-h-[calc(100vh-100px)] scrollbar-hide ${openSideBar ? '' : 'hidden'}`}>
					<div className="pl-4 pr-1.5 mt-6">
							{/* 电路分析功能区（作为主推功能） */}
							<div className="mb-6">
									<div className="flex items-center gap-2 mb-3">
											<BrainCircuit size="20px" className="text-blue-600" />
											<h2 className="text-[16px] font-bold text-blue-800">电路智能分析</h2>
									</div>

									<button
											onClick={() => handleCustomNavigation('/circuit')}
											className="group px-[12px] py-[14px] text-[14px] select-none h-14 items-center leading-5 tracking-normal gap-2 flex w-full cursor-pointer justify-between rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 text-left font-medium text-blue-900 shadow-sm ring-1 ring-blue-200 transition duration-200 hover:shadow-md hover:ring-blue-300 mb-2"
									>
											<span className="transition-colors group-hover:text-blue-700 font-semibold flex items-center">
													<CircuitBoard size="18px" className="mr-2" />
													创建电路分析
											</span>
											<BrainCircuit size="18px" className="transition-transform group-hover:scale-110" />
									</button>

									{/* 新增：电路实验任务分析入口 */}
									<div className="flex items-center gap-2 mb-3 mt-6">
											<span className="text-blue-600">
													{/* 可替换为合适的实验icon */}
													<svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M5 2h10v2H5V2zm1 3h8v2H6V5zm2 3h4v2H8V8zm-2 3h8v2H6v-2zm-2 3h12v2H4v-2z" fill="#2563eb"/></svg>
											</span>
											<h2 className="text-[16px] font-bold text-blue-800">电路实验任务分析</h2>
									</div>
									<button
											onClick={() => handleCustomNavigation('/circuit/experiment')}
											className="group px-[12px] py-[14px] text-[14px] select-none h-14 items-center leading-5 tracking-normal gap-2 flex w-full cursor-pointer justify-between rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 text-left font-medium text-purple-900 shadow-sm ring-1 ring-purple-200 transition duration-200 hover:shadow-md hover:ring-purple-300 mb-2"
									>
											<span className="transition-colors group-hover:text-purple-700 font-semibold flex items-center">
													{/* 可替换为合适的实验icon */}
													<svg width="18" height="18" fill="none" viewBox="0 0 20 20"><path d="M5 2h10v2H5V2zm1 3h8v2H6V5zm2 3h4v2H8V8zm-2 3h8v2H6v-2zm-2 3h12v2H4v-2z" fill="#a21caf"/></svg>
													实验任务分析
											</span>
											<svg width="18" height="18" fill="none" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V6h2v4z" fill="#a21caf"/></svg>
									</button>

									<Collapsible defaultOpen={true} open={circuitMenuOpen} onOpenChange={setCircuitMenuOpen}>
											<div className="flex items-center gap-1.5 mb-1">
													<CollapsibleTrigger className="w-full" asChild>
															<button className="flex items-center gap-1 group select-none hover:text-blue-900 w-full">
																	<span className="text-[14px] font-medium text-blue-700">我的电路库</span>
																	<ChevronRight size="16px" className="text-blue-600 group-data-[state=open]:rotate-90 transition duration-200"/>
															</button>
													</CollapsibleTrigger>
											</div>
											<CollapsibleContent className="mt-1 mb-3">
													<div 
															onClick={() => handleCustomNavigation('/circuit/list')}
															className="group flex select-none items-center gap-2 rounded-lg mx-1 px-3 py-2 text-sm text-blue-700 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-blue-200 cursor-pointer transition-all duration-200"
													>
															<Save size="14px" className="text-blue-500 transition-colors group-hover:text-blue-700"/>
															<span className="select-none truncate group-hover:font-medium transition-colors">
																已保存的电路设计
															</span>
													</div>
											</CollapsibleContent>
									</Collapsible>
							</div>

							{/* 新建对话按钮 */}
							<button
									onClick={() => {
											setActiveConversationId(null);
											// 明确指定导航到通用模式的昭析智能体对话页面
											handleCustomNavigation('/blank', { 
													state: { 
															agentType: 'GENERAL',
															agentName: '通用对话' 
													} 
											});
									}}
									className="group px-[12px] text-[14px] select-none h-12 items-center leading-5 tracking-normal gap-2 flex w-full cursor-pointer justify-between rounded-lg bg-white py-4 text-left font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200 transition duration-200 hover:shadow-md hover:ring-neutral-300">
									<span className="transition-colors group-hover:text-neutral-700">新建对话</span>
									<MessageCirclePlus size="18px" className="transition-transform group-hover:scale-110" />
							</button>

							{/* 添加智能助手菜单 */}
							<AgentMenu />

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
										className={` truncate text-ellipsis
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
					<SidebarFooter className={`border-t border-neutral-200 ${openSideBar ? '' : 'hidden'}`}>
					{isLogin && (
						<NavUser />
					)}
					</SidebarFooter>
			</Sidebar>
    );
}

export default AppSideBar;

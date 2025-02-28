import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  Sparkles,
  ChevronRight,
  MessageCirclePlus
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/pages/flow/components/ui/collapsible.tsx"

import DrawSeeIcon from '@/assets/svg/昭析.svg';


import { NavMain } from "@/pages/flow/components/nav-main.tsx"
import { NavProjects } from "@/pages/flow/components/nav-projects.tsx"
import { NavSecondary } from "@/pages/flow/components/nav-secondary.tsx"
import { NavUser } from "@/pages/flow/components/nav-user.tsx"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/pages/flow/components/ui/sidebar.tsx"
import {toast} from "sonner";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    /*{
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },*/
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  return (
    <Sidebar className="pr-4" variant="inset" {...props}>
      <SidebarHeader>
        {/*<SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>*/}
        <div className="cursor-pointer relative m-3 mb-3 hidden transition-all md:flex justify-start items-center shrink-0">
          <div className="pointer-events-none select-none relative flex items-center gap-1 h-5">
            <img className="h-[28px]" src={DrawSeeIcon} alt="DrawSee" />
            <div className="ml-2 text-[28px] font-bold overflow-hidden whitespace-nowrap">
              昭析
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/*<NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />*/}

        <div className="pl-4 pr-1.5 mt-6">
          <button
            className="px-[12px] text-[14px] select-none h-8 items-center leading-5 tracking-normal gap-2 flex w-full cursor-pointer justify-between rounded-md bg-neutral-100 py-4 text-left font-medium text-neutral-900 ring-2 ring-neutral-200 transition duration-200 hover:scale-[0.97] hover:ring-neutral-300">
            <span>新建对话</span>
            <MessageCirclePlus size="18px" />
          </button>

          <Collapsible>
            <div className="flex items-center gap-1.5 mb-0 mt-10">
              <CollapsibleTrigger className="" asChild>
                <button className="flex items-center gap-1 group select-none hover:text-neutral-900">
                  <span className="text-[15px] hover:text-black opacity-60">历史会话</span>
                  <ChevronRight size="18px" className="group-data-[state=open]:rotate-90 transition duration-200"/>
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-2.5">
              <div
                className="my-1.5 group relative flex select-none items-center justify-between gap-1 rounded-lg px-1.5 py-2 text-sm opacity-80 duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-600/80 dark:text-neutral-300 cursor-pointer">
                <div className="flex items-center gap-1">
                  <Sparkles size="18px"/>
                  <span className="select-none truncate group-hover:font-medium pl-1 max-w-52">RAG模型学习</span>
                </div>
              </div>
              <div
                className="my-1.5 group relative flex select-none items-center justify-between gap-1 rounded-lg px-1.5 py-2 text-sm opacity-80 duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-600/80 dark:text-neutral-300 cursor-pointer">
                <div className="flex items-center gap-1">
                  <Sparkles size="18px"/>
                  <span className="select-none truncate group-hover:font-medium pl-1 max-w-52">RAG模型学习</span>
                </div>
              </div>
              <div
                className="my-1.5 group relative flex select-none items-center justify-between gap-1 rounded-lg px-1.5 py-2 text-sm opacity-80 duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-600/80 dark:text-neutral-300 cursor-pointer">
                <div className="flex items-center gap-1">
                  <Sparkles size="18px"/>
                  <span className="select-none truncate group-hover:font-medium pl-1 max-w-52">RAG模型学习</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user}/>
      </SidebarFooter>
    </Sidebar>
  )
}

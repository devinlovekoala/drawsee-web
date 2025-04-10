'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChatIcon, CodeIcon, MagicWandIcon, RocketIcon, TargetIcon, VideoIcon, CircuitBoardIcon } from 'lucide-react';

export const navigations = [
  {
    name: '常规问答',
    href: '/',
    icon: ChatIcon,
    tag: '',
  },
  {
    name: '解题推理',
    href: '/solver',
    icon: MagicWandIcon,
    tag: '',
  },
  {
    name: '目标解析',
    href: '/planner',
    icon: TargetIcon,
    tag: '',
  },
  {
    name: '网页生成',
    href: '/html-maker',
    icon: CodeIcon,
    tag: '',
  },
  {
    name: '动画生成',
    href: '/animation',
    icon: VideoIcon,
    tag: '近期上线',
  },
  {
    name: '电路分析',
    href: '/circuit',
    icon: CircuitBoardIcon,
    tag: '新功能',
  },
];

export default function Navigations() {
  const pathname = usePathname();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    const index = navigations.findIndex(
      (nav) => pathname === nav.href || pathname.startsWith(`${nav.href}/`)
    );
    setSelectedIndex(index !== -1 ? index : 0);
  }, [pathname]);

  return (
    <div className="flex w-full max-w-md justify-center overflow-hidden">
      <div className="relative flex flex-1 items-center justify-center space-x-1 p-2">
        {navigations.map((nav, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Link
              key={nav.name}
              href={nav.href}
              className={`relative flex h-10 flex-1 items-center justify-center space-x-1 rounded-lg px-1 text-sm font-medium transition-colors ${
                isSelected ? '' : 'hover:bg-gray-100'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="navigation-indicator"
                  className="absolute inset-0 z-0 rounded-lg bg-white shadow-[0_2px_4px_0_rgba(0,0,0,0.15)]"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <nav.icon className="h-4 w-4" />
                <span className="hidden sm:block">{nav.name}</span>
                {nav.tag && (
                  <span className="absolute -right-5 -top-1.5 rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-medium text-white">
                    {nav.tag}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Users, UserPlus, Globe } from 'lucide-react';

// 定义标签类型
type TabType = 'joined' | 'created' | 'available';

interface CourseTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function CourseTabs({ activeTab, onTabChange }: CourseTabsProps) {
  const tabs = [
    {
      id: 'joined' as TabType,
      label: '我加入的',
      icon: Users
    },
    {
      id: 'created' as TabType,
      label: '我创建的',
      icon: UserPlus
    },
    {
      id: 'available' as TabType,
      label: '可访问的',
      icon: Globe
    }
  ];

  return (
    <div className="flex rounded-lg p-1 bg-neutral-100 mb-8">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center justify-center gap-1.5 flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${
            activeTab === tab.id
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-neutral-600 hover:text-indigo-600'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default CourseTabs;
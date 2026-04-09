import React from 'react';
import {
  landingCapabilities,
  landingWorkflowSteps
} from '@/common/constant/landing-page.constant.ts';

const IntelligentWorkflowSection: React.FC = () => {
  return (
    <section id="agents" className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              智能交互方案
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            从手动模式切换升级为系统自动编排，围绕真实教学、仿真与工程任务持续输出
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-6"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {landingWorkflowSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm"
            >
              <div className="inline-flex w-10 h-10 rounded-full bg-blue-600 text-white items-center justify-center font-bold mb-4">
                {index + 1}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {landingCapabilities.map((capability) => (
            <div
              key={capability.title}
              className="rounded-2xl bg-white border border-gray-100 p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 mb-3">
                {capability.tag}
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">{capability.title}</h4>
              <p className="text-gray-600 leading-7">{capability.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full translate-x-1/3 -translate-y-1/3 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-50 rounded-full -translate-x-1/3 translate-y-1/3 opacity-50"></div>
    </section>
  );
};

export default IntelligentWorkflowSection;

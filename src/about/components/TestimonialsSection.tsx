import React from 'react';
import { landingTestimonials } from '@/common/constant/landing-page.constant.ts';

// 分成两组，用于两行展示
const firstRowTestimonials = [...landingTestimonials, ...landingTestimonials];
const secondRowTestimonials = [...landingTestimonials].reverse();
const secondRow = [...secondRowTestimonials, ...secondRowTestimonials];

const TestimonialCard: React.FC<{
  testimonial: typeof landingTestimonials[0],
  variant: 'primary' | 'secondary'
}> = ({ testimonial, variant }) => {
  const baseStyles = "flex flex-col bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-full";
  const variantStyles = variant === 'primary' 
    ? "border-t-4 border-blue-500" 
    : "border-t-4 border-indigo-500";
  
  return (
    <div className={`${baseStyles} ${variantStyles} w-[320px] mx-4 my-2 flex-shrink-0`}>
      <div className="p-6 flex-1">
        {/* 引号图标 */}
        <div className="text-5xl text-blue-100 leading-none mb-3">
          "
        </div>
        
        {/* 评价内容 */}
        <blockquote className="text-gray-700 mb-4 text-base">
          {testimonial.quote}
        </blockquote>
      </div>
      
      {/* 用户信息 */}
      <div className="p-6 pt-3 border-t border-gray-100 bg-gray-50/80">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-white shadow-sm">
            <img src={testimonial.avatar} alt={testimonial.author} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{testimonial.author}</p>
            <p className="text-sm text-gray-500">{testimonial.title}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* 标题部分 */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              用户心声
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            听听他们怎么说
          </p>
          
          {/* 装饰线 */}
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-6"></div>
        </div>
      </div>
      
      {/* 无限滚动评价卡片 */}
      <div className="mb-8 relative">
        {/* 两侧渐变遮罩 */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-white to-transparent"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-white to-transparent"></div>
        
        {/* 第一行 - 从右向左滚动 */}
        <div className="overflow-hidden py-4 mb-6">
          <div className="flex animate-marquee-left">
            {firstRowTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`row1-${index}`}
                testimonial={testimonial}
                variant={index % 2 === 0 ? 'primary' : 'secondary'}
              />
            ))}
          </div>
        </div>
        
        {/* 第二行 - 从左向右滚动 */}
        <div className="overflow-hidden py-4">
          <div className="flex animate-marquee-right">
            {secondRow.map((testimonial, index) => (
              <TestimonialCard
                key={`row2-${index}`}
                testimonial={testimonial}
                variant={index % 2 === 0 ? 'secondary' : 'primary'}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* 背景装饰 */}
      <div className="absolute -top-20 right-0 w-96 h-96 bg-blue-50 rounded-full translate-x-1/2 -translate-y-1/3 opacity-50"></div>
      <div className="absolute -bottom-20 left-0 w-96 h-96 bg-indigo-50 rounded-full -translate-x-1/2 translate-y-1/3 opacity-50"></div>
    </section>
  );
};

export default TestimonialsSection; 
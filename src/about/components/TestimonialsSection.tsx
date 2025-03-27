import React from 'react';

// 扩展评价数据，确保有足够多的卡片实现流畅滚动效果
const testimonials = [
  {
    quote: "DrawSee彻底改变了我的思考方式，不再局限于线性对话，每次提问都能引发新的思路。特别适合需要多角度分析的工作。",
    author: "李远",
    title: "产品经理",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    quote: "作为一名研究生，DrawSee帮助我组织和拓展研究思路，树状结构让知识连接更加直观。推理解题模式对论文写作特别有帮助。",
    author: "张明",
    title: "计算机科学研究生",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    quote: "网页生成模式太神奇了，我只需描述想要的页面，DrawSee就能生成可预览的HTML。对于快速制作原型非常实用。",
    author: "王睿",
    title: "UI设计师",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg"
  },
  {
    quote: "目标解析模式帮我把复杂项目拆解成可管理的任务，节省了大量规划时间。多模型支持也让回答更加精准。",
    author: "陈思",
    title: "项目管理师",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg"
  },
  {
    quote: "昭析DrawSee的直观视觉化让我能轻松理解复杂概念，极大提高了学习效率。",
    author: "刘芳",
    title: "高中教师",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg"
  },
  {
    quote: "作为一名技术主管，我发现DrawSee极大提高了团队的创意讨论效率，尤其是在远程工作情境下。",
    author: "赵强",
    title: "技术主管",
    avatar: "https://randomuser.me/api/portraits/men/55.jpg"
  },
  {
    quote: "DrawSee让我轻松规划和组织内容创作流程，大幅提升了我的工作效率和创意质量。",
    author: "孙琳",
    title: "内容创作者",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg"
  },
  {
    quote: "使用DrawSee进行头脑风暴，让我能够更全面地探索各种可能性，非常适合创意工作。",
    author: "黄伟",
    title: "广告创意总监",
    avatar: "https://randomuser.me/api/portraits/men/63.jpg"
  }
];

// 分成两组，用于两行展示
const firstRowTestimonials = [...testimonials, ...testimonials];
const secondRowTestimonials = [...testimonials.reverse(), ...testimonials.reverse()];

const TestimonialCard: React.FC<{
  testimonial: typeof testimonials[0],
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
            {secondRowTestimonials.map((testimonial, index) => (
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
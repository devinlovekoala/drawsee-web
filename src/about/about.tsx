import { useEffect, useState, useRef } from "react";

// 导入样式
import "./styles/animations.css";

// 组件导入
import NavBar from "./components/NavBar.tsx";
import HeroSection from "./components/HeroSection.tsx";
import FeaturesSection from "./components/FeaturesSection.tsx";
import TreeVisualSection from "./components/TreeVisualSection.tsx";
import AgentModesSection from "./components/AgentModesSection.tsx";
import BenefitsSection from "./components/BenefitsSection.tsx";
import TestimonialsSection from "./components/TestimonialsSection.tsx";
import JoinCommunitySection from "./components/JoinCommunitySection.tsx";
import CtaSection from "./components/CtaSection.tsx";
import Footer from "./components/Footer.tsx";

function About() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const aboutRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // 页面加载动画
    setIsLoaded(true);
    
    // 添加平滑滚动效果
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(this: HTMLAnchorElement, e: Event) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (!href) return;
        
        const targetElement = document.querySelector(href);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.getBoundingClientRect().top + window.scrollY,
            behavior: 'smooth'
          });
        }
      });
    });
    
    // 高级页面滚动监听器进行视差效果和动画触发
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // 视差效果
      const parallaxElements = document.querySelectorAll('.parallax');
      parallaxElements.forEach((el) => {
        const element = el as HTMLElement;
        const speed = element.dataset.speed || "0.1";
        const yPos = -(window.scrollY * parseFloat(speed));
        element.style.transform = `translateY(${yPos}px)`;
      });
      
      // 滚动触发动画
      const animateElements = document.querySelectorAll('.animate-on-scroll');
      animateElements.forEach((el) => {
        const element = el as HTMLElement;
        // 当元素进入视口时添加动画类
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('animate-fade-in-up');
          element.classList.remove('opacity-0');
        }
      });
      
      // 高级渐变背景效果
      if (aboutRef.current) {
        const sections = aboutRef.current.querySelectorAll('section');
        sections.forEach((section) => {
          const rect = section.getBoundingClientRect();
          const isInView = rect.top < window.innerHeight && rect.bottom > 0;
          
          if (isInView) {
            const progress = 1 - (rect.top / window.innerHeight);
            const opacity = Math.min(0.1, Math.max(0.05, progress * 0.15));
            
            // 为每个部分添加动态背景效果
            if (section.classList.contains('bg-gradient-section')) {
              section.style.setProperty('--gradient-opacity', opacity.toString());
            }
          }
        });
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // 初始化加载时执行一次
    handleScroll();
    
    // 添加鼠标移动磁性效果
    const handleMouseMove = (e: MouseEvent) => {
      const magneticElements = document.querySelectorAll('.magnetic');
      
      magneticElements.forEach(el => {
        const element = el as HTMLElement;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distanceX = (e.clientX - centerX) / 8;
        const distanceY = (e.clientY - centerY) / 8;
        
        const dist = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        // 只在鼠标接近时应用效果
        if (dist < 100) {
          element.style.transform = `translate(${distanceX}px, ${distanceY}px)`;
        } else {
          element.style.transform = 'translate(0, 0)';
        }
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return (
    <div 
      ref={aboutRef}
      className={`about-page transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* 固定顶部导航 */}
      <NavBar />
      
      {/* 主页部分 */}
      <main className="relative overflow-hidden">
        {/* 背景装饰 - 整个页面的装饰元素 */}
        <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
          {/* 移动的渐变球体 */}
          <div 
            className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-50/20 to-indigo-100/20 blur-3xl"
            style={{
              transform: `translate(${scrollY * 0.05}px, ${scrollY * -0.02}px)`,
              transition: 'transform 0.5s cubic-bezier(0.215, 0.61, 0.355, 1)'
            }}
          ></div>
          <div 
            className="absolute -bottom-40 -left-20 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-50/20 to-pink-100/20 blur-3xl"
            style={{
              transform: `translate(${scrollY * -0.03}px, ${scrollY * 0.01}px)`,
              transition: 'transform 0.5s cubic-bezier(0.215, 0.61, 0.355, 1)'
            }}
          ></div>
        </div>
        
        {/* 镂空网格背景 */}
        <div className="fixed inset-0 -z-10 bg-white bg-opacity-60 backdrop-blur-3xl pointer-events-none"></div>
        <div className="fixed inset-0 -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiNmMWY1ZjkiIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzFhMSAxIDAgMTEwLTIgMSAxIDAgMDEwIDJ6bTEwIDExYTEgMSAwIDExMC0yIDEgMSAwIDAxMCAyem0tMjAgMGExIDEgMCAxMTAtMiAxIDEgMCAwMTAgMnptMTAtMTBhMSAxIDAgMTEwLTIgMSAxIDAgMDEwIDJ6bTEwLTEwYTEgMSAwIDExMC0yIDEgMSAwIDAxMCAyem0tMjAgMGExIDEgMCAxMTAtMiAxIDEgMCAwMTAgMnoiIGZpbGw9IiNlMmU4ZjAiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvZz48L3N2Zz4=')] opacity-5 pointer-events-none"></div>
        
        {/* 主要内容部分 */}
        <HeroSection />
        
        <div className="bg-gradient-section relative py-10" style={{ "--gradient-opacity": "0.05" } as React.CSSProperties}>
          <FeaturesSection />
        </div>
        
        <div className="relative bg-white z-10">
          <TreeVisualSection />
        </div>
        
        <div className="bg-gradient-section relative py-10" style={{ "--gradient-opacity": "0.05" } as React.CSSProperties}>
          <AgentModesSection />
        </div>
        
        <div className="relative bg-white z-10">
          <BenefitsSection />
        </div>
        
        <div className="bg-gradient-section relative py-10" style={{ "--gradient-opacity": "0.05" } as React.CSSProperties}>
          <TestimonialsSection />
        </div>
        
        {/* 共建者部分 */}
        <div className="relative bg-white z-10">
          <JoinCommunitySection />
        </div>
        
        {/* 交互式CTA部分 */}
        <div className="relative bg-white z-10">
          <CtaSection />
        </div>
        
        {/* 页脚 */}
        <Footer />
        
        {/* 返回顶部按钮 */}
        <button
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          className={`fixed right-6 bottom-6 z-50 p-3 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 transform hover:scale-110 ${
            scrollY > 300 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </main>
    </div>
  );
}

export default About;

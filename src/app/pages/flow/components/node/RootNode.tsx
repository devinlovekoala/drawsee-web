import {Handle, Position} from '@xyflow/react';
import { ExtendedNodeProps } from './base/BaseNode';
import { useEffect, useRef } from 'react';
import { ROOT_NODE_SIZE, ROOT_NODE_SVG_SIZE } from '@/app/pages/flow/constants'; // 导入常量

function RootNode({ showSourceHandle = true, selected }: ExtendedNodeProps<'root'>) {
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // 处理光波效果
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置canvas尺寸
    const updateCanvasSize = () => {
      canvas.width = ROOT_NODE_SIZE; // 使用常量
      canvas.height = ROOT_NODE_SIZE; // 使用常量
    };
    
    updateCanvasSize();
    
    // 绘制波纹动画
    const ripples: Array<{radius: number, opacity: number, speed: number}> = [];
    
    // 添加初始波纹，增加初始半径和速度
    ripples.push({ radius: 50, opacity: 0.7, speed: 0.6 }); // 增加波纹的初始半径和透明度
    
    // 动画函数
    const animate = () => {
      if (!ctx) return;
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // 绘制所有波纹
      ripples.forEach((ripple, index) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = selected 
          ? `rgba(79, 70, 229, ${ripple.opacity})` 
          : `rgba(59, 130, 246, ${ripple.opacity})`;
        ctx.lineWidth = 3; // 增加波纹线宽
        ctx.stroke();
        
        // 更新波纹
        ripple.radius += ripple.speed;
        ripple.opacity -= 0.005;
        
        // 如果波纹完全透明或太大，删除它
        if (ripple.opacity <= 0 || ripple.radius > 100) { // 增加波纹最大半径
          ripples.splice(index, 1);
        }
      });
      
      // 随机添加新波纹
      if (Math.random() < 0.2 && ripples.length < 5) { // 增加最大波纹数量
        ripples.push({ 
          radius: 60, // 增加新波纹的初始半径
          opacity: Math.random() * 0.3 + 0.3, // 增加新波纹的透明度
          speed: Math.random() * 0.4 // 增加新波纹的速度
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // 启动动画
    animationRef.current = requestAnimationFrame(animate);
    
    // 清理函数
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [selected]);
  
  return (
    <div className="root-node-container" style={{ width: ROOT_NODE_SIZE, height: ROOT_NODE_SIZE }}> {/* 使用常量 */}
      <canvas 
        ref={canvasRef} 
        className={`root-node-canvas ${selected ? 'selected' : ''}`}
        style={{ width: `${ROOT_NODE_SIZE}px`, height: `${ROOT_NODE_SIZE}px` }} // 使用常量
      />
      <div 
        className={`root-node ${selected ? 'root-node-selected' : ''}`}
        style={{ 
          width: `${ROOT_NODE_SIZE-60}px`, height: `${ROOT_NODE_SIZE-60}px`,
          //transform: 'translate(20px, 20px)'
        }} // 使用常量
      >
        <div className="root-node-inner">
          <div className="root-node-glow"></div>
          <RootSvg className={`root-node-icon ${selected ? 'selected' : 'default'}`} />
        </div>
        {showSourceHandle && (
          <Handle 
            type="source" 
            position={Position.Right} 
            className={`node-handle ${selected ? 'selected' : ''}`}
          />
        )}
      </div>
    </div>
  );
}

const RootSvg = ({className}: {className: string}) => {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"
         strokeLinejoin="round" className={className}
         height={ROOT_NODE_SVG_SIZE} width={ROOT_NODE_SVG_SIZE} xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3v12"></path>
      <path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
      <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
      <path d="M15 6a9 9 0 0 0-9 9"></path>
      <path d="M18 15v6"></path>
      <path d="M21 18h-6"></path>
    </svg>
  );
};

export default RootNode;

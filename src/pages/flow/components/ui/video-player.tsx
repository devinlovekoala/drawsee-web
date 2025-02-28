import React, { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
    taskId: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ taskId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [frameQueue, setFrameQueue] = useState<string[]>([]);
    const frameIndexRef = useRef(0);

    useEffect(() => {
        const eventSource = new EventSource(`/flow/animation?taskId=${taskId}`);
        const newFrames: string[] = [];

        eventSource.onmessage = (event) => {
            const frameData = event.data; // 后端传来的 Base64 图片数据
            newFrames.push(frameData);

            // 只保留有限长度，防止内存溢出
            if (newFrames.length > 300) {
                newFrames.shift();
            }

            setFrameQueue([...newFrames]);
        };

        eventSource.onerror = () => {
            console.error("SSE connection error.");
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [taskId]);

    useEffect(() => {
        if (!canvasRef.current || frameQueue.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        let animationFrameId: ReturnType<typeof setTimeout>;
        const fps = 30;
        const frameInterval = 1000 / fps;

        const renderFrame = () => {
            if (frameIndexRef.current < frameQueue.length) {
                const img = new Image();
                img.src = `data:image/jpeg;base64,${frameQueue[frameIndexRef.current]}`;
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
                frameIndexRef.current++;
            }

            animationFrameId = setTimeout(renderFrame, frameInterval);
        };

        renderFrame();

        return () => clearTimeout(animationFrameId);
    }, [frameQueue]);

    return <canvas ref={canvasRef} width={640} height={360} />;
};

export default VideoPlayer;

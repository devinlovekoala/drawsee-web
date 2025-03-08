import { useEffect } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";

export const useSSE = (url: string, onMessage: (data: any) => void) => {
    useEffect(() => {
        if (!url) return;

        const eventSource = new EventSourcePolyfill(url);

        eventSource.onmessage = (event: { data: string; }) => {
            const parsedData = JSON.parse(event.data);
            onMessage(parsedData);
        };

        eventSource.onerror = () => {
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [url, onMessage]);
};

export default useSSE;

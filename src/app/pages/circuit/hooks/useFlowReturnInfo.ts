import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FlowLocationState } from '@/app/contexts/FlowContext';
import { FLOW_RETURN_INFO_KEY, FLOW_RETURN_INFO_TTL } from '@/common/constant/storage-key.constant';

/**
 * 解析并维护“返回会话”所需的convId
 */
export function useFlowReturnInfo() {
  const location = useLocation();
  const [convId, setConvId] = useState<number | null>(null);

  useEffect(() => {
    const locationState = location.state as (FlowLocationState & { fromFlow?: boolean }) | null | undefined;
    const stateConvId = typeof locationState?.convId === 'number' ? locationState?.convId : null;

    if (stateConvId) {
      sessionStorage.setItem(
        FLOW_RETURN_INFO_KEY,
        JSON.stringify({
          convId: stateConvId,
          ts: Date.now(),
          from: location.pathname
        })
      );
      setConvId(stateConvId);
      return;
    }

    const storedRaw = sessionStorage.getItem(FLOW_RETURN_INFO_KEY);
    if (!storedRaw) {
      setConvId(null);
      return;
    }

    try {
      const stored = JSON.parse(storedRaw) as { convId?: number | string; ts?: number };
      const storedTs = typeof stored.ts === 'number' ? stored.ts : 0;
      if (storedTs && Date.now() - storedTs > FLOW_RETURN_INFO_TTL) {
        sessionStorage.removeItem(FLOW_RETURN_INFO_KEY);
        setConvId(null);
        return;
      }
      const parsedConvId = typeof stored.convId === 'number'
        ? stored.convId
        : typeof stored.convId === 'string'
          ? parseInt(stored.convId, 10)
          : NaN;
      if (!parsedConvId || Number.isNaN(parsedConvId)) {
        setConvId(null);
        return;
      }
      setConvId(parsedConvId);
    } catch (error) {
      console.error('Failed to parse flow return info', error);
      sessionStorage.removeItem(FLOW_RETURN_INFO_KEY);
      setConvId(null);
    }
  }, [location]);

  return convId;
}

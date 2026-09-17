import { useQueue as useQueueCtx } from '../context/QueueContext';

// Keeps queue consumers independent from the concrete context import path.
export const useQueue = () => {
  return useQueueCtx();
};

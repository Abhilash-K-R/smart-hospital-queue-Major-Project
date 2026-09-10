import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEMO_PATIENT } from '../utils/constants';
import { queueService } from '../services/queueService';

// Shares the live queue model and demo controls between queue-related screens.
const QueueContext = createContext();

// Provides queue state, automatic progression, and manual simulation actions.
export const QueueProvider = ({ children }) => {
  const [queueState, setQueueState] = useState({
    tokenNumber: DEMO_PATIENT.tokenNumber,
    numericToken: DEMO_PATIENT.numericToken,
    currentToken: DEMO_PATIENT.currentToken,
    patientsAhead: DEMO_PATIENT.patientsAhead,
    estimatedWaitMinutes: DEMO_PATIENT.estimatedWaitMinutes,
    doctor: DEMO_PATIENT.doctor,
    department: DEMO_PATIENT.department,
    roomNo: DEMO_PATIENT.roomNo,
    emergencyCount: DEMO_PATIENT.emergencyInsertedCount,
    lastUpdated: new Date().toLocaleTimeString(),
    isAutoRefresh: true,
    leaveAfterMinutes: DEMO_PATIENT.leaveAfterMinutes,
    trafficDurationMinutes: DEMO_PATIENT.trafficDurationMinutes
  });

  // Fetches live queue status from FastAPI backend
  const fetchQueueData = useCallback(async (token = queueState.tokenNumber) => {
    try {
      const data = await queueService.getQueueStatus(token);
      if (data && (data.tokenNumber || data.currentToken)) {
        setQueueState(prev => ({
          ...prev,
          tokenNumber: data.tokenNumber || prev.tokenNumber,
          numericToken: data.numericToken ?? prev.numericToken,
          currentToken: data.currentToken ?? prev.currentToken,
          patientsAhead: data.patientsAhead ?? prev.patientsAhead,
          estimatedWaitMinutes: data.estimatedWaitMinutes ?? prev.estimatedWaitMinutes,
          doctor: data.doctor || prev.doctor,
          department: data.department || prev.department,
          roomNo: data.roomNo || prev.roomNo,
          emergencyCount: data.emergencyCount ?? prev.emergencyCount,
          lastUpdated: data.lastUpdated || new Date().toLocaleTimeString()
        }));
        return;
      }
    } catch (err) {
      console.warn("Queue sync from backend failed, falling back to local state:", err.message);
    }
  }, [queueState.tokenNumber]);

  // Initial load
  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  // Auto Refresh Queue every 30 seconds
  useEffect(() => {
    if (!queueState.isAutoRefresh) return;

    const interval = setInterval(() => {
      fetchQueueData();
    }, 30000); // 30s auto refresh

    return () => clearInterval(interval);
  }, [queueState.isAutoRefresh, fetchQueueData]);

  // Insert Emergency Patient
  const triggerEmergency = () => {
    setQueueState(prev => ({
      ...prev,
      emergencyCount: prev.emergencyCount + 1,
      estimatedWaitMinutes: prev.estimatedWaitMinutes + 5,
      lastUpdated: new Date().toLocaleTimeString()
    }));
  };

  // Toggle Auto Refresh
  const toggleAutoRefresh = () => {
    setQueueState(prev => ({ ...prev, isAutoRefresh: !prev.isAutoRefresh }));
  };

  // Advance Queue Manually
  const advanceQueue = () => {
    setQueueState(prev => {
      const nextCurrent = Math.min(prev.numericToken, prev.currentToken + 1);
      const nextAhead = Math.max(0, prev.numericToken - nextCurrent);
      return {
        ...prev,
        currentToken: nextCurrent,
        patientsAhead: nextAhead,
        estimatedWaitMinutes: nextAhead * 4,
        lastUpdated: new Date().toLocaleTimeString()
      };
    });
  };

  return (
    <QueueContext.Provider value={{ queueState, setQueueState, triggerEmergency, toggleAutoRefresh, advanceQueue }}>
      {children}
    </QueueContext.Provider>
  );
};

// Reads queue state from the nearest queue provider.
export const useQueue = () => useContext(QueueContext);

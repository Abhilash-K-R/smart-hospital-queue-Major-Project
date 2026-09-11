import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEMO_PATIENT } from '../utils/constants';
import { queueService } from '../services/queueService';
import { useAuth } from './AuthContext';

// Shares the live queue model and demo controls between queue-related screens.
const QueueContext = createContext();

// Provides queue state, automatic progression, and manual simulation actions.
export const QueueProvider = ({ children }) => {
  const { user } = useAuth();

  const [queueState, setQueueState] = useState(() => {
    const active = user || DEMO_PATIENT;
    return {
      tokenNumber: active.tokenNumber || DEMO_PATIENT.tokenNumber,
      numericToken: active.numericToken || DEMO_PATIENT.numericToken,
      currentToken: active.currentToken || DEMO_PATIENT.currentToken,
      patientsAhead: active.patientsAhead ?? DEMO_PATIENT.patientsAhead,
      estimatedWaitMinutes: active.estimatedWaitMinutes ?? DEMO_PATIENT.estimatedWaitMinutes,
      doctor: active.doctor || DEMO_PATIENT.doctor,
      department: active.department || DEMO_PATIENT.department,
      roomNo: active.roomNo || DEMO_PATIENT.roomNo,
      emergencyCount: active.emergencyInsertedCount || 0,
      lastUpdated: new Date().toLocaleTimeString(),
      isAutoRefresh: true,
      leaveAfterMinutes: active.leaveAfterMinutes || DEMO_PATIENT.leaveAfterMinutes,
      trafficDurationMinutes: active.trafficDurationMinutes || DEMO_PATIENT.trafficDurationMinutes
    };
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

  // Sync state when user changes (e.g. after booking new appointment)
  useEffect(() => {
    if (user && user.tokenNumber) {
      setQueueState(prev => ({
        ...prev,
        tokenNumber: user.tokenNumber,
        numericToken: user.numericToken ?? prev.numericToken,
        currentToken: user.currentToken ?? prev.currentToken,
        patientsAhead: user.patientsAhead ?? prev.patientsAhead,
        estimatedWaitMinutes: user.estimatedWaitMinutes ?? prev.estimatedWaitMinutes,
        doctor: user.doctor || prev.doctor,
        department: user.department || prev.department,
        roomNo: user.roomNo || prev.roomNo,
      }));
      fetchQueueData(user.tokenNumber);
    }
  }, [user, fetchQueueData]);

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

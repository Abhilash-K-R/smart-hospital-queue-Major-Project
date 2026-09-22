import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEMO_PATIENT } from '../utils/constants';
import { queueService } from '../services/queueService';
import { patientService } from '../services/patientService';
import { useAuth } from './AuthContext';

// Shares the live queue model and demo controls between queue-related screens.
const QueueContext = createContext();

// Provides queue state, automatic progression, and manual simulation actions.
export const QueueProvider = ({ children }) => {
  const { user, setUser } = useAuth();

  const [queueState, setQueueState] = useState(() => {
    const activeTok = user?.tokenNumber || (user?.appointment_id ? `OPD-${String(user.appointment_id).padStart(3, '0')}` : null);
    const hasToken = Boolean(activeTok);
    return {
      hasActiveToken: hasToken,
      tokenNumber: activeTok,
      numericToken: user?.numericToken || (user?.appointment_id ? Number(user.appointment_id) : null),
      currentToken: user?.currentToken || null,
      patientsAhead: user?.patientsAhead || 0,
      estimatedWaitMinutes: user?.estimatedWaitMinutes || 0,
      doctor: user?.doctor || "General Medicine • OPD Hub",
      doctorId: user?.doctorId ? Number(String(user.doctorId).replace(/\D/g, '')) : (user?.doctor_id || 3),
      department: user?.department || "General Medicine",
      roomNo: user?.roomNo || "Room 204",
      emergencyCount: user?.emergencyInsertedCount || 0,
      lastUpdated: new Date().toLocaleTimeString(),
      isAutoRefresh: true,
      leaveAfterMinutes: user?.leaveAfterMinutes || 0,
      trafficDurationMinutes: user?.trafficDurationMinutes || 0
    };
  });

  // Fetches live queue status from FastAPI backend for active token
  const fetchQueueData = useCallback(async (token = queueState.tokenNumber) => {
    if (!token) {
      // Check if user has an active appointment in backend
      if (user && user.phone) {
        try {
          const res = await queueService.getDoctorQueueStream(queueState.doctorId || 3);
          if (res) {
            setQueueState(prev => ({
              ...prev,
              currentToken: res.servingToken || prev.currentToken,
              doctor: res.doctorName || prev.doctor,
              lastUpdated: new Date().toLocaleTimeString()
            }));
          }
        } catch {}
      }
      return;
    }

    try {
      const data = await queueService.getQueueStatus(token);
      if (data && (data.tokenNumber || data.currentToken)) {
        setQueueState(prev => ({
          ...prev,
          hasActiveToken: true,
          tokenNumber: data.tokenNumber || prev.tokenNumber,
          numericToken: data.numericToken ?? prev.numericToken,
          currentToken: data.currentToken || prev.currentToken,
          patientsAhead: data.patientsAhead ?? prev.patientsAhead,
          estimatedWaitMinutes: data.estimatedWaitMinutes ?? prev.estimatedWaitMinutes,
          doctor: data.doctor || prev.doctor,
          department: data.department || prev.department,
          roomNo: data.roomNo || prev.roomNo,
          emergencyCount: data.emergencyCount ?? prev.emergencyCount,
          lastUpdated: data.lastUpdated || new Date().toLocaleTimeString()
        }));
      }
    } catch (err) {
      console.warn("Queue sync failed:", err.message);
    }
  }, [queueState.tokenNumber, queueState.doctorId, user]);

  // Sync state when user logs in or books a new appointment
  useEffect(() => {
    if (user && user.tokenNumber) {
      setQueueState(prev => ({
        ...prev,
        hasActiveToken: true,
        tokenNumber: user.tokenNumber,
        numericToken: user.numericToken ?? prev.numericToken,
        currentToken: user.currentToken ?? prev.currentToken,
        patientsAhead: user.patientsAhead ?? prev.patientsAhead,
        estimatedWaitMinutes: user.estimatedWaitMinutes ?? prev.estimatedWaitMinutes,
        doctor: user.doctor || prev.doctor,
        doctorId: user.doctorId ? Number(String(user.doctorId).replace(/\D/g, '')) : (user.doctor_id || 3),
        department: user.department || prev.department,
        roomNo: user.roomNo || prev.roomNo,
      }));
      fetchQueueData(user.tokenNumber);
    } else if (user) {
      // User is logged in but tokenNumber is not in memory - check backend /appointments/me
      const checkBackend = async () => {
        try {
          const myAppts = await patientService.getMyAppointments(user.phone);
          if (Array.isArray(myAppts) && myAppts.length > 0) {
            // Find most recent active appointment (pending or serving)
            const active = myAppts.find(a => a.status === 'pending' || a.status === 'serving');
            if (active) {
              const allocatedToken = active.tokenNumber || (active.numericToken ? `OPD-${String(active.numericToken).padStart(3, '0')}` : `OPD-${String(active.id).padStart(3, '0')}`);
              setQueueState(prev => ({
                ...prev,
                hasActiveToken: true,
                isExpired: false,
                status: active.status,
                tokenNumber: allocatedToken,
                numericToken: active.numericToken || active.id,
                patientsAhead: active.patientsAhead ?? prev.patientsAhead,
                estimatedWaitMinutes: active.estimatedWaitMinutes ?? prev.estimatedWaitMinutes,
                doctor: active.doctor || prev.doctor,
                doctorId: active.doctor_id || prev.doctorId,
                department: active.department || prev.department,
                roomNo: active.roomNo || prev.roomNo,
                timeSlot: active.time_slot,
                appointmentDate: active.appointment_date
              }));
              fetchQueueData(allocatedToken);
              return;
            }

            // Check if there is an expired or completed slot
            const recent = myAppts[0];
            if (recent && (recent.status === 'expired' || recent.status === 'completed')) {
              const allocatedToken = recent.tokenNumber || (recent.numericToken ? `OPD-${String(recent.numericToken).padStart(3, '0')}` : `OPD-${String(recent.id).padStart(3, '0')}`);
              setQueueState(prev => ({
                ...prev,
                hasActiveToken: true,
                isExpired: recent.status === 'expired',
                status: recent.status,
                tokenNumber: allocatedToken,
                numericToken: recent.numericToken || recent.id,
                currentToken: recent.status === 'expired' ? "OPD-CLOSED" : allocatedToken,
                patientsAhead: 0,
                estimatedWaitMinutes: 0,
                doctor: recent.doctor || prev.doctor,
                doctorId: recent.doctor_id || prev.doctorId,
                department: recent.department || prev.department,
                roomNo: recent.roomNo || prev.roomNo,
                timeSlot: recent.time_slot,
                appointmentDate: recent.appointment_date
              }));
              return;
            }
          }
          // No active appointment found
          const docStream = await queueService.getDoctorQueueStream(3);
          setQueueState(prev => ({
            ...prev,
            hasActiveToken: false,
            isExpired: false,
            status: 'none',
            tokenNumber: null,
            numericToken: null,
            currentToken: docStream?.servingToken || null,
            patientsAhead: 0,
            estimatedWaitMinutes: 0,
            doctor: "General Medicine • OPD Hub",
            department: "General Medicine",
            roomNo: "Room 204"
          }));
        } catch {
          setQueueState(prev => ({
            ...prev,
            hasActiveToken: false,
            isExpired: false,
            status: 'none',
            tokenNumber: null,
            numericToken: null
          }));
        }
      };
      checkBackend();
    } else {
      setQueueState(prev => ({
        ...prev,
        hasActiveToken: false,
        tokenNumber: null,
        numericToken: null,
        currentToken: null,
        patientsAhead: 0,
        estimatedWaitMinutes: 0,
        doctor: "General Medicine • OPD Hub",
        department: "General Medicine",
        roomNo: "Room 204"
      }));
    }
  }, [user, fetchQueueData]);

  // Auto Refresh Queue every 5-10 seconds for real-time synchronization with staff
  useEffect(() => {
    if (!queueState.isAutoRefresh) return;

    const interval = setInterval(() => {
      fetchQueueData();
    }, 5000); // 5s auto refresh

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
      const nextCurrent = Math.min(prev.numericToken || 1, (prev.currentToken ? parseInt(String(prev.currentToken).replace(/\D/g, '')) : 1) + 1);
      const nextAhead = Math.max(0, (prev.numericToken || 1) - nextCurrent);
      return {
        ...prev,
        currentToken: `OPD-${String(nextCurrent).padStart(3, '0')}`,
        patientsAhead: nextAhead,
        estimatedWaitMinutes: nextAhead * 4,
        lastUpdated: new Date().toLocaleTimeString()
      };
    });
  };

  return (
    <QueueContext.Provider value={{ queueState, setQueueState, fetchQueueData, triggerEmergency, toggleAutoRefresh, advanceQueue }}>
      {children}
    </QueueContext.Provider>
  );
};

// Reads queue state from the nearest queue provider.
export const useQueue = () => useContext(QueueContext);

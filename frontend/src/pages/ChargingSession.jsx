import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaBolt, FaClock, FaWallet, FaPlug, FaPowerOff, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const ChargingSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [energyConsumed, setEnergyConsumed] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [endTime, setEndTime] = useState(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalCo2, setTotalCo2] = useState(0);
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const powerRate = 50;
  const pricePerKwh = 12;

  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      try {
        const docRef = doc(db, 'chargingSessions', sessionId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSession({ id: docSnap.id, ...data });
          
          if (data.startTime?.toDate) {
            setStartTimestamp(data.startTime.toDate().getTime());
          }
          
          if (data.status === 'completed') {
            setIsActive(false);
            setEndTime(data.endTime?.toDate?.() || null);
            setTotalDuration(data.duration || 0);
            setTotalEnergy(data.energyConsumed || 0);
            setTotalCost(data.amount || 0);
            setTotalCo2(data.co2Saved || 0);
          } else {
            setIsActive(true);
            setElapsedSeconds(data.duration || 0);
            setEnergyConsumed(data.energyConsumed || 0);
            setCurrentCost(data.amount || 0);
          }
        } else {
          alert('❌ Session not found.');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
      setLoading(false);
    };
    
    fetchSession();
  }, [sessionId]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    
    if (isActive && startTimestamp) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTimestamp) / 1000);
        
        const hours = elapsed / 3600;
        const energy = powerRate * hours;
        const cost = energy * pricePerKwh;

        setElapsedSeconds(elapsed);
        setEnergyConsumed(parseFloat(energy.toFixed(2)));
        setCurrentCost(parseFloat(cost.toFixed(2)));

        // Calculate remaining time
        if (session?.startTime?.toDate && session?.duration) {
          const endTimeMs = session.startTime.toDate().getTime() + (session.duration || 60) * 60000;
          const remaining = Math.max(0, Math.floor((endTimeMs - now) / 1000));
          setRemainingSeconds(remaining);
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, startTimestamp, session]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const endCharging = async () => {
    if (window.confirm('Are you sure you want to end this charging session?')) {
      setEnding(true);
      try {
        const sessionRef = doc(db, 'chargingSessions', sessionId);
        const finalEnergy = energyConsumed;
        const finalCost = currentCost;
        const finalCo2 = energyConsumed * 0.28;
        const finalDuration = elapsedSeconds;
        
        await updateDoc(sessionRef, {
          endTime: serverTimestamp(),
          status: 'completed',
          duration: finalDuration,
          energyConsumed: finalEnergy,
          amount: finalCost,
          co2Saved: finalCo2
        });
        
        alert('✅ Charging session ended successfully!');
        navigate('/history');
      } catch (error) {
        alert('❌ Error ending session: ' + error.message);
        setEnding(false);
      }
    }
  };

  const progress = Math.min((elapsedSeconds / 7200) * 100, 100);

  const formatRemaining = (seconds) => {
    if (seconds <= 0) return 'Completed';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) return (
    <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
      <div className="spinner"></div>
      <p>Loading session...</p>
    </div>
  );
  
  if (!session) return (
    <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
      <h2>❌ Session Not Found</h2>
      <button className="btn btn-primary" onClick={() => navigate('/history')}>
        Back to History
      </button>
    </div>
  );

  return (
    <div className="charging-session">
      <div className="container" style={{ padding: '40px 0' }}>
        <h1 className="page-title">⚡ Charging Session</h1>
        <p className="session-id">Session #{sessionId}</p>

        <div className="session-card">
          <div className="session-header">
            <FaBolt className="session-icon" />
            <h2>{session.stationName || 'Charging Station'}</h2>
            <span className={`status-badge ${isActive ? 'active' : 'completed'}`}>
              {isActive ? '🔴 Charging' : '✅ Completed'}
            </span>
          </div>

          {isActive ? (
            <>
              <div className="timer-display">
                <div className="timer-icon"><FaClock /></div>
                <div className="timer-time">{formatTime(elapsedSeconds)}</div>
                <div className="timer-label">Elapsed Time</div>
              </div>

              <div className="remaining-display">
                <span className="remaining-label">⏳ Remaining Time:</span>
                <span className="remaining-value">{formatRemaining(remainingSeconds)}</span>
              </div>

              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-label">{progress.toFixed(0)}% complete</div>

              <div className="live-stats">
                <div className="stat-item">
                  <FaBolt className="stat-icon" />
                  <div>
                    <span className="stat-label">Energy Consumed</span>
                    <span className="stat-value">{energyConsumed} kWh</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FaWallet className="stat-icon" />
                  <div>
                    <span className="stat-label">Current Cost</span>
                    <span className="stat-value">₹{currentCost}</span>
                  </div>
                </div>
                <div className="stat-item">
                  <FaPlug className="stat-icon" />
                  <div>
                    <span className="stat-label">Power Rate</span>
                    <span className="stat-value">{powerRate} kW</span>
                  </div>
                </div>
              </div>

              <div className="session-details">
                <div className="detail-item">
                  <span className="detail-label">Charger</span>
                  <span className="detail-value">{session.chargerType || 'CCS'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Start Time</span>
                  <span className="detail-value">
                    {session.startTime?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Scheduled End</span>
                  <span className="detail-value" style={{ color: '#dc3545', fontWeight: 'bold' }}>
                    {session.startTime?.toDate?.() && session.duration ? 
                      new Date(session.startTime.toDate().getTime() + (session.duration || 60) * 60000).toLocaleTimeString() 
                      : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">{session.duration || 0} min</span>
                </div>
              </div>

              <button 
                className="btn btn-danger btn-full"
                onClick={endCharging}
                disabled={ending}
              >
                <FaPowerOff /> {ending ? 'Ending...' : 'End Charging'}
              </button>
            </>
          ) : (
            <>
              <div className="completed-summary">
                <FaCheckCircle className="completed-icon" />
                <h3>Charging Completed!</h3>
                <div className="completed-stats">
                  <div className="completed-stat">
                    <span className="completed-label">Total Duration</span>
                    <span className="completed-value">{formatTime(totalDuration)}</span>
                  </div>
                  <div className="completed-stat">
                    <span className="completed-label">Total Energy</span>
                    <span className="completed-value">{totalEnergy} kWh</span>
                  </div>
                  <div className="completed-stat">
                    <span className="completed-label">Total Cost</span>
                    <span className="completed-value">₹{totalCost}</span>
                  </div>
                  <div className="completed-stat">
                    <span className="completed-label">CO₂ Saved</span>
                    <span className="completed-value">{totalCo2} kg</span>
                  </div>
                </div>
                <div className="session-details">
                  <div className="detail-item">
                    <span className="detail-label">Start Time</span>
                    <span className="detail-value">
                      {session.startTime?.toDate?.()?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">End Time</span>
                    <span className="detail-value">
                      {endTime ? formatDate(endTime) : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Scheduled End</span>
                    <span className="detail-value">
                      {session.startTime?.toDate?.() && session.duration ? 
                        new Date(session.startTime.toDate().getTime() + (session.duration || 60) * 60000).toLocaleTimeString() 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                <button 
                  className="btn btn-primary btn-full"
                  onClick={() => navigate('/history')}
                >
                  View History
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .charging-session { padding: 20px 0; }
        .page-title { text-align: center; font-size: 36px; color: #1a1a2e; margin-bottom: 8px; }
        .session-id { text-align: center; color: #6c757d; margin-bottom: 30px; }
        
        .session-card { max-width: 550px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .session-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #e9ecef; }
        .session-icon { font-size: 30px; color: #2e7d32; }
        .session-header h2 { color: #1a1a2e; flex: 1; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-badge.active { background: #f8d7da; color: #721c24; animation: pulse 1.5s infinite; }
        .status-badge.completed { background: #d4edda; color: #155724; }
        
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

        .timer-display { text-align: center; padding: 20px 0; background: #f8f9fa; border-radius: 12px; margin-bottom: 10px; }
        .timer-icon { font-size: 24px; color: #2e7d32; }
        .timer-time { font-size: 48px; font-weight: 700; color: #1a1a2e; font-family: monospace; }
        .timer-label { font-size: 14px; color: #6c757d; }

        .remaining-display { text-align: center; padding: 10px; background: #fff3cd; border-radius: 8px; margin-bottom: 15px; }
        .remaining-label { font-size: 14px; color: #856404; }
        .remaining-value { font-size: 18px; font-weight: 700; color: #856404; }

        .progress-container { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin-bottom: 5px; }
        .progress-bar { height: 100%; background: linear-gradient(90deg, #2e7d32, #66bb6a); transition: width 1s; border-radius: 4px; }
        .progress-label { text-align: center; font-size: 12px; color: #6c757d; margin-bottom: 20px; }

        .live-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
        .stat-item { display: flex; align-items: center; gap: 10px; background: #f8f9fa; padding: 12px; border-radius: 8px; }
        .stat-icon { font-size: 20px; color: #2e7d32; }
        .stat-item div { display: flex; flex-direction: column; }
        .stat-label { font-size: 10px; color: #6c757d; text-transform: uppercase; }
        .stat-value { font-size: 16px; font-weight: 600; color: #1a1a2e; }

        .session-details { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .detail-item { text-align: center; }
        .detail-label { display: block; font-size: 10px; color: #6c757d; text-transform: uppercase; }
        .detail-value { display: block; font-size: 14px; font-weight: 600; color: #1a1a2e; }

        .btn-full { width: 100%; padding: 14px; font-size: 18px; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .btn-full:disabled { opacity: 0.6; cursor: not-allowed; }

        .completed-summary { text-align: center; }
        .completed-icon { font-size: 60px; color: #28a745; margin-bottom: 15px; }
        .completed-summary h3 { color: #1a1a2e; margin-bottom: 20px; }
        .completed-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
        .completed-stat { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .completed-label { display: block; font-size: 11px; color: #6c757d; text-transform: uppercase; }
        .completed-value { display: block; font-size: 18px; font-weight: 700; color: #1a1a2e; }

        @media (max-width: 480px) {
          .live-stats { grid-template-columns: 1fr; }
          .session-details { grid-template-columns: 2fr 2fr; }
          .completed-stats { grid-template-columns: 1fr; }
          .timer-time { font-size: 32px; }
        }
      `}</style>
    </div>
  );
};

export default ChargingSession;
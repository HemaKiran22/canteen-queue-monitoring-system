"use client";


import { useState, useEffect } from 'react';
import { 
  Users, Clock, BarChart3, Bell, Pause, Play, RefreshCw, 
  AlertTriangle, CheckCircle, History, TrendingUp,  X 
} from 'lucide-react';
import { Line } from 'react-chartjs-2';

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import {
  AlertTriangle,
  BarChart3, Bell,
  CheckCircle,
  Clock,
  History,
  Pause, Play, RefreshCw,
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import styles from './styles.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface QueueData {
  students: number;
  minWait: number;
  maxWait: number;
  timestamp: string;
}

interface AlertType {
  id: string;
  type: 'warning' | 'success' | 'info';
  message: string;
  timestamp: Date;
}

interface HistoryRecord {
  time: Date;
  students: number;
  waitTime: number;
}

export default function Home() {
  const [queueData, setQueueData] = useState<QueueData>({
    students: 0,
    minWait: 0,
    maxWait: 0,
    timestamp: "",
  });
  const [isPaused, setIsPaused] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [queueStatus, setQueueStatus] = useState('good');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [metrics, setMetrics] = useState({
    avgWait: 0,
    peakStudents: 0,
    totalServed: 0,
  });

  // Mock data for chart
  const chartData = {
    labels: ['6am', '9am', '12pm', '3pm', '6pm'],
    datasets: [
      {
        label: 'Students in Queue',
        data: [12, 19, 3, 5, 2],
        borderColor: '#3b82f6',
        tension: 0.4,
      },
    ],
  };

  useEffect(() => {
    const fetchData = async () => {
      if (isPaused) return;
      try {
        const response = await fetch('/api/queue');
        const data = await response.json();
        setQueueData(data);
        updateQueueStatus(data.students);
        updateHistory(data);
        updateMetrics(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const updateQueueStatus = (students: number) => {
    const newStatus = students <= 10 ? 'good' : students <= 20 ? 'busy' : 'full';
    setQueueStatus(newStatus);
    
    if (newStatus === 'full' && queueStatus !== 'full' && notifications) {
      setAlerts(prev => [...prev, {
        id: Date.now().toString(),
        type: 'warning',
        message: 'Queue reached full capacity!',
        timestamp: new Date()
      }]);
    }
  };

  const updateHistory = (data: QueueData) => {
    setHistory(prev => [{
      time: new Date(data.timestamp),
      students: data.students,
      waitTime: data.maxWait
    }, ...prev.slice(0, 9)]);
  };

  const updateMetrics = (data: QueueData) => {
    setMetrics(prev => ({
      avgWait: Math.round((prev.avgWait + data.maxWait) / 2),
      peakStudents: Math.max(prev.peakStudents, data.students),
      totalServed: prev.totalServed + data.students
    }));
  };

  const getStatusColor = () => {
    switch (queueStatus) {
      case 'good': return '#22c55e';
      case 'busy': return '#f59e0b';
      case 'full': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const progressPercentage = Math.min((queueData.students / 20) * 100, 100);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Canteen Queue Monitor</h1>
          <p className={styles.subtitle}>Real-time Queue Tracking & Analytics</p>
        </div>

        <div className={styles.controls}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`${styles.controlBtn} ${isPaused ? styles.resumeBtn : styles.pauseBtn}`}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`${styles.controlBtn} ${notifications ? styles.notifyOnBtn : styles.notifyOffBtn}`}
          >
            <Bell size={16} />
            {notifications ? "Notifications On" : "Off"}
          </button>
          <button onClick={() => window.location.reload()} className={`${styles.controlBtn} ${styles.refreshBtn}`}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {alerts.length > 0 && (
          <div className={styles.alertsContainer}>
            {alerts.map(a => (
              <div key={a.id} className={`${styles.alert} ${styles[`alert-${a.type}`]}`}>
                {a.type === 'warning' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                <span className={styles.alertMessage}>{a.message}</span>
                <span className={styles.alertTime}>{new Date(a.timestamp).toLocaleTimeString()}</span>
                <button onClick={() => setAlerts(prev => prev.filter(alert => alert.id !== a.id))} 
                  className={styles.alertClose}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.mainGrid}>
          <div className={styles.mainCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Queue Status</h2>
              <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor() }}>
                {queueStatus.toUpperCase()}
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <Users className={styles.statIcon} size={32} />
                <div className={styles.statValue}>{queueData.students}</div>
                <div className={styles.statLabel}>Students</div>
              </div>
              <div className={styles.statCard}>
                <Clock className={styles.statIcon} size={32} />
                <div className={styles.statValue}>{queueData.minWait} - {queueData.maxWait}s</div>
                <div className={styles.statLabel}>Wait Time</div>
              </div>
              <div className={styles.statCard}>
                <BarChart3 className={styles.statIcon} size={32} />
                <div className={styles.statValue}>{Math.round(progressPercentage)}%</div>
                <div className={styles.statLabel}>Capacity</div>
              </div>
            </div>

            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundColor: getStatusColor()
                }}
              />
            </div>

            <div className={styles.chartContainer}>
              <Line data={chartData} options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Hourly Queue Trends' }
                }
              }} />
            </div>

            <div className={styles.lastUpdated}>
              Last updated: {queueData.timestamp ? new Date(queueData.timestamp).toLocaleTimeString() : 'Never'}
              {isPaused && <span className={styles.pausedIndicator}> (PAUSED)</span>}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.analyticsCard}>
              <h3 className={styles.sectionTitle}><TrendingUp size={20} /> Analytics</h3>
              <div className={styles.metricsList}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Avg. Wait Time</span>
                  <span className={styles.metricValue}>{metrics.avgWait}s</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Peak Students</span>
                  <span className={styles.metricValue}>{metrics.peakStudents}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Total Served</span>
                  <span className={styles.metricValue}>{metrics.totalServed}</span>
                </div>
              </div>
            </div>

            <div className={styles.historyCard}>
              <h3 className={styles.sectionTitle}><History size={20} /> Recent History</h3>
              <div className={styles.historyList}>
                {history.length > 0 ? (
                  history.map((record, index) => (
                    <div key={index} className={styles.historyItem}>
                      <span className={styles.historyStudents}>{record.students} students</span>
                      <span className={styles.historyWait}>{record.waitTime}s</span>
                      <span className={styles.historyTime}>
                        {record.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={styles.noData}>No history available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

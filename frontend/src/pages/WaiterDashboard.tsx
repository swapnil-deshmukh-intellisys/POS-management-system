import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface Waiter {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  status: string;
  ordersServed: number;
  salesHandled: number;
  tableAssignments: { tableNumber: string }[];
  employeeCode?: string;
}

interface ServiceTask {
  id: string;
  orderId: string;
  tableNumber: string;
  waiterId: string | null;
  status: string; // ready, picked_up, serving, served
  assignedAt: string;
  pickedUpAt: string | null;
  servedAt: string | null;
  kitchenOrder: {
    id: string;
    notes: string | null;
    totalAmount: number;
    createdAt: string;
    items: {
      id: string;
      quantity: number;
      menuItem: {
        name: string;
        price: number;
      };
    }[];
  };
  waiter?: Waiter;
}

const stylesInject = (
  <style>{`
    @keyframes bounce-in {
      0% {
        transform: scale(0.3);
        opacity: 0;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
      70% {
        transform: scale(0.9);
        opacity: 0.9;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    .animate-bounce-in {
      animation: bounce-in 0.5s ease-out;
    }
  `}</style>
);

export const WaiterDashboard: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [currentWaiter, setCurrentWaiter] = useState<Waiter | null>(null);
  const currentWaiterRef = React.useRef<Waiter | null>(null);

  useEffect(() => {
    currentWaiterRef.current = currentWaiter;
  }, [currentWaiter]);

  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTableFilter, setSelectedTableFilter] = useState<string | null>(null);
  const [highlightedTicketId, setHighlightedTicketId] = useState<string | null>(null);
  const [timeTick, setTimeTick] = useState(0);
  const [alerts, setAlerts] = useState<{
    id: string;
    tableNumber: string;
    waiterName: string;
    items: { name: string; qty: number }[];
  }[]>([]);
  const [loading, setLoading] = useState(true);

  // Local toasts with items detail

  // Realtime connection URL
  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.protocol}//${window.location.hostname}:5000/api`;

  const playBellSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.65);
    } catch (e) {
      console.warn('Audio blocked');
    }
  };

  const playServeSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      gain1.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        gain2.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.4);
      }, 100);
    } catch (e) {
      console.warn('Audio blocked');
    }
  };

  // Load cached data immediately on mount to prevent white flash
  useEffect(() => {
    const cachedTables = localStorage.getItem('waiter_dashboard_tables');
    const cachedTasks = localStorage.getItem('waiter_dashboard_tasks');
    if (cachedTables) {
      try {
        setTables(JSON.parse(cachedTables));
      } catch (e) {}
    }
    if (cachedTasks) {
      try {
        setTasks(JSON.parse(cachedTasks));
      } catch (e) {}
    }
    if (cachedTables || cachedTasks) {
      setLoading(false);
    }
  }, []);

  const fetchData = async (waiterId?: string) => {
    try {
      const restaurantId = user?.restaurantId || 'mock-id';
      const wId = waiterId || currentWaiterRef.current?.id;
      const tasksUrl = wId 
        ? `/restaurant/service-tasks?restaurantId=${restaurantId}&waiterId=${wId}`
        : `/restaurant/service-tasks?restaurantId=${restaurantId}`;
      
      const [waiterData, tablesData, tasksData] = await Promise.all([
        apiRequest(`/restaurant/waiters?restaurantId=${restaurantId}`),
        apiRequest(`/restaurant/tables?restaurantId=${restaurantId}`).catch(() => []),
        apiRequest(tasksUrl)
      ]);

      setWaiters(waiterData);
      setTables(tablesData);
      setTasks(tasksData);

      localStorage.setItem('waiter_dashboard_tables', JSON.stringify(tablesData));
      localStorage.setItem('waiter_dashboard_tasks', JSON.stringify(tasksData));
    } catch (err) {
      console.warn('Error loading data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (waiters.length > 0 && !currentWaiter) {
      const match = waiters.find(w => w.email === user?.email || w.name.toLowerCase() === user?.name?.toLowerCase()) || waiters[0];
      setCurrentWaiter(match);
      fetchData(match.id);
    }
  }, [waiters, user, currentWaiter]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      setTimeTick(t => t + 1);
    }, 10000);

    const sseUrl = `${API_BASE}/restaurant/realtime`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_SERVICE_TASK') {
          const newTask: ServiceTask = payload.data.task;
          
          setTasks(prev => {
            if (prev.some(t => t.id === newTask.id || t.orderId === newTask.orderId)) return prev;
            return [newTask, ...prev];
          });

          // Play sound and show transient alert ONLY if it matches the current active waiter!
          if (newTask.waiterId === currentWaiterRef.current?.id) {
            playBellSound();
            
            const newAlert = {
              id: newTask.id,
              tableNumber: newTask.tableNumber,
              waiterName: newTask.waiter?.name || currentWaiterRef.current?.name || 'Rahul',
              items: newTask.kitchenOrder?.items?.map(it => ({
                name: it.menuItem?.name,
                qty: it.quantity
              })) || []
            };

            setAlerts(prev => [newAlert, ...prev]);

            // Auto dismiss after 8 seconds
            setTimeout(() => {
              setAlerts(prev => prev.filter(a => a.id !== newTask.id));
            }, 8000);
          }
        } else if (payload.type === 'ORDER_STATUS_UPDATE') {
          const { id, status, task } = payload.data;
          setTasks(prev => {
            return prev.map(t => {
              if (t.orderId === id || (task && t.id === task.id)) {
                return {
                  ...t,
                  status: task?.status || (status === 'SERVING' ? 'picked_up' : status === 'SERVED' ? 'served' : t.status),
                  pickedUpAt: task?.pickedUpAt || t.pickedUpAt,
                  servedAt: task?.servedAt || t.servedAt,
                  waiterId: task?.waiterId || t.waiterId
                };
              }
              return t;
            });
          });
          fetchData(currentWaiterRef.current?.id || undefined);
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, []);

  const handleUpdateTaskStatus = async (taskId: string, nextStatus: 'picked_up' | 'served') => {
    const action = nextStatus === 'picked_up' ? 'pickup' : 'serve';
    try {
      await apiRequest(`/restaurant/service-tasks/${taskId}/${action}`, {
        method: 'PUT'
      });
      if (nextStatus === 'served') {
        playServeSound();
      }
      fetchData(currentWaiterRef.current?.id || undefined);
    } catch (err) {
      console.warn(err);
    }
  };

  const myAssignedTables = currentWaiter
    ? currentWaiter.tableAssignments.map(a => a.tableNumber.replace(/\s+/g, '').toLowerCase())
    : [];

  const isTableAssigned = (tableNumber: string): boolean => {
    const cleanTable = tableNumber.replace(/\s+/g, '').toLowerCase();
    return myAssignedTables.includes(cleanTable);
  };

  const readyTasks = tasks
    .filter(t => (t.status === 'ready' || t.status === 'READY') && t.waiterId === currentWaiter?.id)
    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());

  const uniqueReadyTasks: ServiceTask[] = [];
  const seenReadyTables = new Set<string>();
  readyTasks.forEach(t => {
    const cleanTable = (t.tableNumber || '').replace(/\D/g, '') || (t.tableNumber || '').trim().toLowerCase();
    if (cleanTable && !seenReadyTables.has(cleanTable)) {
      seenReadyTables.add(cleanTable);
      uniqueReadyTasks.push(t);
    }
  });

  const servedTasks = tasks
    .filter(t => (t.status === 'served' || t.status === 'SERVED') && t.waiterId === currentWaiter?.id)
    .sort((a, b) => new Date(b.servedAt || 0).getTime() - new Date(a.servedAt || 0).getTime());

  const uniqueServedTasks: ServiceTask[] = [];
  const seenServedTables = new Set<string>();
  servedTasks.forEach(t => {
    const cleanTable = (t.tableNumber || '').replace(/\D/g, '') || (t.tableNumber || '').trim().toLowerCase();
    if (cleanTable && !seenServedTables.has(cleanTable)) {
      seenServedTables.add(cleanTable);
      uniqueServedTasks.push(t);
    }
  });

  const filteredReadyTasks = selectedTableFilter
    ? uniqueReadyTasks.filter(t => {
        const tNum = t.tableNumber.replace(/\D/g, '') || t.tableNumber.trim();
        const fNum = selectedTableFilter.replace(/\D/g, '') || selectedTableFilter.trim();
        return tNum.toLowerCase() === fNum.toLowerCase();
      })
    : uniqueReadyTasks;

  const filteredServedTasks = selectedTableFilter
    ? uniqueServedTasks.filter(t => {
        const tNum = t.tableNumber.replace(/\D/g, '') || t.tableNumber.trim();
        const fNum = selectedTableFilter.replace(/\D/g, '') || selectedTableFilter.trim();
        return tNum.toLowerCase() === fNum.toLowerCase();
      })
    : uniqueServedTasks;

  // Repeat sound reminder every 60 seconds if unacknowledged ready orders are present
  useEffect(() => {
    let soundInterval: any = null;
    if (readyTasks.length > 0) {
      soundInterval = setInterval(() => {
        playBellSound();
      }, 60000);
    }
    return () => {
      if (soundInterval) clearInterval(soundInterval);
    };
  }, [readyTasks.length]);

  const getTimerText = (startTimeString: string) => {
    const elapsed = Date.now() - new Date(startTimeString).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes <= 0) return 'READY NOW';
    return `READY ${minutes} MIN AGO`;
  };

  const getServedTimerText = (servedAtString: string | null) => {
    if (!servedAtString) return 'Served Just Now';
    const elapsed = Date.now() - new Date(servedAtString).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes <= 0) return 'Served Just Now';
    return `Served ${minutes} min ago`;
  };

  const handleViewOrder = (taskId: string) => {
    setHighlightedTicketId(taskId);
    setTimeout(() => {
      const el = document.getElementById(`ticket-${taskId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    setTimeout(() => {
      setHighlightedTicketId(null);
    }, 4000);
  };

  // Auto scroll/focus on the first active ready order
  useEffect(() => {
    if (readyTasks.length > 0) {
      const firstTask = readyTasks[0];
      const el = document.getElementById(`ticket-${firstTask.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [readyTasks.length, currentWaiter?.id]);

  return (
    <div className="space-y-8 select-none bg-slate-50 -m-8 p-8 min-h-screen text-slate-900 font-sans antialiased">
      <span className="hidden">{timeTick}</span>
      {stylesInject}
      
      {/* Transient Alert Popups Container (stacked, newest on top) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-[285px] w-full pointer-events-none">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className="pointer-events-auto bg-white border border-slate-200 p-4 rounded-xl shadow-lg flex flex-col gap-2 animate-bounce-in w-full relative text-left"
          >
            <button
              onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
              className="text-slate-400 hover:text-slate-600 text-base font-bold font-mono absolute top-2.5 right-2.5 cursor-pointer"
              title="Dismiss"
            >
              ×
            </button>
            
            <div className="flex items-center gap-2">
              <img src="/notification.gif" alt="bell alert" className="w-6 h-6 shrink-0" />
              <div>
                <span className="font-bold text-[9px] text-emerald-600 uppercase tracking-wider block">
                  ORDER READY
                </span>
                <span className="text-sm font-bold text-slate-900 block leading-tight">
                  TABLE T{alert.tableNumber.replace(/\D/g, '') || alert.tableNumber}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-slate-900 space-y-0.5 border-t border-slate-100 pt-2">
              {(() => {
                const consolidated: Record<string, number> = {};
                alert.items.forEach(it => {
                  consolidated[it.name] = (consolidated[it.name] || 0) + it.qty;
                });
                return Object.entries(consolidated).map(([name, qty], idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{name}</span>
                    <span className="font-bold text-slate-700">Qty {qty}</span>
                  </div>
                ));
              })()}
            </div>

            <div className="flex justify-between items-center mt-1 border-t border-slate-100 pt-2 text-[10px]">
              <span className="text-slate-500 font-bold uppercase">Waiter: {alert.waiterName}</span>
              <button
                onClick={() => {
                  handleViewOrder(alert.id);
                  setAlerts(prev => prev.filter(a => a.id !== alert.id));
                }}
                className="text-emerald-600 hover:text-emerald-700 font-bold uppercase underline cursor-pointer"
              >
                [ VIEW ORDER ]
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-wider text-slate-950 uppercase">Waiter Console</h1>
          
          {/* Sleek Simulated Waiter Profile Switcher */}
          {waiters.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[9px] uppercase font-bold text-slate-500 px-2">Console:</span>
              {waiters.slice(0, 4).map(w => (
                <button
                  key={w.id}
                  onClick={() => {
                    setCurrentWaiter(w);
                    setSelectedTableFilter(null);
                    fetchData(w.id);
                  }}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all duration-200 cursor-pointer ${
                    currentWaiter?.id === w.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-650 hover:bg-slate-200'
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div></div>
      </div>

      {/* SECTION 1: MY TABLES */}
      <div className="space-y-3 text-left">
        <h2 className="text-xs font-normal uppercase tracking-wider text-black">My Assigned Tables</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {loading && tables.length === 0 ? (
              [1, 2, 3, 4].map(n => (
                <div key={n} className="py-2.5 px-6 rounded-xl border border-slate-200 bg-slate-100 animate-pulse w-28 h-9"></div>
              ))
            ) : (() => {
              const uniqueTables: typeof tables = [];
              const seen = new Set<string>();
              tables
                .filter(table => isTableAssigned(table.tableNumber))
                .forEach(table => {
                  const displayDigits = table.tableNumber.replace(/\D/g, '') || table.tableNumber.trim();
                  const key = displayDigits.toLowerCase();
                  if (!seen.has(key)) {
                    seen.add(key);
                    uniqueTables.push(table);
                  }
                });
              return uniqueTables.map(table => {
                const displayDigits = table.tableNumber.replace(/\D/g, '');
                const isSelected = selectedTableFilter && (
                  (table.tableNumber.replace(/\D/g, '') || table.tableNumber.trim()).toLowerCase() ===
                  (selectedTableFilter.replace(/\D/g, '') || selectedTableFilter.trim()).toLowerCase()
                );
                
                return (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTableFilter(isSelected ? null : table.tableNumber)}
                    className={`py-2.5 px-6 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-250 bg-white text-black hover:border-emerald-600'
                    }`}
                  >
                    Table {displayDigits || table.tableNumber}
                  </button>
                );
              });
            })()}
            {!loading && tables.filter(table => isTableAssigned(table.tableNumber)).length === 0 && (
              <p className="text-xs text-neutral-500 italic font-semibold py-1">No assigned tables found.</p>
            )}
          </div>
        </div>
      </div>
      {/* SECTION 2: READY FOR PICKUP */}
      <div className="space-y-3 text-left">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-normal uppercase tracking-wider text-black">READY FOR PICKUP</h2>
          {filteredReadyTasks.length > 0 && (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {filteredReadyTasks.length} Ready
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading && readyTasks.length === 0 ? (
            [1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between min-h-[160px] animate-pulse">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="bg-slate-200 h-5 w-20 rounded"></div>
                    <div className="bg-slate-200 h-4 w-12 rounded"></div>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <div className="bg-slate-105 h-4 w-5/6 rounded"></div>
                    <div className="bg-slate-105 h-4 w-3/4 rounded"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100">
                  <div className="bg-slate-105 h-3.5 w-16 rounded"></div>
                  <div className="bg-slate-200 h-7 w-16 rounded-lg"></div>
                </div>
              </div>
            ))
          ) : (
            filteredReadyTasks.map(task => {
              const timerText = getTimerText(task.assignedAt);
              const displayDigits = task.tableNumber.replace(/\D/g, '');
              const isHighlighted = highlightedTicketId === task.id;
              
              return (
                <div
                  key={task.id}
                  id={`ticket-${task.id}`}
                  className={`bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between min-h-[160px] shadow-xs hover:border-slate-350 transition-all ${
                    isHighlighted ? 'ring-1 ring-amber-400 bg-amber-50/10' : ''
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-900 uppercase">
                        TABLE T{displayDigits || task.tableNumber}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        READY
                      </span>
                    </div>

                    {/* Food Items (normal black text) */}
                    <div className="space-y-1 text-xs text-slate-900 font-normal">
                      {(() => {
                        const consolidated: Record<string, number> = {};
                        task.kitchenOrder?.items?.forEach(it => {
                          const name = it.menuItem?.name || 'Dish';
                          consolidated[name] = (consolidated[name] || 0) + it.quantity;
                        });
                        return Object.entries(consolidated).map(([name, qty], idx) => (
                          <div key={idx} className="text-slate-900">
                            {name} Qty {qty}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      {timerText}
                    </span>
                    <button
                      onClick={() => handleUpdateTaskStatus(task.id, 'served')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase px-3 py-1 rounded transition"
                    >
                      SERVE
                    </button>
                  </div>
                </div>
              );
            })
          )}
          {!loading && filteredReadyTasks.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-xl font-bold uppercase tracking-wider text-xs">
              No ready orders to serve.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: RECENTLY SERVED */}
      <div className="space-y-3 text-left">
        <h2 className="text-xs font-normal uppercase tracking-wider text-black">Recently Served</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm divide-y divide-slate-100">
          {loading && servedTasks.length === 0 ? (
            [1, 2, 3].map(n => (
              <div key={n} className="flex justify-between py-3.5 items-center animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-200 h-4.5 w-24 rounded"></div>
                  <div className="bg-slate-105 h-3.5 w-16 rounded"></div>
                </div>
                <div className="bg-slate-105 h-3.5 w-20 rounded"></div>
              </div>
            ))
          ) : (
            filteredServedTasks.slice(0, 12).map((task, idx) => {
              const displayDigits = task.tableNumber.replace(/\D/g, '');
              return (
                <div key={task.id} className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 ${idx === 0 ? 'pt-0' : ''} ${idx === filteredServedTasks.slice(0, 12).length - 1 ? 'pb-0' : ''}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-900 font-bold uppercase">TABLE T{displayDigits || task.tableNumber}</span>
                    {task.waiter?.name && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        Served By {task.waiter.name}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold uppercase mt-1 sm:mt-0">
                    {getServedTimerText(task.servedAt)}
                  </span>
                </div>
              );
            })
          )}
          {!loading && filteredServedTasks.length === 0 && (
            <p className="text-xs text-slate-400 italic font-semibold py-2 uppercase">No recently served tables.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default WaiterDashboard;



import { db } from '../firebaseConfig';
import { ref, onValue, set, push, update, remove, get, child } from 'firebase/database';
import { Order, Worker, Admin, Expense, OrderChangeRequest, Notification } from '../types';
import { INITIAL_WORKERS, INITIAL_ADMINS } from '../constants';

// Flag to check if we are using Cloud DB
export const isCloudActive = !!db;

// Helper to simulate async behavior for LocalStorage to match Firebase API signature
const mockSubscribe = (key: string, callback: (data: any[]) => void) => {
    const load = () => {
        const data = localStorage.getItem(key);
        callback(data ? JSON.parse(data) : []);
    };
    load(); // Initial load
    
    // Poll for changes in other tabs (primitive sync)
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
};

const mockSave = (key: string, data: any[]) => {
    localStorage.setItem(key, JSON.stringify(data));
    return Promise.resolve();
};

// --- CONSTANTS FOR LOCATIONS ---
const DEFAULT_PICKUP_LOCATIONS = ["البهجة", "الالف", "وندر فود", "المدينة", "كوسميتيك", "البشرى"];
const DEFAULT_DROPOFF_LOCATIONS = ["الخفجي", "سكرة", "الرويسات", "مخادمة", "سوق لحجر", "سوق بلعباس"];

// --- DATA SERVICES ---

export const DB = {
    // --- ORDERS ---
    subscribeToOrders: (callback: (orders: Order[]) => void) => {
        if (isCloudActive) {
            const ordersRef = ref(db, 'orders');
            return onValue(ordersRef, (snapshot) => {
                const data = snapshot.val();
                const ordersList = data ? Object.values(data) : [];
                callback(ordersList as Order[]);
            });
        } else {
            return mockSubscribe('speed_delivery_orders', callback);
        }
    },

    saveOrder: (order: Order) => {
        if (isCloudActive) {
            return set(ref(db, `orders/${order.id}`), order);
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_orders') || '[]');
            const index = current.findIndex((o: Order) => o.id === order.id);
            if (index >= 0) current[index] = order;
            else current.unshift(order);
            return mockSave('speed_delivery_orders', current);
        }
    },

    // New Function for Partial Updates
    updateOrder: (orderId: string, updates: Partial<Order>) => {
        if (isCloudActive) {
            return update(ref(db, `orders/${orderId}`), updates);
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_orders') || '[]');
            const index = current.findIndex((o: Order) => o.id === orderId);
            if (index >= 0) {
                current[index] = { ...current[index], ...updates };
                return mockSave('speed_delivery_orders', current);
            }
            return Promise.resolve();
        }
    },

    deleteOrder: (id: string) => {
        if (isCloudActive) {
            return remove(ref(db, `orders/${id}`));
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_orders') || '[]');
            const filtered = current.filter((o: Order) => o.id !== id);
            return mockSave('speed_delivery_orders', filtered);
        }
    },

    // --- CHANGE REQUESTS (Worker Edits) ---
    subscribeToChangeRequests: (callback: (requests: OrderChangeRequest[]) => void) => {
        if (isCloudActive) {
            const reqRef = ref(db, 'change_requests');
            return onValue(reqRef, (snapshot) => {
                const data = snapshot.val();
                callback(data ? Object.values(data) : []);
            });
        } else {
            return mockSubscribe('speed_delivery_change_requests', callback);
        }
    },

    createChangeRequest: (request: OrderChangeRequest) => {
        if (isCloudActive) {
            return set(ref(db, `change_requests/${request.id}`), request);
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_change_requests') || '[]');
            current.push(request);
            return mockSave('speed_delivery_change_requests', current);
        }
    },

    approveChangeRequest: async (request: OrderChangeRequest) => {
        // 1. Update the original order with new values
        if (isCloudActive) {
            await update(ref(db, `orders/${request.orderId}`), request.newValues);
            // 2. Delete the request
            return remove(ref(db, `change_requests/${request.id}`));
        } else {
            // Update Order
            const orders = JSON.parse(localStorage.getItem('speed_delivery_orders') || '[]');
            const orderIndex = orders.findIndex((o: Order) => o.id === request.orderId);
            if (orderIndex >= 0) {
                orders[orderIndex] = { ...orders[orderIndex], ...request.newValues };
                localStorage.setItem('speed_delivery_orders', JSON.stringify(orders));
            }
            // Delete Request
            const requests = JSON.parse(localStorage.getItem('speed_delivery_change_requests') || '[]');
            const filtered = requests.filter((r: OrderChangeRequest) => r.id !== request.id);
            return mockSave('speed_delivery_change_requests', filtered);
        }
    },

    rejectChangeRequest: (id: string) => {
        if (isCloudActive) {
            return remove(ref(db, `change_requests/${id}`));
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_change_requests') || '[]');
            const filtered = current.filter((r: OrderChangeRequest) => r.id !== id);
            return mockSave('speed_delivery_change_requests', filtered);
        }
    },

    // --- NOTIFICATIONS SYSTEM ---
    sendWorkerNotification: (workerId: string, notification: Notification) => {
        if (isCloudActive) {
            return set(ref(db, `notifications/${workerId}/${notification.id}`), notification);
        } else {
            const key = `notifications_${workerId}`;
            const current = JSON.parse(localStorage.getItem(key) || '[]');
            current.unshift(notification);
            return mockSave(key, current);
        }
    },

    subscribeToWorkerNotifications: (workerId: string, callback: (notifications: Notification[]) => void) => {
        if (isCloudActive) {
            return onValue(ref(db, `notifications/${workerId}`), (snapshot) => {
                const data = snapshot.val();
                callback(data ? Object.values(data) : []);
            });
        } else {
             return mockSubscribe(`notifications_${workerId}`, callback);
        }
    },

    markNotificationAsRead: (workerId: string, notificationId: string) => {
        if (isCloudActive) {
             return update(ref(db, `notifications/${workerId}/${notificationId}`), { isRead: true });
        } else {
            const key = `notifications_${workerId}`;
            const current = JSON.parse(localStorage.getItem(key) || '[]');
            const index = current.findIndex((n: Notification) => n.id === notificationId);
            if(index >= 0) {
                current[index].isRead = true;
                return mockSave(key, current);
            }
            return Promise.resolve();
        }
    },

    // --- WORKERS ---
    subscribeToWorkers: (callback: (workers: Worker[]) => void) => {
        if (isCloudActive) {
            const refDb = ref(db, 'workers');
            return onValue(refDb, (snapshot) => {
                const data = snapshot.val();
                const list = data ? Object.values(data) : [];
                callback(list as Worker[]);
            });
        } else {
            const unsub = mockSubscribe('speed_delivery_workers', (data) => {
                if (data.length === 0 && INITIAL_WORKERS.length > 0) {
                     mockSave('speed_delivery_workers', INITIAL_WORKERS);
                     callback(INITIAL_WORKERS);
                } else {
                    callback(data);
                }
            });
            return unsub;
        }
    },

    saveWorker: (worker: Worker) => {
        if (isCloudActive) {
            return set(ref(db, `workers/${worker.id}`), worker);
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_workers') || '[]');
            const index = current.findIndex((w: Worker) => w.id === worker.id);
            if (index >= 0) current[index] = worker;
            else current.push(worker);
            return mockSave('speed_delivery_workers', current);
        }
    },
    
    // Optimized for frequent updates (GPS)
    updateWorkerLocation: (workerId: string, lat: number, lng: number) => {
        if (isCloudActive) {
            return update(ref(db, `workers/${workerId}`), {
                latitude: lat,
                longitude: lng,
                lastLocationUpdate: new Date().toISOString()
            });
        } else {
            // Local Storage fallback (Mock)
            const current = JSON.parse(localStorage.getItem('speed_delivery_workers') || '[]');
            const index = current.findIndex((w: Worker) => w.id === workerId);
            if (index >= 0) {
                current[index].latitude = lat;
                current[index].longitude = lng;
                current[index].lastLocationUpdate = new Date().toISOString();
                return mockSave('speed_delivery_workers', current);
            }
        }
    },

    deleteWorker: (id: string) => {
        if (isCloudActive) {
            return remove(ref(db, `workers/${id}`));
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_workers') || '[]');
            const filtered = current.filter((w: Worker) => w.id !== id);
            return mockSave('speed_delivery_workers', filtered);
        }
    },

    // --- ADMINS ---
    subscribeToAdmins: (callback: (admins: Admin[]) => void) => {
        if (isCloudActive) {
            return onValue(ref(db, 'admins'), (snapshot) => {
                const data = snapshot.val();
                callback(data ? Object.values(data) : []);
            });
        } else {
            const unsub = mockSubscribe('speed_delivery_admins', (data) => {
                if (data.length === 0 && INITIAL_ADMINS.length > 0) {
                    mockSave('speed_delivery_admins', INITIAL_ADMINS);
                    callback(INITIAL_ADMINS);
                } else {
                    callback(data);
                }
            });
            return unsub;
        }
    },

    saveAdmin: (admin: Admin) => {
        if (isCloudActive) {
            return set(ref(db, `admins/${admin.id}`), admin);
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_admins') || '[]');
            current.push(admin);
            return mockSave('speed_delivery_admins', current);
        }
    },

    deleteAdmin: (id: string) => {
        if (isCloudActive) {
            return remove(ref(db, `admins/${id}`));
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_admins') || '[]');
            const filtered = current.filter((a: Admin) => a.id !== id);
            return mockSave('speed_delivery_admins', filtered);
        }
    },

    // --- EXPENSES ---
    subscribeToExpenses: (callback: (expenses: Expense[]) => void) => {
        if (isCloudActive) {
            return onValue(ref(db, 'expenses'), (snapshot) => {
                const data = snapshot.val();
                callback(data ? Object.values(data) : []);
            });
        } else {
            return mockSubscribe('speed_delivery_expenses', callback);
        }
    },

    saveExpense: (expense: Expense) => {
        if (isCloudActive) {
            return set(ref(db, `expenses/${expense.id}`), expense);
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_expenses') || '[]');
            current.unshift(expense);
            return mockSave('speed_delivery_expenses', current);
        }
    },

    deleteExpense: (id: string) => {
        if (isCloudActive) {
            return remove(ref(db, `expenses/${id}`));
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_expenses') || '[]');
            const filtered = current.filter((e: Expense) => e.id !== id);
            return mockSave('speed_delivery_expenses', filtered);
        }
    },

    // --- FAVORITE LOCATIONS (PICKUP & DROPOFF) ---
    subscribeToLocations: (type: 'pickup' | 'dropoff', callback: (locations: string[]) => void) => {
        const path = `settings/locations/${type}`;
        const defaultList = type === 'pickup' ? DEFAULT_PICKUP_LOCATIONS : DEFAULT_DROPOFF_LOCATIONS;

        if (isCloudActive) {
            return onValue(ref(db, path), (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const list = Array.isArray(data) ? data : Object.values(data);
                    callback(list as string[]);
                } else {
                    set(ref(db, path), defaultList);
                    callback(defaultList);
                }
            });
        } else {
            const key = `speed_delivery_locations_${type}`;
            const unsub = mockSubscribe(key, (data) => {
                if (!data || data.length === 0) {
                    mockSave(key, defaultList);
                    callback(defaultList);
                } else {
                    callback(data);
                }
            });
            return unsub;
        }
    },

    addLocation: async (type: 'pickup' | 'dropoff', location: string) => {
        const path = `settings/locations/${type}`;
        
        if (isCloudActive) {
            const snapshot = await get(ref(db, path));
            let currentList: string[] = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                currentList = Array.isArray(data) ? data : Object.values(data);
            }
            
            if (!currentList.includes(location)) {
                currentList.push(location);
                return set(ref(db, path), currentList);
            }
        } else {
            const key = `speed_delivery_locations_${type}`;
            const current = JSON.parse(localStorage.getItem(key) || '[]');
            if (!current.includes(location)) {
                current.push(location);
                return mockSave(key, current);
            }
        }
    },
    
    deleteLocation: async (type: 'pickup' | 'dropoff', location: string) => {
        const path = `settings/locations/${type}`;
         if (isCloudActive) {
            const snapshot = await get(ref(db, path));
            if (snapshot.exists()) {
                 const data = snapshot.val();
                 let currentList = Array.isArray(data) ? data : Object.values(data);
                 currentList = currentList.filter((l: any) => l !== location);
                 return set(ref(db, path), currentList);
            }
        } else {
             const key = `speed_delivery_locations_${type}`;
             const current: any[] = JSON.parse(localStorage.getItem(key) || '[]');
             const filtered = current.filter(l => l !== location);
             return mockSave(key, filtered);
        }
    },

    // --- UTILS ---
    generateOrderId: async () => {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-GB').replace(/\//g, '');
        
        let count = 1;
        if (isCloudActive) {
            try {
                const snapshot = await get(child(ref(db), `counters/${dateStr}`));
                if (snapshot.exists()) {
                    count = snapshot.val() + 1;
                }
                set(ref(db, `counters/${dateStr}`), count);
            } catch(e) {
                console.error("Counter error", e);
            }
        } else {
            const stored = localStorage.getItem('speed_delivery_daily_seq');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.date === dateStr) count = data.count + 1;
            }
            localStorage.setItem('speed_delivery_daily_seq', JSON.stringify({ date: dateStr, count }));
        }
        
        return `${dateStr}-${count}`;
    },

    // --- DATA MANAGEMENT ---
    backupData: async () => {
        if (isCloudActive) {
            const snapshot = await get(ref(db));
            return snapshot.val();
        } else {
            return {
                orders: JSON.parse(localStorage.getItem('speed_delivery_orders') || '[]'),
                workers: JSON.parse(localStorage.getItem('speed_delivery_workers') || '[]'),
                admins: JSON.parse(localStorage.getItem('speed_delivery_admins') || '[]'),
                expenses: JSON.parse(localStorage.getItem('speed_delivery_expenses') || '[]'),
                counters: JSON.parse(localStorage.getItem('speed_delivery_daily_seq') || '{}'),
                locations_pickup: JSON.parse(localStorage.getItem('speed_delivery_locations_pickup') || '[]'),
                locations_dropoff: JSON.parse(localStorage.getItem('speed_delivery_locations_dropoff') || '[]'),
                change_requests: JSON.parse(localStorage.getItem('speed_delivery_change_requests') || '[]'),
                notifications: {},
            };
        }
    },

    restoreData: async (data: any) => {
        if (!data) throw new Error("No data provided");
        
        if (isCloudActive) {
            return update(ref(db), data);
        } else {
            if (data.orders) localStorage.setItem('speed_delivery_orders', JSON.stringify(data.orders));
            if (data.workers) localStorage.setItem('speed_delivery_workers', JSON.stringify(data.workers));
            if (data.admins) localStorage.setItem('speed_delivery_admins', JSON.stringify(data.admins));
            if (data.expenses) localStorage.setItem('speed_delivery_expenses', JSON.stringify(data.expenses));
            if (data.counters) localStorage.setItem('speed_delivery_daily_seq', JSON.stringify(data.counters));
            if (data.locations_pickup) localStorage.setItem('speed_delivery_locations_pickup', JSON.stringify(data.locations_pickup));
            if (data.locations_dropoff) localStorage.setItem('speed_delivery_locations_dropoff', JSON.stringify(data.locations_dropoff));
            if (data.change_requests) localStorage.setItem('speed_delivery_change_requests', JSON.stringify(data.change_requests));
            return Promise.resolve();
        }
    },

    fullSystemReset: async () => {
        if (isCloudActive) {
            const updates: any = {};
            updates['orders'] = null;
            updates['expenses'] = null;
            updates['change_requests'] = null;
            updates['notifications'] = null;
            
            const workersSnap = await get(ref(db, 'workers'));
            if (workersSnap.exists()) {
                const workers = workersSnap.val();
                Object.keys(workers).forEach(key => {
                    updates[`workers/${key}/ordersCompleted`] = 0;
                    updates[`workers/${key}/totalEarnings`] = 0;
                    updates[`workers/${key}/latitude`] = null;
                    updates[`workers/${key}/longitude`] = null;
                });
            }
            return update(ref(db), updates);
        } else {
            localStorage.removeItem('speed_delivery_orders');
            localStorage.removeItem('speed_delivery_expenses');
            localStorage.removeItem('speed_delivery_change_requests');
            
            const workers = JSON.parse(localStorage.getItem('speed_delivery_workers') || '[]');
            const resetWorkers = workers.map((w: Worker) => ({
                ...w,
                ordersCompleted: 0,
                totalEarnings: 0,
                latitude: null,
                longitude: null
            }));
            localStorage.setItem('speed_delivery_workers', JSON.stringify(resetWorkers));
            return Promise.resolve();
        }
    }
};
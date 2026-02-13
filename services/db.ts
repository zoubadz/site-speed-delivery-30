import { db } from '../firebaseConfig';
import { ref, onValue, set, push, update, remove, get, child } from 'firebase/database';
import { Order, Worker, Admin, Expense } from '../types';
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

    deleteOrder: (id: string) => {
        if (isCloudActive) {
            return remove(ref(db, `orders/${id}`));
        } else {
            const current = JSON.parse(localStorage.getItem('speed_delivery_orders') || '[]');
            const filtered = current.filter((o: Order) => o.id !== id);
            return mockSave('speed_delivery_orders', filtered);
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

    // --- UTILS ---
    generateOrderId: async () => {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-GB').replace(/\//g, ''); // 26022024
        
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
    }
};
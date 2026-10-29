import { create } from 'zustand';
import type { UserDetails, DoctorDetails, MedicineReminder, MedicalRecord, ChatSession, Message, HealthNotice } from '../types';

interface AuthState {
  token: string | null;
  role: 'student' | 'doctor' | 'admin' | null;
  user: UserDetails | DoctorDetails | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  showSosPopup: boolean;
  reminders: MedicineReminder[];
  records: MedicalRecord[];
  chats: ChatSession[];
  notices: HealthNotice[];
  
  // Actions
  login: (token: string, role: 'student' | 'doctor' | 'admin', user: UserDetails | DoctorDetails) => void;
  logout: () => void;
  updateUser: (user: UserDetails | DoctorDetails) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setShowSosPopup: (show: boolean) => void;
  
  // Data Setters & Operations
  setReminders: (reminders: MedicineReminder[]) => void;
  addReminder: (reminder: MedicineReminder) => void;
  setRecords: (records: MedicalRecord[]) => void;
  addRecord: (record: MedicalRecord) => void;
  removeRecord: (id: number) => void;
  setChats: (chats: ChatSession[]) => void;
  addChat: (chat: ChatSession) => void;
  addMessage: (chatId: number, message: Message) => void;
  setNotices: (notices: HealthNotice[]) => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  return 'light';
};

export const useStore = create<AuthState>((set) => {
  // Load token & user details from local storage on init
  const savedToken = localStorage.getItem('token');
  const savedRole = localStorage.getItem('role') as 'student' | 'doctor' | 'admin' | null;
  const savedUserRaw = localStorage.getItem('user');
  let savedUser = null;
  try {
    savedUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;
  } catch (e) {
    console.error(e);
  }

  const initialTheme = 'light';
  // Apply light theme class globally
  document.documentElement.classList.remove('dark');
  document.body.classList.remove('dark');

  return {
    token: savedToken,
    role: savedRole,
    user: savedUser,
    isAuthenticated: !!savedToken,
    theme: initialTheme,
    showSosPopup: false,
    reminders: [],
    records: [],
    chats: [],
    notices: [],

    login: (token, role, user) => {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, role, user, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      set({ token: null, role: null, user: null, isAuthenticated: false, reminders: [], records: [], chats: [] });
    },

    updateUser: (user) => {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    },

    toggleTheme: () => set((state) => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      return { theme: 'light' };
    }),

    setTheme: (theme) => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      set({ theme: 'light' });
    },

    setShowSosPopup: (showSosPopup) => set({ showSosPopup }),

    setReminders: (reminders) => set({ reminders }),
    addReminder: (reminder) => set((state) => ({ reminders: [...state.reminders, reminder] })),
    
    setRecords: (records) => set({ records }),
    addRecord: (record) => set((state) => ({ records: [record, ...state.records] })),
    removeRecord: (id) => set((state) => ({ records: state.records.filter(r => r.id !== id) })),

    setChats: (chats) => set({ chats }),
    addChat: (chat) => set((state) => {
      const exists = state.chats.some(c => c.id === chat.id);
      if (exists) return {};
      return { chats: [...state.chats, chat] };
    }),
    
    addMessage: (chatId, message) => set((state) => {
      const updatedChats = state.chats.map((chat) => {
        if (chat.id === chatId) {
          // Check if message is already added
          const msgExists = chat.messages.some(m => m.id === message.id);
          if (msgExists) return chat;
          return {
            ...chat,
            messages: [...chat.messages, message]
          };
        }
        return chat;
      });
      return { chats: updatedChats };
    }),

    setNotices: (notices) => set({ notices }),
  };
});

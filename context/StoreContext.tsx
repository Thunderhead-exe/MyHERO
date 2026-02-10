import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Child, Story, User } from '../types';
import { MOCK_USER, SAMPLE_CHILDREN } from '../constants';

interface StoreContextType {
  user: User;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  children: Child[];
  stories: Story[];
  addChild: (child: Child) => void;
  updateChild: (child: Child) => void;
  addStory: (story: Story) => void;
  updateStory: (story: Story) => void;
  deductCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  getStory: (id: string) => Story | undefined;
  getChild: (id: string) => Child | undefined;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mh_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Load initial state from local storage or defaults
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('mh_user');
      return saved ? JSON.parse(saved) : MOCK_USER;
    } catch (e) {
      return MOCK_USER;
    }
  });

  const [childrenList, setChildrenList] = useState<Child[]>(() => {
    try {
      const saved = localStorage.getItem('mh_children');
      return saved ? JSON.parse(saved) : SAMPLE_CHILDREN;
    } catch (e) {
      return SAMPLE_CHILDREN;
    }
  });

  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem('mh_stories');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem('mh_auth', String(isAuthenticated));
    } catch (e) {
      console.warn('Failed to save auth state', e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem('mh_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('mh_children', JSON.stringify(childrenList));
    } catch (e) {
      console.warn('Failed to save children', e);
    }
  }, [childrenList]);

  useEffect(() => {
    try {
      localStorage.setItem('mh_stories', JSON.stringify(stories));
    } catch (e) {
      console.error('Failed to save stories. Storage might be full.', e);
      // In a real app, we might want to notify the user or clean up old stories
    }
  }, [stories]);

  // Auth Actions
  const login = (email: string) => {
    setUser({ ...MOCK_USER, email }); // Reset to mock user on login for demo
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  // Data Actions
  const addChild = (child: Child) => {
    setChildrenList(prev => [...prev, child]);
  };

  const updateChild = (updatedChild: Child) => {
    setChildrenList(prev => prev.map(c => c.id === updatedChild.id ? updatedChild : c));
  };

  const addStory = (story: Story) => {
    setStories(prev => [story, ...prev]);
  };

  const updateStory = (updatedStory: Story) => {
    setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
  };

  const deductCredits = (amount: number): boolean => {
    if (user.credits >= amount) {
      setUser(prev => ({ ...prev, credits: prev.credits - amount }));
      return true;
    }
    return false;
  };

  const addCredits = (amount: number) => {
    setUser(prev => ({ ...prev, credits: prev.credits + amount }));
  };

  const getStory = (id: string) => stories.find(s => s.id === id);
  const getChild = (id: string) => childrenList.find(c => c.id === id);

  return (
    <StoreContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      children: childrenList,
      stories,
      addChild,
      updateChild,
      addStory,
      updateStory,
      deductCredits,
      addCredits,
      getStory,
      getChild
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
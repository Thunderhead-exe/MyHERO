import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Home, User, LogOut, Settings, CreditCard, Star } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, addCredits, logout } = useStore();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              H
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">MyHERO</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold cursor-pointer hover:bg-amber-200 transition select-none"
              onClick={() => addCredits(5)}
              title="Click to buy more credits (Demo)"
            >
              <span>🪙</span>
              <span>{user.credits}</span>
            </div>
            
            {/* Parent Profile Dropdown */}
            <div className="relative" ref={menuRef}>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                  <User size={18} />
                </div>
                <div className="hidden sm:block text-sm font-medium text-slate-600">
                  {user.name}
                </div>
              </div>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-fadeIn origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email || 'parent@demo.com'}</p>
                  </div>
                  
                  <div className="px-2 py-2">
                    <div className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-slate-400"/>
                        <span>Credits</span>
                      </div>
                      <span className="font-bold text-amber-600">{user.credits}</span>
                    </div>
                     <div className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-slate-400"/>
                        <span>Plan</span>
                      </div>
                      <span className="font-bold text-indigo-600">Premium</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <Settings size={16} className="text-slate-400"/>
                      <span>Settings</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 mt-1 px-2 py-2">
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-10">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className={`flex flex-col items-center p-2 ${isActive('/') ? 'text-indigo-600' : 'text-slate-400'}`}>
            <Home size={24} />
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          <Link to="/create-story" className="flex flex-col items-center p-2 text-indigo-600 -mt-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg text-white">
              <PlusCircle size={32} />
            </div>
          </Link>
           <Link to="/child/new" className={`flex flex-col items-center p-2 ${isActive('/child/new') ? 'text-indigo-600' : 'text-slate-400'}`}>
            <User size={24} />
            <span className="text-xs mt-1 font-medium">New Child</span>
          </Link>
        </div>
      </nav>

      {/* Desktop Footer spacer */}
      <div className="h-20 sm:h-10"></div>
    </div>
  );
};

export default Layout;
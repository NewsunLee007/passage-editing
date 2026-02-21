import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Info, Moon, Sun, PenLine, History, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../hooks/useTheme';

const Layout: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/', label: '生成 (Generate)', icon: LayoutDashboard },
    { to: '/edit', label: '编辑 (Edit)', icon: PenLine },
    { to: '/preview', label: '预览 (Preview)', icon: FileText },
    { to: '/history', label: '历史 (History)', icon: History },
    { to: '/settings', label: '设置 (Settings)', icon: Settings },
    { to: '/about', label: '关于 (About)', icon: Info },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 font-sans text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-200/60 to-cyan-100/40 blur-3xl dark:from-sky-500/20 dark:to-cyan-400/10" />
        <div className="absolute -bottom-48 -right-48 h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-indigo-200/50 to-sky-100/30 blur-3xl dark:from-indigo-500/20 dark:to-sky-400/10" />
      </div>
      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 w-72 bg-white/80 border-r border-gray-200 flex flex-col shadow-sm z-30 backdrop-blur dark:bg-slate-950/70 dark:border-slate-800/70 transition-transform duration-300 ease-in-out",
        "md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/70 to-white/40 dark:border-slate-800/70 dark:from-slate-900/40 dark:to-slate-950/20">
          <div className="flex flex-col items-center w-full">
            <img src="https://p.ipic.vip/lhgb6n.png" alt="Logo" className="w-14 h-14 object-contain rounded-xl shadow-lg shadow-blue-200 mb-2" />
            <h1 className="font-bold text-slate-800 text-lg leading-tight tracking-tight dark:text-slate-100">
              ESL阅读材料
            </h1>
            <h2 className="font-bold text-blue-600 text-sm leading-tight tracking-tight mb-1">
              智能生成
            </h2>
            <p className="text-[11px] text-gray-400 tracking-wider dark:text-slate-500" style={{ fontFamily: "'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', cursive" }}>
              Designed by Newsun Lee
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium text-sm',
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm translate-x-1 ring-1 ring-blue-100 dark:bg-slate-900/60 dark:text-sky-300 dark:ring-slate-800'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-900/40 dark:hover:text-slate-100'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={clsx("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-100 dark:border-slate-800/70">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-slate-700 shadow-sm transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100 dark:hover:bg-slate-900/60 mb-3"
              type="button"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="text-sm">{isDark ? '日间模式' : '夜间模式'}</span>
            </button>
            <div className="bg-blue-50 rounded-lg p-4 text-xs text-blue-800/80 leading-relaxed dark:bg-slate-900/50 dark:text-slate-200/80">
                <p className="font-semibold mb-1">提示</p>
                本系统完全免费，所有数据均存储在本地浏览器中。
            </div>
            <div className="mt-4 text-center text-xs text-gray-400 dark:text-slate-500">
                v1.0.0
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-slate-800 bg-white/80 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="font-bold text-slate-800 text-base leading-tight tracking-tight dark:text-slate-100">
              ESL阅读材料
            </h1>
            <h2 className="font-bold text-blue-600 text-xs leading-tight tracking-tight">
              智能生成
            </h2>
          </div>
          <div className="w-8"></div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="h-full w-full">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;

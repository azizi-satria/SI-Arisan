import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Users, Landmark, Menu } from 'lucide-react';
import { Period } from '../types';

interface SidebarProps {
  periods: Period[];
  activePeriodId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectPeriod: (id: string) => void;
  onOpenNewPeriod: () => void;
  onToggleMobileMenu: () => void;
}

export default function Sidebar({
  periods,
  activePeriodId,
  isCollapsed,
  onToggleCollapse,
  onSelectPeriod,
  onOpenNewPeriod,
  onToggleMobileMenu,
}: SidebarProps) {
  return (
    <aside
      id="sidebar-container"
      style={{ width: isCollapsed ? '0px' : '288px' }}
      className={`bg-slate-900 text-slate-300 flex flex-col h-full hidden md:flex flex-shrink-0 shadow-2xl relative z-20 transition-all duration-300 ${
        isCollapsed ? 'overflow-hidden' : ''
      }`}
    >
      {/* Brand logo header */}
      <div className="p-6 bg-slate-950 flex items-center justify-between border-b border-slate-800">
        <div id="sidebar-logo-text" className="flex items-center gap-3 overflow-hidden">
          <div className="bg-gradient-to-br from-teal-400 to-teal-600 text-white p-2.5 rounded-xl shadow-lg shadow-teal-500/30 flex-shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Arisan<span className="text-teal-400">Pro</span>
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 font-semibold">
                Manajemen Cerdas
              </p>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <button
            id="btn-collapse-sidebar"
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Sembunyikan Panel"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Menu / Periods list */}
      {!isCollapsed && (
        <div id="sidebar-menu-content" className="p-5 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Periode Aktif
            </h2>
            <button
              id="btn-sidebar-add-period"
              onClick={onOpenNewPeriod}
              className="text-teal-400 hover:text-white bg-slate-800 hover:bg-teal-500 hover:shadow-lg hover:shadow-teal-500/20 p-1.5 rounded-lg transition-all duration-300 cursor-pointer"
              title="Tambah Periode"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <ul id="period-list" className="space-y-2">
            {periods.length === 0 ? (
              <li className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-700 rounded-xl text-center">
                Belum ada periode.
              </li>
            ) : (
              periods.map((p) => {
                const isActive = p.id === activePeriodId;
                return (
                  <li
                    key={p.id}
                    onClick={() => onSelectPeriod(p.id)}
                    className={`cursor-pointer p-3 rounded-xl transition-all border-l-4 border-transparent flex justify-between items-center group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500/20 to-slate-900 border-l-4 border-teal-400 text-teal-300 font-semibold shadow-inner'
                        : 'hover:bg-slate-800/60 text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate text-sm flex items-center gap-1.5 font-bold">
                        {p.isClosed && <span className="text-rose-550 text-xs">🔒</span>}
                        {p.name}
                      </span>
                      {p.isClosed && (
                        <span className="text-[9px] text-rose-400 font-bold tracking-tight">Selesai & Diarsipkan</span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium flex-shrink-0 ${
                        isActive
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                          : 'bg-slate-800 text-slate-500 group-hover:bg-slate-750'
                      }`}
                    >
                      {p.members.length}/{p.targetMembers}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </aside>
  );
}

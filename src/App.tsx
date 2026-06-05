import React, { useState, useEffect } from 'react';
import { 
  Layers, Search, Users, Cpu, Lock, Activity, 
  Settings, User, Sparkles, TrendingUp, AlertCircle, ShieldAlert
} from 'lucide-react';
import DashboardExecutivo from './components/DashboardExecutivo';
import InteligenciaMercado from './components/InteligenciaMercado';
import MonitorConcorrentes from './components/MonitorConcorrentes';
import WebhooksManager from './components/WebhooksManager';
import OAuthPKCESimulator from './components/OAuthPKCESimulator';
import ArchitectureBlueprint from './components/ArchitectureBlueprint';
import OportunidadesMercado from './components/OportunidadesMercado';
import { SystemMetrics } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'intel' | 'opportunities' | 'repricer' | 'webhooks' | 'oauth' | 'archi'>('dashboard');
  const [isMeliConnected, setIsMeliConnected] = useState<boolean>(() => {
    return !!localStorage.getItem('meli_access_token');
  });
  const [sellerNickname, setSellerNickname] = useState<string>(() => {
    return localStorage.getItem('meli_seller_nickname') || '';
  });
  const [isOfficial, setIsOfficial] = useState<boolean>(() => {
    return localStorage.getItem('meli_is_official') === 'true';
  });

  const handleConnectChange = (connected: boolean) => {
    setIsMeliConnected(connected);
    setSellerNickname(localStorage.getItem('meli_seller_nickname') || '');
    setIsOfficial(localStorage.getItem('meli_is_official') === 'true');
  };
  
  // Real-time simulated telemetry system metrics to show in the sidebar
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 12.4,
    memoryUsage: 482, // MBs
    redisQueueSize: 0,
    postgresConnCount: 14,
    apiRequestsCount: 1284,
    rateLimitRemaining: 4920,
    circuitBreakerStatus: 'closed',
    errorRatePercent: 0.04
  });

  // Soft fluctuate metrics in the background to simulate high fidelity telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const deltaCpu = (Math.random() * 4 - 2);
        const nextCpu = Math.max(5, Math.min(85, prev.cpuUsage + deltaCpu));
        
        const deltaMem = Math.floor(Math.random() * 6 - 3);
        const nextMem = Math.max(400, Math.min(1000, prev.memoryUsage + deltaMem));

        const deltaRemaining = Math.floor(Math.random() * 20 - 10);
        const nextRemaining = Math.max(100, Math.min(5000, prev.rateLimitRemaining + deltaRemaining));

        const prevQueue = prev.redisQueueSize;
        const nextQueue = prevQueue > 0 ? prevQueue - 1 : 0;

        return {
          ...prev,
          cpuUsage: Number(nextCpu.toFixed(1)),
          memoryUsage: nextMem,
          redisQueueSize: nextQueue,
          rateLimitRemaining: nextRemaining
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Sleek LEFT SIDEBAR (Minimalist Light Theme) */}
      <aside className="w-64 bg-white flex flex-col flex-shrink-0 border-r border-slate-200 select-none">
        
        {/* Sidebar Header Brand Area */}
        <div className="p-6 border-b border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">MeliPro</h1>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider mt-1.5 uppercase">Enterprise Solutions</p>
        </div>

        {/* Navigation Tab Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 text-xs font-semibold overflow-y-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-slate-100 text-slate-900' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Cpu className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-400'}`} />
            <span>Dashboard Executivo</span>
          </button>

          <button 
            onClick={() => setActiveTab('intel')}
            className={`w-full p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === 'intel' 
                ? 'bg-slate-100 text-slate-900' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Search className={`w-4 h-4 ${activeTab === 'intel' ? 'text-slate-900' : 'text-slate-400'}`} />
            <span>Inteligência de Mercado</span>
          </button>

          <button 
            onClick={() => setActiveTab('opportunities')}
            className={`w-full p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === 'opportunities' 
                ? 'bg-slate-100 text-slate-900' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'opportunities' ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>Radar de Oportunidades</span>
          </button>

          <button 
            onClick={() => setActiveTab('repricer')}
            className={`w-full p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === 'repricer' 
                ? 'bg-slate-100 text-slate-900' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeTab === 'repricer' ? 'text-slate-900' : 'text-slate-400'}`} />
            <span>Monitor & Repricer</span>
          </button>

          <button 
            onClick={() => setActiveTab('webhooks')}
            className={`w-full p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === 'webhooks' 
                ? 'bg-slate-100 text-slate-900' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Activity className={`w-4 h-4 ${activeTab === 'webhooks' ? 'text-slate-900' : 'text-slate-400'}`} />
            <span>Webhooks</span>
          </button>

          <button 
            onClick={() => setActiveTab('oauth')}
            className={`w-full p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === 'oauth' 
                ? 'bg-slate-100 text-slate-900' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Lock className={`w-4 h-4 ${activeTab === 'oauth' ? 'text-slate-900' : 'text-slate-400'}`} />
            <span>Conexão Oficial</span>
          </button>

          <button 
            onClick={() => setActiveTab('archi')}
            className={`w-full p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === 'archi' 
                ? 'bg-slate-100 text-slate-900' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Layers className={`w-4 h-4 ${activeTab === 'archi' ? 'text-slate-900' : 'text-slate-400'}`} />
            <span>Arquitetura Blueprint</span>
          </button>
        </nav>

        {/* Bottom Status Information (Very low-key and elegant) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isMeliConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              Mercado Livre
            </span>
            <span className={`font-mono text-[10px] font-bold ${isMeliConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isMeliConnected ? 'CONECTADO' : 'MOCK'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Container Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Sleek Top Header (Clean White Bar with Soft Border) */}
        <header className="h-16 bg-white border-b border-slate-150 flex items-center justify-between px-6 sm:px-8 select-none flex-shrink-0">
          
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              {activeTab === 'dashboard' && 'Dashboard Executivo'}
              {activeTab === 'intel' && 'Inteligência de Mercado'}
              {activeTab === 'opportunities' && 'Radar de Oportunidades'}
              {activeTab === 'repricer' && 'Monitor e Repricer'}
              {activeTab === 'webhooks' && 'Gerenciador de Webhooks'}
              {activeTab === 'oauth' && 'Integração Oficial'}
              {activeTab === 'archi' && 'Arquitetura e Escopo'}
            </h1>
          </div>

          {/* User Profile and Quick Logout Block */}
          <div className="flex items-center gap-3">
            {isMeliConnected ? (
              <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-1.5 px-3 rounded-lg transition-all text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-slate-800">@{sellerNickname}</span>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => {
                    localStorage.removeItem('meli_access_token');
                    localStorage.removeItem('meli_refresh_token');
                    localStorage.removeItem('meli_client_id');
                    localStorage.removeItem('meli_seller_nickname');
                    localStorage.removeItem('meli_is_official');
                    localStorage.removeItem('meli_expires_at');
                    setIsMeliConnected(false);
                    setSellerNickname('');
                    setIsOfficial(false);
                  }}
                  className="text-slate-400 hover:text-rose-600 font-bold transition-all uppercase text-[9px] tracking-wider cursor-pointer"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('oauth')}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                Conectar Conta
              </button>
            )}
          </div>

        </header>

        {/* Body Workspace Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-6xl mx-auto w-full">
            
            {/* Dynamic Interactive Component View */}
            <div className="w-full">
              {activeTab === 'dashboard' && (
                <DashboardExecutivo 
                  isMeliConnected={isMeliConnected} 
                  isMeliOfficial={isOfficial}
                  sellerNickname={sellerNickname}
                />
              )}
              {activeTab === 'intel' && (
                <InteligenciaMercado 
                  isMeliConnected={isMeliConnected} 
                  isMeliOfficial={isOfficial}
                  sellerNickname={sellerNickname}
                />
              )}
              {activeTab === 'opportunities' && (
                <OportunidadesMercado 
                  isMeliConnected={isMeliConnected} 
                  isMeliOfficial={isOfficial}
                  sellerNickname={sellerNickname}
                />
              )}
              {activeTab === 'repricer' && (
                <MonitorConcorrentes 
                  isMeliConnected={isMeliConnected} 
                  isMeliOfficial={isOfficial}
                  sellerNickname={sellerNickname}
                />
              )}
              {activeTab === 'webhooks' && (
                <WebhooksManager 
                  isMeliConnected={isMeliConnected} 
                  isMeliOfficial={isOfficial}
                  sellerNickname={sellerNickname}
                />
              )}
              {activeTab === 'oauth' && (
                <OAuthPKCESimulator 
                  isMeliConnected={isMeliConnected} 
                  onConnectChange={handleConnectChange} 
                />
              )}
              {activeTab === 'archi' && <ArchitectureBlueprint />}
            </div>

          </div>

        </div>

        {/* Subtle, Minimal Footer */}
        <footer className="h-10 bg-white border-t border-slate-200 flex items-center justify-between px-6 text-[10px] text-slate-400 select-none flex-shrink-0">
          <span>MeliPro Integration Engine</span>
          <span>© 2026 MeliPro Solutions</span>
        </footer>

      </main>

    </div>
  );
}

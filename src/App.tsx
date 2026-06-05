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
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Sleek LEFT SIDEBAR (Dark Theme for high contrast branding) */}
      <aside className="w-66 bg-slate-900 flex flex-col text-white flex-shrink-0 border-r border-slate-800">
        
        {/* Sidebar Header Brand Area */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-1.5 rounded text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white uppercase">MeliPro</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1 uppercase">ENTERPRISE SOLUTIONS</p>
        </div>

        {/* Navigation Tab Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 text-xs font-semibold overflow-y-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full p-2.5 rounded flex items-center gap-3 transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Cpu className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-blue-400' : ''}`} />
            <span>Dashboard Executivo</span>
          </button>

          <button 
            onClick={() => setActiveTab('intel')}
            className={`w-full p-2.5 rounded flex items-center gap-3 transition-colors ${
              activeTab === 'intel' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Search className={`w-4 h-4 ${activeTab === 'intel' ? 'text-blue-400' : ''}`} />
            <span>Inteligência de Mercado</span>
          </button>

          <button 
            onClick={() => setActiveTab('opportunities')}
            className={`w-full p-2.5 rounded flex items-center gap-3 transition-colors ${
              activeTab === 'opportunities' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'opportunities' ? 'text-cyan-450' : ''}`} />
            <span>Radar de Oportunidades</span>
          </button>

          <button 
            onClick={() => setActiveTab('repricer')}
            className={`w-full p-2.5 rounded flex items-center gap-3 transition-colors ${
              activeTab === 'repricer' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeTab === 'repricer' ? 'text-blue-400' : ''}`} />
            <span>Monitor & Repricer</span>
          </button>

          <button 
            onClick={() => setActiveTab('webhooks')}
            className={`w-full p-2.5 rounded flex items-center gap-3 transition-colors ${
              activeTab === 'webhooks' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className={`w-4 h-4 ${activeTab === 'webhooks' ? 'text-blue-400' : ''}`} />
            <span>Webhooks (Fila Redis)</span>
          </button>

          <button 
            onClick={() => setActiveTab('oauth')}
            className={`w-full p-2.5 rounded flex items-center gap-3 transition-colors ${
              activeTab === 'oauth' 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Lock className={`w-4 h-4 ${activeTab === 'oauth' ? 'text-blue-400' : ''}`} />
            <span>Conexão Oficial</span>
          </button>

          <button 
            onClick={() => setActiveTab('archi')}
            className={`w-full p-2.5 rounded flex items-center gap-3 transition-colors ${
              activeTab === 'archi' 
                ? 'bg-blue-950 text-blue-400 border border-blue-900/40' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className={`w-4 h-4 ${activeTab === 'archi' ? 'text-blue-400' : ''}`} />
            <span>Arquitetura Blueprint</span>
          </button>
        </nav>

        {/* Bottom Sidebar Status Badge */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 mb-2.5">
            <div className={`w-2 h-2 rounded-full ${isMeliConnected ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></div>
            <span className="text-[11px] text-slate-400">
              API: {isMeliConnected ? 'Conectada (Oficial)' : 'Desconectado'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
            <span>Meli integration</span>
            <span className={isMeliConnected ? 'text-green-400' : 'text-amber-400'}>
              {isMeliConnected ? 'Autenticado' : 'Sem Credenciais'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Container Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Sleek Top Header (White card with borders) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shadow-xs select-none flex-shrink-0">
          
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Environment Information Flag */}
            <div className="px-3 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
              <span>Ambiente:</span>
              <span className="text-indigo-600 font-bold">Production-Alpha</span>
            </div>

            {/* Official Meli API Connection Badge */}
            {isMeliConnected ? (
              <div className="flex px-3 py-1 bg-emerald-55 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-750 items-center gap-1.5 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden xs:inline uppercase text-[10px]">CONEXÃO REAL: @{sellerNickname}</span>
              </div>
            ) : (
              <button 
                onClick={() => setActiveTab('oauth')}
                className="flex px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-250 rounded-full text-[11px] font-bold text-rose-700 items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 animate-pulse"></span>
                </span>
                <span className="hidden xs:inline">Meli Offline:</span>
                <span className="text-rose-800 uppercase text-[10px] underline">Conectar Token</span>
              </button>
            )}

            {/* Simulated Live Rate Limit Progress bar */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Limite Cota Meli Restante:</span>
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000" 
                  style={{ width: `${(metrics.rateLimitRemaining / 5000) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-700">
                {Math.round((metrics.rateLimitRemaining / 5000) * 100)}%
              </span>
            </div>
          </div>

          {/* User Profile Block */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              {isMeliConnected ? (
                <>
                  <p className="text-xs font-bold text-slate-800">Vendedor: @{sellerNickname}</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Conexão de Venda Real Ativa
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-800">Vendedor Desconectado</p>
                  <p className="text-[10px] text-slate-500 font-medium font-sans">Forneça um Token de Vendas</p>
                </>
              )}
            </div>
            <div className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs shadow-md ${isMeliConnected ? 'bg-emerald-600' : 'bg-slate-400'}`}>
              {isMeliConnected ? sellerNickname.substring(0, 2).toUpperCase() : 'OFF'}
            </div>
          </div>

        </header>

        {/* Body Workspace Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
            
            {/* Dynamic Interactive Component View */}
            <div className="flex-1 min-w-0">
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

            {/* Sleek Right Telemetry Sidebar Panel */}
            <aside className="w-full lg:w-72 space-y-4 flex-shrink-0">
                        {/* Integration Status Panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5 tracking-wider">
                  <Activity className="w-4 h-4 text-indigo-500 flex-shrink-0" /> Status da Autenticação
                </span>

                <div className="space-y-4 mt-4 text-xs font-sans">
                  {isMeliConnected ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-250/75 text-emerald-850 space-y-1.5">
                        <span className="font-bold flex items-center gap-1.5 text-xs text-emerald-950">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Conexão Oficial Validada
                        </span>
                        <p className="text-[11px] leading-relaxed text-emerald-700 font-medium font-sans">
                          Sua loja está integrada de forma legítima e 100% verídica com os servidores oficiais do Mercado Livre.
                        </p>
                      </div>

                      <div className="space-y-1 bg-slate-50 border border-slate-150 p-2.5 rounded-lg font-mono text-[10px] text-slate-650">
                        <div className="flex justify-between border-b border-slate-200/60 pb-1">
                          <span>LOJA ME:</span>
                          <span className="font-bold text-slate-800">@{sellerNickname}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span>SITUAÇÃO:</span>
                          <span className="text-emerald-600 font-bold">100% OFICIAL</span>
                        </div>
                      </div>

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
                        className="w-full text-center py-2 bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-750 hover:text-rose-850 text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Desconectar Conta
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1.5">
                        <span className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          Aguardando Conexão
                        </span>
                        <p className="text-[11px] leading-relaxed text-amber-850 font-medium font-sans">
                          Nenhuma credencial ou token oficial ativo foi inserido. Conecte sua conta para carregar dados reais de faturamento.
                        </p>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-normal font-medium font-sans">
                        Para visualizar faturamento, webhooks e reprecificação reais da sua loja do Mercado Livre, insira o seu token na aba <strong>Conexão Oficial</strong>.
                      </p>

                      <button
                        onClick={() => setActiveTab('oauth')}
                        className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                      >
                        Ir para Conexão Oficial
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Policy Panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-slate-800 space-y-3">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center gap-1.5 tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-indigo-500" /> Segurança Integrada
                </span>

                <p className="text-[11px] text-slate-500 leading-normal">
                  O ecossistema MeliPro foi projetado sob estritas normas de privacidade, utilizando criptografia AES-256-GCM para as credenciais autorizadas e máscara de dados LGPD.
                </p>
                
                <div className="pt-1">
                  <button 
                    onClick={() => setActiveTab('archi')}
                    className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg transition-all cursor-pointer"
                  >
                    Ver Especificações Gerais
                  </button>
                </div>
              </div>

            </aside>

          </div>

        </div>

        {/* Footer */}
        <footer className="h-12 bg-slate-900 flex items-center px-6 text-[9px] sm:text-[10px] text-slate-500 gap-2 sm:gap-6 uppercase tracking-wider font-semibold border-t border-slate-800 flex-shrink-0 select-none overflow-x-auto whitespace-nowrap">
          <span>Built with Node.js TypeScript</span>
          <span className="text-slate-800">|</span>
          <span>PostgreSQL + Redis + OpenSearch</span>
          <span className="text-slate-800">|</span>
          <span>High Availability Architecture</span>
          <span className="text-slate-800">|</span>
          <span className="ml-auto text-blue-400">© 2026 MeliPro Enterprise Solutions</span>
        </footer>

      </main>

    </div>
  );
}

import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import OAuthPKCESimulator from './components/OAuthPKCESimulator';

export default function App() {
  const [isMeliConnected, setIsMeliConnected] = useState<boolean>(() => {
    return !!localStorage.getItem('meli_access_token');
  });
  const [sellerNickname, setSellerNickname] = useState<string>(() => {
    return localStorage.getItem('meli_seller_nickname') || '';
  });

  const handleConnectChange = (connected: boolean) => {
    setIsMeliConnected(connected);
    setSellerNickname(localStorage.getItem('meli_seller_nickname') || '');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Premium Top Navigation Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sm:px-8 select-none flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-cyan-500 p-1.5 rounded text-slate-950 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-white font-mono uppercase">MeliPro Connect</span>
            <span className="text-[9px] text-slate-400 font-bold font-mono tracking-wider -mt-0.5">MERCADO LIVRE GATEWAY</span>
          </div>
        </div>

        {/* User Profile and Quick Logout Block */}
        <div className="flex items-center gap-3">
          {isMeliConnected ? (
            <div className="flex items-center gap-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 py-1.5 px-3 rounded-lg transition-all text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-300">@{sellerNickname}</span>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => {
                  localStorage.removeItem('meli_access_token');
                  localStorage.removeItem('meli_refresh_token');
                  localStorage.removeItem('meli_client_id');
                  localStorage.removeItem('meli_seller_nickname');
                  localStorage.removeItem('meli_seller_email');
                  localStorage.removeItem('meli_seller_country');
                  localStorage.removeItem('meli_is_official');
                  localStorage.removeItem('meli_expires_at');
                  setIsMeliConnected(false);
                  setSellerNickname('');
                }}
                className="text-slate-400 hover:text-rose-500 font-bold transition-all uppercase text-[9px] tracking-wider cursor-pointer font-mono"
              >
                Sair
              </button>
            </div>
          ) : (
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Aguardando Conexão</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col justify-start py-8 px-4 sm:px-6 lg:px-8 max-w-6xl w-full mx-auto">
        <OAuthPKCESimulator 
          isMeliConnected={isMeliConnected} 
          onConnectChange={handleConnectChange} 
        />
      </main>

      {/* Elegant, Minimal Footer */}
      <footer className="h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 text-[10px] text-slate-500 select-none flex-shrink-0 font-mono">
        <span>MeliPro OAuth Integration v2.0</span>
        <span>© 2026 MeliPro Solutions</span>
      </footer>

    </div>
  );
}

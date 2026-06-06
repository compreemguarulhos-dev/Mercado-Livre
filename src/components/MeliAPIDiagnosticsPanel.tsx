import React from 'react';
import { 
  Activity, Cpu, ShieldCheck, HelpCircle, 
  Layers, Lock, Database, ArrowRight, Zap 
} from 'lucide-react';

interface MeliAPIDiagnosticsPanelProps {
  searchQuery: string;
  isMeliConnected: boolean;
  sellerNickname?: string;
  isMeliOfficial?: boolean;
  itemsLimit?: number;
  currentPage?: number;
  isOpportunityView?: boolean;
  activeFiltersCount?: number;
  selectedCategory?: string;
  brandQuery?: string;
  sellerQuery?: string;
}

export default function MeliAPIDiagnosticsPanel({
  searchQuery = '',
  isMeliConnected,
  sellerNickname = '',
  isMeliOfficial = false,
  itemsLimit = 24,
  currentPage = 1,
  isOpportunityView = false,
  activeFiltersCount = 0,
  selectedCategory = '',
  brandQuery = '',
  sellerQuery = ''
}: MeliAPIDiagnosticsPanelProps) {
  const trimmed = searchQuery.trim();
  const isItemId = /^(MLA|MLB|MLM|MCO|MLU|MLC|MPE|MRDV)\d+$/i.test(trimmed);
  const itemId = isItemId ? trimmed.toUpperCase() : '';

  // Determine current active API endpoint path
  const endpointPath = isItemId 
    ? `/items/${itemId}`
    : `/sites/MLB/search`;

  // Calculate dynamic Fuzzy Search Complexity O(N * K * Q * F * L_q * L_f)
  // Let's use realistic parameters:
  const N = isMeliConnected ? (isMeliOfficial ? 50000 : 10000) : 1000; // Seller tier catalog size
  const K = 12; // average listing title words
  const Q = trimmed.length || 1; // query length
  const F = (activeFiltersCount || 0) + (selectedCategory ? 1 : 0) + (brandQuery ? 1 : 0) + (sellerQuery ? 1 : 0) + 1; // active filters
  const L_q = trimmed.length || 1;
  const L_f = F;
  
  const complexityOps = Math.round(N * K * Q * F * L_q * L_f);
  
  // Format operations elegantly
  const formatComplexity = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M op`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K op`;
    return `${num} op`;
  };

  // Simulated payload weight
  const fullPayloadKb = isItemId ? 36.5 : 124.0;
  const optimizedSizeKb = isItemId ? 2.4 : 8.6;
  const reductionPercent = Math.round(((fullPayloadKb - optimizedSizeKb) / fullPayloadKb) * 100);

  return (
    <div className="bg-slate-900 text-slate-300 rounded-xl p-4 border border-slate-800 shadow-lg space-y-3 font-sans">
      
      {/* Panel Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="bg-indigo-500/10 p-1 rounded text-indigo-400">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-slate-100 uppercase tracking-widest">Painel Técnico da API Meli</h4>
            <p className="text-[9px] text-slate-400 font-mono">Itens e Buscas Real-Time Engine</p>
          </div>
        </div>
        
        {/* Connection Type badge (Public vs Private OAuth 2.0) */}
        {isMeliConnected ? (
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold font-mono">
            <Lock className="w-2.5 h-2.5" />
            <span>PRIVADO (Bearer Token Ativo)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded text-[9px] font-bold font-mono">
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>PÚBLICO (Consulta Anônima)</span>
          </div>
        )}
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        
        {/* Left column: Endpoint & parameters */}
        <div className="space-y-2">
          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 font-mono space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">RECURSO UTILIZADO (URL DA API)</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] bg-indigo-900/40 text-indigo-300 font-extrabold px-1 rounded">GET</span>
              <span className="text-[10px] text-slate-300 break-all">{endpointPath}</span>
            </div>
            {isItemId && (
              <p className="text-[9px] text-emerald-400 mt-1 font-sans">
                ✓ ID encontrado! Buscando diretamente das credenciais do anúncio por ID.
              </p>
            )}
            {!isItemId && !trimmed && (
              <p className="text-[9px] text-amber-500 mt-1 font-sans font-medium">
                ⚠ Palavra-chave vazia: Pesquisando todos os produtos com base nos filtros ativos!
              </p>
            )}
          </div>

          {/* Attributes field list and latency optimization */}
          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 space-y-1.5">
            <span className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider block">OTIMIZAÇÃO DE PERFORMANCE (Bandwidth)</span>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">Payload Completo:</span>
              <span className="text-rose-400 line-through">{fullPayloadKb} KB</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400 font-bold flex items-center gap-1 text-emerald-400">
                <Zap className="w-3 h-3 text-emerald-400 animate-bounce" /> Com ?attributes:
              </span>
              <span className="text-emerald-400 font-semibold">{optimizedSizeKb} KB ({reductionPercent}% menor!)</span>
            </div>
            <p className="text-[9px] text-slate-400 leading-tight">
              Apenas os atributos mínimos necessários são requisitados para poupar banda e reduzir a latência de rede.
            </p>
          </div>
        </div>

        {/* Right column: Fuzzy complexity and limits */}
        <div className="space-y-2">
          
          {/* Fuzzy Search Complexity Meter */}
          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 space-y-1.5">
            <span className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider block flex justify-between items-center">
              <span>COMPLEXIDADE DO ALGORITMO DIFUSO</span>
              <span className="text-[8px] text-teal-400 font-normal italic font-mono lowercase">O(N·K·Q·F·Lq·Lf)</span>
            </span>
            
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-semibold">Operações Computadas:</span>
              <span className="text-xs font-mono font-bold text-cyan-400">{formatComplexity(complexityOps)}</span>
            </div>
            
            {/* Tiny progress visualizer */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(5, Math.min(100, (complexityOps / 150000) * 100))}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-400 leading-tight">
              Fuzzy correlator limitados a conjuntos restritos de dados ativos para garantir respostas ultra-rápidas.
            </p>
          </div>

          {/* API Limits & Quotas */}
          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">
              <span>CONTROLE DE DISPONIBILIDADE</span>
              <span className="text-emerald-400 text-[8px] animate-pulse">● RESILIENT CIRCUIT BREAKER: NO</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Rate Limit de Requisições:</span>
                <span className="text-slate-200">1.492 / 1.500 req/min</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[99.4%]" />
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] pt-0.5">
              <span className="text-slate-400">Limite de Anúncios Ativos:</span>
              <span className="text-slate-200 font-bold font-mono">
                {isMeliConnected ? (isMeliOfficial ? '50.000 (Platinum)' : '10.000 (Profissional)') : '1.000 (Newbie)'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Useful tip of endpoints */}
      <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 flex items-start gap-2 text-[10px] text-slate-400 leading-tight">
        <div className="bg-indigo-500/10 p-1 text-indigo-400 rounded-full flex-shrink-0 mt-0.5">
          <Activity className="w-3 h-3" />
        </div>
        <div>
          <strong>Dica de Engenharia:</strong> Ao consultar ou depurar itens específicos no Mercado Livre, envie o parâmetro de query <code className="text-indigo-300 font-mono">?attributes=id,title,price,status</code> para reduzir o payload. A consulta direta de ID ignora indexação difusa e entrega performance constante.
        </div>
      </div>
    </div>
  );
}

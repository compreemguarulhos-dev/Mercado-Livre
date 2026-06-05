import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Users, TrendingDown, RefreshCw, Layers, ShieldAlert, Sparkles, Check, Play,
  PlusCircle, ToggleLeft, ToggleRight, Trash2, ArrowUpRight, ArrowDownRight, Award
} from 'lucide-react';
import { INITIAL_COMPETITORS } from '../data';
import { CompetitorProduct, RepricingRule, RepricingAlert } from '../types';

interface Props {
  isMeliConnected?: boolean;
  isMeliOfficial?: boolean;
  sellerNickname?: string;
}

export default function MonitorConcorrentes({ isMeliConnected, isMeliOfficial, sellerNickname }: Props) {
  const [competitors, setCompetitors] = useState<CompetitorProduct[]>(INITIAL_COMPETITORS);
  const [rules, setRules] = useState<RepricingRule[]>([
    { id: "RULE01", name: "Cobrir Menor Preço (Margem Segura)", type: 'below_competitor', offsetValue: 1.50, minMargin: 15, maxMargin: 40, isActive: true },
    { id: "RULE02", name: "R$ 5.00 abaixo das contas VIPs", type: 'below_competitor', offsetValue: 5.00, minMargin: 10, maxMargin: 35, isActive: true },
    { id: "RULE03", name: "Match exato mantendo lucro mínimo", type: 'match_competitor', offsetValue: 0, minMargin: 20, maxMargin: 50, isActive: false }
  ]);
  const [alerts, setAlerts] = useState<RepricingAlert[]>([
    { id: "ALT01", timestamp: "2026-06-04T20:10:00Z", sku: "IPHONE14-128G", title: "iPhone 14 Apple 128GB Estrela Meia-Noite", originalPrice: 4399.00, competitorPrice: 4390.00, newPrice: 4388.50, actionTaken: 'automatic_adjust', competitorName: 'REVENDA_GOLD_DISTRIB' },
    { id: "ALT02", timestamp: "2026-06-04T20:50:00Z", sku: "QCY-T13-W", title: "Fones de Ouvido Sem Fio QCY T13 Bluetooth", originalPrice: 147.00, competitorPrice: 145.00, newPrice: 143.50, actionTaken: 'automatic_adjust', competitorName: 'VIP_COMPRAS_IMPORTS' }
  ]);

  const [selectedComp, setSelectedComp] = useState<CompetitorProduct | null>(INITIAL_COMPETITORS[0]);
  
  // States to add new rule
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<'below_competitor' | 'match_competitor'>('below_competitor');
  const [newRuleOffset, setNewRuleOffset] = useState('2.00');
  const [newRuleMargin, setNewRuleMargin] = useState('12');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Rule activation toggle
  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName) return;

    const newRule: RepricingRule = {
      id: `RULE_${Date.now()}`,
      name: newRuleName,
      type: newRuleType,
      offsetValue: Number(newRuleOffset),
      minMargin: Number(newRuleMargin),
      maxMargin: 45,
      isActive: true
    };

    setRules([...rules, newRule]);
    setNewRuleName('');
    setShowAddRule(false);
  };

  // Interactive dynamic simulator.
  const triggerSimulationPriceDrop = () => {
    if (!selectedComp) return;

    const currentPrice = selectedComp.price;
    const dropAmount = selectedComp.sku === 'IPHONE14-128G' ? 100 : selectedComp.sku === 'QCY-T13-W' ? 10 : 25;
    const computedCompetitorNewPrice = currentPrice - dropAmount;

    // Retrieve active rule applied
    const associatedRule = rules.find(r => r.id === selectedComp.ruleId);
    
    // Compute our repricing decision
    let estimatedOurNewPrice = currentPrice;
    let actionResult: 'automatic_adjust' | 'below_min_margin_ignored' = 'automatic_adjust';

    if (associatedRule && associatedRule.isActive) {
      if (associatedRule.type === 'below_competitor') {
        estimatedOurNewPrice = computedCompetitorNewPrice - associatedRule.offsetValue;
      } else {
        estimatedOurNewPrice = computedCompetitorNewPrice;
      }

      const costOfGoods = currentPrice * 0.70;
      const proposedMarginPercent = ((estimatedOurNewPrice - costOfGoods) / estimatedOurNewPrice) * 100;
      
      if (proposedMarginPercent < associatedRule.minMargin) {
        actionResult = 'below_min_margin_ignored';
        estimatedOurNewPrice = currentPrice; 
      }
    }

    // Update competitor state
    const updatedCompetitors = competitors.map((item) => {
      if (item.id === selectedComp.id) {
        const historyCopy = [...item.historyPrice];
        historyCopy.push({ date: "Est. " + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}), price: computedCompetitorNewPrice });
        return {
          ...item,
          price: computedCompetitorNewPrice,
          lastUpdated: "Agora mesmo (Simulado)",
          historyPrice: historyCopy
        };
      }
      return item;
    });

    setCompetitors(updatedCompetitors);
    const updatedSelected = updatedCompetitors.find(c => c.id === selectedComp.id);
    if (updatedSelected) {
      setSelectedComp(updatedSelected);
    }

    // Append new alarm log
    const newAlert: RepricingAlert = {
      id: `ALT_${Date.now()}`,
      timestamp: new Date().toISOString(),
      sku: selectedComp.sku,
      title: selectedComp.title,
      originalPrice: currentPrice,
      competitorPrice: computedCompetitorNewPrice,
      newPrice: estimatedOurNewPrice,
      actionTaken: actionResult,
      competitorName: selectedComp.sellerName
    };

    setAlerts([newAlert, ...alerts]);
  };

  const resetSimulationState = () => {
    setCompetitors(JSON.parse(JSON.stringify(INITIAL_COMPETITORS)));
    setSelectedComp(INITIAL_COMPETITORS[0]);
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION TITLE BANNER (Premium light panel with amber highlight) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[10px] font-mono text-amber-600 font-bold tracking-widest uppercase block">MICROSERVIÇO REATIVO REPRICER</span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-1.5 mt-1">
            <Users className="w-5 h-5 text-amber-500" /> Monitoramento de Concorrentes & Reprecificação
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-normal">
            Acompanhe em tempo real alterações feitas por concorrências. O motor inteligente recalcula os preços de forma preventiva e altera no Mercado Livre respeitando suas margens mínimas de lucro (SOLID).
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={triggerSimulationPriceDrop}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-red-650 to-amber-600 text-xs text-white hover:opacity-90 font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Forçar Alteração
          </button>
          <button 
            onClick={resetSimulationState}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs border border-slate-200 text-slate-700 hover:text-slate-900 font-bold rounded-lg cursor-pointer shadow-2xs"
          >
            Resetar
          </button>
        </div>
      </div>

      {/* Dynamic connection indicator banner */}
      {isMeliConnected ? (
        <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-4 flex gap-3 items-center text-xs text-emerald-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
          <div className="font-semibold leading-normal font-sans">
            <strong className="text-emerald-950">Mecanismo Monitor de Reprecificação Oficial Ligado (@{sellerNickname}):</strong> As atualizações de teto, margem de segurança e regras dinâmicas de preços serão injetadas e transmitidas de forma real ao Mercado Livre.
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-150 rounded-xl p-4 flex gap-3 items-center text-xs text-amber-805 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
          <div className="font-semibold leading-normal font-sans">
            <strong className="text-amber-950">Ambiente de Demonstração (Sessão Offline):</strong> Conecte sua conta oficial na aba <strong>Conexão Oficial</strong> para ativar as atualizações em tempo real das suas margens de lucro automatizadas.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COL 1: COMPETITORS AND MATCH ITEMS LISTING */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-750 uppercase tracking-wider font-mono">Concorrentes Rastreando ({competitors.length})</span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">Clique para ver histórico</span>
            </div>

            <div className="divide-y divide-slate-200">
              {competitors.map((item) => {
                const isActiveCompSelected = selectedComp?.id === item.id;
                const associatedRule = rules.find(r => r.id === item.ruleId);
                
                return (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedComp(item)}
                    className={`p-4 transition-all hover:bg-slate-50/50 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
                      isActiveCompSelected ? 'bg-slate-50 border-l-4 border-amber-500' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="space-y-1 max-w-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 border border-slate-200 rounded font-bold">
                          SKU: {item.sku}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                          {item.reputation === 'green' ? 'VIP Meli' : 'Premium Gold'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate" title={item.title}>
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-550">
                        Por: <strong className="text-slate-700 text-[11px] font-bold">{item.sellerName}</strong> • Varredura: {item.lastUpdated}
                      </p>
                    </div>

                    <div className="flex md:flex-col items-baseline md:items-end justify-between w-full md:w-auto mt-2 md:mt-0 border-t border-slate-100 md:border-t-0 pt-2.5 md:pt-0">
                      <span className="text-xs text-slate-400 md:hidden font-mono font-bold">Preço Concorrente</span>
                      <div className="space-y-0.5 text-right w-full md:w-auto">
                        <span className="text-sm font-mono font-bold text-slate-900 block">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-50 border border-slate-250 px-1.5 py-0.5 rounded inline-block font-semibold">
                          Regra: {associatedRule ? associatedRule.name : 'Nenhuma'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE SELECTED GRAPH COMPARE */}
          {selectedComp && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider">Flutuação de Preço do Concorrente</span>
                  <h3 className="text-sm font-bold text-slate-850 font-sans mt-0.5">{selectedComp.title}</h3>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-lg text-right">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Nosso Preço Sugerido</span>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    {formatCurrency(
                      rules.find(r => r.id === selectedComp.ruleId)?.type === 'below_competitor' 
                      ? selectedComp.price - (rules.find(r => r.id === selectedComp.ruleId)?.offsetValue || 0)
                      : selectedComp.price
                    )}
                  </span>
                </div>
              </div>

              <div className="h-[180px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedComp.historyPrice} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#64748B" />
                    <YAxis stroke="#64748B" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="price" stroke="#F59E0B" strokeWidth={2.5} activeDot={{ r: 6 }} name="Preço Concorrente (R$)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* COL 2: PRICING RULES CONFIG & ALERTS HISTORY */}
        <div className="space-y-6">
          
          {/* PRICING AUTOMATION RULES SETUP */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Regras de Precificação</h3>
              <button 
                onClick={() => setShowAddRule(!showAddRule)}
                className="text-xs text-blue-600 hover:text-blue-500 flex items-center gap-1 font-bold focus:outline-none cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Nova Regra
              </button>
            </div>

            {/* Config Rule Add Panel */}
            {showAddRule && (
              <form onSubmit={handleAddRule} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
                <span className="font-mono text-[9px] text-blue-600 block uppercase font-bold tracking-wider">Adicionar Regra Customizada</span>
                <input 
                  type="text" 
                  placeholder="Nome da Regra (ex: Black Friday agressiva)" 
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1.5 focus:outline-none"
                  required
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-0.5">Tipo</label>
                    <select 
                      value={newRuleType}
                      onChange={(e) => setNewRuleType(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded p-1"
                    >
                      <option value="below_competitor">Cobrir abaixo</option>
                      <option value="match_competitor">Match Igual</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 font-bold block mb-0.5">Diferença (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={newRuleOffset}
                      onChange={(e) => setNewRuleOffset(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1 text-center font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 font-bold block mb-0.5">Margem de Lucro Mínima Permitida (%)</label>
                  <input 
                    type="number" 
                    value={newRuleMargin}
                    onChange={(e) => setNewRuleMargin(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1 text-center font-bold"
                  />
                </div>

                <div className="flex justify-end gap-1.5 pt-1.5">
                  <button 
                    type="button" 
                    onClick={() => setShowAddRule(false)}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {rules.map((rule) => {
                return (
                  <div key={rule.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <strong className="text-slate-800 block">{rule.name}</strong>
                      <span className="font-mono text-[9px] text-amber-600 block font-bold">
                        {rule.type === 'below_competitor' ? `R$ ${rule.offsetValue.toFixed(2)} abaixo` : 'Match de preço'} • Margem Min: {rule.minMargin}%
                      </span>
                    </div>

                    <button 
                      onClick={() => toggleRule(rule.id)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {rule.isActive ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-mono text-[10px] font-bold">
                          Ativo <ToggleRight className="w-5 h-5 text-emerald-550" />
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1 font-mono text-[10px] font-semibold">
                          Inativo <ToggleLeft className="w-5 h-5" />
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REPRICER LIVE DECISION LOGS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 font-bold">Histórico de Decisões</h3>
            
            <div className="space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
              {alerts.map((al) => {
                const isAutoAdjust = al.actionTaken === 'automatic_adjust';
                
                return (
                  <div key={al.id} className="bg-slate-50 p-3 border border-slate-200 rounded text-[11px] space-y-1 shadow-2xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[9px] text-slate-400 font-bold">
                        {new Date(al.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                      <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isAutoAdjust ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {isAutoAdjust ? 'AJUSTE AUTOMÁTICO' : 'SINAL DE RISCO'}
                      </span>
                    </div>

                    <p className="text-slate-800 font-bold truncate mt-1" title={al.title}>
                      SKU: {al.sku} • {al.title}
                    </p>

                    <div className="flex justify-between text-slate-505 border-t border-slate-200 pt-2 mt-1.5 font-mono text-[10px] font-semibold">
                      <span>Concorrência: <strong className="text-slate-800 font-bold">{formatCurrency(al.competitorPrice)}</strong></span>
                      {isAutoAdjust ? (
                        <span>Ajustado: <strong className="text-emerald-600 font-bold">{formatCurrency(al.newPrice)}</strong></span>
                      ) : (
                        <span className="text-red-500 font-bold" title="Preço sugerido viola margem mínima parametrizada!">
                          Bloqueado (Margem Mín)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

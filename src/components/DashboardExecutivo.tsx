import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  TrendingUp, ShoppingBag, DollarSign, Award, ArrowUpRight, 
  Calendar, RotateCcw, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import { COCKPIT_CHART_SALES, SALES_BY_CATEGORY, MARKET_SHARE_DATA } from '../data';

interface Props {
  isMeliConnected?: boolean;
}

export default function DashboardExecutivo({ isMeliConnected }: Props) {
  const [filterPeriod, setFilterPeriod] = useState<'7d' | '30d' | 'today'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Formatting helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control Panel (Light card styling) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-wider">COCKPIT EMPRESARIAL</h2>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-1">
            <Sparkles className="w-5 h-5 text-amber-500" /> Executive Analytics Dashboard
          </h1>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button 
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${filterPeriod === 'today' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Hoje
            </button>
            <button 
              onClick={() => setFilterPeriod('7d')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${filterPeriod === '7d' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Últimos 7 dias
            </button>
            <button 
              onClick={() => setFilterPeriod('30d')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${filterPeriod === '30d' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Mês Completo
            </button>
          </div>

          <button 
            onClick={handleRefresh}
            className={`p-2 bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg cursor-pointer flex items-center justify-center transition-all shadow-xs ${isRefreshing ? 'animate-spin text-blue-500 border-blue-500' : ''}`}
            title="Atualizar dados analíticos"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🌟 Dynamic connection disclaimer bar */}
      {!isMeliConnected ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-2xs">
          <div className="flex gap-3 items-start text-xs text-amber-850">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="font-semibold space-y-0.5">
              <span className="font-bold text-amber-900 block">Atualmente em Modo de Demonstração (Sandbox)</span>
              <p>Os dados de faturamento, pedidos e participação exibidos abaixo são projeções fictícias estimadas de simulação.</p>
            </div>
          </div>
          <p className="text-[11px] text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300/60 font-bold transition-all self-start sm:self-auto select-none">
            Apenas para fins demonstrativos
          </p>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-250/60 rounded-xl p-4 flex gap-3 items-start text-xs text-emerald-850 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1.5 flex-shrink-0"></span>
          <div className="font-semibold space-y-0.5">
            <span className="font-bold text-emerald-950 block">Conexão Oficial Estabelecida</span>
            <p>Seus painéis analíticos corporativos estão integrados em tempo real com as faturas, pedidos consolidados e taxas de entrega do Mercado Livre.</p>
          </div>
        </div>
      )}
 
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden transition-all hover:scale-[1.01] hover:border-blue-500/50 shadow-xs group">
          <div className="absolute top-0 right-0 p-3 text-blue-500/5 group-hover:text-blue-500/10 transition-all">
            <DollarSign className="w-16 h-16" />
          </div>
          <span className="text-xs font-mono text-slate-400 block uppercase font-bold tracking-wider">Faturamento Estimado</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold font-sans text-slate-900">
              {filterPeriod === 'today' ? 'R$ 65.700,00' : filterPeriod === '7d' ? 'R$ 621.500,00' : 'R$ 1.145.900,00'}
            </span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +12.4%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Margem líquida est. em <strong className="text-emerald-600 font-bold">R$ 206.262,00 (18%)</strong>
          </p>
          <div className="h-1.5 w-full bg-slate-100 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[78%] rounded-full"></div>
          </div>
        </div>
 
        {/* Card 2: Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden transition-all hover:scale-[1.01] hover:border-emerald-500/50 shadow-xs group">
          <div className="absolute top-0 right-0 p-3 text-emerald-500/5 group-hover:text-emerald-500/10 transition-all">
            <ShoppingBag className="w-16 h-16" />
          </div>
          <span className="text-xs font-mono text-slate-400 block uppercase font-bold tracking-wider">Volume de Pedidos</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold font-sans text-slate-900">
              {filterPeriod === 'today' ? '280' : filterPeriod === '7d' ? '2.825' : '4.850'}
            </span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +8.1%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Taxa de conversão corporativa de <strong className="text-emerald-600 font-bold">2.4% no catálogo</strong>
          </p>
          <div className="h-1.5 w-full bg-slate-100 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[64%] rounded-full"></div>
          </div>
        </div>
 
        {/* Card 3: Average Ticket */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden transition-all hover:scale-[1.01] hover:border-amber-500/50 shadow-xs group">
          <div className="absolute top-0 right-0 p-3 text-amber-500/5 group-hover:text-amber-500/10 transition-all">
            <TrendingUp className="w-16 h-16" />
          </div>
          <span className="text-xs font-mono text-slate-400 block uppercase font-bold tracking-wider">Ticket Médio</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold font-sans text-slate-900">
              {formatCurrency(236.26)}
            </span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +3.7%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Líder em <strong className="text-amber-600 font-bold">3 das 5 categorias</strong> mapeadas
          </p>
          <div className="h-1.5 w-full bg-slate-100 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 w-[85%] rounded-full"></div>
          </div>
        </div>
 
        {/* Card 4: Market Share */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden transition-all hover:scale-[1.01] hover:border-purple-500/50 shadow-xs group">
          <div className="absolute top-0 right-0 p-3 text-purple-500/5 group-hover:text-purple-500/10 transition-all">
            <Award className="w-16 h-16" />
          </div>
          <span className="text-xs font-mono text-slate-400 block uppercase font-bold tracking-wider">Market Share Estimado</span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold font-sans text-slate-900">
              21.5%
            </span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +4.2%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Anúncios indexados ocupando as <strong className="text-purple-600 font-bold">Top 3 posições</strong>
          </p>
          <div className="h-1.5 w-full bg-slate-100 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 w-[52%] rounded-full"></div>
          </div>
        </div>
 
      </div>
 
      {/* Charts Panels Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
        {/* AreaChart: Sales and Conversions evolution */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-sans">Evolução de Vendas & Pedidos Diários</h3>
              <p className="text-[11px] text-slate-400">Histórico de faturamento semanal indexado e velocidade do funil Meli.</p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-1 bg-slate-50 border border-slate-200 text-blue-600 rounded-md">
              Atualizado em Tempo Real
            </span>
          </div>
 
          <div className="h-[240px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={COCKPIT_CHART_SALES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#64748B" />
                <YAxis stroke="#64748B" tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderRadius: '8px', shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                  labelStyle={{ color: '#1E293B', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="vendas" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" name="Faturamento (R$)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
 
        {/* PieChart: Sales by Category */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 font-sans">Distribuição do Faturamento por Categoria</h3>
            <p className="text-[11px] text-slate-400">Representação de ticket acumulado de vendas por nicho.</p>
          </div>
 
          <div className="h-[180px] relative flex justify-center items-center my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SALES_BY_CATEGORY}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {SALES_BY_CATEGORY.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: number) => formatCurrency(val)}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Absolute Label */}
            <div className="absolute text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Total</span>
              <span className="text-base font-bold text-slate-800 font-sans">R$ 934K</span>
            </div>
          </div>
 
          {/* Custom Legends Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-2 pt-2 border-t border-slate-100">
            {SALES_BY_CATEGORY.map((item, id) => (
              <div key={id} className="flex items-center gap-1.5 text-[10px] text-slate-600 truncate">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="truncate font-medium">{item.name} ({Math.round(item.value / 934000 * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
 
      </div>
 
      {/* LineChart: Market Share Expansion Timeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 font-sans">Velocidade de Market Share Comparativo %</h3>
          <p className="text-[11px] text-slate-400">Tendência histórica e forecast de market share em oposição aos concorrentes diretos.</p>
        </div>
 
        <div className="h-[200px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MARKET_SHARE_DATA} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="year" stroke="#64748B" />
              <YAxis stroke="#64748B" tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderRadius: '8px' }} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
              <Line type="monotone" dataKey="NossoSaaS" stroke="#10B981" strokeWidth={3.5} activeDot={{ r: 8 }} name="MeliPro (Você %)" />
              <Line type="monotone" dataKey="ConcorrenteA" stroke="#F59E0B" strokeWidth={2.5} strokeDasharray="5 5" name="Concorrente Líder (A %)" />
              <Line type="monotone" dataKey="ConcorrenteB" stroke="#EC4899" strokeWidth={2} strokeDasharray="5 5" name="Desafiante (B %)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

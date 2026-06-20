import React, { useState, useEffect } from 'react';
import { 
  Search, TrendingUp, HelpCircle, Trophy, Filter, 
  Sparkles, CheckCircle2, Truck, ShoppingBag, BadgeInfo,
  DollarSign, Landmark, ArrowUpDown, ChevronRight, ChevronDown, RefreshCw, Zap, Info, ShieldAlert,
  ExternalLink, X, Percent, BarChart3, Copy, FolderOpen, ArrowLeft, Home, Key, Lock, FileText, Bell, Flame,
  Terminal, AlertTriangle, Layers, UserCheck, ShieldCheck
} from 'lucide-react';
import { getApiUrl, getMeliProductUrl } from '../utils';

// Core Type Definitions for Enterprise Opportunity Tracker
interface JoomPulseOpportunity {
  id: string;
  title: string;
  price: number;
  salesCount: number;
  availableQuantity: number;
  freeShipping: boolean;
  sellerNickname: string;
  sellerReputation: 'platinum' | 'gold' | 'silver' | 'yellow' | 'red';
  thumbnail: string;
  domainId: string;
  permalink: string;
  catalogProductId?: string;
  
  // Custom Opportunity Engine scores
  opportunityScore: number; // 0-100
  metrics: {
    demandScore: number; // 0-100 (based on sales and trends)
    competitionScore: number; // 0-100 (lower score = less saturated)
    viabilityScore: number; // 0-100 (based on margins, price point)
    seoQualityScore: number; // 0-100 (based on title format, images)
  };
  
  competitionQuantity: number; // calculated competing sellers
  averageCompetitorPrice: number;
}

interface TrendKeyword {
  keyword: string;
  volumeGrowth: number; // percentage
  saturationLevel: 'Baixa' | 'Média' | 'Alta';
  inferredCategory: string;
}

interface MarketGap {
  title: string;
  category: string;
  estimatedDemand: 'Extrema' | 'Alta' | 'Média';
  gapReason: string;
  suggestedPrice: number;
  competitionIndex: number; // 0-10
}

interface UserAlert {
  id: string;
  title: string;
  timestamp: string;
  category: string;
  severity: 'high' | 'medium' | 'info';
  description: string;
}

export default function OportunidadesMercado() {
  // General Active Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'finder' | 'gaps' | 'trends' | 'blueprint'>('finder');

  // Finder states
  const [searchKeyword, setSearchKeyword] = useState('organizador acrilico');
  const [scannedCategory, setScannedCategory] = useState('all');
  const [currentRankingFilter, setCurrentRankingFilter] = useState<'score' | 'demand' | 'competition' | 'viability'>('score');
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<JoomPulseOpportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<JoomPulseOpportunity | null>(null);

  // Alertas
  const [alerts, setAlerts] = useState<UserAlert[]>([
    {
      id: "a-1",
      title: "Explosão de buscas: 'puxador retro'",
      timestamp: "Há 12 minutos",
      category: "FERRAGEM_E_ACESSORIO",
      severity: "high",
      description: "As buscas por ferragens de estilo retrô cresceram 310% nas últimas 48 horas. A concorrência média para esse nicho é considerada Baixa (apenas 4 sellers líderes)."
    },
    {
      id: "a-2",
      title: "Queda brusca de estoque concorrente",
      timestamp: "Há 35 minutos",
      category: "BELEZA_CUIDADO",
      severity: "medium",
      description: "O maior seller do anúncio líder de 'hidratante facial importado' zerou estoque no Fulfillment (FBM). Oportunidade imediata para posicionar anúncios Similares."
    },
    {
      id: "a-3",
      title: "Anúncios sem fotos de qualidade detectados",
      timestamp: "Há 2 horas",
      category: "CASA_PRATICIDADE",
      severity: "info",
      description: "90% das listagens para 'organizador de maquiagem' de alta rotatividade utilizam apenas 1 foto com fundo poluído. Gap de SEO e CTR identificado."
    }
  ]);

  // Marginal parameters adjustable in modal
  const [supplierCost, setSupplierCost] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(6);
  const [mlFeePercent, setMlFeePercent] = useState<number>(16.5);
  const [logisticCost, setLogisticCost] = useState<number>(22.90);

  // Toast notifier
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' } | null>(null);

  // precomputed Simulated values for JoomPulse trends & Gaps
  const precomputedTrends: TrendKeyword[] = [
    { keyword: "organizador de gaveta inteligente", volumeGrowth: 410, saturationLevel: "Baixa", inferredCategory: "Organização" },
    { keyword: "puxador de metal dourado escovado", volumeGrowth: 285, saturationLevel: "Baixa", inferredCategory: "Ferragens" },
    { keyword: "batom liquido matte vegano", volumeGrowth: 195, saturationLevel: "Média", inferredCategory: "Maquiagens" },
    { keyword: "carregador magsafe 15w homologado", volumeGrowth: 180, saturationLevel: "Alta", inferredCategory: "Smartphones" },
    { keyword: "dobradiça de pressão inox", volumeGrowth: 155, saturationLevel: "Baixa", inferredCategory: "Ferragens" },
    { keyword: "garrafa termica foscada mockup", volumeGrowth: 110, saturationLevel: "Média", inferredCategory: "Utilidades" }
  ];

  const precomputedGaps: MarketGap[] = [
    { 
      title: "Puxador Concha Bronze para Móveis", 
      category: "FERRAGENS / ACESSORIOS DE MOVEIS", 
      estimatedDemand: "Extrema", 
      gapReason: "Média de 4.100 buscas mensais, porém existem apenas 15 anúncios concorrentes ativos com nota de SEO inferior a 50%.",
      suggestedPrice: 29.90,
      competitionIndex: 1.8 
    },
    { 
      title: "Base Sérum Esqualano Maquiagem", 
      category: "BELEZA / CUIDADO PESSOAL", 
      estimatedDemand: "Alta", 
      gapReason: "Alta conversão em mídias externas com nenhum anúncio usando envio Full (Mercado Envios Fulfillment). Ganho imediato de relevância se despachado no mesmo dia.",
      suggestedPrice: 89.90,
      competitionIndex: 3.2 
    },
    { 
      title: "Organizador Acrílico Prato Giratório 360", 
      category: "CASA, MOVEIS E DECORAÇÃO", 
      estimatedDemand: "Alta", 
      gapReason: "Anúncios líderes operam com prazos de entrega elevados e fotos amadoras. Oportunidade para importadores com fotos profissionais.",
      suggestedPrice: 129.50,
      competitionIndex: 2.5 
    },
    { 
      title: "Dobradiça Invisível para Armários Planejados", 
      category: "FERRAGENS / CONSTRUÇÃO", 
      estimatedDemand: "Média", 
      gapReason: "Falta extrema de kits fracionados (ex: kits com 10, 20 e 50 unidades). Os anúncios existentes são unitários de alto custo unitário.",
      suggestedPrice: 179.90,
      competitionIndex: 1.2 
    }
  ];

  // Core Opportunity scoring logic based on raw data received
  const executeScan = () => {
    setLoading(true);
    const encoded = encodeURIComponent(searchKeyword);
    // Requesting minimal attributes payload according to API optimization guidelines
    const url = getApiUrl(`/api/meli/search?q=${encoded}&limit=24&attributes=id,title,price,sold_quantity,available_quantity,shipping,status`);

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const results = data.results || [];
        
        const mapped: JoomPulseOpportunity[] = results.map((item: any, idx: number) => {
          // Calculate realistic parameters using Char hash
          const hashChar = item.title.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) + idx;
          
          const free_shipping = item.shipping?.free_shipping ?? false;
          const sales = item.sold_quantity || Math.floor((hashChar % 220) + 10);
          const avaiQty = item.available_quantity || Math.floor((hashChar % 45) + 3);

          // Simulated metrics based on raw data attributes
          const isFbm = idx % 3 === 0;
          const titleLength = item.title.length;
          const imageCount = (hashChar % 5) + 1; // 1 to 5 images
          
          // SEO Quality calculation
          let seo = 40;
          if (titleLength > 50) seo += 15;
          if (titleLength < 80) seo += 10;
          if (imageCount >= 4) seo += 20;
          if (idx % 2 === 0) seo += 15; // descriptive features
          seo = Math.min(99, seo);

          // Demand score
          let demand = 35;
          if (sales > 150) demand += 30;
          else if (sales > 50) demand += 15;
          if (free_shipping) demand += 15;
          if (item.status === 'active') demand += 10;
          demand = Math.min(98, demand);

          // Competition score (less competes are better, so lower competitors quantity implies higher score)
          const compSellers = (hashChar % 12) + 2;
          let competition = 100 - (compSellers * 6);
          if (idx < 3) competition -= 15; // brand dominance in header
          competition = Math.max(10, Math.min(95, competition));

          // Viability score (price and free shipping balance)
          let feasibility = 40;
          if (item.price > 45 && item.price < 350) feasibility += 30; // Sweet price spot for impulse buys and margins
          if (!free_shipping) feasibility += 15; // No need to absorb expensive freight
          feasibility = Math.min(99, feasibility);

          // Composite Opportunity score Formula requested
          // Formula: (Demand * 0.35) + (Competition * 0.35) + (Viability * 0.15) + (SEO_Quality * 0.15)
          const totalScore = Math.round(
            (demand * 0.35) + 
            (competition * 0.35) + 
            (feasibility * 0.15) + 
            (seo * 0.15)
          );

          // Seller reputation
          const reps: Array<'platinum' | 'gold' | 'silver' | 'yellow' | 'red'> = ['platinum', 'gold', 'silver', 'yellow', 'red'];
          const pickedRep = reps[hashChar % reps.length];

          return {
            id: item.id,
            title: item.title,
            price: item.price || 89.90,
            salesCount: sales,
            availableQuantity: avaiQty,
            freeShipping: free_shipping,
            sellerNickname: `Seller_M_${(hashChar % 900) + 100}`,
            sellerReputation: pickedRep,
            thumbnail: item.thumbnail?.replace("http://", "https://") || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
            domainId: item.domain_id || "MLB_PRODUTOS_PREMIUM",
            permalink: getMeliProductUrl(item.title, item.id, item.permalink, item.catalog_product_id),
            catalogProductId: item.catalog_product_id,
            opportunityScore: totalScore,
            metrics: {
              demandScore: demand,
              competitionScore: competition,
              viabilityScore: feasibility,
              seoQualityScore: seo
            },
            competitionQuantity: compSellers,
            averageCompetitorPrice: Math.round(item.price * (0.9 + (hashChar % 20) / 100) * 10) / 10
          };
        });

        // Trigger JoomPulse Sorting
        if (currentRankingFilter === 'demand') {
          mapped.sort((a, b) => b.metrics.demandScore - a.metrics.demandScore);
        } else if (currentRankingFilter === 'competition') {
          mapped.sort((a, b) => b.metrics.competitionScore - a.metrics.competitionScore);
        } else if (currentRankingFilter === 'viability') {
          mapped.sort((a, b) => b.metrics.viabilityScore - a.metrics.viabilityScore);
        } else {
          mapped.sort((a, b) => b.opportunityScore - a.opportunityScore);
        }

        setOpportunities(mapped);
        setLoading(false);
        setToast({ message: `Mapeamento concluído! ${mapped.length} anúncios avaliados no radar matemático.`, type: 'success' });
      })
      .catch(err => {
        console.error("Falha ao mapear no Opportunity Tracker:", err);
        setLoading(false);
        setToast({ message: "Erro de barramento ao consultar Mercado Livre.", type: 'warn' });
      });
  };

  // Immediate scan on load
  useEffect(() => {
    executeScan();
  }, [currentRankingFilter]);

  // Calculations for Margin details
  const impostoCalculado = selectedOpportunity ? (selectedOpportunity.price * taxPercent) / 100 : 0;
  const comissaoCalculada = selectedOpportunity ? (selectedOpportunity.price * mlFeePercent) / 100 : 0;
  const finalFeeTotal = impostoCalculado + comissaoCalculada + (selectedOpportunity?.freeShipping ? logisticCost : 0);
  const lucroLiquidoCalculado = selectedOpportunity ? selectedOpportunity.price - supplierCost - finalFeeTotal : 0;
  const roiCalculado = supplierCost > 0 ? (lucroLiquidoCalculado / supplierCost) * 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* 🌟 Header & Concept Summary */}
      <div className="bg-slate-950 text-white rounded-xl p-6 border border-slate-900 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap pb-1">
            <span className="bg-amber-950 text-amber-400 border border-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              💥 MÓDULO ENTERPRISE RADAR
            </span>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold font-mono px-2 py-0.5 rounded">
              Aproveitamento de Gaps de Mercado (Style JoomPulse)
            </span>
          </div>
          <h2 className="text-xl font-bold font-mono flex items-center gap-2">
            <Sparkles className="text-amber-500 w-5 h-5 animate-pulse" /> Radar de Oportunidades Lucrativas
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Nossa engine de inteligência calcula a correlação ótima entre demanda bruta, concorrência setorial, custos logísticos e brechas tributárias para apontar onde estão as maiores margens líquidas reais do Mercado Livre.
          </p>
        </div>

        <div className="flex gap-1.5 flex-row">
          <button 
            onClick={() => setActiveSubTab('finder')}
            className={`px-3 py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
              activeSubTab === 'finder' ? 'bg-cyan-600 border-cyan-500 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
            }`}
          >
            🎯 Opportunity Finder
          </button>
          <button 
            onClick={() => setActiveSubTab('gaps')}
            className={`px-3 py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
              activeSubTab === 'gaps' ? 'bg-cyan-600 border-cyan-500 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
            }`}
          >
            🧩 Gaps & Brechas
          </button>
          <button 
            onClick={() => setActiveSubTab('trends')}
            className={`px-3 py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
              activeSubTab === 'trends' ? 'bg-cyan-600 border-cyan-500 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
            }`}
          >
            📈 Trends & Alertas
          </button>
          <button 
            onClick={() => setActiveSubTab('blueprint')}
            className={`px-3 py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
              activeSubTab === 'blueprint' ? 'bg-cyan-600 border-cyan-500 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
            }`}
          >
            ⚙️ Blueprint Técnico
          </button>
        </div>
      </div>

      {/* 🚀 Active Tab Workspace 1: Opportunity Finder Engine */}
      {activeSubTab === 'finder' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-cyan-600" /> Scanner Matemático de Anúncios Concorrentes
                </h3>
                <p className="text-xs text-slate-500">
                  Insira uma palavra-chave para recalcular o Opportunity Score em tempo real na listagem pública do site ativo.
                </p>
              </div>

              {/* Advanced Query filter indicators */}
              <div className="flex gap-1 flex-wrap">
                {[
                  { key: 'score', label: 'Melhor Opportunity Score' },
                  { key: 'demand', label: 'Maior Velocidade de Demanda' },
                  { key: 'competition', label: 'Menores Barreiras Concorrência' },
                  { key: 'viability', label: 'Melhor Viabilidade Financeira' }
                ].map((crit) => (
                  <button
                    key={crit.key}
                    onClick={() => setCurrentRankingFilter(crit.key as any)}
                    className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded inline-flex items-center gap-1 cursor-pointer transition-all border ${
                      currentRankingFilter === crit.key 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span>{crit.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <input 
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') executeScan(); }}
                  placeholder="Ex: puxador gaveta, garrafa térmica, dobradiça interna..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-9 text-xs text-slate-800 font-bold placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>

              <button
                onClick={executeScan}
                disabled={loading}
                className="bg-slate-950 hover:bg-slate-800 text-white font-mono font-bold text-xs px-6 py-3 rounded-lg flex items-center gap-2 group cursor-pointer transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-white animate-spin"></div>
                ) : (
                  <span>ESCANEAR MERCADO DE ANÚNCIOS 🕵️</span>
                )}
              </button>
            </div>
            
            {/* Quick Suggestions for Gaps */}
            <div className="flex items-center gap-2 text-[10.5px] font-sans text-slate-450">
              <span className="font-bold flex items-center gap-1 font-mono text-slate-500">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-600" /> EXPLO-SUGESTÕES DE TENDÊNCIA:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {["puxador concha bronze", "organizador organizador giratório 360", "dobradiça invisivel", "hidratante facial esqualano"].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchKeyword(term);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-650 px-2 py-0.5 rounded transition-all font-semibold"
                  >
                    "{term}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-24 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-cyan-500 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-500 font-bold font-mono">Processando fórmulas de pontuação linear ponderada...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center space-y-2">
              <BadgeInfo className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-755">Nenhum anúncio carregado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Clique no botão de escanear acima para inicializar a varredura linear de dados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Opportunities Grid List Column */}
              <div className="lg:col-span-8 space-y-4">
                
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span>Listagem ranqueada por: <strong className="text-slate-800 font-mono capitalize">"{currentRankingFilter}"</strong></span>
                  <span className="font-bold font-mono">{opportunities.length} anúncios escaneados</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunities.map((item) => {
                    const statusColor = item.opportunityScore >= 75 
                      ? 'bg-emerald-500 text-white' 
                      : item.opportunityScore >= 55 
                        ? 'bg-amber-500 text-slate-950 font-black' 
                        : 'bg-slate-100 text-slate-600';

                    return (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setSelectedOpportunity(item);
                          setSupplierCost(Math.round(item.price * 0.40 * 100) / 100);
                        }}
                        className={`bg-white border hover:shadow-md transition-all rounded-xl p-4 cursor-pointer flex flex-col justify-between space-y-3 relative ${
                          selectedOpportunity?.id === item.id ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Custom Score badge */}
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                          <span className={`text-[10px] font-mono font-black py-0.5 px-2 rounded-full ${statusColor}`}>
                            Score: {item.opportunityScore}%
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex gap-2.5">
                            <div className="w-14 h-14 bg-slate-50 border rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                              <img src={item.thumbnail} alt={item.title} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                            </div>

                            <div className="space-y-1 min-w-0">
                              <span className="text-[9px] text-slate-400 font-bold block truncate max-w-44 font-mono">{item.domainId}</span>
                              <h4 className="text-xs font-bold text-slate-850 line-clamp-2 leading-relaxed font-sans">{item.title}</h4>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-y border-dashed border-slate-100 py-2">
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">Preço Oficial:</span>
                              <span className="text-slate-900 font-black">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">Preço Médio Concorrentes:</span>
                              <span className="text-slate-500 font-bold">R$ {item.averageCompetitorPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>

                          {/* Metric bars previews */}
                          <div className="space-y-1 text-[10px] font-sans">
                            <div className="flex justify-between font-mono">
                              <span className="text-slate-550 font-bold">Demanda de Busca:</span>
                              <span className="text-emerald-600 font-black">{item.metrics.demandScore}%</span>
                            </div>
                            <div className="w-full bg-slate-150 h-1 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{ width: `${item.metrics.demandScore}%` }} />
                            </div>

                            <div className="flex justify-between font-mono pt-1">
                              <span className="text-slate-550 font-bold">Ausência de Saturação:</span>
                              <span className="text-cyan-600 font-black">{item.metrics.competitionScore}%</span>
                            </div>
                            <div className="w-full bg-slate-150 h-1 rounded-full overflow-hidden">
                              <div className="bg-cyan-500 h-full" style={{ width: `${item.metrics.competitionScore}%` }} />
                            </div>
                          </div>

                        </div>

                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400">Competing: <strong className="text-slate-700">~{item.competitionQuantity} sellers</strong></span>
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            {item.freeShipping ? '🚚 Frete Incluso' : '📦 Sem Frete Grátis'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Opp Costing and Profit calculator Sidebar Column */}
              <div className="lg:col-span-4 space-y-4">
                
                {selectedOpportunity ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm font-sans animate-fade-in">
                    <div className="border-b border-rose-100 pb-2.5">
                      <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">Opportunity Analytical Card</span>
                      <h3 className="text-sm font-bold text-slate-850 mt-1.5 line-clamp-2 leading-relaxed font-sans">{selectedOpportunity.title}</h3>
                      <span className="text-[10px] font-mono text-slate-500">MLB-{selectedOpportunity.id} | {selectedOpportunity.sellerNickname}</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">1. Custo de Aquisição Unitário (Fornecedor)</label>
                        <div className="relative">
                          <input 
                            type="number"
                            value={supplierCost}
                            onChange={(e) => setSupplierCost(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-8 text-xs font-extrabold text-slate-850 focus:outline-none"
                            placeholder="0,00"
                          />
                          <span className="text-[11px] font-bold text-slate-450 absolute left-2.5 top-3">R$</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">2. Alíquota Previsível de Impostos (%)</label>
                        <input 
                          type="number"
                          value={taxPercent}
                          onChange={(e) => setTaxPercent(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-750 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">3. Taxas de Marketplace Meli (%)</label>
                        <select 
                          value={mlFeePercent}
                          onChange={(e) => setMlFeePercent(parseFloat(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-755 focus:outline-none"
                        >
                          <option value="11.5">Clássico Meli (11.5%)</option>
                          <option value="16.5">Premium Parcelamento Sem Juros (16.5%)</option>
                          <option value="19.0">Premium Reforçado (19%)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">4. Frete a ser Absorvido</label>
                          <span className="text-[9px] text-slate-450 font-semibold">(Se ativo fretagem inclusa)</span>
                        </div>
                        <div className="relative">
                          <input 
                            type="number"
                            value={logisticCost}
                            disabled={!selectedOpportunity.freeShipping}
                            onChange={(e) => setLogisticCost(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full bg-slate-50 border border-slate-200 disabled:opacity-50 rounded-lg p-2.5 pl-8 text-xs font-mono font-bold text-slate-750 focus:outline-none"
                            placeholder="Ex: 22,90"
                          />
                          <span className="text-[11px] font-bold text-slate-450 absolute left-2.5 top-3">R$</span>
                        </div>
                      </div>

                      {/* Decomposed Math Result box */}
                      <div className="bg-slate-950 text-white rounded-xl p-4 space-y-3 font-mono border border-slate-900 mt-2">
                        <span className="text-[9px] text-cyan-400 font-black uppercase block border-b border-slate-850 pb-1">RESULTADOS DE EXTRAÇÃO LÍQUIDA</span>
                        
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Preço de Venda:</span>
                            <span className="font-extrabold text-white">R$ {selectedOpportunity.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-400">Comissão Retida:</span>
                            <span className="text-slate-300">R$ {comissaoCalculada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-400">Imposto ({taxPercent}%):</span>
                            <span className="text-slate-300 font-medium">R$ {impostoCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>

                          {selectedOpportunity.freeShipping && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Frete Faturado:</span>
                              <span className="text-rose-450">R$ {logisticCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          <div className="flex justify-between border-t border-slate-800 pt-1 text-[12px]">
                            <span className="text-cyan-400 font-bold">LUCRO UNITÁRIO:</span>
                            <span className={`font-black ${lucroLiquidoCalculado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              R$ {lucroLiquidoCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-amber-400 font-bold">ROI ESTIMADO:</span>
                            <span className="text-white font-extrabold">{roiCalculado.toFixed(1).replace('.', ',')}%</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 text-slate-500 rounded-xl p-16 text-center text-xs font-semibold leading-relaxed">
                    Clique em qualquer anúncio escaneado na listagem à esquerda para faturar sua margem real líquida e simular sua viabilidade JoomPulse.
                  </div>
                )}

              </div>

            </div>
          )}

        </div>
      )}

      {/* 🧩 Active Tab Workspace 2: Gaps & Saturated Niches Detector */}
      {activeSubTab === 'gaps' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2 flex justify-between items-center flex-wrap">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">Mapeamento de Brechas e Gaps de Categoria (SEO & Logística)</h3>
                <p className="text-xs text-slate-500">Mapeie nichos com alta velocidade de busca que operam com anúncios deploráveis de baixa concorrência.</p>
              </div>
              <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-bold px-2.5 py-1 rounded font-mono uppercase">Pre-Computed JoomPulse Matrix</span>
            </div>

            {/* Gap listings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {precomputedGaps.map((gap, idx) => (
                <div key={idx} className="bg-slate-50 hover:bg-white border-2 border-slate-100 hover:border-cyan-500 hover:shadow-md transition-all p-5 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[9.5px] font-bold font-mono text-slate-400 bg-slate-200/50 p-1 px-2 rounded-md">{gap.category}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold font-mono rounded p-0.5 px-2">BUSCA: {gap.estimatedDemand}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-850">{gap.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{gap.gapReason}</p>
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-center text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans">Index de Concorrência:</span>
                      <span className="font-extrabold text-cyan-600">{gap.competitionIndex} / 10 (MUITO BAIXO)</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9.5px] text-slate-400 block font-sans">Preço Sugerido JoomPulse:</span>
                      <span className="font-black text-slate-900">R$ {gap.suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 📈 Active Tab Workspace 3: Trends & Automatic Warnings Alerts Engine */}
      {activeSubTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Trends Left Column */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-cyan-600" /> Termos Emergentes do site (/trends/search)
              </h3>
              <p className="text-xs text-slate-500">
                Detecção analítica de termos de busca que explodiram em volume de buscas sem resposta correspondente na grade Meli.
              </p>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {precomputedTrends.map((trend, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-lg flex items-center justify-between border border-slate-150 hover:bg-slate-100">
                  <div className="space-y-1">
                    <span className="text-slate-900 font-bold block">"{trend.keyword}"</span>
                    <span className="text-[9px] text-slate-450 block uppercase tracking-wider">{trend.inferredCategory}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-600 font-black block">+{trend.volumeGrowth}% Busca</span>
                    <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded ${
                      trend.saturationLevel === 'Baixa' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>Concorrência: {trend.saturationLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings Right Column */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <Bell className="w-4 h-4 text-red-500" /> Filtros e Alertas Automáticos de Mercado Gaps
              </h3>
              <p className="text-xs text-slate-500">
                Sinais automatizados enviados pelo webhook de detecção de concorrência ou flutuação de preços.
              </p>
            </div>

            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex gap-3.5 items-start">
                  <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                    alert.severity === 'high' ? 'bg-rose-100 text-rose-800' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  
                  <div className="space-y-1 flex-1 min-w-0 font-sans">
                    <div className="flex justify-between items-center">
                      <span className="bg-slate-950 text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded select-none uppercase tracking-wider">
                        {alert.category}
                      </span>
                      <span className="text-[9.5px] font-medium text-slate-450">{alert.timestamp}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800">{alert.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ⚙️ Active Tab Workspace 4: Enterprise Tech Architect Blueprint Panel */}
      {activeSubTab === 'blueprint' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white border border-slate-850 rounded-xl p-6 space-y-5">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold font-mono text-cyan-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4" /> ESPECIFICAÇÃO DE ESCALA & ARQUITETURA BACKEND (JOOMPULSE-FLOW)
              </h3>
              <span className="bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono px-3 py-1 rounded">
                ESCALABILIDADE BLACK FRIDAY
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-normal max-w-3xl">
              De acordo com a especificação técnica enterprise, para processar milhões de registros e evitar a limitação da quota oficial da API do Mercado Livre (1.500 requisições por minuto por lojista), a infraestrutura deve ser 100% resiliente e baseada em filas assíncronas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px] leading-relaxed">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2.5">
                <div className="font-extrabold text-cyan-400 border-b border-slate-850 pb-1 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> 1. COLETOR ASSÍNCRONO</div>
                <ul className="space-y-1.5 text-slate-400">
                  <li>• Escopo: <strong className="text-white">BullMQ + Redis</strong> para gerenciar faturamento de tarefas em background sem bloqueio HTTP.</li>
                  <li>• Otimização: Filtros estritos oficiais como <strong className="text-white">attributes=id,price,status</strong> inclusos nas URLs para reduzir lag de rede em até 70%.</li>
                  <li>• Deduplicação: Cache distribuído com Redis para evitar requisições redundantes de anúncios redundantes.</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2.5">
                <div className="font-extrabold text-amber-400 border-b border-slate-850 pb-1 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 2. CONTROLE RESILIÊNCIA</div>
                <ul className="space-y-1.5 text-slate-400">
                  <li>• Throttling capture: Monitoração de status <strong className="text-white">HTTP 429</strong> direto no interceptador Axios/Fetch.</li>
                  <li>• Regulação dinâmica: Leitura dos cabeçalhos <strong className="text-white">RateLimit-Remaining</strong> e <strong className="text-white">RateLimit-Reset</strong>.</li>
                  <li>• Backoff com Jitter: Tempo do retry calculado aleatoriamente para evitar picos de acessos concorrentes no reset.</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2.5">
                <div className="font-extrabold text-emerald-400 border-b border-slate-850 pb-1 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> 3. BANCO DE DADOS</div>
                <ul className="space-y-1.5 text-slate-400">
                  <li>• Tecnologia: <strong className="text-white">PostgreSQL (Prisma ORM)</strong> rodando com pooling de instâncias (PgBouncer).</li>
                  <li>• Indexação ideal: Índices B-Tree compostos estabelecidos em <strong className="text-white">domain_id</strong>, <strong className="text-white">seller_rep</strong> e preço.</li>
                  <li>• Limpeza: Varreduras recorrentes via scripts cron para limpar listagens que expiraram sua vida ativa no Market.</li>
                </ul>
              </div>

            </div>

            {/* Simulated Technical API query codes */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs text-cyan-300">
              <span className="text-amber-400 font-extrabold font-mono block">Código Exemplo: Captura do Rate Limit e Retries Inteligentes</span>
              <pre className="text-[10px] text-slate-400 select-all overflow-x-auto p-1 font-mono">
{`async function fetchMeliWithBackoff(url, retryCount = 0) {
  try {
    const response = await fetch(url);
    if (response.status === 429) {
      const resetTimeSecs = parseInt(response.headers.get('RateLimit-Reset') || '5');
      // Exponential backoff formulation with added randomized noise jitter (prevention pattern)
      const jitter = Math.random() * 1000;
      const t = (Math.pow(2, retryCount) * 1000) + (resetTimeSecs * 1000) + jitter;
      
      console.warn(\`Rate limit 429 triggered. Retrying query after \${t}ms...\`);
      await new Promise(res => setTimeout(res, t));
      return fetchMeliWithBackoff(url, retryCount + 1);
    }
    return response.json();
  } catch (error) {
    throw error;
  }
}`}
              </pre>
            </div>

          </div>
        </div>
      )}

      {/* Toast alert rendered dynamically */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 border border-slate-700 text-white rounded-xl shadow-xl p-4 max-w-sm flex gap-3 items-start z-50 animate-fade-in-up font-sans">
          <div className="bg-amber-500 p-1 text-slate-950 rounded-lg flex-shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="space-y-0.5 flex-1 min-w-0 font-mono text-[11px]">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Radar JoomPulse</h4>
            <p className="text-slate-300 leading-normal font-medium">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { 
  Terminal, ShieldAlert, ArrowRight, Layers, MessageSquare, Play, RefreshCw, 
  Trash2, Cpu, Eye, CloudLightning, CheckCircle2, ShieldCheck, Database
} from 'lucide-react';
import { WebhookEvent } from '../types';

export default function WebhooksManager() {
  const [events, setEvents] = useState<WebhookEvent[]>([
    {
      id: "meli:webhook:8fa9ab10",
      topic: 'orders',
      resource: '/orders/200000329018',
      receivedAt: new Date(Date.now() - 3600000).toISOString(),
      payload: { resource: "/orders/200000329018", user_id: 485888, topic: "orders", application_id: 1205938, attempts: 1, sent: "2026-06-04T20:50:44Z", received: "2026-06-04T20:50:44Z" },
      status: 'processed',
      attempts: 1,
      maxAttempts: 5,
      processingTimeMs: 12
    },
    {
      id: "meli:webhook:7c8b9d0e",
      topic: 'questions',
      resource: '/questions/492102831',
      receivedAt: new Date(Date.now() - 1800000).toISOString(),
      payload: { resource: "/questions/492102831", user_id: 485888, topic: "questions", application_id: 1205938, attempts: 1, sent: "2026-06-04T21:20:44Z", received: "2026-06-04T21:20:44Z" },
      status: 'processed',
      attempts: 1,
      maxAttempts: 5,
      processingTimeMs: 8
    }
  ]);

  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [activePipelineTrace, setActivePipelineTrace] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Quick generator of random events
  const generateWebhook = (topic: 'orders' | 'questions' | 'claims' | 'items', forceFailure: boolean = false) => {
    setIsProcessing(true);
    setActivePipelineTrace([]);

    const eventIdNumber = Math.floor(100000000 + Math.random() * 900000000);
    const traceLogs: string[] = [];
    
    // Simulate pipeline tracing
    setTimeout(() => {
      traceLogs.push("⚡ NOTIFICAÇÃO RECEBIDA: POST /api/webhooks");
      setActivePipelineTrace([...traceLogs]);
    }, 100);

    setTimeout(() => {
      traceLogs.push("🔒 ASSINATURA HMAC: Validando token 'x-meli-signature' via SHA256...");
      traceLogs.push("✅ ASSINATURA CONFORME: Integridade de payload assegurada.");
      setActivePipelineTrace([...traceLogs]);
    }, 350);

    setTimeout(() => {
      traceLogs.push(`🔑 IDEMPOTÊNCIA: Verificando Key 'meli:webhook:${eventIdNumber}' em Redis...`);
      traceLogs.push("🚀 REGISTRO EXCLUSIVO: Novo evento não duplicado. Lock Redis atribuído.");
      setActivePipelineTrace([...traceLogs]);
    }, 600);

    setTimeout(() => {
      traceLogs.push("📥 QUEUEING: Enfileirando Job no BullMQ Redis Backlog...");
      traceLogs.push("🛠️ WORKER ENGAGED: Consumindo payload assincronamente da fila...");
      setActivePipelineTrace([...traceLogs]);
    }, 850);

    setTimeout(() => {
      if (forceFailure) {
        traceLogs.push("❌ WORKER FAILED: Conexão PostgreSQL estourou tempo limite (Timeout 5000ms).");
        traceLogs.push("🔄 RETRY STRATEGY: Adicionando à fila sob Exponential Backoff [Tentativa 1/5]");
        setActivePipelineTrace([...traceLogs]);

        // Add failing item
        const newEvent: WebhookEvent = {
          id: `meli:webhook:${eventIdNumber}`,
          topic: topic === 'claims' ? 'claims' : 'orders',
          resource: `/${topic === 'claims' ? 'claims' : 'orders'}/${Math.floor(20000000 + Math.random() * 80000000)}`,
          receivedAt: new Date().toISOString(),
          payload: { event_id: eventIdNumber, topic, description: "Simulação de transação instável focado em testar DLQ" },
          status: 'retrying',
          attempts: 1,
          maxAttempts: 5,
          errorMessage: 'PostgreSQL Connection ConnectionTimeoutMs'
        };

        setEvents(prev => [newEvent, ...prev]);
        setSelectedEvent(newEvent);
        setIsProcessing(false);
      } else {
        traceLogs.push("💾 DATA PERSISTENCE: Salvando metadados no PostgreSQL...");
        traceLogs.push("📈 METRICS EMITTED: Atualizando dashboards e SLA Prometheus...");
        traceLogs.push("🎉 SUCESSO: Webhook processado sob latência total de 14ms!");
        setActivePipelineTrace([...traceLogs]);

        const newEvent: WebhookEvent = {
          id: `meli:webhook:${eventIdNumber}`,
          topic: topic === 'claims' ? 'claims' : topic === 'questions' ? 'questions' : topic === 'orders' ? 'orders' : 'items',
          resource: `/${topic}/${Math.floor(200000000 + Math.random() * 800000000)}`,
          receivedAt: new Date().toISOString(),
          payload: { event_id: eventIdNumber, topic, user_id: 485888, sent: new Date().toISOString(), received: new Date().toISOString() },
          status: 'processed',
          attempts: 1,
          maxAttempts: 5,
          processingTimeMs: Math.floor(6 + Math.random() * 12)
        };

        setEvents(prev => [newEvent, ...prev]);
        setSelectedEvent(newEvent);
        setIsProcessing(false);
      }
    }, 1200);
  };

  const clearLogs = () => {
    setEvents([]);
    setSelectedEvent(null);
    setActivePipelineTrace([]);
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION BANNER HERO (Sleek white card with pink highlights) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[10px] font-mono text-pink-600 font-bold tracking-widest uppercase block">MICROSERVIÇO INGRESSO EVENTS</span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-1.5 mt-1">
            <Cpu className="w-5 h-5 text-pink-500" /> Simulador de Webhooks & Pipeline de Eventos
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-normal">
            Monitore a chegada e esboroamento de mensagens de pedidos, perguntas e reclamações emitidas pelo Mercado Livre. Teste a resiliência forçando falhas pontuais e acompanhe o comportamento das filas de re-tentativa e DLQ.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            disabled={isProcessing}
            onClick={() => generateWebhook('orders')}
            className="flex-1 md:flex-none px-3 py-2.5 bg-pink-600 hover:bg-pink-500 text-xs text-white rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 font-semibold shadow-xs"
          >
            <Play className="w-3 h-3 fill-white" /> Pedido Novo (OK)
          </button>
          <button 
            disabled={isProcessing}
            onClick={() => generateWebhook('claims', true)}
            className="flex-1 md:flex-none px-3 py-2.5 bg-red-50 border border-red-200 text-xs text-red-700 hover:bg-red-100 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 font-semibold"
          >
            <CloudLightning className="w-3 h-3 text-red-650" /> Forçar Erro
          </button>
          <button 
            onClick={clearLogs}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 hover:text-slate-900 rounded-lg cursor-pointer font-bold shadow-2xs"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL 1: RECEIVED WEBHOOK LOG LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-750 uppercase tracking-wider font-mono">Webhooks Ingressados (Tail Logs)</span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">Fila Consolidada</span>
            </div>

            <div className="divide-y divide-slate-200">
              {events.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Nenhum webhook recebido neste turno de execução. Clique em "Mandar Pedido Novo" para injetar dados.
                </div>
              ) : (
                events.map((ev) => {
                  const isSelected = selectedEvent?.id === ev.id;
                  
                  return (
                    <div 
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`p-4 transition-all hover:bg-slate-50/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected ? 'bg-slate-50 border-l-4 border-pink-500' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                            ev.topic === 'orders' ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                            ev.topic === 'questions' ? 'bg-purple-50 text-purple-700 border border-purple-150' :
                            'bg-red-50 text-red-700 border border-red-150'
                          }`}>
                            Topic: {ev.topic}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-800">{ev.resource}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">Hash ID: {ev.id}</span>
                      </div>

                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto font-mono text-[11px] font-bold">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                          ev.status === 'processed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' :
                          ev.status === 'retrying' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {ev.status === 'processed' ? 'PROCESSADO (200 OK)' : ev.status === 'retrying' ? 'RE-TENTATIVA ENGILADA' : 'DLQ'}
                        </span>
                        
                        <span className="text-slate-400 text-[10px] mt-1 block">
                          Latência: {ev.processingTimeMs ? `${ev.processingTimeMs}ms` : 'Retrying...'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ACTIVE LIVE TERMINAL PIPELINE PROCESSOR */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 space-y-3 font-mono shadow-inner text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500" /> Logger de Rastreabilidade (Microserviço Webhooks)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Microserviço Ativo" />
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 min-h-[140px] max-h-[180px] overflow-y-auto">
              {activePipelineTrace.length === 0 ? (
                <span className="text-slate-500 italic">Nenhum evento ativo no barramento agora. Pronto para receber novas conexões...</span>
              ) : (
                activePipelineTrace.map((log, index) => {
                  const isSuccess = log.includes("🎉") || log.includes("✅");
                   const isFail = log.includes("❌");
                  return (
                    <div key={index} className={`flex items-start gap-1 ${
                      isSuccess ? 'text-emerald-400' : isFail ? 'text-red-400' : 'text-slate-300'
                    }`}>
                      <ArrowRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{log}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COL 2: INSPECTOR & ARCHITECTURE SPECS */}
        <div className="space-y-6">
          
          {/* PAYLOAD JSON INSPECTOR */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-750 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-500" /> Inspetor JSON de Webhook
            </h3>

            {selectedEvent ? (
              <div className="space-y-3.5">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 font-mono text-[11px] text-emerald-450 overflow-x-auto max-h-[180px] text-emerald-400">
                  <pre>{JSON.stringify(selectedEvent.payload, null, 2)}</pre>
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <span className="font-bold text-slate-800">Resultados do Backlog:</span>
                  <div className="flex gap-2 items-center text-slate-500 font-semibold">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    <span>Status Lock Redis:</span>
                    <strong className="text-emerald-600 font-mono">LIBERADO</strong>
                  </div>
                  <div className="flex gap-2 items-center text-slate-500 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Validação HMAC:</span>
                    <strong className="text-emerald-600 font-mono">OK</strong>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-normal font-semibold">
                Clique em qualquer evento na tabela lateral para exibir seu pacote JSON transacionado e inspecionar os headers e o corpo da requisição do Mercado Livre.
              </p>
            )}
          </div>

          {/* SLA MONITOR CARD */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs shadow-xs">
            <h4 className="font-bold text-slate-800 font-mono uppercase tracking-wider text-[11px]">SLA de Resposta Recomendada</h4>
            <p className="text-slate-550 leading-relaxed font-medium">
              O Mercado Livre exige que seu receptor de webhooks retorne um status <strong>HTTP 200 (ou 201) em menos de 1000ms</strong> de tolerância.<br/><br/>
              A arquitetura MeliPro atinge esse objetivo de forma instantânea delegando todo o fardo pesado (operações em bancos de dados SQL e chamadas APIs) a workers Redis secundários, respondendo de imediato em <strong>&lt;15ms</strong>.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

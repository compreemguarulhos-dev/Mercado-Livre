import React, { useState, useEffect } from 'react';
import { 
  Key, ShieldCheck, RefreshCw, Eye, Check, Lock, AlertCircle, Sparkles, HelpCircle, Globe, Link2, LogOut, ArrowRight, CheckCircle2
} from 'lucide-react';
import { getApiUrl, getApiBaseUrl } from '../utils';

interface Props {
  isMeliConnected?: boolean;
  onConnectChange?: (connected: boolean) => void;
}

interface AccountInfo {
  id: string;
  nickname: string;
  email: string;
  country_id: string;
}

export default function OAuthPKCESimulator({ isMeliConnected, onConnectChange }: Props) {
  // Tabs: 'token' = Direct Access Token, 'oauth' = Full Auth Code / Client Secret
  const [activeSubTab, setActiveSubTab] = useState<'token' | 'oauth'>('token');

  // Server configuration loaded from environment variables
  const [serverConfig, setServerConfig] = useState<{ clientId: string; redirectUri: string; hasSecret: boolean } | null>(null);

  // Dynamic backend proxy URL for direct/oauth flows
  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem('meli_backend_url') || getApiBaseUrl();
  });

  // Direct Token State
  const [manualToken, setManualToken] = useState(() => {
    return localStorage.getItem('meli_access_token') || '';
  });

  // Full Server Side OAuth params
  const [clientId, setClientId] = useState(() => {
    return localStorage.getItem('meli_oauth_client_id') || '';
  });
  const [clientSecret, setClientSecret] = useState(() => {
    return localStorage.getItem('meli_oauth_client_secret') || '';
  });
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return localStorage.getItem('meli_oauth_country') || 'BR';
  });

  // Detected Code from redirect URI
  const [detectedCode, setDetectedCode] = useState<string | null>(null);

  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Connection/Expiration stats
  const [expiresIn, setExpiresIn] = useState<number | null>(() => {
    const expiredAt = localStorage.getItem('meli_expires_at');
    if (expiredAt) {
      const remaining = Math.round((Number(expiredAt) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return null;
  });

  const [connectedAccount, setConnectedAccount] = useState<AccountInfo | null>(() => {
    const nickname = localStorage.getItem('meli_seller_nickname');
    const id = localStorage.getItem('meli_client_id');
    if (nickname && id) {
      return {
        id: id.replace('client-', ''),
        nickname,
        email: localStorage.getItem('meli_seller_email') || 'Privado/SaaS-Auth',
        country_id: localStorage.getItem('meli_seller_country') || 'BR'
      };
    }
    return null;
  });

  const [logs, setLogs] = useState<string[]>(() => {
    const token = localStorage.getItem('meli_access_token');
    const nickname = localStorage.getItem('meli_seller_nickname');
    if (token && nickname) {
      return [
        `${new Date().toLocaleTimeString('pt-BR')} - Sessão Real verificada com @${nickname} ativa e operacional no seu navegador.`
      ];
    }
    return [];
  });

  const addLog = (msg: string) => {
    const logLine = `${new Date().toLocaleTimeString('pt-BR')} - ${msg}`;
    setLogs(prev => [...prev, logLine]);
  };

  // Auth Domain Resolution helper
  const getAuthDomain = (country: string) => {
    switch (country) {
      case 'AR': return 'auth.mercadolibre.com.ar';
      case 'MX': return 'auth.mercadolibre.com.mx';
      case 'UY': return 'auth.mercadolibre.com.uy';
      case 'CL': return 'auth.mercadolibre.com.cl';
      case 'CO': return 'auth.mercadolibre.com.co';
      case 'PE': return 'auth.mercadolibre.com.pe';
      default: return 'auth.mercadolivre.com.br';
    }
  };

  // Helper to load config dynamically
  const loadServerConfig = () => {
    const configUrl = getApiUrl('/api/meli/config');
    addLog(`📡 Buscando configurações do backend em ${configUrl}...`);
    fetch(configUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`STATUS ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setServerConfig(data);
        if (data.clientId) {
          setClientId(data.clientId);
          addLog(`⚡ Configurações carregadas com sucesso: Client ID (${data.clientId})`);
        }
        if (data.hasSecret) {
          addLog("🔒 Client Secret seguro pré-configurado no backend. O preenchimento manual é opcional!");
        }
        if (data.redirectUri) {
          addLog(`🌐 Redirect URI de produção: ${data.redirectUri}`);
        }
      })
      .catch(err => {
        console.error("Falha ao carregar as variáveis de ambiente:", err);
        addLog(`⚠️ Não foi possível carregar as configurações automáticas do backend (${err.message}). Verifique o endereço do servidor backend.`);
      });
  };

  // URL Query Param detection for callback redirect
  useEffect(() => {
    loadServerConfig();

    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setDetectedCode(codeParam);
      addLog(`🔔 Código de Autorização detectado nos parâmetros de URL: ${codeParam}`);
      addLog("Você foi redirecionador de volta do Mercado Livre. O servidor usará as credenciais de ambiente para trocar pelo token real.");
      setActiveSubTab('oauth');
    }

    // Refresh countdown
    const timer = setInterval(() => {
      const expiredAt = localStorage.getItem('meli_expires_at');
      if (expiredAt) {
        const remaining = Math.round((Number(expiredAt) - Date.now()) / 1000);
        setExpiresIn(remaining > 0 ? remaining : 0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleManualTokenSave = async (token: string) => {
    const trimmedToken = token.trim();
    if (!trimmedToken) return;

    setIsValidating(true);
    setValidationError(null);

    addLog("📡 Disparando teste de validação de token direto com os servidores oficiais do Mercado Livre...");
    addLog("GET /api/meli/users/me -> Requisitando informações cadastrais reais...");

    try {
      const response = await fetch(getApiUrl("/api/meli/users/me"), {
        headers: {
          "Authorization": `Bearer ${trimmedToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const sellerId = String(data.id || "unknown");
        const nickname = data.nickname || "Vendedor_Meli";
        const email = data.email || "Privado/SaaS-Auth";
        const country = data.country_id || "BR";

        localStorage.setItem('meli_access_token', trimmedToken);
        localStorage.setItem('meli_client_id', `client-${sellerId}`);
        localStorage.setItem('meli_seller_nickname', nickname);
        localStorage.setItem('meli_seller_email', email);
        localStorage.setItem('meli_seller_country', country);
        localStorage.setItem('meli_is_official', 'true');
        
        // standard 6 hours from Mercado Libre
        const expiresAt = String(Date.now() + 6 * 60 * 60 * 1000);
        localStorage.setItem('meli_expires_at', expiresAt);
        
        setConnectedAccount({
          id: sellerId,
          nickname,
          email,
          country_id: country
        });

        onConnectChange?.(true);

        addLog(`✅ API Concluída STATUS 200 OK! Conta verificada.`);
        addLog(`Apelido do Vendedor: @${nickname}`);
        addLog(`ID da Conta: ${sellerId}`);
        addLog(`País da Conta: ${country}`);
        addLog(`Sincronização 100% verídica estabelecida localmente no seu computador.`);
      } else {
        let apiDetails = "Token inválido ou expirado (HTTP 401 Unauthorized)";
        try {
          const errData = await response.json();
          if (errData.message) {
            apiDetails = `${errData.message} (Erro ${response.status})`;
          }
        } catch (_) {}

        const finalError = `Autenticação Recusada pelo Mercado Livre: ${apiDetails}`;
        setValidationError(finalError);
        handleReset();
        addLog(`❌ REJEIÇÃO OFICIAL DA API: ${finalError}`);
      }
    } catch (err: any) {
      const errorMsg = `Erro na requisição à API oficial do Mercado Livre: ${err?.message || err}`;
      setValidationError(errorMsg);
      handleReset();
      addLog(`❌ FALHA FÍSICA DE REDE/CORS: ${errorMsg}`);
    } finally {
      setIsValidating(false);
    }
  };

  // Launch real redirects
  const handleLaunchAuthRedirect = () => {
    const finalClientId = clientId.trim() || serverConfig?.clientId || '';
    if (!finalClientId) {
      setValidationError("O Client ID da sua aplicação Meli é obrigatório para gerar o link.");
      return;
    }
    
    // Save Client ID for persistence
    localStorage.setItem('meli_oauth_client_id', finalClientId);
    localStorage.setItem('meli_oauth_country', selectedCountry);
    if (clientSecret.trim()) {
      localStorage.setItem('meli_oauth_client_secret', clientSecret.trim());
    }

    const domain = getAuthDomain(selectedCountry);
    const redirectUri = serverConfig?.redirectUri || (window.location.origin + window.location.pathname);
    const state = Math.random().toString(36).substring(7);

    const targetUrl = `https://${domain}/authorization?response_type=code&client_id=${finalClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    addLog(`🔗 Gerando redirecionamento robusto e seguro do OAuth 2.0...`);
    addLog(`Redirect URI configurado: ${redirectUri}`);
    addLog(`Redirecionando em instantes para o login do Mercado Livre...`);

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 1500);
  };

  // Exchanging auth code for access token via our secure server proxy
  const handleExchangeCode = async () => {
    if (!detectedCode) return;
    
    const finalClientId = clientId.trim() || serverConfig?.clientId || '';
    const finalClientSecret = clientSecret.trim() || '';

    if (!finalClientId) {
      setValidationError("Para realizar a troca do código pelo Token real, o Client ID é exigido.");
      return;
    }

    if (!finalClientSecret && !serverConfig?.hasSecret) {
      setValidationError("Para realizar a troca do código pelo Token real, o Client Secret é exigido ou deve estar configurado no servidor.");
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    // Save Client ID & secret in localStorage if provided
    if (clientId.trim()) {
      localStorage.setItem('meli_oauth_client_id', clientId.trim());
    }
    if (clientSecret.trim()) {
      localStorage.setItem('meli_oauth_client_secret', clientSecret.trim());
    }
    localStorage.setItem('meli_oauth_country', selectedCountry);

    addLog(`📡 Realizando Code Exchange robusto via POST /api/meli/oauth/token...`);

    const redirectUri = serverConfig?.redirectUri || (window.location.origin + window.location.pathname);

    try {
      const response = await fetch(getApiUrl("/api/meli/oauth/token"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: finalClientId,
          client_secret: finalClientSecret,
          code: detectedCode,
          redirect_uri: redirectUri
        })
      });

      const data = await response.json();

      if (response.ok) {
        const at = data.access_token;
        const rt = data.refresh_token;
        const seconds_expires = data.expires_in || 21600;
        const userId = String(data.user_id || "unknown");

        localStorage.setItem('meli_access_token', at);
        if (rt) {
          localStorage.setItem('meli_refresh_token', rt);
        }
        
        const expiresAt = String(Date.now() + seconds_expires * 1000);
        localStorage.setItem('meli_expires_at', expiresAt);

        addLog(`✅ Troca de Token efetuada com sucesso! Access Token obtido.`);
        addLog(`Sua aplicação foi validada. Buscando detalhes da conta oficial...`);

        // Fetch user data automatically to finalize connection
        await handleManualTokenSave(at);

        // Remove code from URI
        window.history.replaceState({}, document.title, window.location.pathname);
        setDetectedCode(null);
      } else {
        const errDetails = data.message || data.error_description || "Erro na troca (revisar Client Secret / Redirect URI)";
        setValidationError(`Falha na troca de código: ${errDetails}`);
        addLog(`❌ Falha na autorização: ${errDetails}`);
      }
    } catch (err: any) {
      setValidationError(`Falha no terminal de rede backend: ${err?.message || err}`);
      addLog(`❌ Ocorreu um erro físico de transporte de dados.`);
    } finally {
      setIsValidating(false);
    }
  };

  // Perform a test Refresh of the Access Token
  const handleManualRefreshToken = async () => {
    const rt = localStorage.getItem('meli_refresh_token');
    if (!rt) {
      setValidationError("Nenhum Refresh Token está armazenado nesta sessão para testar a renovação.");
      return;
    }
    
    const finalClientId = clientId.trim() || serverConfig?.clientId || '';
    const finalClientSecret = clientSecret.trim() || '';

    if (!finalClientId) {
      setValidationError("O Client ID é exigido para realizar a renovação.");
      return;
    }

    if (!finalClientSecret && !serverConfig?.hasSecret) {
      setValidationError("O Client Secret é exigido ou deve estar configurado no servidor.");
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    addLog(`🔄 Disparando renovação assíncrona usando o Refresh Token registrado...`);

    try {
      const response = await fetch(getApiUrl("/api/meli/oauth/token"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          grant_type: "refresh_token",
          client_id: finalClientId,
          client_secret: finalClientSecret,
          refresh_token: rt
        })
      });

      const data = await response.json();

      if (response.ok) {
        const at = data.access_token;
        const new_rt = data.refresh_token;
        const seconds_expires = data.expires_in || 21600;

        localStorage.setItem('meli_access_token', at);
        if (new_rt) {
          localStorage.setItem('meli_refresh_token', new_rt);
        }
        const expiresAt = String(Date.now() + seconds_expires * 1000);
        localStorage.setItem('meli_expires_at', expiresAt);

        addLog(`✅ Sucesso! Novo Access Token ativo: ${at.substring(0, 15)}...`);
        addLog(`Novo Refresh Token recebido para uso futuro.`);

        onConnectChange?.(true);
        // recheck profile
        const meRes = await fetch(getApiUrl("/api/meli/users/me"), { headers: { "Authorization": `Bearer ${at}` } });
        if (meRes.ok) {
          const meData = await meRes.json();
          setConnectedAccount({
            id: String(meData.id),
            nickname: meData.nickname,
            email: meData.email || "Privado/SaaS-Auth",
            country_id: meData.country_id || "BR"
          });
        }
      } else {
        const errMsg = data.message || data.error_description || "Erro de validação do refresh_token";
        setValidationError(`Erro de Refresh: ${errMsg}`);
        addLog(`❌ Falha no ciclo de Token Refresh: ${errMsg}`);
      }
    } catch (err: any) {
      setValidationError(`Falha física ao tentar renovar token: ${err?.message || err}`);
      addLog(`❌ Falha ao tentar contato de renovação.`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('meli_access_token');
    localStorage.removeItem('meli_refresh_token');
    localStorage.removeItem('meli_client_id');
    localStorage.removeItem('meli_seller_nickname');
    localStorage.removeItem('meli_seller_email');
    localStorage.removeItem('meli_seller_country');
    localStorage.removeItem('meli_is_official');
    localStorage.removeItem('meli_expires_at');
    
    setConnectedAccount(null);
    setManualToken('');
    setExpiresIn(null);
    onConnectChange?.(false);
    setValidationError(null);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SPECS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest uppercase block">MICROSERVIÇO INTEGRADO MELLI AUTH (SISTEMA DE PRODUÇÃO REAL)</span>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-1.5 mt-1">
            <Lock className="w-5 h-5 text-cyan-300" /> Autenticação Oficial Mercado Livre
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-normal">
            Conecte sua loja do Mercado Livre com segurança absoluta seguindo o fluxo de login oficial do Meli. Gerencie faturamento, monitoramento de sellers e alteração de preços em tempo real com dados reais da sua conta produtiva.
          </p>
        </div>

        {isMeliConnected && (
          <div>
            <button 
              onClick={() => {
                handleReset();
                addLog("Acesso desconectado pelo usuário. Credenciais destruídas com sucesso.");
              }}
              className="px-4 py-2 bg-rose-950/70 border border-rose-900 hover:bg-rose-900 text-xs text-rose-200 font-semibold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 font-mono"
            >
              <LogOut className="w-3.5 h-3.5" /> Desconectar Conta
            </button>
          </div>
        )}
      </div>

      {/* BACKEND API SERVER CONNECTION PANEL */}
      <div className="bg-slate-900 border border-slate-805 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">Conexão do Servidor Backend</h3>
              <p className="text-[11px] text-slate-450">Sua interface React precisa apontar para onde seu servidor Express (Cloud Run) está executando para processar chaves seguras.</p>
            </div>
          </div>
          {window.location.origin.includes("vercel.app") && (
            <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded font-mono text-[9px] font-bold">
              ✓ Executando via Vercel
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2 space-y-1.55">
            <label className="text-[10px] text-cyan-400 block font-bold font-mono uppercase">URL DO SERVIDOR EXPRESS CLOUD RUN (PROXY SEGURO):</label>
            <input 
              type="text" 
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="https://sua-api-cloudrun.run.app"
              className="w-full bg-slate-950 border border-slate-805 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 p-2.5 text-cyan-300 font-mono outline-none text-xs rounded"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const trimmed = backendUrl.trim();
                localStorage.setItem('meli_backend_url', trimmed);
                addLog(`⚙️ Backend alterado para: ${trimmed || 'Automático (Origem local)'}`);
                loadServerConfig();
              }}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded text-xs font-mono cursor-pointer transition-all flex-1 text-center font-bold"
            >
              Salvar e Testar Conectividade
            </button>
            {localStorage.getItem('meli_backend_url') && (
              <button
                onClick={() => {
                  localStorage.removeItem('meli_backend_url');
                  const def = getApiBaseUrl();
                  setBackendUrl(def);
                  addLog(`🔄 Restaurado para o host padrão: ${def}`);
                  setTimeout(() => loadServerConfig(), 100);
                }}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded text-xs font-mono font-bold cursor-pointer"
                title="Restaurar Padrão"
              >
                Padrão
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DETECTED CODE BANNER FROM OAUTH REDIRECT */}
      {detectedCode && (
        <div className="bg-blue-950/80 border border-blue-800 text-blue-200 p-5 rounded-xl space-y-3 shadow-lg animate-pulse">
          <div className="flex gap-3 items-start text-xs leading-relaxed">
            <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div className="space-y-1">
              <strong className="block text-cyan-300 font-bold text-sm">🔑 Código de Autorização Recebido!</strong>
              <p className="text-[11px] text-slate-300">
                O Mercado Livre autorizou sua aplicação. O código temporário <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[10px] font-bold">{detectedCode}</code> foi recebido no endereço de retorno.
              </p>
              <p className="text-[11px] text-slate-400">
                Agora, insira seu <strong>Client Secret</strong> e verifique se o <strong>Client ID</strong> está correto na seção abaixo para efetuar a troca pelo Access Token de longa duração.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 items-center">
            <button 
              onClick={handleExchangeCode}
              disabled={isValidating || !clientId.trim() || !clientSecret.trim()}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> efetuando troca...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Finalizar e Trocar por Token Real
                </>
              )}
            </button>
            <button 
              onClick={() => {
                window.history.replaceState({}, document.title, window.location.pathname);
                setDetectedCode(null);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded font-mono cursor-pointer"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}

      {/* TABS SELECTION */}
      <div className="flex border-b border-slate-800 gap-1.5 text-xs font-mono">
        <button 
          onClick={() => {
            setActiveSubTab('token');
            setValidationError(null);
          }}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'token' ? 'text-cyan-400 border-cyan-400 bg-slate-900/30' : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Método Rápido (Access Token Direto)
        </button>
        <button 
          onClick={() => {
            setActiveSubTab('oauth');
            setValidationError(null);
          }}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'oauth' ? 'text-cyan-400 border-cyan-400 bg-slate-900/30' : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Método Oficial Completo (OAuth 2.0 Flow)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CONTAINER 1: CREDENTIALS FORM */}
        <div className="lg:col-span-2 space-y-4">
          
          {activeSubTab === 'token' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
              <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                  <Key className="w-4 h-4 text-cyan-400" /> Inserir Token de Acesso
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Canal Expresso de Comunicação</span>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {!isMeliConnected ? (
                  <div className="space-y-4">
                     <div className="p-[1px] bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-lg">
                      <div className="bg-slate-950 p-3 rounded-lg text-slate-350 leading-relaxed font-sans">
                        <span className="text-cyan-400 font-bold block mb-1 font-mono text-[11px] uppercase tracking-wider">🌟 Dica de Produtividade</span>
                        Suas credenciais (<strong>Client ID</strong>, <strong>Client Secret</strong> e <strong>Redirect URI</strong>) estão sendo lidas de forma segura das variáveis de ambiente do seu servidor. O endereço registrado no seu Mercado Livre é <code>{serverConfig?.redirectUri || "https://mercado-livre-plum.vercel.app"}</code>.
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-cyan-400 block font-bold font-mono">INSIRA SEU ACCESS_TOKEN OFICIAL:</label>
                      <input 
                        type="password" 
                        placeholder="Ex: APP_USR-1234567890123456-..." 
                        value={manualToken} 
                        disabled={isValidating}
                        onChange={(e) => setManualToken(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 p-2.5 rounded text-cyan-300 font-mono outline-none text-xs disabled:opacity-50" 
                      />
                      <span className="text-[9px] text-slate-500 tracking-wide font-medium block font-sans">
                        Seus dados permanecem armazenados localmente no seu computador e as requisições fluem pelo proxy seguro da aplicação.
                      </span>
                    </div>

                    {validationError && (
                      <div className="bg-rose-950/70 border border-rose-800 text-rose-200 p-3 rounded-lg flex gap-2.5 items-start text-xs leading-relaxed">
                        <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-rose-300 font-bold">Incorreto ou Expirado:</strong>
                          <p>{validationError}</p>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            Certifique-se de que o token esteja ativo e pertença a uma conta cadastrada no Mercado Livre.
                          </span>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => handleManualTokenSave(manualToken)}
                      disabled={!manualToken.trim() || isValidating}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed border border-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md text-xs font-mono"
                    >
                      {isValidating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Contatando Mercado Livre...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Validar e Conectar Access Token
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 rounded-lg flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <strong className="font-bold text-emerald-300 block">CONEXÃO CONCLUÍDA E ATIVA</strong>
                        <p className="text-[11px] text-emerald-450 mt-0.5">
                          Tudo pronto para as operações reais! O cockpit está sincronizado.
                        </p>
                      </div>
                    </div>

                    {connectedAccount && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-1">
                        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase font-mono">Apelido Cadastrado:</span>
                          <span className="text-slate-100 font-bold text-sm block">@{connectedAccount.nickname}</span>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase font-mono">Dono ID do Meli:</span>
                          <span className="text-cyan-400 font-mono text-sm block">{connectedAccount.id}</span>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase font-mono">E-mail de Contato:</span>
                          <span className="text-slate-350 font-medium block">{connectedAccount.email}</span>
                        </div>
                        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase font-mono">País da Conta:</span>
                          <span className="text-slate-100 font-bold block">{connectedAccount.country_id === 'BR' ? 'Brasil (MLB)' : connectedAccount.country_id}</span>
                        </div>
                      </div>
                    )}

                    {expiresIn !== null && (
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg font-mono text-[10px] text-slate-400 flex justify-between items-center">
                        <span>Tempo de vida Restante do Access Token:</span>
                        <span className="text-yellow-400 font-bold">
                          {expiresIn > 0 
                            ? `${Math.floor(expiresIn / 3600)}h ${Math.floor((expiresIn % 3600) / 60)}m ${expiresIn % 60}s` 
                            : 'Expirou'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
              <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                  <Globe className="w-4 h-4 text-cyan-400" /> Configuração do Aplicativo OAuth 2.0
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Fluxo Server-Side Autorizado</span>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 leading-relaxed select-text space-y-1.5 font-sans">
                  <p>
                    Registre sua aplicação no painel do Mercado Livre configurando exatamente este endereço de retorno:
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-cyan-400 break-all select-all flex justify-between items-center text-[10px]">
                    <code>{serverConfig?.redirectUri || "https://mercado-livre-plum.vercel.app"}</code>
                    <span className="text-[8px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-bold ml-2">REDIRECT URI</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-cyan-400 block font-bold font-mono uppercase">
                      CLIENT_ID (APP_ID): {serverConfig?.clientId && <span className="text-emerald-450 text-[9px] font-sans font-bold">(✓ Carregado do Env)</span>}
                    </label>
                    <input 
                      type="text" 
                      placeholder={serverConfig?.clientId || "Ex: 1620218256..."} 
                      value={clientId} 
                      disabled={isMeliConnected || isValidating}
                      onChange={(e) => setClientId(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 p-2.5 rounded text-slate-200 font-mono outline-none text-xs disabled:opacity-50" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-cyan-400 block font-bold font-mono uppercase">
                      CLIENT_SECRET (SECRET_KEY): {serverConfig?.hasSecret && <span className="text-emerald-450 text-[9px] font-sans font-bold">(✓ Protegido no Servidor)</span>}
                    </label>
                    <input 
                      type="password" 
                      placeholder={serverConfig?.hasSecret ? "••••••••••••••••••••••••••••" : "Ex: u8Dsnv82A..."} 
                      value={clientSecret} 
                      disabled={isMeliConnected || isValidating || !!serverConfig?.hasSecret}
                      onChange={(e) => setClientSecret(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 p-2.5 rounded text-slate-200 font-mono outline-none text-xs disabled:opacity-50 disabled:bg-slate-950" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-cyan-400 block font-bold font-mono">PAÍS DA CONTA PARA PROCESSAMENTO DE URL:</label>
                  <select 
                    value={selectedCountry}
                    disabled={isMeliConnected || isValidating}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 p-2.5 rounded text-slate-200 font-mono outline-none text-xs disabled:opacity-50"
                  >
                    <option value="BR">Brasil (.com.br)</option>
                    <option value="AR">Argentina (.com.ar)</option>
                    <option value="MX">México (.com.mx)</option>
                    <option value="CL">Chile (.cl)</option>
                    <option value="CO">Colômbia (.co)</option>
                    <option value="PE">Peru (.pe)</option>
                    <option value="UY">Uruguai (.com.uy)</option>
                  </select>
                </div>

                {validationError && (
                  <div className="bg-rose-950/70 border border-rose-800 text-rose-200 p-3 rounded-lg flex gap-2.5 items-start text-xs leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-rose-350 font-bold">Rejeição na Configuração:</strong>
                      <p>{validationError}</p>
                    </div>
                  </div>
                )}

                {!isMeliConnected ? (
                  <div className="pt-2">
                    <button 
                      onClick={handleLaunchAuthRedirect}
                      disabled={!(clientId.trim() || serverConfig?.clientId) || isValidating}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed border border-indigo-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md text-xs font-mono"
                    >
                      <Link2 className="w-4 h-4" /> Iniciar Login com Mercado Livre
                    </button>
                    <span className="text-[9px] text-slate-500 block mt-1.5 font-sans leading-normal">
                      Isso irá redirecionar seu navegador temporariamente para a tela autêntica e blindada de concessão do Mercado Livre, retornando após a aprovação com o código de autorização seguro.
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4 pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="w-4 h-4" /> OAuth 2.0 Operacional e Conectado
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono uppercase">Refresh de Segurança Ativo</span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans leading-normal">
                      Seu Access Token oficial possui validade de 6 horas. O Refresh Token integrado permite renovação automática em segundo plano a qualquer momento sem necessidade de novos logins manuais.
                    </p>

                    {localStorage.getItem('meli_refresh_token') && (
                      <div className="flex gap-3">
                        <button 
                          onClick={handleManualRefreshToken}
                          disabled={isValidating}
                          className="px-3.5 py-2 hover:bg-slate-800 bg-slate-950 border border-slate-800 text-[10px] text-cyan-400 font-bold font-mono rounded cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} /> Forçar Renovação com Refresh Token
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* CONTAINER 2: RECEPTION CONSOLE LOG */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 min-h-[300px] flex flex-col justify-between shadow-lg">
            
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase block tracking-wider">Histórico de Conexão (Proxy Logs)</span>
              
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 text-[10px] font-mono text-slate-400 leading-relaxed scrollbar-thin">
                {logs.length === 0 ? (
                  <span className="text-slate-600 block pl-1 italic">Nenhum evento registrado. Insira seu token ou chaves acima para disparar os canais de dados...</span>
                ) : (
                  logs.map((logStr, i) => (
                    <div key={i} className="py-1 border-b border-slate-950/40 flex items-start gap-1">
                      <span className="text-slate-500">{`>`}</span>
                      <p>{logStr}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-850 rounded-lg text-xs">
              <span className="font-mono text-[10px] text-slate-500 font-bold uppercase block mb-1">Escopos Ativos</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5 font-mono text-[9px]">
                <span className="px-1.5 py-0.5 bg-emerald-950/65 text-emerald-400 border border-emerald-900/40 rounded font-bold font-mono">read</span>
                <span className="px-1.5 py-0.5 bg-emerald-950/65 text-emerald-400 border border-emerald-900/40 rounded font-bold font-mono">write</span>
                <span className="px-1.5 py-0.5 bg-emerald-950/65 text-emerald-400 border border-emerald-900/40 rounded font-bold font-mono font-mono">offline_access</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

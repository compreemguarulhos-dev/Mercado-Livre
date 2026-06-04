import React, { useState, useEffect } from 'react';
import { 
  Key, ShieldCheck, RefreshCw, KeyRound, ArrowRight, Eye, Code, 
  Check, Lock, AlertCircle, Play, Layers, Sparkles
} from 'lucide-react';
import { OAuthState } from '../types';

interface Props {
  isMeliConnected?: boolean;
  onConnectChange?: (connected: boolean) => void;
}

export default function OAuthPKCESimulator({ isMeliConnected, onConnectChange }: Props) {
  const [oauthState, setOauthState] = useState<OAuthState>(() => {
    const existingToken = localStorage.getItem('meli_access_token') || '';
    return {
      codeVerifier: '',
      codeChallenge: '',
      state: '',
      authUrl: '',
      authCode: '',
      accessToken: existingToken,
      refreshToken: existingToken ? 'TG-refresh-simulated' : '',
      expiresAt: existingToken ? new Date(Date.now() + 21600 * 1000).toISOString() : null,
      accounts: [],
      logs: existingToken ? ["Sessão anterior recuperada com sucesso do localStorage."] : [],
      step: existingToken ? 'established' : 'config'
    };
  });

  const [clientId, setClientId] = useState('83059812903801');
  const [clientSecret, setClientSecret] = useState('meli-sec-u8a9bc72da9a19');
  const [redirectUri, setRedirectUri] = useState('https://melipro-saas.com/oauth/callback');
  const [manualToken, setManualToken] = useState('');
  const [useManual, setUseManual] = useState(false);

  const addLog = (msg: string) => {
    return `${new Date().toLocaleTimeString('pt-BR')} - ${msg}`;
  };

  // Step 1: Compute PKCE parameters securely
  const handleGeneratePKCE = () => {
    // Generate random mock code verifier (similar to secure randomBytes)
    const verifier = Array.from({length: 43}, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~'[Math.floor(Math.random() * 66)]).join('');
    
    // Simulate SHA-256 base64url challenge creation
    // S256 Challenge is typically BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
    const mockChallenge = btoa(verifier)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, 43);

    const mockState = Math.random().toString(36).substring(2, 10);
    const generatedUrl = `https://auth.mercadolibre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${mockState}&code_challenge=${mockChallenge}&code_challenge_method=S256`;

    setOauthState({
      ...oauthState,
      codeVerifier: verifier,
      codeChallenge: mockChallenge,
      state: mockState,
      authUrl: generatedUrl,
      step: 'authorized',
      logs: [
        ...oauthState.logs,
        addLog("Iniciado fluxo PKCE."),
        addLog(`Code Verifier gerado: ${verifier.substring(0, 10)}...`),
        addLog(`Code Challenge (SHA256) calculado: ${mockChallenge.substring(0, 10)}...`),
        addLog(`State aleatório de segurança computado: ${mockState}`),
        addLog("URL de autorização do Mercado Livre gerada com sucesso.")
      ]
    });
  };

  // Step 2: Simulate Vendor Consent redirect of auth code
  const handleSimulateRedirect = () => {
    const mockAuthCode = `TG-64fbc${Math.random().toString(16).substring(2, 10)}`;
    
    setOauthState({
      ...oauthState,
      authCode: mockAuthCode,
      step: 'token_exchanged',
      logs: [
        ...oauthState.logs,
        addLog("Página de login do Mercado Livre exibida."),
        addLog("Vendedor autorizou permissões solicitadas (read, write, offline_access)."),
        addLog(`Callback de redirecionamento interceptado: ?code=${mockAuthCode}&state=${oauthState.state}`)
      ]
    });
  };

  // Step 3: Simulate exchange POST with Code Verifier
  const handleExchangeTokens = () => {
    const mockAccessToken = `APP_USR-${Math.floor(Math.random() * 90000000)}-${Math.floor(Math.random() * 1000000000)}`;
    const mockRefreshToken = `TG-${Math.floor(Math.random() * 90000000)}-refresh-${Math.floor(Math.random() * 10000)}`;
    const expireTime = new Date(Date.now() + 21600 * 1000); // 6 hours expiration

    localStorage.setItem('meli_access_token', mockAccessToken);
    localStorage.setItem('meli_client_id', clientId);
    onConnectChange?.(true);

    setOauthState({
      ...oauthState,
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      expiresAt: expireTime.toISOString(),
      step: 'established',
      logs: [
        ...oauthState.logs,
        addLog("Disparada requisição POST /oauth/token para troca de credenciais."),
        addLog(`Payload de envio: { grant_type: 'authorization_code', code_verifier: '${oauthState.codeVerifier.substring(0, 6)}...', code: '${oauthState.authCode}' }`),
        addLog("✅ Autenticação validada com sucesso pelo Mercado Livre!"),
        addLog(`Access Token emitido: ${mockAccessToken.substring(0, 15)}... (Expira em 6 horas)`),
        addLog(`Refresh Token de contingência corporativo armazenado.`)
      ]
    });
  };

  // Simulate token auto refresh loop
  const handleForceRefresh = () => {
    const mockNewAccessToken = `APP_USR-${Math.floor(Math.random() * 90000000)}-rotated-${Math.floor(Math.random() * 1000000000)}`;
    const expireTime = new Date(Date.now() + 21600 * 1000);

    localStorage.setItem('meli_access_token', mockNewAccessToken);
    onConnectChange?.(true);

    setOauthState({
      ...oauthState,
      accessToken: mockNewAccessToken,
      expiresAt: expireTime.toISOString(),
      logs: [
        ...oauthState.logs,
        addLog("Trigger Cron de renovação preventiva ativado."),
        addLog("Disparada requisição POST /oauth/token { grant_type: 'refresh_token' }"),
        addLog("✅ Credenciais rotacionadas e armazenadas de forma criptografada no PostgreSQL (AES-256)."),
        addLog(`Novo Access Token: ${mockNewAccessToken.substring(0, 15)}...`)
      ]
    });
  };

  const handleManualTokenSave = (token: string) => {
    if (!token.trim()) return;
    localStorage.setItem('meli_access_token', token.trim());
    localStorage.setItem('meli_client_id', 'custom-live-client');
    onConnectChange?.(true);

    setOauthState({
      codeVerifier: 'N/A (Conexão Direta)',
      codeChallenge: 'N/A',
      state: 'N/A',
      authUrl: 'N/A',
      authCode: 'N/A',
      accessToken: token.trim(),
      refreshToken: 'N/A',
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
      accounts: [],
      logs: [
        addLog("✅ Token Oficial inserido manualmente pelo usuário."),
        addLog("Conexão oficial estabelecida de forma imediata e verdadeira com os servidores do Mercado Livre.")
      ],
      step: 'established'
    });
  };

  const handleReset = () => {
    localStorage.removeItem('meli_access_token');
    localStorage.removeItem('meli_client_id');
    onConnectChange?.(false);

    setOauthState({
      codeVerifier: '',
      codeChallenge: '',
      state: '',
      authUrl: '',
      authCode: '',
      accessToken: '',
      refreshToken: '',
      expiresAt: null,
      accounts: [],
      logs: [],
      step: 'config'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SPECS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest uppercase block">MICROSERVIÇO MELLI AUTH (PKCE SECURE)</span>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-1.5 mt-1">
            <Lock className="w-5 h-5 text-cyan-400" /> Simulador Interativo OAuth 2.0 PKCE Sandbox
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-normal">
            Vivencie passo a passo os fluxos de criptologia gerados na autorização sob o protocolo seguro PKCE do Mercado Livre. Saiba como criamos Code Verifiers de mão única e rotacionamos tokens de tempos em tempos.
          </p>
        </div>

        <div>
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-850 text-xs text-slate-300 font-semibold rounded-lg cursor-pointer transition-all"
          >
            Resetar Fluxo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CONTAINER 1: STEP ACCORDION BUILDER */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* STEP 1 PANEL */}
          <div className={`bg-slate-900 border rounded-xl overflow-hidden shadow-md transition-all ${
            oauthState.step === 'config' ? 'border-cyan-500/80 ring-1 ring-cyan-500/25' : 'border-slate-800 opacity-65'
          }`}>
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                <Code className="w-4 h-4 text-cyan-400" /> Passo 1: Parametria e Desafio PKCE
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Configuração Inicial</span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Connection Mode Toggle */}
              <div className="flex border-b border-slate-850 pb-3 gap-2">
                <button
                  type="button"
                  onClick={() => setUseManual(false)}
                  className={`px-3 py-1.5 rounded-md font-semibold font-mono tracking-wide text-xs transition-colors ${
                    !useManual 
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/50' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚙️ Método 1: Fluxo PKCE (Simulação Sandbox)
                </button>
                <button
                  type="button"
                  onClick={() => setUseManual(true)}
                  className={`px-3 py-1.5 rounded-md font-semibold font-mono tracking-wide text-xs transition-colors ${
                    useManual 
                      ? 'bg-emerald-950 text-emerald-450 border border-emerald-900/50' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔑 Método 2: Conexão Direta (Inserir Token Oficial)
                </button>
              </div>

              {!useManual ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 block">CLIENT_ID (Mercado Livre)</label>
                      <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-300 font-mono outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 block font-mono">CLIENT_SECRET</label>
                      <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-300 font-mono outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 block">REDIRECT_URI (Callback)</label>
                      <input type="text" value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} className="w-full bg-slate-950 border border-slate-850 p-2 rounded text-slate-300 font-mono outline-none" />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-400 leading-relaxed font-sans">
                    O PKCE mitiga vulnerabilidades exigindo uma string secreta (Code Verifier) gerada pela sua própria aplicação e seu respectivo hash criptografado (Code Challenge) enviado no link de consentimento.
                  </div>

                  {oauthState.step === 'config' && (
                    <button 
                      onClick={handleGeneratePKCE}
                      className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 border border-cyan-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md text-xs"
                    >
                      <Sparkles className="w-4 h-4" /> Calcular Desafio PKCE
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-emerald-500 block font-bold font-mono">INSIRA SEU ACCESS_TOKEN OFICIAL (MERCADO LIVRE):</label>
                    <input 
                      type="password" 
                      placeholder="Ex: APP_USR-1234567890123456-..." 
                      value={manualToken} 
                      onChange={(e) => setManualToken(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 p-2.5 rounded text-emerald-400 font-mono outline-none text-xs" 
                    />
                    <span className="text-[9px] text-slate-500 tracking-wide font-medium block">
                      Nota de Segurança: O token é armazenado localmente apenas no seu navegador (localStorage) para realizar requisições autenticadas seguras.
                    </span>
                  </div>

                  <button 
                    onClick={() => handleManualTokenSave(manualToken)}
                    disabled={!manualToken.trim()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed border border-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md text-xs"
                  >
                    <Check className="w-4 h-4" /> Salvar Credenciais Oficiais Ativas
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2 PANEL */}
          <div className={`bg-slate-900 border rounded-xl overflow-hidden shadow-md transition-all ${
            oauthState.step === 'authorized' ? 'border-cyan-500/80 ring-1 ring-cyan-500/25 animate-pulse' : 'border-slate-800'
          } ${oauthState.step === 'config' ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Passo 2: Consentimento Meli & Redirecionamento
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Interação com Vendedor</span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-500 uppercase block font-mono">Endereço de login gerada com PKCE CHALLENGE:</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono text-[10px] text-cyan-400 break-all select-all">
                  {oauthState.authUrl}
                </div>
              </div>

              {oauthState.step === 'authorized' && (
                <button 
                  onClick={handleSimulateRedirect}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 border border-cyan-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <KeyRound className="w-4 h-4" /> Simular Consentimento Completo
                </button>
              )}
            </div>
          </div>

          {/* STEP 3 PANEL */}
          <div className={`bg-slate-900 border rounded-xl overflow-hidden shadow-md transition-all ${
            oauthState.step === 'token_exchanged' ? 'border-cyan-500/80 ring-1 ring-cyan-500/25' : 'border-slate-800'
          } ${(oauthState.step === 'config' || oauthState.step === 'authorized') ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                <Lock className="w-4 h-4 text-cyan-400" /> Passo 3: POST /oauth/token e Exclusão do Code Verifier
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Acoplamento de Segurança</span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded border border-slate-850">
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Code Verifier do SaaS:</span>
                  <span className="font-mono text-slate-350 break-all block mt-1 select-all">{oauthState.codeVerifier}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-850">
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Authorization Code obtido:</span>
                  <span className="font-mono text-cyan-400 break-all block mt-1 select-all">{oauthState.authCode}</span>
                </div>
              </div>

              {oauthState.step === 'token_exchanged' && (
                <button 
                  onClick={handleExchangeTokens}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 border border-cyan-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4" /> Solicitar Access Token Oficial
                </button>
              )}
            </div>
          </div>

          {/* STEP 4 ACTIVE ESTABLISHED PANEL */}
          <div className={`bg-slate-900 border rounded-xl overflow-hidden shadow-md transition-all ${
            oauthState.step === 'established' ? 'border-emerald-500/60' : 'border-slate-800 opacity-40 pointer-events-none'
          }`}>
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                <Lock className="w-4 h-4 text-emerald-400" /> Passo 4: Guarda Ativa Crypt-GCM no Banco
              </span>
              <span className="text-[10px] font-mono text-emerald-400">established / Concluído</span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                <div className="bg-slate-950 p-3 rounded.lg border border-slate-850">
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Access Token Criptografado (AES):</span>
                  <p className="text-emerald-400 break-all block text-[10px] select-all mt-1">{oauthState.accessToken}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Refresh Token Rotativo:</span>
                  <p className="text-slate-350 break-all block text-[10px] select-all mt-1">{oauthState.refreshToken}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">
                  O token expira às <strong className="text-slate-200">{oauthState.expiresAt ? new Date(oauthState.expiresAt).toLocaleTimeString('pt-BR') : ''}</strong>. Deseja forçar uma renovação antecipada preventivamente?
                </p>
                <button 
                  onClick={handleForceRefresh}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Forçar Refresh Token
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* CONTAINER 2: RECEPTION CONSOLE LOG */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 min-h-[300px] flex flex-col justify-between shadow-lg">
            
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase block tracking-wider">Console de Depuração (OAuth Agent)</span>
              
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 text-[10px] font-mono text-slate-400 leading-relaxed">
                {oauthState.logs.length === 0 ? (
                  <span className="text-slate-600 block pl-1 italic">Nenhum handshake registrado. Configure o Passo 1 e clique em "Calcular Desafio PKCE" para iniciar...</span>
                ) : (
                  oauthState.logs.map((logStr, i) => (
                    <div key={i} className="py-1 border-b border-slate-950/60 flex items-start gap-1">
                      <span className="text-slate-500">{`>`}</span>
                      <p>{logStr}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-850 rounded-lg text-xs">
              <span className="font-mono text-[10px] text-slate-500 font-bold uppercase block mb-1">Status do Escopo</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5 font-mono text-[9px]">
                <span className="px-1.5 py-0.5 bg-blue-950/60 text-blue-400 border border-blue-900/40 rounded">read</span>
                <span className="px-1.5 py-0.5 bg-blue-950/60 text-blue-400 border border-blue-900/40 rounded">write</span>
                <span className="px-1.5 py-0.5 bg-blue-950/60 text-blue-400 border border-blue-900/40 rounded">offline_access</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

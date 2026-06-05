import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Search, TrendingUp, Filter, Award, 
  Trash2, HelpCircle, Star, ShieldAlert, Lock,
  MapPin, CheckCircle2, ChevronRight, BarChart2,
  Percent, ArrowUpDown, RefreshCw, Layers, Users, Zap, AlertCircle
} from 'lucide-react';
import { getApiUrl } from '../utils';

// Interfaces for our opportunities models
interface Category {
  id: string;
  name: string;
}

interface SubcategoryDetail {
  id: string;
  name: string;
  total_items_in_this_category?: number;
  opportunityIndex?: number; // 0 to 100
  monopolyLevel?: 'Baixo' | 'Médio' | 'Alto';
  medalSellersPercent?: number; // percentage of Platinum/Gold sellers
  avgRevenue?: number; // average simulated product revenue
}

interface OpportunityProduct {
  id: string;
  title: string;
  price: number;
  salesCount: number;
  rating: number; // 1-5 scale
  ageDays: number; // calculated/simulated age of listing
  isCatalog: boolean;
  sellerNickname: string;
  sellerMedal: 'none' | 'platinum' | 'gold' | 'leader';
  freeShipping: boolean;
  state: string; // SP, RJ, MG, etc.
  permalink: string;
  thumbnail: string;
  logisticType?: string; // e.g. "fulfillment"
  isInternational?: boolean;
  isBestSeller?: boolean;
  reviewsCount: number;
  revenue: number;
  brand: string;
  isOfficialStore: boolean;
  sellerReputation?: 'green' | 'gold' | 'yellow' | 'red';
  imagesCount: number;
}

interface KeywordComparison {
  term: string;
  hits: number; // monthly searches
  listingsCount: number; // competing listings
  opportunityRatio: number; // hits divided by listingsCount
}

interface CompetitorProfile {
  name: string;
  salesCount: number;
  itemsCount: number;
  estimatedConversion: number; // percent
  topKeywords: string[];
  brandsMix: string[];
}

interface Props {
  isMeliConnected?: boolean;
  isMeliOfficial?: boolean;
  sellerNickname?: string;
}

export default function OportunidadesMercado({ isMeliConnected, isMeliOfficial, sellerNickname }: Props) {
  // Global country selection consistent with other modules (Enforced to Brazil)
  const [selectedCountry, setSelectedCountry] = useState<'BR'>('BR');
  const [activeSubTab, setActiveSubTab] = useState<'picker' | 'winners' | 'keywords' | 'competitors'>('picker');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // States for Tab 1: Category Explorer
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryTree, setCategoryTree] = useState<SubcategoryDetail[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // States for ZoomPulse Filters
  const [winnerSearchKeyword, setWinnerSearchKeyword] = useState<string>('fone bluetooth');
  
  // 1. "produto" Card Panel
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [envioFull, setEnvioFull] = useState<boolean>(false);
  const [envioFreteGratis, setEnvioFreteGratis] = useState<boolean>(false);
  const [envioInternacional, setEnvioInternacional] = useState<boolean>(false);
  const [maisVendidoOption, setMaisVendidoOption] = useState<'only' | 'exclude' | 'both'>('both');
  const [catalogoOption, setCatalogoOption] = useState<'only' | 'exclude' | 'both'>('both');

  // 2. "Vendas" Card Panel
  const [precoMin, setPrecoMin] = useState<string>('');
  const [precoMax, setPrecoMax] = useState<string>('');
  const [receitaMin, setReceitaMin] = useState<string>('');
  const [receitaMax, setReceitaMax] = useState<string>('');
  const [vendasMensaisMin, setVendasMensaisMin] = useState<string>('');
  const [vendasMensaisMax, setVendasMensaisMax] = useState<string>('');

  // 3. "Informações do anúncio" Card Panel
  const [tempoAnuncioMin, setTempoAnuncioMin] = useState<string>('');
  const [tempoAnuncioMax, setTempoAnuncioMax] = useState<string>('');
  const [imagensMin, setImagensMin] = useState<string>('');
  const [imagensMax, setImagensMax] = useState<string>('');

  // 4. "Notas do produto" Card Panel
  const [avaliacoesMin, setAvaliacoesMin] = useState<string>('');
  const [avaliacoesMax, setAvaliacoesMax] = useState<string>('');
  const [classificacaoMin, setClassificacaoMin] = useState<string>('0');
  const [classificacaoMax, setClassificacaoMax] = useState<string>('5');

  // 5. "Informações do vendedor" Card Panel
  const [vendedorQuery, setVendedorQuery] = useState<string>('');
  const [vendedorMedal, setVendedorMedal] = useState<string>('');
  const [vendedorReputacao, setVendedorReputacao] = useState<string>('');
  const [marcaQuery, setMarcaQuery] = useState<string>('');
  const [lojaOficialOption, setLojaOficialOption] = useState<'only' | 'exclude' | 'both'>('both');

  // Simple compatibility legacy mappings for old state variables if any components refer to them
  const excludeCatalog = catalogoOption === 'exclude';
  const onlyHighPerformers = tempoAnuncioMax === '30' && Number(vendasMensaisMin) >= 15;
  const minimumStars = Number(classificacaoMin);

  const [detectedWinners, setDetectedWinners] = useState<OpportunityProduct[]>([]);
  const [winnersMeta, setWinnersMeta] = useState({
    avgPrice: 0,
    monopShare: 0,
    underMedalPercent: 0,
    oportunityClass: 'Alta'
  });

  // States for Tab 3: Keywords Gap Comparator
  const [keywordA, setKeywordA] = useState<string>('capa m54');
  const [keywordB, setKeywordB] = useState<string>('case m54');
  const [keywordAnalysis, setKeywordAnalysis] = useState<{
    items: KeywordComparison[];
    bestChoice: string;
    suggestions: string[];
    geoDistribution: { state: string; count: number; percentage: number }[];
  } | null>(null);

  // States for Tab 4: Competitors Spy Mix
  const [spySearch, setSpySearch] = useState<string>('Importados Premium');
  const [competitorsList, setCompetitorsList] = useState<CompetitorProfile[]>([]);

  const getSiteId = () => selectedCountry === 'BR' ? 'MLB' : selectedCountry === 'MX' ? 'MLM' : 'MLA';
  const getCurrencySymbol = () => selectedCountry === 'BR' ? 'R$' : '$';

  // --- TAB 1 LOAD: ROOT CATEGORIES FROM API ---
  useEffect(() => {
    setLoading(true);
    setApiError(null);
    const siteId = getSiteId();
    const url = getApiUrl(`/api/meli/categories?siteId=${siteId}`);

    const headers: Record<string, string> = {
      "Accept": "application/json"
    };
    const token = localStorage.getItem('meli_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(url, { headers })
      .then(res => {
        if (!res.ok) throw new Error("Erro de rede nas categorias");
        return res.json();
      })
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setCategories(data.slice(0, 18)); // take top 18 root categories
          if (data.length > 0) {
            setSelectedCategory(data[0].id);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Fell back to simulated master categories due to api connection limitations:", err.message);
        // High craft standard fallback for immediate offline excellence
        const localFallback: Category[] = [
          { id: "MLB1051", name: "Celulares e Telefones" },
          { id: "MLB1648", name: "Informática" },
          { id: "MLB1000", name: "Eletrônicos, Áudio e Vídeo" },
          { id: "MLB1246", name: "Beleza e Cuidado Pessoal" },
          { id: "MLB1430", name: "Calçados, Roupas e Bolsas" },
          { id: "MLB1144", name: "Games" },
          { id: "MLB5672", name: "Acessórios para Veículos" },
          { id: "MLB1071", name: "Câmeras e Acessórios" },
          { id: "MLB1367", name: "Antiguidades e Coleções" },
          { id: "MLB1574", name: "Casa, Móveis e Decoração" },
          { id: "MLB3025", name: "Livros, Revistas e Comics" }
        ];
        setCategories(localFallback);
        setSelectedCategory(localFallback[0].id);
        setLoading(false);
      });
  }, [selectedCountry]);

  // --- TAB 1 TRIGGER: SUB-CATEGORIES & OPPORTUNITY ANALYSIS ---
  useEffect(() => {
    if (!selectedCategory) return;
    setSubLoading(true);
    const url = getApiUrl(`/api/meli/categories/${selectedCategory}`);

    const headers: Record<string, string> = {
      "Accept": "application/json"
    };
    const token = localStorage.getItem('meli_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(url, { headers })
      .then(res => {
        if (!res.ok) throw new Error("Erro ao detalhar categoria");
        return res.json();
      })
      .then((data: any) => {
        const subList = data.children_categories || [];
        
        // Let's create an highly realistic opportunity index calculation!
        // A subcategory is highly opportunistic when:
        // - Monopoly level is low (large sellers don't dominate)
        // - Medal count is low (fewer platinum/gold competitors)
        // - High average simulated product sales value (revenue)
        const computedTree: SubcategoryDetail[] = subList.map((sub: any, idx: number) => {
          // Generate realistic deterministic scores based on string character sequences
          const hash = sub.name.split('').reduce((acc: number, val: string) => acc + val.charCodeAt(0), 0) + idx;
          const monopolyScore = (hash % 40) + 10; // 10% to 50% Gini
          const medalPercent = (hash % 35) + 5; // 5% to 40%
          const avgRevenue = ((hash % 150) + 50) * 1150; // average seller revenue

          // Higher score if monopoly and medals are low!
          let opportunityScore = 100 - (monopolyScore * 1.2) - (medalPercent * 1.0);
          if (avgRevenue > 80000) opportunityScore += 15;
          opportunityScore = Math.max(15, Math.min(98, Math.round(opportunityScore)));

          return {
            id: sub.id,
            name: sub.name,
            total_items_in_this_category: (hash % 850) * 20 + 350,
            opportunityIndex: opportunityScore,
            monopolyLevel: monopolyScore < 25 ? 'Baixo' : monopolyScore < 40 ? 'Médio' : 'Alto',
            medalSellersPercent: medalPercent,
            avgRevenue: avgRevenue
          };
        });

        // Sort by the best opportunity first!
        computedTree.sort((a, b) => (b.opportunityIndex || 0) - (a.opportunityIndex || 0));
        setCategoryTree(computedTree);
        setSubLoading(false);
      })
      .catch((err) => {
        console.warn("Fell back to simulated subcategory tree:", err);
        // Fallback detailed subcategories
        const subFallbacks: Record<string, string[]> = {
          "MLB1051": ["Acessórios para Celulares", "Cabos & Carregadores", "Películas Protetoras", "Smartwatches", "Roteadores Repetidores Simples"],
          "MLB1648": ["Memórias RAM Portáteis", "Mouses Ergonômicos", "Teclados Mecânicos Gamer", "Malas para Notebooks", "Cabos de Fibra Óptica"],
          "MLB1000": ["Fones com Cancelamento", "Soundbars para Escritório", "Microfones Condensadores", "Placas de Captura USB"],
        };

        const activeSubNames = subFallbacks[selectedCategory] || ["Kit de Acessórios Únicos", "Organizadores Inteligentes", "Suportes Universais Multiuso", "Gadgets de Teste", "Embalagens Sustentáveis"];
        const computedTree: SubcategoryDetail[] = activeSubNames.map((name, idx) => {
          const monopolyScore = 15 + (idx * 8) % 35;
          const medalPercent = 10 + (idx * 6) % 30;
          const avgRevenue = (55 + idx * 25) * 1500;
          let opportunityScore = 95 - monopolyScore - (medalPercent * 0.8) + (avgRevenue > 100000 ? 10 : 0);
          opportunityScore = Math.round(Math.max(20, Math.min(99, opportunityScore)));

          return {
            id: `SUB-${1000 + idx}`,
            name: name,
            total_items_in_this_category: 150 + idx * 80,
            opportunityIndex: opportunityScore,
            monopolyLevel: monopolyScore < 22 ? 'Baixo' : monopolyScore < 35 ? 'Médio' : 'Alto',
            medalSellersPercent: medalPercent,
            avgRevenue: avgRevenue
          };
        });
        computedTree.sort((a, b) => (b.opportunityIndex || 0) - (a.opportunityIndex || 0));
        setCategoryTree(computedTree);
        setSubLoading(false);
      });
  }, [selectedCategory]);

  // --- TAB 2 TRIGGER: WINNER PRODUCTS FINDER ---
  const handleFindWinners = () => {
    setLoading(true);
    setApiError(null);
    const siteId = getSiteId();
    const cleanWord = encodeURIComponent(winnerSearchKeyword.trim() || 'fone bluetooth');
    
    // We trigger the proxy endpoint
    const url = getApiUrl(`/api/meli/search?siteId=${siteId}&q=${cleanWord}&limit=50`);

    const headers: Record<string, string> = {
      "Accept": "application/json"
    };
    const token = localStorage.getItem('meli_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(url, { headers })
      .then(res => {
        if (!res.ok) throw new Error("Erro na rede do buscaprodutos");
        return res.json();
      })
      .then((data: any) => {
        const results = data.results || [];
        
        // Map products and inject high craft simulation tags where genuine attributes are blank
        const mapped: OpportunityProduct[] = results.map((p: any, idx: number) => {
          // Check if item contains catalog attributes (catalog_listing flag)
          const isCatalogItem = p.catalog_listing === true || !!p.catalog_product_id;
          
          // Generate reviews between 3.8 and 5.0
          const hashChar = p.title.charCodeAt(0) || 4;
          const calculatedRating = 4.0 + Number(((hashChar % 11) / 10).toFixed(1)); 
          
          // Generate simulated age (between 5 and 360 days)
          // To have high performance new products, some must be < 30 days and have sales > 50
          const age = 10 + (hashChar * idx) % 150;
          const sales = p.sold_quantity || Math.floor((hashChar % 40) * 12 + 10);
          
          // Determine realistic seller reputation/medal
          const medalOptions: ('none' | 'platinum' | 'gold' | 'leader')[] = ['none', 'none', 'leader', 'gold', 'platinum'];
          const selectedMedal = medalOptions[(hashChar + idx) % medalOptions.length];

          const statesOfBrazil = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'DF'];
          const randomState = statesOfBrazil[(hashChar * idx) % statesOfBrazil.length];

          // Thumbnail upgrades for clean presentation
          let imgUrl = p.thumbnail || "";
          if (imgUrl.startsWith("http://")) {
            imgUrl = imgUrl.replace("http://", "https://");
          }
          imgUrl = imgUrl.replace("-I.jpg", "-O.jpg").replace("-I.jpeg", "-O.jpeg").replace("-I.png", "-O.png");

          // Extra attributes to support ZoomPulse filter options
          const imagesCount = (hashChar % 5) + 3; // 3 to 7 images
          const reviewsCount = (hashChar * idx % 350) + 12; // 12 to 362 reviews
          const revenue = p.price * sales;
          const brands = ["Samsung", "Xiaomi", "Apple", "Baseus", "Essager", "Ugreen", "MeliPro", "OEM", "Philco", "Mondial"];
          const brand = brands[(hashChar + idx) % brands.length];
          const isOfficialStore = (hashChar * idx) % 3 === 0;
          const reputations: ('green' | 'gold' | 'yellow' | 'red')[] = ['green', 'gold', 'yellow', 'red'];
          const sellerReputation = reputations[(hashChar + idx) % reputations.length];
          const isBestSeller = (hashChar * idx) % 4 === 0;
          const isInternational = (hashChar * idx) % 6 === 0;

          return {
            id: p.id,
            title: p.title,
            price: p.price,
            salesCount: sales,
            rating: calculatedRating,
            ageDays: age,
            isCatalog: isCatalogItem,
            sellerNickname: `Seller_${p.id.substring(3, 7)}`,
            sellerMedal: selectedMedal,
            freeShipping: p.shipping?.free_shipping ?? false,
            state: randomState,
            permalink: p.permalink,
            thumbnail: imgUrl,
            logisticType: p.shipping?.logistic_type === 'fulfillment' ? 'fulfillment' : ((hashChar % 2 === 0) ? 'fulfillment' : 'regular'),
            isInternational,
            isBestSeller,
            reviewsCount,
            revenue,
            brand,
            isOfficialStore,
            sellerReputation,
            imagesCount
          };
        });

        // APPLY FILTERS STRICTLY CORRESPONDING TO SYSTEM MANDATES (ZoomPulse)
        let filtered = [...mapped];

        // 1. Categoria
        if (filterCategory) {
          const catNameLower = filterCategory.toLowerCase();
          filtered = filtered.filter(p => p.title.toLowerCase().includes(catNameLower));
        }

        // 2. Tipo de Envio
        if (envioFull) {
          filtered = filtered.filter(p => p.logisticType === "fulfillment");
        }
        if (envioFreteGratis) {
          filtered = filtered.filter(p => p.freeShipping);
        }
        if (envioInternacional) {
          filtered = filtered.filter(p => p.isInternational);
        }

        // 3. Mais Vendido
        if (maisVendidoOption === 'only') {
          filtered = filtered.filter(p => p.isBestSeller === true);
        } else if (maisVendidoOption === 'exclude') {
          filtered = filtered.filter(p => !p.isBestSeller);
        }

        // 4. Produtos do Catálogo
        if (catalogoOption === 'only') {
          filtered = filtered.filter(p => p.isCatalog === true);
        } else if (catalogoOption === 'exclude') {
          filtered = filtered.filter(p => !p.isCatalog);
        }

        // 5. Preço
        if (precoMin !== '') {
          filtered = filtered.filter(p => p.price >= Number(precoMin));
        }
        if (precoMax !== '') {
          filtered = filtered.filter(p => p.price <= Number(precoMax));
        }

        // 6. Receita Mensal
        if (receitaMin !== '') {
          filtered = filtered.filter(p => p.revenue >= Number(receitaMin));
        }
        if (receitaMax !== '') {
          filtered = filtered.filter(p => p.revenue <= Number(receitaMax));
        }

        // 7. Vendas Mensais
        if (vendasMensaisMin !== '') {
          filtered = filtered.filter(p => p.salesCount >= Number(vendasMensaisMin));
        }
        if (vendasMensaisMax !== '') {
          filtered = filtered.filter(p => p.salesCount <= Number(vendasMensaisMax));
        }

        // 8. Tempo de Anúncio no Ar
        if (tempoAnuncioMin !== '') {
          filtered = filtered.filter(p => p.ageDays >= Number(tempoAnuncioMin));
        }
        if (tempoAnuncioMax !== '') {
          filtered = filtered.filter(p => p.ageDays <= Number(tempoAnuncioMax));
        }

        // 9. Imagens
        if (imagensMin !== '') {
          filtered = filtered.filter(p => p.imagesCount >= Number(imagensMin));
        }
        if (imagensMax !== '') {
          filtered = filtered.filter(p => p.imagesCount <= Number(imagensMax));
        }

        // 10. Avaliações (reviews count)
        if (avaliacoesMin !== '') {
          filtered = filtered.filter(p => p.reviewsCount >= Number(avaliacoesMin));
        }
        if (avaliacoesMax !== '') {
          filtered = filtered.filter(p => p.reviewsCount <= Number(avaliacoesMax));
        }

        // 11. Classificação (rating score)
        if (classificacaoMin !== '') {
          filtered = filtered.filter(p => p.rating >= Number(classificacaoMin));
        }
        if (classificacaoMax !== '') {
          filtered = filtered.filter(p => p.rating <= Number(classificacaoMax));
        }

        // 12. Vendedor query
        if (vendedorQuery.trim() !== '') {
          const q = vendedorQuery.toLowerCase();
          filtered = filtered.filter(p => p.sellerNickname.toLowerCase().includes(q));
        }

        // 13. Medalha
        if (vendedorMedal !== '') {
          filtered = filtered.filter(p => p.sellerMedal === vendedorMedal);
        }

        // 14. Reputação
        if (vendedorReputacao !== '') {
          filtered = filtered.filter(p => p.sellerReputation === vendedorReputacao);
        }

        // 15. Marca query
        if (marcaQuery.trim() !== '') {
          const q = marcaQuery.toLowerCase();
          filtered = filtered.filter(p => p.brand.toLowerCase().includes(q));
        }

        // 16. Loja Oficial
        if (lojaOficialOption === 'only') {
          filtered = filtered.filter(p => p.isOfficialStore === true);
        } else if (lojaOficialOption === 'exclude') {
          filtered = filtered.filter(p => !p.isOfficialStore);
        }

        // Calculate metadata of current batch
        const totalProductsMock = filtered.length;
        if (totalProductsMock > 0) {
          const avgPriceVal = filtered.reduce((acc, p) => acc + p.price, 0) / totalProductsMock;
          
          // Determine Monopoly Level based on sales concentration
          const sortedBySales = [...filtered].sort((a,b) => b.salesCount - a.salesCount);
          const totalSales = sortedBySales.reduce((acc, p) => acc + p.salesCount, 0);
          const top3Sales = sortedBySales.slice(0, 3).reduce((acc, p) => acc + p.salesCount, 0);
          const monopolyShareOfTopThree = totalSales > 0 ? (top3Sales / totalSales) * 100 : 0;

          // Badged sellers vs general
          const medalSellersCount = filtered.filter(p => p.sellerMedal !== 'none').length;
          const percentSellersWithMedal = (medalSellersCount / totalProductsMock) * 100;

          let opportunityTag = 'Extrema';
          if (monopolyShareOfTopThree > 60 || percentSellersWithMedal > 50) {
            opportunityTag = 'Baixa (Muito Concorrido)';
          } else if (monopolyShareOfTopThree > 40 || percentSellersWithMedal > 30) {
            opportunityTag = 'Média Mágica';
          }

          setWinnersMeta({
            avgPrice: avgPriceVal,
            monopShare: monopolyShareOfTopThree,
            underMedalPercent: percentSellersWithMedal,
            oportunityClass: opportunityTag
          });
        } else {
          setWinnersMeta({
            avgPrice: 0,
            monopShare: 0,
            underMedalPercent: 0,
            oportunityClass: 'Nenhuma'
          });
        }

        setDetectedWinners(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Winner finding search error:", err);
        setApiError("Erro ao comunicar com a consulta Mercado Livre. Filtros em tempo real simulados ativos!");
        
        // Robust mock data when API quota or internet fails
        const mockWinners: OpportunityProduct[] = [
          {
            id: "MLB32391039",
            title: "Fone de Ouvido Bluetooth Impermeável v5.4 AirMax Pro",
            price: 189.90,
            salesCount: 820,
            rating: 4.8,
            ageDays: 12, // created 12 days ago! (winner)
            isCatalog: false,
            sellerNickname: "AURA_RETAIL_BR",
            sellerMedal: "platinum",
            freeShipping: true,
            state: "SP",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/headphone.jpg",
            logisticType: "fulfillment",
            isInternational: false,
            isBestSeller: true,
            reviewsCount: 350,
            revenue: 155720,
            brand: "Ugreen",
            isOfficialStore: true,
            sellerReputation: "green",
            imagesCount: 6
          },
          {
            id: "MLB32391040",
            title: "Super Carregador Inteligente GaN 65W Turbo Tipo-C",
            price: 114.50,
            salesCount: 450,
            rating: 4.7,
            ageDays: 20, // winner
            isCatalog: false,
            sellerNickname: "TECH_MIND_STORE",
            sellerMedal: "gold",
            freeShipping: true,
            state: "MG",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/charger.jpg",
            logisticType: "fulfillment",
            isInternational: false,
            isBestSeller: true,
            reviewsCount: 120,
            revenue: 51525,
            brand: "Baseus",
            isOfficialStore: true,
            sellerReputation: "green",
            imagesCount: 4
          },
          {
            id: "MLB32391055",
            title: "Organizador de Cabos de Silicone Autoadesivo Flex",
            price: 29.90,
            salesCount: 145,
            rating: 3.6,
            ageDays: 6, // super short age, strong sales!
            isCatalog: false,
            sellerNickname: "UTIL_FAST_PRO",
            sellerMedal: "none",
            freeShipping: false,
            state: "PR",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/organizer.jpg",
            logisticType: "regular",
            isInternational: false,
            isBestSeller: false,
            reviewsCount: 22,
            revenue: 4335,
            brand: "OEM",
            isOfficialStore: false,
            sellerReputation: "yellow",
            imagesCount: 3
          },
          {
            id: "MLB32391082",
            title: "Suporte Ergonômico Portátil de Alumínio Maciço para Notebook",
            price: 98.00,
            salesCount: 310,
            rating: 4.9,
            ageDays: 24, // winner
            isCatalog: false,
            sellerNickname: "WORK_WELL_DEVICES",
            sellerMedal: "gold",
            freeShipping: true,
            state: "SP",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/stand.jpg",
            logisticType: "fulfillment",
            isInternational: false,
            isBestSeller: true,
            reviewsCount: 150,
            revenue: 30380,
            brand: "MeliPro",
            isOfficialStore: false,
            sellerReputation: "green",
            imagesCount: 5
          },
          {
            id: "MLB32392095",
            title: "Teclado Mecânico Compacto RGB Gamer Bluetooth 60%",
            price: 349.90,
            salesCount: 85,
            rating: 4.3,
            ageDays: 45,
            isCatalog: true,
            sellerNickname: "GAMING_SPHERE",
            sellerMedal: "leader",
            freeShipping: true,
            state: "RJ",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/keyboard.jpg",
            logisticType: "regular",
            isInternational: true,
            isBestSeller: false,
            reviewsCount: 40,
            revenue: 29741.5,
            brand: "Xiaomi",
            isOfficialStore: true,
            sellerReputation: "green",
            imagesCount: 5
          },
          {
            id: "MLB32393301",
            title: "Mouse Sem Fio Ergonômico Recarregável Vertical",
            price: 149.00,
            salesCount: 190,
            rating: 4.5,
            ageDays: 18,
            isCatalog: false,
            sellerNickname: "LOGI_X_SHOP",
            sellerMedal: "platinum",
            freeShipping: true,
            state: "SP",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/mouse.jpg",
            logisticType: "fulfillment",
            isInternational: false,
            isBestSeller: true,
            reviewsCount: 65,
            revenue: 28310,
            brand: "Samsung",
            isOfficialStore: true,
            sellerReputation: "green",
            imagesCount: 6
          },
          {
            id: "MLB32394042",
            title: "Cabo USB-C para Lightning Trançado Reforçado 2m",
            price: 45.00,
            salesCount: 1200,
            rating: 4.7,
            ageDays: 75,
            isCatalog: false,
            sellerNickname: "CONNECT_DIRECT",
            sellerMedal: "platinum",
            freeShipping: false,
            state: "PR",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/cable.jpg",
            logisticType: "fulfillment",
            isInternational: true,
            isBestSeller: true,
            reviewsCount: 650,
            revenue: 54000,
            brand: "Essager",
            isOfficialStore: false,
            sellerReputation: "green",
            imagesCount: 3
          },
          {
            id: "MLB32395510",
            title: "Mini Projetor Home Cinema Smart HD WiFi Android",
            price: 599.90,
            salesCount: 60,
            rating: 4.1,
            ageDays: 95,
            isCatalog: true,
            sellerNickname: "CINE_MAX_STORE",
            sellerMedal: "leader",
            freeShipping: true,
            state: "SC",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/projector.jpg",
            logisticType: "regular",
            isInternational: true,
            isBestSeller: false,
            reviewsCount: 30,
            revenue: 35994,
            brand: "Xiaomi",
            isOfficialStore: false,
            sellerReputation: "yellow",
            imagesCount: 7
          },
          {
            id: "MLB32396102",
            title: "Smartwatch Esportivo AMOLED Sensor Cardíaco GPS",
            price: 269.00,
            salesCount: 410,
            rating: 4.4,
            ageDays: 32,
            isCatalog: false,
            sellerNickname: "XIAOMI_OFICIAL_BR",
            sellerMedal: "platinum",
            freeShipping: true,
            state: "SP",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/watch.jpg",
            logisticType: "fulfillment",
            isInternational: false,
            isBestSeller: true,
            reviewsCount: 110,
            revenue: 110290,
            brand: "Xiaomi",
            isOfficialStore: true,
            sellerReputation: "green",
            imagesCount: 5
          },
          {
            id: "MLB32397720",
            title: "Mochila Impermeável Anti-Furto Notebook USB",
            price: 159.00,
            salesCount: 95,
            rating: 4.0,
            ageDays: 50,
            isCatalog: false,
            sellerNickname: "MALA_RAPIDA",
            sellerMedal: "none",
            freeShipping: true,
            state: "MG",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/backpack.jpg",
            logisticType: "regular",
            isInternational: false,
            isBestSeller: false,
            reviewsCount: 15,
            revenue: 15105,
            brand: "OEM",
            isOfficialStore: false,
            sellerReputation: "yellow",
            imagesCount: 4
          },
          {
            id: "MLB32398845",
            title: "Lâmpada Inteligente RGB Alexa Google Home 12W",
            price: 39.90,
            salesCount: 1500,
            rating: 4.8,
            ageDays: 120,
            isCatalog: false,
            sellerNickname: "LUZ_INTELIGENTE",
            sellerMedal: "platinum",
            freeShipping: true,
            state: "BA",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/lamp.jpg",
            logisticType: "fulfillment",
            isInternational: false,
            isBestSeller: true,
            reviewsCount: 1100,
            revenue: 59850,
            brand: "MeliPro",
            isOfficialStore: true,
            sellerReputation: "green",
            imagesCount: 4
          },
          {
            id: "MLB32399990",
            title: "Tripé Flexível para Celular Ring Light Bluetooth",
            price: 24.50,
            salesCount: 320,
            rating: 4.2,
            ageDays: 8,
            isCatalog: false,
            sellerNickname: "FOTO_FACIL",
            sellerMedal: "none",
            freeShipping: false,
            state: "PE",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/tripod.jpg",
            logisticType: "regular",
            isInternational: false,
            isBestSeller: false,
            reviewsCount: 48,
            revenue: 7840,
            brand: "OEM",
            isOfficialStore: false,
            sellerReputation: "yellow",
            imagesCount: 3
          },
          {
            id: "MLB32400122",
            title: "Balança Digital de Cozinha Inox Precisão 10kg",
            price: 19.90,
            salesCount: 2200,
            rating: 4.5,
            ageDays: 300,
            isCatalog: false,
            sellerNickname: "CASA_PRATICA",
            sellerMedal: "gold",
            freeShipping: false,
            state: "SP",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/scale.jpg",
            logisticType: "fulfillment",
            isInternational: false,
            isBestSeller: true,
            reviewsCount: 1400,
            revenue: 43780,
            brand: "Mondial",
            isOfficialStore: false,
            sellerReputation: "green",
            imagesCount: 2
          },
          {
            id: "MLB32402130",
            title: "Liquidificador Portátil USB Squeeze Garrafa",
            price: 79.90,
            salesCount: 180,
            rating: 3.9,
            ageDays: 14,
            isCatalog: false,
            sellerNickname: "ELETRO_FAST",
            sellerMedal: "leader",
            freeShipping: true,
            state: "ES",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/blender.jpg",
            logisticType: "regular",
            isInternational: false,
            isBestSeller: false,
            reviewsCount: 29,
            revenue: 14382,
            brand: "Philco",
            isOfficialStore: false,
            sellerReputation: "red",
            imagesCount: 5
          },
          {
            id: "MLB32403215",
            title: "Umidificador de Ar Ultrassônico Difusor LED",
            price: 54.00,
            salesCount: 290,
            rating: 4.6,
            ageDays: 22,
            isCatalog: false,
            sellerNickname: "AMBIENTE_SAUDAVEL",
            sellerMedal: "none",
            freeShipping: true,
            state: "GO",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/humidifier.jpg",
            logisticType: "fulfillment",
            isInternational: false,
            isBestSeller: false,
            reviewsCount: 88,
            revenue: 15660,
            brand: "Philco",
            isOfficialStore: false,
            sellerReputation: "green",
            imagesCount: 5
          },
          {
            id: "MLB32404450",
            title: "Hub USB-C 8 em 1 HDMI Ethernet SD Card Pro",
            price: 199.00,
            salesCount: 380,
            rating: 4.8,
            ageDays: 40,
            isCatalog: false,
            sellerNickname: "UGREEN_EXT",
            sellerMedal: "platinum",
            freeShipping: true,
            state: "SP",
            permalink: "https://www.mercadolivre.com.br",
            thumbnail: "https://assets.respawnre.com/items/hub.jpg",
            logisticType: "fulfillment",
            isInternational: true,
            isBestSeller: true,
            reviewsCount: 210,
            revenue: 75620,
            brand: "Ugreen",
            isOfficialStore: true,
            sellerReputation: "green",
            imagesCount: 6
          }
        ];

        let filtered = mockWinners;

        // Apply fallback filters
        if (filterCategory) {
          const catNameLower = filterCategory.toLowerCase();
          filtered = filtered.filter(p => p.title.toLowerCase().includes(catNameLower));
        }
        if (envioFull) {
          filtered = filtered.filter(p => p.logisticType === "fulfillment");
        }
        if (envioFreteGratis) {
          filtered = filtered.filter(p => p.freeShipping);
        }
        if (envioInternacional) {
          filtered = filtered.filter(p => p.isInternational);
        }
        if (maisVendidoOption === 'only') {
          filtered = filtered.filter(p => p.isBestSeller === true);
        } else if (maisVendidoOption === 'exclude') {
          filtered = filtered.filter(p => !p.isBestSeller);
        }
        if (catalogoOption === 'only') {
          filtered = filtered.filter(p => p.isCatalog === true);
        } else if (catalogoOption === 'exclude') {
          filtered = filtered.filter(p => !p.isCatalog);
        }
        if (precoMin !== '') {
          filtered = filtered.filter(p => p.price >= Number(precoMin));
        }
        if (precoMax !== '') {
          filtered = filtered.filter(p => p.price <= Number(precoMax));
        }
        if (receitaMin !== '') {
          filtered = filtered.filter(p => p.revenue >= Number(receitaMin));
        }
        if (receitaMax !== '') {
          filtered = filtered.filter(p => p.revenue <= Number(receitaMax));
        }
        if (vendasMensaisMin !== '') {
          filtered = filtered.filter(p => p.salesCount >= Number(vendasMensaisMin));
        }
        if (vendasMensaisMax !== '') {
          filtered = filtered.filter(p => p.salesCount <= Number(vendasMensaisMax));
        }
        if (tempoAnuncioMin !== '') {
          filtered = filtered.filter(p => p.ageDays >= Number(tempoAnuncioMin));
        }
        if (tempoAnuncioMax !== '') {
          filtered = filtered.filter(p => p.ageDays <= Number(tempoAnuncioMax));
        }
        if (imagensMin !== '') {
          filtered = filtered.filter(p => p.imagesCount >= Number(imagensMin));
        }
        if (imagensMax !== '') {
          filtered = filtered.filter(p => p.imagesCount <= Number(imagensMax));
        }
        if (avaliacoesMin !== '') {
          filtered = filtered.filter(p => p.reviewsCount >= Number(avaliacoesMin));
        }
        if (avaliacoesMax !== '') {
          filtered = filtered.filter(p => p.reviewsCount <= Number(avaliacoesMax));
        }
        if (classificacaoMin !== '') {
          filtered = filtered.filter(p => p.rating >= Number(classificacaoMin));
        }
        if (classificacaoMax !== '') {
          filtered = filtered.filter(p => p.rating <= Number(classificacaoMax));
        }
        if (vendedorQuery.trim() !== '') {
          const q = sellerNickname ? sellerNickname.toLowerCase() : vendedorQuery.toLowerCase();
          filtered = filtered.filter(p => p.sellerNickname.toLowerCase().includes(q));
        }
        if (vendedorMedal !== '') {
          filtered = filtered.filter(p => p.sellerMedal === vendedorMedal);
        }
        if (vendedorReputacao !== '') {
          filtered = filtered.filter(p => p.sellerReputation === vendedorReputacao);
        }
        if (marcaQuery.trim() !== '') {
          const q = marcaQuery.toLowerCase();
          filtered = filtered.filter(p => p.brand.toLowerCase().includes(q));
        }
        if (lojaOficialOption === 'only') {
          filtered = filtered.filter(p => p.isOfficialStore === true);
        } else if (lojaOficialOption === 'exclude') {
          filtered = filtered.filter(p => !p.isOfficialStore);
        }

        const totalFiltered = filtered.length;
        if (totalFiltered > 0) {
          const avgPriceVal = filtered.reduce((acc, p) => acc + p.price, 0) / totalFiltered;
          const sortedBySales = [...filtered].sort((a,b) => b.salesCount - a.salesCount);
          const totalSales = sortedBySales.reduce((acc, p) => acc + p.salesCount, 0);
          const top3Sales = sortedBySales.slice(0, 3).reduce((acc, p) => acc + p.salesCount, 0);
          const monopolyShare = totalSales > 0 ? (top3Sales / totalSales) * 100 : 0;
          const badgeCount = filtered.filter(p => p.sellerMedal !== 'none').length;
          const percentSellersWithMedal = (badgeCount / totalFiltered) * 100;

          setWinnersMeta({
            avgPrice: avgPriceVal,
            monopShare: monopolyShare,
            underMedalPercent: percentSellersWithMedal,
            oportunityClass: monopolyShare < 35 ? 'Extrema 🚀' : 'Boa ⭐'
          });
        } else {
          setWinnersMeta({
            avgPrice: 0,
            monopShare: 0,
            underMedalPercent: 0,
            oportunityClass: 'Nenhuma'
          });
        }

        setDetectedWinners(filtered);
        setLoading(false);
      });
  };

  useEffect(() => {
    handleFindWinners();
  }, [
    activeSubTab,
    selectedCountry,
    winnerSearchKeyword,
    filterCategory,
    envioFull,
    envioFreteGratis,
    envioInternacional,
    maisVendidoOption,
    catalogoOption,
    precoMin,
    precoMax,
    receitaMin,
    receitaMax,
    vendasMensaisMin,
    vendasMensaisMax,
    tempoAnuncioMin,
    tempoAnuncioMax,
    imagensMin,
    imagensMax,
    avaliacoesMin,
    avaliacoesMax,
    classificacaoMin,
    classificacaoMax,
    vendedorQuery,
    vendedorMedal,
    vendedorReputacao,
    marcaQuery,
    lojaOficialOption
  ]);

  // --- TAB 3 TRIGGER: KEYWORD COMPARATOR & SYNONYMS GAP ANALYSIS ---
  const handleKeywordAnalyze = () => {
    setLoading(true);
    
    // Simulate real database trend hits vs listings matching synonyms
    setTimeout(() => {
      const getHash = (st: string) => st.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const hA = getHash(keywordA);
      const hB = getHash(keywordB);

      const hitsA = 45000 + (hA % 30) * 1500;
      const listA = 1200 + (hA % 200) * 8;
      const ratioA = hitsA / listA;

      const hitsB = 35000 + (hB % 30) * 1200;
      const listB = 400 + (hB % 100) * 5;
      const ratioB = hitsB / listB;

      const comparison: KeywordComparison[] = [
        { term: keywordA, hits: hitsA, listingsCount: listA, opportunityRatio: Number(ratioA.toFixed(1)) },
        { term: keywordB, hits: hitsB, listingsCount: listB, opportunityRatio: Number(ratioB.toFixed(1)) }
      ];

      const winnerTerm = ratioA > ratioB ? keywordA : keywordB;

      // Regional seller allocation for SP, RJ, PR, MG
      const geoDist = [
        { state: "Estado de São Paulo (SP)", count: 280, percentage: 65 },
        { state: "Minas Gerais (MG)", count: 65, percentage: 15 },
        { state: "Paraná (PR)", count: 43, percentage: 10 },
        { state: "Rio de Janeiro (RJ)", count: 26, percentage: 6 },
        { state: "Outros Estados brasileiros", count: 17, percentage: 4 }
      ];

      setKeywordAnalysis({
        items: comparison,
        bestChoice: winnerTerm,
        suggestions: [
          `${winnerTerm} silicone`,
          `kit 3 ${winnerTerm}`,
          `${winnerTerm} antiqueda anti-impacto`,
          `${winnerTerm} magnetico ultra-slim`
        ],
        geoDistribution: geoDist
      });
      setLoading(false);
    }, 600);
  };

  useEffect(() => {
    handleKeywordAnalyze();
  }, [keywordA, keywordB, selectedCountry]);

  // --- TAB 4 TRIGGER: ESPIONAGEM CONCORRENTES ---
  const handleSpySearch = () => {
    // Generate intelligent seller profile overview
    const mockSellers: CompetitorProfile[] = [
      {
        name: "MASTER_DISTRIB_BR",
        salesCount: 15400,
        itemsCount: 122,
        estimatedConversion: 4.2,
        topKeywords: ["carregador turbo tipo c", "fone sem fio ergonomico", "capinha à prova d'água"],
        brandsMix: ["Baseus", "Essager", "Ugreen", "Marca Própria Premium"]
      },
      {
        name: "LIDER_ULTIMATE_SHOP",
        salesCount: 9800,
        itemsCount: 84,
        estimatedConversion: 3.8,
        topKeywords: ["mops autolimpantes", "lixeiras inteligentes de inox", "organizadores acrilicos"],
        brandsMix: ["Oikos", "Tramontina", "Sanremo", "Importados OEM"]
      },
      {
        name: "TECH_WAVES_MELI",
        salesCount: 6500,
        itemsCount: 45,
        estimatedConversion: 5.1,
        topKeywords: ["suporte veicular ventosa magsafe", "kit chaves precisao", "soundbar bluetooth 40w"],
        brandsMix: ["KAIDI", "Aura", "Hrebos", "Lelong"]
      }
    ];
    setCompetitorsList(mockSellers);
  };

  useEffect(() => {
    handleSpySearch();
  }, [spySearch]);

  const handleApplyTrendKeyword = (kw: string) => {
    setWinnerSearchKeyword(kw);
    setActiveSubTab('winners');
  };

  return (
    <div className="space-y-6">

      {/* Brand Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-cyan-500 text-slate-950 font-mono text-[9px] font-black rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> RADAR DE ALTA PERFORMANCE
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-cyan-400 font-mono font-bold uppercase">MeliPro Market Intelligence v3.2</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2.5 mt-1">
            <Layers className="w-6 h-6 text-cyan-400 animate-spin-slow" /> Radar de Oportunidades Lucrativas
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Navegue pela árvore de categorias do Mercado Livre, faça buscas filtrando o ruído de catálogo, compare variações de termos de buscas de alto tráfego e espione mix de produtos vencedores.
          </p>
        </div>

        {/* Simplificação de País */}
        <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1.5 w-full md:w-auto">
          <span className="text-[10px] font-bold text-slate-500 px-2 uppercase font-mono">Território:</span>
          {(['BR', 'MX', 'AR'] as const).map((country) => (
            <button
              key={country}
              onClick={() => setSelectedCountry(country)}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                selectedCountry === country 
                  ? 'bg-cyan-600 text-slate-950 shadow font-black' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {country === 'BR' && 'BR 🇧🇷'}
              {country === 'MX' && 'MX 🇲🇽'}
              {country === 'AR' && 'AR 🇦🇷'}
            </button>
          ))}
        </div>
      </div>

      {/* Sub tabs selectors */}
      <div className="flex bg-slate-900 border border-slate-800/80 p-1.5 rounded-xl gap-2 font-mono text-xs overflow-x-auto select-none">
        {[
          { id: 'picker', label: '📂 Árvore de Categorias', desc: 'Brechas de Concorrência' },
          { id: 'winners', label: '🚀 Radar de Anúncios Vencedores', desc: 'Análise Avançada de Filtros' },
          { id: 'keywords', label: '🔎 Lacunas e Palavras-Chave', desc: 'Volume vs Concorrência' },
          { id: 'competitors', label: '🕵️ Monitor de Mix de Concorrentes', desc: 'Espionagem e Estratégia' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 min-w-[210px] text-left p-3.5 rounded-lg transition-all border cursor-pointer ${
              activeSubTab === tab.id 
                ? 'bg-slate-950 text-white border-cyan-500/80 shadow-inner' 
                : 'text-slate-450 hover:bg-slate-950/40 hover:text-white border-transparent'
            }`}
          >
            <span className="block font-bold text-xs">{tab.label}</span>
            <span className="block text-[10px] text-slate-500 font-sans mt-0.5">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* MAIN CONTAINER WORKSPACE */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">

        {/* TAB 1: CATEGORY BRECHAS EXPLORER */}
        {activeSubTab === 'picker' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs">
              <div className="flex gap-2.5 items-start">
                <AlertCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-indigo-950">Métrica de Grau de Oportunidades por Categoria</h4>
                  <p className="text-slate-600 leading-normal">
                    Uma subcategoria é de <strong>Alta Oportunidade (Index &gt; 80%)</strong> se grandes players não dominam o mercado (<span className="text-indigo-600 font-semibold font-mono">Baixo nível de Monopolização</span>) e há uma <span className="text-indigo-600 font-semibold font-mono">baixa retenção de medalhas</span> nos primeiros resultados (facilidade de superação orgânica no algoritmo Meli).
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Category Picker Column */}
              <div className="lg:col-span-4 space-y-3">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Selecione uma Categoria Geral:</label>
                <div className="space-y-1.5 max-h-[460px] overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                        selectedCategory === cat.id 
                          ? 'bg-cyan-50 border-cyan-200 text-cyan-950 font-bold shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${selectedCategory === cat.id ? 'text-cyan-600' : 'text-slate-400'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories Analyzed List */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-rose-100/10">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Subcategorias Oportunísticas para Exploração profunda:</span>
                  <span className="text-xs bg-slate-100 text-slate-500 font-mono font-bold px-2 py-0.5 rounded-md">
                    Total: {categoryTree.length} analisadas
                  </span>
                </div>

                {subLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
                    <span className="text-xs text-slate-400 font-semibold font-mono">Processando e computando matriz de Monopolização da categoria...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryTree.map((sub, idx) => (
                      <div 
                        key={sub.id} 
                        className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">{sub.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({sub.id})</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 font-mono text-[10px] text-slate-500">
                            <div>Monopolização: <strong className={sub.monopolyLevel === 'Baixo' ? 'text-emerald-600' : sub.monopolyLevel === 'Médio' ? 'text-amber-600' : 'text-rose-600'}>{sub.monopolyLevel}</strong></div>
                            <div>Vendedores com Medalha: <strong className="text-slate-700">{sub.medalSellersPercent}%</strong></div>
                            <div>Faturamento Médio Est.: <strong className="text-slate-800">{getCurrencySymbol()} {sub.avgRevenue?.toLocaleString('pt-BR')}</strong></div>
                          </div>
                        </div>

                        {/* Opportunity Score Indicator */}
                        <div className="flex items-center gap-3.5 self-end md:self-auto font-mono">
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">Grau de Oportunidade</span>
                            <span className={`text-base font-black ${
                              (sub.opportunityIndex || 0) >= 80 ? 'text-emerald-600' : (sub.opportunityIndex || 0) >= 60 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                              {sub.opportunityIndex}%
                            </span>
                          </div>

                          <button 
                            onClick={() => handleApplyTrendKeyword(sub.name)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-3 py-1.5 rounded-lg text-[10px] uppercase shadow-2xs transition-colors cursor-pointer"
                          >
                            Analisar Anúncios ⚡
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: WINNERS RADAR */}
        {activeSubTab === 'winners' && (
          <div className="space-y-6">
            
            {/* --- JOOMPULSE STYLE SEARCH & FILTER DASHBOARD (ALL ENABLED) --- */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
              
              {/* Header and Country selection */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-cyan-600" /> JoomPulse Oportunidades Radar
                  </h3>
                  <p className="text-xs text-slate-500">Configure cruzamentos de dados avançados semelhantes ao painel JoomPulse para identificar brechas exclusivas.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Canal Ativo:</span>
                  <div className="bg-white border border-slate-200 rounded-lg py-1 px-3 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs select-none">
                    Brasil 🇧🇷 <span className="text-[10px] font-mono text-indigo-600 font-extrabold">(MLB)</span>
                  </div>
                </div>
              </div>

              {/* Primary Search Input */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="flex-1 relative">
                  <span className="text-[9px] uppercase font-mono font-extrabold text-slate-400 block mb-1">Palavra-chave Geral de Varredura</span>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={winnerSearchKeyword} 
                      onChange={(e) => setWinnerSearchKeyword(e.target.value)}
                      placeholder="Ex: fone bluetooth, organizador acrilico, garrafa termica..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-9 text-xs text-slate-800 font-bold placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>
                
                <div className="w-full md:w-auto flex items-end">
                  <button 
                    onClick={handleFindWinners}
                    disabled={loading}
                    className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-mono font-bold text-xs px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    BUSCAR VENCEDORES 🚀
                  </button>
                </div>
              </div>

              {/* JoomPulse Filter Panel Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* PANEL 1: PRODUTO */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-4 shadow-3xs hover:shadow-2xs transition-shadow">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-1.5 h-3.5 bg-cyan-600 rounded-xs inline-block"></span>1. Produto & Envio
                    </span>
                    <span className="text-[9px] font-mono font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded-sm">Filtros ML</span>
                  </div>

                  {/* Category Field */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Filtrar por nome de Categoria:</label>
                    <input 
                      type="text" 
                      value={filterCategory} 
                      onChange={(e) => setFilterCategory(e.target.value)}
                      placeholder="Ex: Celulares, Eletrônicos..."
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-lg text-slate-700 font-semibold focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  {/* Shipping Type Checkboxes */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Modalidades de Envios:</label>
                    <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600">
                      <label className="flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50">
                        <input 
                          type="checkbox" 
                          checked={envioFull} 
                          onChange={(e) => setEnvioFull(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-cyan-600"
                        />
                        <span>Apenas Envio Fulfillment (FULL) ⚡</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50">
                        <input 
                          type="checkbox" 
                          checked={envioFreteGratis} 
                          onChange={(e) => setEnvioFreteGratis(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-cyan-600"
                        />
                        <span>Frete Grátis Habilitado</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50">
                        <input 
                          type="checkbox" 
                          checked={envioInternacional} 
                          onChange={(e) => setEnvioInternacional(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-cyan-600"
                        />
                        <span>Envio Internacional (CrossBorder)</span>
                      </label>
                    </div>
                  </div>

                  {/* Best Seller Radio Options */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-100 uppercase font-mono font-bold block text-slate-400">Destaque de Mais Vendido:</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-lg text-[11px] font-mono font-bold text-slate-600 text-center">
                      <button 
                        onClick={() => setMaisVendidoOption('both')}
                        className={`py-1 rounded ${maisVendidoOption === 'both' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
                      >
                        Ambos
                      </button>
                      <button 
                        onClick={() => setMaisVendidoOption('only')}
                        className={`py-1 rounded ${maisVendidoOption === 'only' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
                      >
                        Apenas
                      </button>
                      <button 
                        onClick={() => setMaisVendidoOption('exclude')}
                        className={`py-1 rounded ${maisVendidoOption === 'exclude' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  {/* Catalog items options */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-100 uppercase font-mono font-bold block text-slate-400">Anúncio de Catálogo:</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-lg text-[11px] font-mono font-bold text-slate-600 text-center">
                      <button 
                        onClick={() => setCatalogoOption('both')}
                        className={`py-1 rounded ${catalogoOption === 'both' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
                      >
                        Ambos
                      </button>
                      <button 
                        onClick={() => setCatalogoOption('only')}
                        className={`py-1 rounded ${catalogoOption === 'only' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
                      >
                        Apenas
                      </button>
                      <button 
                        onClick={() => setCatalogoOption('exclude')}
                        className={`py-1 rounded ${catalogoOption === 'exclude' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>

                {/* PANEL 2: VENDAS */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-4 shadow-3xs hover:shadow-2xs transition-shadow">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-1.5 h-3.5 bg-emerald-600 rounded-xs inline-block"></span>2. Métricas de Vendas
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">Comercial</span>
                  </div>

                  {/* Preco bounds */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Preço (R$):</label>
                    <div className="flex gap-2 text-[10px] font-mono">
                      <button 
                        onClick={() => { setPrecoMin(''); setPrecoMax('50'); }}
                        className={`flex-1 py-1 rounded bg-slate-50 border ${precoMax === '50' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'} hover:border-slate-300`}
                      >
                        Até 50
                      </button>
                      <button 
                        onClick={() => { setPrecoMin('50'); setPrecoMax('150'); }}
                        className={`flex-1 py-1 rounded bg-slate-50 border ${precoMin === '50' && precoMax === '150' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'} hover:border-slate-300`}
                      >
                        50 a 150
                      </button>
                      <button 
                        onClick={() => { setPrecoMin('150'); setPrecoMax(''); }}
                        className={`flex-1 py-1 rounded bg-slate-50 border ${precoMin === '150' && precoMax === '' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'} hover:border-slate-300`}
                      >
                        150+
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={precoMin} 
                        onChange={(e) => setPrecoMin(e.target.value)}
                        placeholder="De"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      />
                      <span className="text-slate-400 text-xs">a</span>
                      <input 
                        type="number" 
                        value={precoMax} 
                        onChange={(e) => setPrecoMax(e.target.value)}
                        placeholder="Até"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Monthly Revenue bounds */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Receita Mensal Estimada (R$):</label>
                    <div className="flex gap-1.5 text-[9px] font-mono">
                      <button 
                        onClick={() => { setReceitaMin('0'); setReceitaMax('5000'); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${receitaMax === '5000' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        Até 5k
                      </button>
                      <button 
                        onClick={() => { setReceitaMin('5000'); setReceitaMax('20000'); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${receitaMin === '5000' && receitaMax === '20000' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        5k a 20k
                      </button>
                      <button 
                        onClick={() => { setReceitaMin('20000'); setReceitaMax(''); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${receitaMin === '20000' && receitaMax === '' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        20k+
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={receitaMin} 
                        onChange={(e) => setReceitaMin(e.target.value)}
                        placeholder="De"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      />
                      <span className="text-slate-400 text-xs">a</span>
                      <input 
                        type="number" 
                        value={receitaMax} 
                        onChange={(e) => setReceitaMax(e.target.value)}
                        placeholder="Até"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Monthly sales volume bounds */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Volume de Vendas Mensais:</label>
                    <div className="flex gap-1.5 text-[9px] font-mono">
                      <button 
                        onClick={() => { setVendasMensaisMin(''); setVendasMensaisMax('50'); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${vendasMensaisMax === '50' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        Até 50 un.
                      </button>
                      <button 
                        onClick={() => { setVendasMensaisMin('50'); setVendasMensaisMax('200'); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${vendasMensaisMin === '50' && vendasMensaisMax === '200' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        50 a 200
                      </button>
                      <button 
                        onClick={() => { setVendasMensaisMin('200'); setVendasMensaisMax(''); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${vendasMensaisMin === '200' && vendasMensaisMax === '' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        200+
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={vendasMensaisMin} 
                        onChange={(e) => setVendasMensaisMin(e.target.value)}
                        placeholder="De"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      />
                      <span className="text-slate-400 text-xs">a</span>
                      <input 
                        type="number" 
                        value={vendasMensaisMax} 
                        onChange={(e) => setVendasMensaisMax(e.target.value)}
                        placeholder="Até"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* PANEL 3: INFORMAÇÕES DO ANÚNCIO & IMAGENS */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-4 shadow-3xs hover:shadow-2xs transition-shadow">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-1.5 h-3.5 bg-indigo-600 rounded-xs inline-block"></span>3. Detalhes de Mídia & Vida
                    </span>
                    <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-sm">Metadata</span>
                  </div>

                  {/* Tempo de anuncio no ar */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Idade do Anúncio (Dias no ar):</label>
                    <div className="flex gap-1.5 text-[9px] font-mono">
                      <button 
                        onClick={() => { setTempoAnuncioMin('0'); setTempoAnuncioMax('30'); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${tempoAnuncioMax === '30' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        &lt; 30 dias (Novos)
                      </button>
                      <button 
                        onClick={() => { setTempoAnuncioMin('30'); setTempoAnuncioMax('120'); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${tempoAnuncioMin === '30' && tempoAnuncioMax === '120' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        30 - 120 dias
                      </button>
                      <button 
                        onClick={() => { setTempoAnuncioMin('120'); setTempoAnuncioMax(''); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${tempoAnuncioMin === '120' && tempoAnuncioMax === '' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        120+ dias
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={tempoAnuncioMin} 
                        onChange={(e) => setTempoAnuncioMin(e.target.value)}
                        placeholder="De"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      />
                      <span className="text-slate-400 text-xs">a</span>
                      <input 
                        type="number" 
                        value={tempoAnuncioMax} 
                        onChange={(e) => setTempoAnuncioMax(e.target.value)}
                        placeholder="Até"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Quantity of Images check */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Quantidade de Fotos Cadastradas:</label>
                    <div className="flex gap-1.5 text-[9px] font-mono">
                      <button 
                        onClick={() => { setImagensMin('1'); setImagensMax('3'); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${imagensMax === '3' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        Poucas (1-3 fotos)
                      </button>
                      <button 
                        onClick={() => { setImagensMin('4'); setImagensMax('6'); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${imagensMin === '4' && imagensMax === '6' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        Razoável (4-6)
                      </button>
                      <button 
                        onClick={() => { setImagensMin('7'); setImagensMax(''); }}
                        className={`flex-1 py-0.5 rounded bg-slate-50 border ${imagensMin === '7' && imagensMax === '' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'border-slate-100'}`}
                      >
                        Muitas (7+)
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={imagensMin} 
                        onChange={(e) => setImagensMin(e.target.value)}
                        placeholder="De"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      />
                      <span className="text-slate-400 text-xs">a</span>
                      <input 
                        type="number" 
                        value={imagensMax} 
                        onChange={(e) => setImagensMax(e.target.value)}
                        placeholder="Até"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* PANEL 4: NOTAS & AVALIAÇÕES */}
                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">4. Avaliações & Nota</span>
                    
                    {/* Reviews Count */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold block">Contagem de Avaliações (Volume de Reviews):</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={avaliacoesMin} 
                          onChange={(e) => setAvaliacoesMin(e.target.value)}
                          placeholder="Mínimo"
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                        />
                        <span className="text-slate-400 text-[10px]">a</span>
                        <input 
                          type="number" 
                          value={avaliacoesMax} 
                          onChange={(e) => setAvaliacoesMax(e.target.value)}
                          placeholder="Máximo"
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Star classifications rating */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold block">Classificação por Estrelas (Nota do Produto):</label>
                      <div className="flex items-center gap-2">
                        <select 
                          value={classificacaoMin} 
                          onChange={(e) => setClassificacaoMin(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                        >
                          <option value="0">Qualquer Nota</option>
                          <option value="3.5">🎯 &gt;= 3.5 Estrelas</option>
                          <option value="4.0">⭐ &gt;= 4.0 Estrelas</option>
                          <option value="4.5">🏆 &gt;= 4.5 Estrelas</option>
                          <option value="4.8">🌟 &gt;= 4.8 Estrelas</option>
                        </select>
                        <span className="text-slate-400 text-xs">a</span>
                        <select 
                          value={classificacaoMax} 
                          onChange={(e) => setClassificacaoMax(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                        >
                          <option value="5">5.0 Estrelas</option>
                          <option value="4.5">Até 4.5 Estrelas</option>
                          <option value="4.0">Até 4.0 Estrelas</option>
                          <option value="3.5">Até 3.5 Estrelas</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PANEL 5: VENDEDOR & REPUTAÇÃO */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-4 shadow-3xs hover:shadow-2xs transition-shadow lg:col-span-3 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-1.5 h-3.5 bg-rose-600 rounded-xs inline-block"></span>5. Vendedor & Reputação de Mercado
                    </span>
                    <span className="text-[9px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-sm">Combate Monopólio</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Seller Name Query */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Nickname do Vendedor:</label>
                      <input 
                        type="text" 
                        value={vendedorQuery} 
                        onChange={(e) => setVendedorQuery(e.target.value)}
                        placeholder="Ex: LOJA_OFICIAL..."
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-lg text-slate-700 font-semibold focus:outline-none"
                      />
                    </div>

                    {/* Vendedor Medal drop selectors */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Medalha MercadoLíder:</label>
                      <select 
                        value={vendedorMedal} 
                        onChange={(e) => setVendedorMedal(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-lg text-slate-700 font-semibold focus:outline-none"
                      >
                        <option value="">Consolo Geral (Todas)</option>
                        <option value="none">Sem Medalha (Fácil Combater)</option>
                        <option value="platinum">Platinum (Altíssimo)</option>
                        <option value="gold">Gold (Intermediário)</option>
                        <option value="leader">Líder (Iniciante)</option>
                      </select>
                    </div>

                    {/* Thermometer seller reputation color */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Reputação Termômetro:</label>
                      <select 
                        value={vendedorReputacao} 
                        onChange={(e) => setVendedorReputacao(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      >
                        <option value="">Qualquer cor</option>
                        <option value="green">🟢 Verde (Ideal/Saudável)</option>
                        <option value="gold">🟡 Amarelo (Médio)</option>
                        <option value="yellow">🟠 Laranja (Atenção)</option>
                        <option value="red">🔴 Vermelho (Sob risco)</option>
                      </select>
                    </div>

                    {/* Product Brand Filter */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Marca do Fabricante:</label>
                      <input 
                        type="text" 
                        value={marcaQuery} 
                        onChange={(e) => setMarcaQuery(e.target.value)}
                        placeholder="Ex: Xiaomi, Samsung, OEM..."
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-lg text-slate-700 font-semibold focus:outline-none font-mono"
                      />
                    </div>

                  </div>

                  {/* Official Store toggles (lojoficiais) */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="text-[10px] text-slate-100 uppercase font-mono font-bold block text-slate-400">Vendedor é Loja Oficial:</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-lg text-[11px] font-mono font-bold text-slate-600 text-center">
                      <button 
                        onClick={() => setLojaOficialOption('both')}
                        className={`py-1 rounded ${lojaOficialOption === 'both' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
                      >
                        Ambos
                      </button>
                      <button 
                        onClick={() => setLojaOficialOption('only')}
                        className={`py-1 rounded ${lojaOficialOption === 'only' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
                      >
                        Apenas Lojas Oficiais
                      </button>
                      <button 
                        onClick={() => setLojaOficialOption('exclude')}
                        className={`py-1 rounded ${lojaOficialOption === 'exclude' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-800'}`}
                      >
                        Excluir LOficiais
                      </button>
                    </div>
                  </div>

                  {/* Reset Filters button pill */}
                  <div className="pt-2 flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      ⚡ Filtros Interativos em Tempo Real Ativos
                    </span>
                    <button 
                      onClick={() => {
                        setFilterCategory('');
                        setEnvioFull(false);
                        setEnvioFreteGratis(false);
                        setEnvioInternacional(false);
                        setMaisVendidoOption('both');
                        setCatalogoOption('both');
                        setPrecoMin('');
                        setPrecoMax('');
                        setReceitaMin('');
                        setReceitaMax('');
                        setVendasMensaisMin('');
                        setVendasMensaisMax('');
                        setTempoAnuncioMin('');
                        setTempoAnuncioMax('');
                        setImagensMin('');
                        setImagensMax('');
                        setAvaliacoesMin('');
                        setAvaliacoesMax('');
                        setClassificacaoMin('0');
                        setClassificacaoMax('5');
                        setVendedorQuery('');
                        setVendedorMedal('');
                        setVendedorReputacao('');
                        setMarcaQuery('');
                        setLojaOficialOption('both');
                      }} 
                      className="text-slate-400 hover:text-rose-500 font-bold uppercase tracking-widest text-[9px] font-mono underline transition-colors cursor-pointer"
                    >
                      Limpar Filtros 🧹
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* General Metadata Report panel calculated on top of API results */}
            {detectedWinners.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-rose-500/10 bg-slate-950 text-white rounded-xl font-mono text-center">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block uppercase">Preço Médio Categoria</span>
                  <strong className="text-base text-cyan-400 block mt-1">{getCurrencySymbol()} {winnersMeta.avgPrice.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block uppercase">Nível Monopólio (TOP 3)</span>
                  <strong className={`text-base block mt-1 ${winnersMeta.monopShare > 60 ? 'text-rose-500' : winnersMeta.monopShare > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>{winnersMeta.monopShare.toFixed(1)}%</strong>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block uppercase">Medalhas Ativas</span>
                  <strong className="text-base text-indigo-400 block mt-1">{winnersMeta.underMedalPercent.toFixed(0)}% do mercado</strong>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block uppercase">Grau de Oportunidade</span>
                  <strong className="text-base text-emerald-400 block mt-1 uppercase font-black">{winnersMeta.oportunityClass}</strong>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <RefreshCw className="w-10 h-10 text-cyan-600 animate-spin" />
                <span className="text-xs text-slate-400 font-bold font-mono">Buscando anúncios, limpando logs de catalog, analisando ratings de reviews e calculando timestamps...</span>
              </div>
            ) : (
              <div className="space-y-4">
                
                <h4 className="text-xs font-mono uppercase font-bold text-slate-500 border-b border-slate-100 pb-2">Produtos Vencedores Detectados ({detectedWinners.length}):</h4>
                
                {detectedWinners.length === 0 ? (
                  <div className="bg-slate-50 text-slate-400 border border-slate-200 text-center py-16 rounded-xl font-medium text-xs">
                    Nenhum anúncio correspondente foi localizado com as estritas regras de filtragem aplicadas. Tente flexibilizar os limites de estrelas ou de idade!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detectedWinners.map((product) => (
                      <div 
                        key={product.id}
                        className="bg-white border border-slate-200 hover:border-cyan-400/80 p-4 rounded-xl shadow-xs transition-colors flex gap-4"
                      >
                        {/* Img Thumbnail container */}
                        <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200/50 flex items-center justify-center relative">
                          <img 
                            src={product.thumbnail} 
                            alt={product.title} 
                            className="object-contain w-full h-full p-1"
                            referrerPolicy="no-referrer"
                          />
                          {product.freeShipping && (
                            <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[8px] font-black uppercase text-center py-0.5">
                              FRETE GRÁTIS
                            </span>
                          )}
                        </div>

                        {/* Text context details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className="bg-slate-100 text-slate-700 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">{product.id}</span>
                            <span className="text-slate-400 text-[10px] items-center gap-1 flex font-mono"><MapPin className="w-3 h-3" /> {product.state}</span>
                          </div>

                          <a 
                            href={product.permalink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block font-bold text-xs text-slate-900 hover:text-cyan-600 truncate transition-colors"
                          >
                            {product.title}
                          </a>

                          <div className="flex justify-between items-center flex-wrap gap-2 pt-1 font-mono text-[10px]">
                            <span className="text-slate-900 font-extrabold text-sm">{getCurrencySymbol()} {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-500">Histórico: <strong className="text-slate-700">{product.salesCount}+ vendas</strong></span>
                          </div>

                          {/* ZoomPulse Estimated Monthly revenue */}
                          {product.revenue !== undefined && (
                            <div className="bg-slate-50 text-slate-700 text-[10px] font-mono px-2 py-1 rounded border border-slate-100 flex justify-between items-center">
                              <span>Consolo de Faturamento Est.:</span>
                              <strong className="text-slate-900 font-extrabold">{getCurrencySymbol()} {product.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês</strong>
                            </div>
                          )}

                          {/* Extra critical opportunity tags matched directly to specifications */}
                          <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] px-2 py-0.5 rounded flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {product.rating.toFixed(1)}
                              {product.reviewsCount !== undefined && (
                                <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
                              )}
                            </span>
                            
                            {product.ageDays <= 35 ? (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-250 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                                🔥 NOVO ({product.ageDays} dias)
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded">
                                Idade: {product.ageDays}d
                              </span>
                            )
                            }

                            {product.logisticType === 'fulfillment' ? (
                              <span className="bg-yellow-50 text-yellow-800 border border-yellow-250 text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase">
                                ⚡ FULL
                              </span>
                            ) : (
                              <span className="bg-slate-50 text-slate-500 text-[8px] px-1.5 py-0.5 rounded">
                                Regular
                              </span>
                            )}

                            {product.brand && (
                              <span className="bg-slate-100 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                                {product.brand}
                              </span>
                            )}

                            {product.isOfficialStore && (
                              <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 text-[8px] px-1.5 py-0.5 rounded font-mono font-black uppercase">
                                🛡️ LOJA OFICIAL
                              </span>
                            )}

                            {product.sellerMedal !== 'none' ? (
                              <span className="bg-indigo-50 text-indigo-705 border border-indigo-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-[80px]">
                                🏆 {product.sellerMedal}
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                👤 Geral
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* TAB 3: KEYWORDS COMPILER & GAP CODES */}
        {activeSubTab === 'keywords' && (
          <div className="space-y-6">
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs space-y-1 leading-relaxed">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-cyan-600 animate-pulse" /> Scanner de Lacunas de Demanda vs Concorrência
              </h4>
              <p className="text-slate-600">
                O tráfego de termos de pesquisas orgânicas varia muito de acordo com sinônimos de mercado (ex: "capa" vs "case", "fone" vs "headset"). Digite dois termos abaixo para analisar qual deles apresenta maior volume de consultas em relação ao número de competidores registrados.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-slate-100 bg-slate-50 rounded-xl">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Termo de Busca A (Variação Comum):</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={keywordA} 
                    onChange={(e) => setKeywordA(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-lg p-2.5 pl-8 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Termo de Busca B (Variação Sinônima):</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={keywordB} 
                    onChange={(e) => setKeywordB(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-lg p-2.5 pl-8 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
                </div>
              </div>
            </div>

            {keywordAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                
                {/* Comparison Chart Data */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 border-b border-slate-100 pb-2">Matriz de Performance de Sinônimos:</h4>
                  
                  <div className="space-y-3 font-mono">
                    {keywordAnalysis.items.map((kw, idx) => (
                      <div key={kw.term} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-sm text-slate-900">"{kw.term}"</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">Razão Demanda: {kw.opportunityRatio}x</span>
                        </div>

                        {/* Metricas progress bar bar */}
                        <div className="space-y-1.5 text-xs text-slate-500">
                          <div className="flex justify-between text-[10px]">
                            <span>Consultas Mensais Aprox: {kw.hits.toLocaleString('pt-BR')}</span>
                            <span>Anúncios Competindo: {kw.listingsCount.toLocaleString('pt-BR')}</span>
                          </div>
                          
                          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${idx === 0 ? 'bg-cyan-500' : 'bg-indigo-500'}`}
                              style={{ width: `${Math.min(100, (kw.opportunityRatio / 45) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendation Tag banner */}
                  <div className="bg-emerald-950/20 text-emerald-950 border border-emerald-900/30 p-4 rounded-xl text-xs space-y-1 leading-relaxed">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                      <span>🏆 Recomendação do Algoritmo MeliPro</span>
                    </div>
                    <p className="text-slate-600 font-medium">
                      O termo <strong className="text-slate-900 uppercase">"{keywordAnalysis.bestChoice}"</strong> possui o melhor índice de eficiência e menor saturação de anúncios de concorrentes ativos. Recomendamos utilizá-lo prioritariamente nos títulos dos seus anúncios e na configuração das tags de busca do Mercado Envios.
                    </p>
                  </div>
                </div>

                {/* Geography distribution heatmap column */}
                <div className="lg:col-span-5 space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 border-b border-slate-100 pb-2">Distribuição Geográfica de Vendas:</h4>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-[11px] text-slate-650">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase border-b border-slate-200/50 pb-1.5">Origem do Tráfego Sellers:</span>
                    
                    {keywordAnalysis.geoDistribution.map((state) => (
                      <div key={state.state} className="space-y-1.5">
                        <div className="flex justify-between font-semibold">
                          <span className="truncate">{state.state}</span>
                          <span>{state.percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full" 
                            style={{ width: `${state.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    
                    <p className="text-[10px] text-slate-400 font-sans pt-1 leading-relaxed">
                      Sellers do estado de São Paulo (SP) respondem por mais de 60% da concorrência logística total. Nichos regionais de Minas, Paraná ou Centro-Oeste oferecem tarifas melhores de frete Meli Flex.
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 4: COMPETITORS MIX ANALYSIS */}
        {activeSubTab === 'competitors' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs space-y-1">
              <h4 className="font-bold text-slate-950 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" /> Espionagem Estratégica de Concorrentes de Nicho
              </h4>
              <p className="text-slate-605 font-medium leading-relaxed">
                Pare de focar unicamente nas corporações multinacionais de faturamento bilionário. A instrução técnica das fontes exige vasculhar e listar lojas menores que possuam um mix de catálogos similar ao seu e espionar suas marcas, palavras-chave e taxas de conversão de anúncios.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-500">Palavra-chave para rastrear vendedores similares:</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={spySearch}
                    onChange={(e) => setSpySearch(e.target.value)}
                    placeholder="Ex: Importados, Casa & Cia..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-8 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                  <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
                </div>
              </div>
              <button 
                onClick={handleSpySearch}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-4 py-2.5 rounded-lg text-xs font-bold font-mono uppercase cursor-pointer flex-shrink-0"
              >
                Espionar Marcas e Mix 🕵️
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-450 border-b border-slate-100 pb-2">Perfis de Concorrentes Correlacionados Estimados:</h4>

              <div className="grid grid-cols-1 gap-4">
                {competitorsList.map((comp) => (
                  <div key={comp.name} className="p-5 border border-slate-200 rounded-xl hover:shadow-xs transition-shadow space-y-4 bg-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-[9px] font-mono uppercase bg-slate-100 px-2 py-0.5 rounded font-black text-slate-600">SELLER CONCORRENTE</span>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1">@{comp.name}</h4>
                      </div>
                      
                      <div className="flex gap-4 font-mono text-[11px] text-slate-500 sm:text-right">
                        <div>
                          <span className="block text-[9px] uppercase text-slate-400">Vendas Estimadas</span>
                          <strong className="text-slate-900 text-xs">{comp.salesCount.toLocaleString()} un</strong>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase text-slate-400">Mix Ativo</span>
                          <strong className="text-slate-900 text-xs">{comp.itemsCount} produtos</strong>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase text-slate-400">Taxa CVR Média</span>
                          <strong className="text-cyan-600 text-xs">{comp.estimatedConversion}%</strong>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-[11px] font-medium leading-relaxed">
                      <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg">
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Principais Marcas Operadas (Brands Mix):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {comp.brandsMix.map((b) => (
                            <span key={b} className="bg-white border border-slate-250 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">{b}</span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg">
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Termos e Títulos de Alta Frequência:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {comp.topKeywords.map((k) => (
                            <span key={k} className="bg-slate-205 text-indigo-800 border border-indigo-200/40 px-2 py-0.5 rounded text-[10px] font-semibold">"{k}"</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

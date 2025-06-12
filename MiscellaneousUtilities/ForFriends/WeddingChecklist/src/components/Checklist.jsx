import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react';

// Firebase imports (novo jeito!)
import { db, auth } from "../firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// Tailwind CSS is assumed to be available.

// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase only once
let app;
let db;
let auth;

if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
  }
} else {
  console.warn("Firebase config não disponível. O aplicativo funcionará sem persistência de dados.");
}

const initialChecklistData = [
  {
    id: 'convites',
    category: 'O Essencial',
    title: 'Convites',
    description: 'Convidar os 60 convidados de forma prática e econômica.',
    options: [
      { id: 'convite-digital-interativo', label: 'Convite Digital Interativo' },
      { id: 'convite-digital-simples', label: 'Convite Digital Simples' },
      { id: 'convite-fisico-diy', label: 'Convite Físico DIY (Faça Você Mesma)' },
    ],
  },
  {
    id: 'vestido-noiva',
    category: 'O Essencial',
    title: 'Vestido da Noiva e Acessórios',
    description: 'Encontrar um vestido lindo e acessórios que se encaixem no orçamento.',
    options: [
      { id: 'vestido-e-commerce', label: 'Comprar em E-commerce (Shopee/Shein/AliExpress)' },
      { id: 'vestido-aluguel-simples', label: 'Aluguel de Vestido Simples' },
      { id: 'vestido-casual-adaptado', label: 'Vestido Branco Casual Adaptado com Acessórios DIY' },
    ],
  },
  {
    id: 'beleza-noiva',
    category: 'O Essencial',
    title: 'Beleza da Noiva (Cabelo e Maquiagem)',
    description: 'Sentir-se radiante no grande dia.',
    options: [
      { id: 'beleza-diy', label: 'Maquiagem e Cabelo DIY (Faça Você Mesma)' },
      { id: 'beleza-amiga', label: 'Ajuda de Amiga Talentosa' },
      { id: 'beleza-estudante', label: 'Profissional em Formação/Estudante' },
    ],
  },
  {
    id: 'traje-noivo',
    category: 'O Essencial',
    title: 'Traje do Noivo',
    description: 'O noivo elegante e confortável.',
    options: [
      { id: 'traje-aluguel', label: 'Aluguel de Traje Completo' },
      { id: 'traje-existente', label: 'Usar um Traje Existente com Acessórios Novos' },
      { id: 'traje-suspensorios', label: 'Calça Social e Camisa com Suspensórios e Gravata/Lenço Rosa' },
    ],
  },
  {
    id: 'decoracao',
    category: 'Celebração e Ambiente',
    title: 'Decoração (Rosa e Branco)',
    description: 'Transformar o local com o tema do casamento.',
    options: [
      { id: 'decoracao-diy-flores', label: 'Centros de Mesa e Arranjos DIY (Flores Artificiais/Naturais da Estação)' },
      { id: 'decoracao-baloes-tecidos', label: 'Balões (Arcos Desconstruídos) e Tecidos Decorativos (Tule/Voil)' },
      { id: 'decoracao-iluminacao-detalhes', label: 'Iluminação (Pisca-Piscas/Lanternas de Papel) e Detalhes Complementares' },
    ],
  },
  {
    id: 'cerimonia',
    category: 'Celebração e Ambiente',
    title: 'Cerimônia (Música, Celebrante, Alianças)',
    description: 'O momento do "sim" ser inesquecível e significativo.',
    options: [
      { id: 'cerimonia-musica-playlist', label: 'Música com Playlist Personalizada (Celular/Caixa de Som)' },
      { id: 'cerimonia-celebrante-amigo', label: 'Celebrante Amigo ou Familiar' },
      { id: 'cerimonia-aliancas-acessiveis', label: 'Alianças (Opções Acessíveis: Aço, Prata, Folheadas, Joia de Família)' },
    ],
  },
  {
    id: 'alimentacao',
    category: 'O Banquete e as Recordações',
    title: 'Alimentação e Bebidas',
    description: 'Servir os convidados de forma deliciosa e econômica.',
    options: [
      { id: 'alimentacao-coquetel', label: 'Coquetel Simples (Mini-Salgados Assados/Fritos, Canapés)' },
      { id: 'alimentacao-frios', label: 'Mesa de Frios e Patês' },
      { id: 'alimentacao-nao-alcoolicas', label: 'Bebidas Não Alcoólicas Variadas' },
    ],
  },
  {
    id: 'bolo-doces',
    category: 'O Banquete e as Recordações',
    title: 'Bolo e Doces',
    description: 'Ter um bolo lindo e docinhos saborosos para a festa.',
    options: [
      { id: 'bolo-fake-corte', label: 'Bolo Fake Decorado + Bolo de Corte Simples' },
      { id: 'bolo-naked-caseiro', label: 'Naked Cake ou Bolo Caseiro Decorado com Flores' },
      { id: 'docinhos-caseiros-guloseimas', label: 'Docinhos Caseiros e Mesa de Guloseimas' },
    ],
  },
  {
    id: 'lembrancinhas',
    category: 'O Banquete e as Recordações',
    title: 'Lembrancinhas',
    description: 'Um mimo especial para os convidados lembrarem do dia.',
    options: [
      { id: 'lembrancinhas-doces-diy', label: 'Doces Personalizados DIY' },
      { id: 'lembrancinhas-mimos-diy', label: 'Pequenos Mimos DIY (Mini-Suculentas, Sachês, Mini-Velas)' },
      { id: 'lembrancinhas-chaveiros-imas', label: 'Chaveiros ou Ímãs Personalizados' },
    ],
  },
  {
    id: 'fotografia-video',
    category: 'O Banquete e as Recordações',
    title: 'Fotografia e Vídeo',
    description: 'Registrar os momentos especiais do casamento.',
    options: [
      { id: 'foto-amigo-familiar', label: 'Amigo/Familiar "Fotógrafo" com Boa Câmera/Celular' },
      { id: 'foto-iniciante', label: 'Contratar Fotógrafo/Videomaker Iniciante/Estudante' },
      { id: 'foto-descartaveis-polaroid', label: 'Câmeras Descartáveis/Polaroid para os Convidados' },
    ],
  },
  {
    id: 'detalhes-essenciais',
    category: 'Detalhes Finais e Controle',
    title: 'Outros Detalhes Essenciais',
    description: 'Garantir o conforto e a organização geral.',
    options: [
      { id: 'detalhes-kit-banheiro', label: 'Kit Banheiro DIY (Itens Essenciais em Cestas)' },
      { id: 'detalhes-lista-presentes', label: 'Lista de Presentes em Dinheiro / Cotas (Plataformas Online)' },
      { id: 'detalhes-placas-sinalizacao', label: 'Plaquinhas e Sinalização DIY' },
    ],
  },
];

const App = () => {
  const [checklist, setChecklist] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null); // State for collapsible sections

  // Firebase Authentication and Data Loading
  useEffect(() => {
    let unsubscribe;
    if (db && auth) {
      const initializeAuthAndLoadData = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }

          unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
              setUserId(user.uid);
              const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'weddingChecklist', 'data');
              onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                  const savedData = docSnap.data().items;
                  // Merge saved data with initial structure to ensure all options exist
                  const mergedChecklist = initialChecklistData.map(initialItem => {
                    const savedItem = savedData.find(si => si.id === initialItem.id);
                    if (savedItem) {
                      // Ensure options from saved data are preserved, if they exist
                      const updatedOptions = initialItem.options.map(option => {
                        const savedOptionDetails = savedItem.options.find(so => so.id === option.id);
                        return {
                          ...option,
                          budget: savedOptionDetails?.budget || '',
                          pros: savedOptionDetails?.pros || '',
                          cons: savedOptionDetails?.cons || '',
                        };
                      });
                      return {
                        ...initialItem,
                        options: updatedOptions,
                        selectedOption: savedItem.selectedOption,
                        completed: savedItem.completed,
                        currentBudget: savedItem.currentBudget || 0, // Ensure currentBudget is set
                      };
                    }
                    return {
                      ...initialItem,
                      options: initialItem.options.map(opt => ({ ...opt, budget: '', pros: '', cons: '' })),
                      selectedOption: null,
                      completed: false,
                      currentBudget: 0
                    };
                  });
                  setChecklist(mergedChecklist);
                } else {
                  // If no data, initialize with empty values
                  const initializedChecklist = initialChecklistData.map(item => ({
                    ...item,
                    options: item.options.map(opt => ({ ...opt, budget: '', pros: '', cons: '' })),
                    selectedOption: null,
                    completed: false,
                    currentBudget: 0
                  }));
                  setChecklist(initializedChecklist);
                }
                setLoading(false);
              }, (err) => {
                console.error("Erro ao carregar dados do Firestore:", err);
                setError("Erro ao carregar dados. Tente recarregar a página.");
                setLoading(false);
              });
            } else {
              setUserId(null);
              setLoading(false);
            }
          });
        } catch (err) {
          console.error("Erro na autenticação Firebase:", err);
          setError("Erro na autenticação. Tente recarregar a página.");
          setLoading(false);
        }
      };
      initializeAuthAndLoadData();
    } else {
      setLoading(false);
      // Fallback for when Firebase is not initialized (e.g., config missing)
      const initializedChecklist = initialChecklistData.map(item => ({
        ...item,
        options: item.options.map(opt => ({ ...opt, budget: '', pros: '', cons: '' })),
        selectedOption: null,
        completed: false,
        currentBudget: 0
      }));
      setChecklist(initializedChecklist);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []); // Run once on component mount

  // Function to save data to Firestore
  const saveDataToFirestore = useCallback(async (dataToSave) => {
    if (db && userId) {
      try {
        const userDocRef = doc(db, 'artifacts', appId, 'users', userId, 'weddingChecklist', 'data');
        await setDoc(userDocRef, { items: dataToSave });
      } catch (err) {
        console.error("Erro ao salvar dados no Firestore:", err);
        setError("Erro ao salvar dados. As alterações podem não ter sido salvas.");
      }
    }
  }, [db, userId]);

  // Handle changes in checklist items
  const handleItemChange = useCallback((itemId, key, value, optionId = null) => {
    setChecklist(prevChecklist => {
      const updatedChecklist = prevChecklist.map(item => {
        if (item.id === itemId) {
          if (optionId) {
            // Update an option's details (budget, pros, cons)
            const updatedOptions = item.options.map(opt =>
              opt.id === optionId ? { ...opt, [key]: value } : opt
            );
            return { ...item, options: updatedOptions };
          } else {
            // Update top-level item property (completed, selectedOption)
            return { ...item, [key]: value };
          }
        }
        return item;
      });
      saveDataToFirestore(updatedChecklist); // Save on every change
      return updatedChecklist;
    });
  }, [saveDataToFirestore]);

  // Calculate total budget
  const totalBudgetSpent = useMemo(() => {
    return checklist.reduce((total, item) => {
      if (item.selectedOption) {
        const selectedOpt = item.options.find(opt => opt.id === item.selectedOption);
        return total + (parseFloat(selectedOpt?.budget) || 0);
      }
      return total;
    }, 0);
  }, [checklist]);

  const budgetRemaining = 3000 - totalBudgetSpent;

  // Group checklist items by category
  const groupedChecklist = useMemo(() => {
    return checklist.reduce((acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [checklist]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pink-50 text-pink-700">
        <RefreshCcw className="animate-spin mr-2" size={24} /> Carregando seu checklist...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100 text-red-700 p-4 rounded-lg shadow-md">
        <p>Ocorreu um erro: {error}. Por favor, tente recarregar a página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white font-inter text-gray-800 p-4 sm:p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        input[type="radio"]:checked + label span {
          background-color: #ec4899; /* Pink-600 */
          border-color: #ec4899;
        }
        input[type="radio"]:checked + label span svg {
          opacity: 1;
        }
        .animate-check {
          animation: check-scale 0.3s ease-out;
        }
        @keyframes check-scale {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6 sm:p-8 border border-pink-200">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-pink-600 mb-2">
          Canvas de Planejamento de Casamento da Laura 💖
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Seu guia interativo para organizar o grande dia!
        </p>

        {userId && (
          <div className="text-sm text-gray-500 text-center mb-6 p-2 bg-pink-50 rounded-md">
            Seu ID de Usuário (para salvar e compartilhar): <span className="font-mono font-semibold text-pink-700 break-words">{userId}</span>
          </div>
        )}

        {/* Overview & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-pink-100 p-4 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-pink-700 mb-2">Orçamento Geral</h2>
            <p className="text-lg font-bold text-pink-800">Total Previsto: R$ 3.000,00</p>
            <p className="text-lg font-bold text-green-700">Gasto Atual: R$ {totalBudgetSpent.toFixed(2).replace('.', ',')}</p>
            <p className="text-lg font-bold" style={{ color: budgetRemaining < 0 ? '#ef4444' : '#22c55e' }}>
              Restante: R$ {budgetRemaining.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-pink-200">
            <h2 className="text-xl font-semibold text-pink-700 mb-2">Visão Rápida</h2>
            <p className="text-gray-700">
              <span className="font-semibold">Data:</span> 12 de Dezembro de 2025
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Cores:</span> Rosa e Branco
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Convidados:</span> 60
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Local:</span> Já Garantido (Sem Custo)
            </p>
          </div>
        </div>

        {/* Checklist Sections */}
        {Object.keys(groupedChecklist).map(category => (
          <div key={category} className="mb-8">
            <div
              className="flex items-center justify-between bg-pink-500 text-white p-4 rounded-lg cursor-pointer shadow-md transform hover:scale-[1.01] transition-transform duration-200"
              onClick={() => setActiveSection(activeSection === category ? null : category)}
            >
              <h2 className="text-2xl font-bold">{category}</h2>
              {activeSection === category ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
            {activeSection === category && (
              <div className="mt-4 space-y-6">
                {groupedChecklist[category].map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-lg shadow-md border border-pink-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-pink-600 mb-1">{item.title}</h3>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      </div>
                      <label className="flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={item.completed}
                          onChange={(e) => handleItemChange(item.id, 'completed', e.target.checked)}
                        />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                          ${item.completed ? 'bg-pink-500' : 'bg-gray-200 border-2 border-gray-300'}`}>
                          {item.completed && <Check size={20} className="text-white animate-check" />}
                        </div>
                        <span className="ml-2 text-sm text-gray-700 font-medium">Concluído</span>
                      </label>
                    </div>

                    <div className="space-y-4">
                      {item.options.map(option => (
                        <div key={option.id} className="border border-pink-100 p-4 rounded-lg bg-pink-50 transition-all duration-200 hover:shadow-sm">
                          <label className="flex items-start cursor-pointer mb-3">
                            <input
                              type="radio"
                              name={`option-${item.id}`}
                              className="hidden"
                              checked={item.selectedOption === option.id}
                              onChange={() => handleItemChange(item.id, 'selectedOption', option.id)}
                            />
                            <span className="w-5 h-5 rounded-full border-2 border-pink-300 flex items-center justify-center mr-3 transition-all duration-200">
                              {item.selectedOption === option.id && <span className="w-3 h-3 bg-pink-600 rounded-full"></span>}
                            </span>
                            <span className="text-md font-semibold text-pink-700 flex-1">{option.label}</span>
                          </label>

                          {item.selectedOption === option.id && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                              <div>
                                <label htmlFor={`${option.id}-budget`} className="block text-xs font-medium text-gray-500 mb-1">Orçamento (R$)</label>
                                <input
                                  type="number"
                                  id={`${option.id}-budget`}
                                  className="w-full p-2 border border-pink-200 rounded-md focus:ring-pink-300 focus:border-pink-300 text-sm"
                                  placeholder="0.00"
                                  value={option.budget}
                                  onChange={(e) => handleItemChange(item.id, 'budget', e.target.value, option.id)}
                                />
                              </div>
                              <div className="md:col-span-1">
                                <label htmlFor={`${option.id}-pros`} className="block text-xs font-medium text-gray-500 mb-1">Prós</label>
                                <textarea
                                  id={`${option.id}-pros`}
                                  className="w-full p-2 border border-pink-200 rounded-md focus:ring-pink-300 focus:border-pink-300 text-sm h-16 resize-y"
                                  placeholder="Vantagens dessa opção"
                                  value={option.pros}
                                  onChange={(e) => handleItemChange(item.id, 'pros', e.target.value, option.id)}
                                ></textarea>
                              </div>
                              <div className="md:col-span-1">
                                <label htmlFor={`${option.id}-cons`} className="block text-xs font-medium text-gray-500 mb-1">Contras</label>
                                <textarea
                                  id={`${option.id}-cons`}
                                  className="w-full p-2 border border-pink-200 rounded-md focus:ring-pink-300 focus:border-pink-300 text-sm h-16 resize-y"
                                  placeholder="Desvantagens dessa opção"
                                  value={option.cons}
                                  onChange={(e) => handleItemChange(item.id, 'cons', e.target.value, option.id)}
                                ></textarea>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Checklist = () => { 
  // ...todo o código igual ao seu App (mas mude o nome do componente para Checklist!)
};

export default Checklist;

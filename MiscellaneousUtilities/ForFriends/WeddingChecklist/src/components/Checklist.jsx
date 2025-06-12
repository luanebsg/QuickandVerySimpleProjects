import React, { useState, useEffect, useMemo } from "react";
import { db, auth } from "../firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

// O seu checklist inicial:
const initialChecklistData = [
  // ... (cole aqui todo o array que te passei antes, igualzinho!)
];

const Checklist = () => {
  const [checklist, setChecklist] = useState(null); // começa como null para indicar "carregando"
  const [activeSection, setActiveSection] = useState(null);
  const [userId, setUserId] = useState(null);

  // Autenticação anônima e sincronização com Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const docRef = doc(db, "users", user.uid);
        // Escuta mudanças em tempo real no Firestore
        const unsubFirestore = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setChecklist(docSnap.data().checklist);
          } else {
            // Se não existe dados, inicializa com o array inicial
            setChecklist(initialChecklistData.map(item => ({
              ...item,
              options: item.options.map(opt => ({ ...opt, budget: "", pros: "", cons: "" })),
              selectedOption: null,
              completed: false,
              currentBudget: 0
            })));
          }
        });
        return unsubFirestore;
      } else {
        // Se não está autenticado, faz login anônimo
        await signInAnonymously(auth);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sempre que o checklist mudar, salva no Firestore
  useEffect(() => {
    if (userId && checklist) {
      const docRef = doc(db, "users", userId);
      setDoc(docRef, { checklist }, { merge: true });
    }
  }, [userId, checklist]);

  // Função para alterar o checklist local
  const handleItemChange = (itemId, key, value, optionId = null) => {
    setChecklist(prevChecklist =>
      prevChecklist.map(item => {
        if (item.id === itemId) {
          if (optionId) {
            const updatedOptions = item.options.map(opt =>
              opt.id === optionId ? { ...opt, [key]: value } : opt
            );
            return { ...item, options: updatedOptions };
          } else {
            return { ...item, [key]: value };
          }
        }
        return item;
      })
    );
  };

  // Calcula total gasto
  const totalBudgetSpent = useMemo(() => {
    if (!checklist) return 0;
    return checklist.reduce((total, item) => {
      if (item.selectedOption) {
        const selectedOpt = item.options.find(opt => opt.id === item.selectedOption);
        return total + (parseFloat(selectedOpt?.budget) || 0);
      }
      return total;
    }, 0);
  }, [checklist]);

  const budgetRemaining = 3000 - totalBudgetSpent;

  // Agrupa por categoria
  const groupedChecklist = useMemo(() => {
    if (!checklist) return {};
    return checklist.reduce((acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [checklist]);

  // Exibe "carregando" enquanto não tem dados
  if (!checklist) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center text-pink-600 font-bold text-xl">
        Carregando checklist...
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
                          onChange={(e) => handleItemChange(item.id, "completed", e.target.checked)}
                        />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                          ${item.completed ? "bg-pink-500" : "bg-gray-200 border-2 border-gray-300"}`}>
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
                              onChange={() => handleItemChange(item.id, "selectedOption", option.id)}
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
                                  onChange={(e) => handleItemChange(item.id, "budget", e.target.value, option.id)}
                                />
                              </div>
                              <div className="md:col-span-1">
                                <label htmlFor={`${option.id}-pros`} className="block text-xs font-medium text-gray-500 mb-1">Prós</label>
                                <textarea
                                  id={`${option.id}-pros`}
                                  className="w-full p-2 border border-pink-200 rounded-md focus:ring-pink-300 focus:border-pink-300 text-sm h-16 resize-y"
                                  placeholder="Vantagens dessa opção"
                                  value={option.pros}
                                  onChange={(e) => handleItemChange(item.id, "pros", e.target.value, option.id)}
                                ></textarea>
                              </div>
                              <div className="md:col-span-1">
                                <label htmlFor={`${option.id}-cons`} className="block text-xs font-medium text-gray-500 mb-1">Contras</label>
                                <textarea
                                  id={`${option.id}-cons`}
                                  className="w-full p-2 border border-pink-200 rounded-md focus:ring-pink-300 focus:border-pink-300 text-sm h-16 resize-y"
                                  placeholder="Desvantagens dessa opção"
                                  value={option.cons}
                                  onChange={(e) => handleItemChange(item.id, "cons", e.target.value, option.id)}
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

export default Checklist;
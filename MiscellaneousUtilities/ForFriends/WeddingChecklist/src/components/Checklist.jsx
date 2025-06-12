import React, { useState, useEffect, useMemo, useCallback } from "react";
import { db, auth } from "../firebase";
import {
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { Check, ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";

const initialChecklistData = [
  // ... (mesmo conteúdo do seu checklist, pode colar aqui igual)
  // Por brevidade, não repito aqui, mas você cola igual do seu código.
];

const Checklist = () => {
  const [checklist, setChecklist] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  // Firebase Auth & Load
  useEffect(() => {
    let unsubscribe;
    const start = async () => {
      try {
        await signInAnonymously(auth);
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            setUserId(user.uid);
            const userDocRef = doc(db, "weddingChecklist", user.uid);
            onSnapshot(
              userDocRef,
              (docSnap) => {
                if (docSnap.exists()) {
                  setChecklist(docSnap.data().items);
                } else {
                  const baseData = initialChecklistData.map(item => ({
                    ...item,
                    options: item.options.map(opt => ({ ...opt, budget: '', pros: '', cons: '' })),
                    selectedOption: null,
                    completed: false
                  }));
                  setChecklist(baseData);
                }
                setLoading(false);
              },
              (err) => {
                setError("Erro ao carregar dados. Tente novamente.");
                setLoading(false);
              }
            );
          } else {
            setUserId(null);
            setLoading(false);
          }
        });
      } catch (err) {
        setError("Erro na autenticação.");
        setLoading(false);
      }
    };
    start();
    return () => unsubscribe && unsubscribe();
  }, []);

  // Salvar no Firestore
  const saveChecklist = useCallback(async (data) => {
    if (userId) {
      try {
        const userDocRef = doc(db, "weddingChecklist", userId);
        await setDoc(userDocRef, { items: data });
      } catch (err) {
        setError("Erro ao salvar dados.");
      }
    }
  }, [userId]);

  // Handle changes
  const handleItemChange = useCallback((itemId, key, value, optionId = null) => {
    setChecklist(prev =>
      prev.map(item => {
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
  }, []);

  // Salva sempre que checklist mudar
  useEffect(() => {
    if (!loading && userId) saveChecklist(checklist);
  }, [checklist, saveChecklist, loading, userId]);

  // Orçamento
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

  // Agrupar por categoria
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
        <p>Ocorreu um erro: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white font-inter text-gray-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6 sm:p-8 border border-pink-200">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-pink-600 mb-2">
          Canvas de Planejamento de Casamento da Laura 💖
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Seu guia interativo para organizar o grande dia!
        </p>
        {userId && (
          <div className="text-sm text-gray-500 text-center mb-6 p-2 bg-pink-50 rounded-md">
            Seu ID de Usuário: <span className="font-mono font-semibold text-pink-700 break-words">{userId}</span>
          </div>
        )}

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
                                <label className="block text-xs font-medium text-gray-500 mb-1">Orçamento (R$)</label>
                                <input
                                  type="number"
                                  className="w-full p-2 border border-pink-200 rounded-md focus:ring-pink-300 focus:border-pink-300 text-sm"
                                  placeholder="0.00"
                                  value={option.budget}
                                  onChange={(e) => handleItemChange(item.id, 'budget', e.target.value, option.id)}
                                />
                              </div>
                              <div className="md:col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Prós</label>
                                <textarea
                                  className="w-full p-2 border border-pink-200 rounded-md focus:ring-pink-300 focus:border-pink-300 text-sm h-16 resize-y"
                                  placeholder="Vantagens dessa opção"
                                  value={option.pros}
                                  onChange={(e) => handleItemChange(item.id, 'pros', e.target.value, option.id)}
                                ></textarea>
                              </div>
                              <div className="md:col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Contras</label>
                                <textarea
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

export default Checklist;
import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Bot } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [hasShownIntro, setHasShownIntro] = useState(false);

  useEffect(() => {
    // Show introduction after 2 seconds if not shown before
    if (!hasShownIntro) {
      const timer = setTimeout(() => {
        setIsMinimized(false);
        setHasShownIntro(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasShownIntro]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isMinimized && (
        <div className="bg-white rounded-lg shadow-xl mb-4 w-80 transform transition-transform">
          <div className="p-4 border-b flex items-center justify-between bg-gray-50 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Bot className="w-6 h-6 text-blue-600" />
              <h3 className="font-medium">Assistente Virtual</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Minimizar</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
                <p className="text-sm">
                  Olá! Sou o assistente virtual da Sapataria Guimarães. 
                  Em breve estarei disponível para ajudar com:
                </p>
                <ul className="mt-2 text-sm space-y-1 list-disc list-inside text-gray-600">
                  <li>Análise de dados e relatórios</li>
                  <li>Sugestões de melhorias</li>
                  <li>Alertas importantes</li>
                  <li>Respostas a dúvidas</li>
                  <li>Automação de tarefas</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Estou em desenvolvimento e em breve trarei mais funcionalidades 
                  para otimizar sua experiência! 🚀
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 rounded-b-lg">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Funcionalidade em desenvolvimento..."
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                disabled
              />
              <button
                className="ml-2 p-2 text-gray-400 cursor-not-allowed"
                disabled
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors relative"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full"></span>
        </button>
      )}
    </div>
  );
};

export default AIAssistant;
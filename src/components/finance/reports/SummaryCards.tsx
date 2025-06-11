import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../../utils/currencyUtils';

interface SummaryCardsProps {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netFlow: number;
  };
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Income */}
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total de Receitas</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Entradas</span>
          </div>
        </div>
      </div>

      {/* Total Expenses */}
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total de Despesas</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpenses)}
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm text-red-600">
            <TrendingDown className="w-4 h-4 mr-1" />
            <span>Saídas</span>
          </div>
        </div>
      </div>

      {/* Net Flow */}
      <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${
        summary.netFlow >= 0 ? 'border-blue-500' : 'border-orange-500'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Fluxo Líquido</p>
            <p className={`text-2xl font-bold ${
              summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {formatCurrency(summary.netFlow)}
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            summary.netFlow >= 0 ? 'bg-blue-100' : 'bg-orange-100'
          }`}>
            <DollarSign className={`w-6 h-6 ${
              summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`} />
          </div>
        </div>
        <div className="mt-4">
          <div className={`flex items-center text-sm ${
            summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
          }`}>
            {summary.netFlow >= 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            <span>{summary.netFlow >= 0 ? 'Positivo' : 'Negativo'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
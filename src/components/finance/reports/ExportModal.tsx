import React, { useState } from 'react';
import { X, Download, FileText, File } from 'lucide-react';
import { FinancialTransaction } from '../../../services/financialService';
import { formatCurrency } from '../../../utils/currencyUtils';

interface ExportModalProps {
  transactions: FinancialTransaction[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netFlow: number;
  };
  filters: any;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ transactions, summary, filters, onClose }) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      exportToPDF();
    } else {
      exportToExcel();
    }
  };

  const exportToPDF = () => {
    // Create a simple HTML report for PDF generation
    const reportContent = generateReportHTML();
    
    // Open in new window for printing/PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.print();
    }
    
    onClose();
  };

  const exportToExcel = () => {
    // Generate CSV content
    const csvContent = generateCSV();
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onClose();
  };

  const generateReportHTML = () => {
    const periodText = filters.dateRange.preset === 'today' ? 'Hoje' :
      filters.dateRange.preset === 'week' ? 'Esta Semana' :
      filters.dateRange.preset === 'month' ? 'Este Mês' :
      `${filters.dateRange.startDate} a ${filters.dateRange.endDate}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Financeiro - Sapataria Guimarães</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { margin-bottom: 30px; }
          .summary-card { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .income { color: #059669; }
          .expense { color: #dc2626; }
          .text-right { text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório Financeiro</h1>
          <h2>Sapataria Guimarães</h2>
          <p>Período: ${periodText}</p>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        ${includeSummary ? `
        <div class="summary">
          <h3>Resumo Financeiro</h3>
          <div class="summary-card">
            <h4>Total de Receitas</h4>
            <p class="income">${formatCurrency(summary.totalIncome)}</p>
          </div>
          <div class="summary-card">
            <h4>Total de Despesas</h4>
            <p class="expense">${formatCurrency(summary.totalExpenses)}</p>
          </div>
          <div class="summary-card">
            <h4>Fluxo Líquido</h4>
            <p class="${summary.netFlow >= 0 ? 'income' : 'expense'}">${formatCurrency(summary.netFlow)}</p>
          </div>
        </div>
        ` : ''}
        
        ${includeDetails ? `
        <div class="details">
          <h3>Detalhamento das Transações</h3>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Forma Pagamento</th>
                <th class="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(transaction => `
                <tr>
                  <td>${new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
                  <td>${transaction.type === 'income' ? 'Receita' : 'Despesa'}</td>
                  <td>${transaction.description}</td>
                  <td>${transaction.category}</td>
                  <td>${transaction.payment_method || '-'}</td>
                  <td class="text-right ${transaction.type === 'income' ? 'income' : 'expense'}">
                    ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(Math.abs(transaction.amount))}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      </body>
      </html>
    `;
  };

  const generateCSV = () => {
    let csv = 'Data,Tipo,Descrição,Categoria,Forma Pagamento,Valor\n';
    
    transactions.forEach(transaction => {
      const row = [
        new Date(transaction.date).toLocaleDateString('pt-BR'),
        transaction.type === 'income' ? 'Receita' : 'Despesa',
        `"${transaction.description}"`,
        transaction.category,
        transaction.payment_method || '',
        (transaction.type === 'income' ? '' : '-') + Math.abs(transaction.amount).toFixed(2)
      ].join(',');
      csv += row + '\n';
    });
    
    return csv;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Exportar Relatório</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Formato de Exportação
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value as 'pdf')}
                  className="mr-3"
                />
                <FileText className="w-5 h-5 mr-2 text-red-600" />
                <span>PDF (para impressão)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value as 'excel')}
                  className="mr-3"
                />
                <File className="w-5 h-5 mr-2 text-green-600" />
                <span>Excel/CSV (para análise)</span>
              </label>
            </div>
          </div>

          {/* Content Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Conteúdo do Relatório
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="mr-3"
                />
                <span>Incluir resumo financeiro</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  className="mr-3"
                />
                <span>Incluir detalhamento das transações</span>
              </label>
            </div>
          </div>

          {/* Report Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Informações do Relatório</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• {transactions.length} transações</p>
              <p>• Período: {filters.dateRange.preset === 'today' ? 'Hoje' : 
                filters.dateRange.preset === 'week' ? 'Esta semana' : 
                filters.dateRange.preset === 'month' ? 'Este mês' : 'Personalizado'}</p>
              <p>• Fluxo líquido: {formatCurrency(summary.netFlow)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={!includeSummary && !includeDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
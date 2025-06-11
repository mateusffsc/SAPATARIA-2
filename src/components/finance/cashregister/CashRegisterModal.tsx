import React, { useState } from 'react';
import { X, Lock, Unlock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { CashRegisterService, CashRegisterSession } from './CashRegisterService';
import { formatCurrency } from '../../../utils/currencyUtils';

interface CashRegisterModalProps {
  type: 'open' | 'close';
  currentSession: CashRegisterSession | null;
  onSuccess: () => void;
  onClose: () => void;
}

const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  type,
  currentSession,
  onSuccess,
  onClose
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'password' | 'amount'>('password');

  const handlePasswordSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const isValid = await CashRegisterService.validateAdminPassword(password);
      
      if (!isValid) {
        setError('Senha incorreta. Apenas administradores podem realizar esta operação.');
        return;
      }

      setStep('amount');
    } catch (error) {
      setError('Erro ao validar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const amountValue = parseFloat(amount);
      
      if (isNaN(amountValue) || amountValue < 0) {
        setError('Digite um valor válido.');
        return;
      }

      if (type === 'open') {
        await CashRegisterService.openCashRegister(amountValue, 'Admin');
      } else if (currentSession) {
        await CashRegisterService.closeCashRegister(
          currentSession.id,
          amountValue,
          'Admin',
          notes
        );
      }

      onSuccess();
    } catch (error) {
      setError('Erro ao processar operação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'password') {
        handlePasswordSubmit();
      } else {
        handleAmountSubmit();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {type === 'open' ? (
              <Unlock className="w-5 h-5 text-green-600" />
            ) : (
              <Lock className="w-5 h-5 text-red-600" />
            )}
            <h3 className="text-lg font-semibold">
              {type === 'open' ? 'Abrir Caixa' : 'Fechar Caixa'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 'password' ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">Acesso Restrito</p>
                    <p>Esta operação requer senha de administrador.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha do Administrador
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite a senha"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={loading || !password}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Continuar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {type === 'open' ? (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Abertura de Caixa</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Informe o valor inicial em dinheiro no caixa.
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Inicial (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="0,00"
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Fechamento de Caixa</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Conte o dinheiro no caixa e informe o valor final.
                  </p>

                  {currentSession && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Valor inicial:</span>
                          <p className="font-medium">{formatCurrency(currentSession.opening_amount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Aberto em:</span>
                          <p className="font-medium">
                            {new Date(currentSession.opened_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor Final no Caixa (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="0,00"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações (opcional)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observações sobre o fechamento..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAmountSubmit}
                  disabled={loading || !amount}
                  className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    type === 'open' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {loading ? 'Processando...' : type === 'open' ? 'Abrir Caixa' : 'Fechar Caixa'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashRegisterModal;
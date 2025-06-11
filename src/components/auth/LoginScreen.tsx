import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useToast } from '../shared/ToastContainer';

const LoginScreen: React.FC = () => {
  const { login, loading } = useAuth();
  const { showError } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const success = login(username, password);
      
      if (!success) {
        showError('Falha no login', 'Usuário ou senha incorretos. Tente novamente.');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Erro no login', error instanceof Error ? error.message : 'Ocorreu um erro ao tentar fazer login.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sapataria Guimarães</h1>
          <p className="text-gray-600">Sistema de Gestão</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuário
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
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

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Entrar</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-sm text-gray-600">
          <p className="text-center">
          </p>
          <p className="text-center text-xs text-gray-500 mt-1">
            
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
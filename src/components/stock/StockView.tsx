import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, Archive, ShoppingCart, RefreshCw } from 'lucide-react';
import ProductForm from '../cadastros/products/ProductForm';
import { useToast } from '../shared/ToastContainer';
import StockPurchaseModal from './StockPurchaseModal';
import { formatCurrency } from '../../utils/currencyUtils';

const StockView: React.FC = () => {
  const { products, setProducts, suppliers, loadProducts } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { showSuccess, showError } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const filteredItems = products.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = products.filter(item => item.stock <= item.minStock);
  
  // Calculate total stock value correctly
  const totalStockValue = products.reduce((sum, item) => sum + (item.stock * item.price), 0);

  const handleSave = (productData: any) => {
    try {
      if (editingItem) {
        setProducts(prev => prev.map(prod => 
          prod.id === editingItem.id ? { ...prod, ...productData } : prod
        ));
        showSuccess('Produto atualizado com sucesso!');
      } else {
        const newProduct = {
          id: products.length + 1,
          createdAt: new Date().toISOString().split('T')[0],
          isActive: true,
          ...productData
        };
        setProducts(prev => [...prev, newProduct]);
        showSuccess('Produto cadastrado com sucesso!');
      }
      
      setShowModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving product:', error);
      showError('Erro ao salvar produto', 'Não foi possível salvar o produto. Tente novamente.');
    }
  };

  const handleEdit = (product: any) => {
    setEditingItem(product);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(prev => prev.filter(prod => prod.id !== id));
      showSuccess('Produto excluído com sucesso!');
    }
  };

  const handlePurchase = (product: any) => {
    setSelectedProduct(product);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSave = (purchaseData: any) => {
    try {
      // Update product stock
      setProducts(prev => prev.map(prod => 
        prod.id === purchaseData.productId ? 
          { ...prod, stock: prod.stock + purchaseData.quantity } : 
          prod
      ));
      
      setShowPurchaseModal(false);
      setSelectedProduct(null);
      showSuccess('Compra de estoque registrada com sucesso!');
    } catch (error) {
      console.error('Error processing purchase:', error);
      showError('Erro ao processar compra', 'Não foi possível registrar a compra. Tente novamente.');
    }
  };

  const refreshStockData = async () => {
    setIsRefreshing(true);
    try {
      await loadProducts();
      showSuccess('Estoque atualizado com sucesso!');
    } catch (error) {
      console.error('Error refreshing stock data:', error);
      showError('Erro ao atualizar estoque', 'Não foi possível atualizar os dados do estoque.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
        <div className="flex space-x-3">
          <button
            onClick={refreshStockData}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700 transition-colors"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Estoque'}</span>
          </button>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Comprar Estoque</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Item</span>
          </button>
        </div>
      </div>

      {/* Stock Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total de Itens</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Estoque Baixo</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Archive className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Valor Total em Estoque</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalStockValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, categoria ou fornecedor..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Compra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{item.name}</td>
                  <td className="px-6 py-4">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.stock <= item.minStock
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.stock} unid.
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatCurrency(item.price)}</td>
                  <td className="px-6 py-4">{formatCurrency(item.stock * item.price)}</td>
                  <td className="px-6 py-4">{item.supplier}</td>
                  <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePurchase(item)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Comprar Estoque"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Nenhum item encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <ProductForm
          product={editingItem}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Stock Purchase Modal */}
      {showPurchaseModal && (
        <StockPurchaseModal
          product={selectedProduct}
          onSave={handlePurchaseSave}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default StockView;
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Search, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currencyUtils';
import FormInput from '../shared/FormInput';
import { ClientService } from '../../services/clientService';
import { CashService } from '../../services/cashService';
import { Client, ProductSale, ProductSaleItem } from '../../types';
import { supabase } from '../../lib/supabase';
import { FinancialService } from '../../services/financialService';
import { 
  validateCPF, 
  validatePhone, 
  validateEmail, 
  validateName,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES 
} from '../../utils/validators';
import { useToast } from '../shared/ToastContainer';

interface ProductSaleModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const ProductSaleModal: React.FC<ProductSaleModalProps> = ({ onClose, onSave }) => {
  const { 
    products, 
    clients, 
    paymentMethods, 
    setClients, 
    generateSaleNumber,
    setProductSales,
    productSales,
    loadProducts,
    setProducts,
    bankAccounts
  } = useAppContext();
  
  const { showSuccess, showError } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<number | ''>('');
  const [items, setItems] = useState<{
    productId: number;
    quantity: number;
    price: number;
    total: number;
  }[]>([{ productId: 0, quantity: 1, price: 0, total: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saleNumber, setSaleNumber] = useState('');

  // Payment options
  const [paymentOption, setPaymentOption] = useState<'normal' | 'cash' | 'installment'>('normal');
  const [cashDiscount, setCashDiscount] = useState(5); // Default 5% discount
  const [installments, setInstallments] = useState(2); // Default 2 installments
  const [installmentFee, setInstallmentFee] = useState(3); // Default 3% fee per installment
  const [originalTotal, setOriginalTotal] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  const [newClientData, setNewClientData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Generate sale number on mount
  useEffect(() => {
    generateSaleNumber().then(number => {
      setSaleNumber(number);
    });
  }, [generateSaleNumber]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = () => {
    setItems([...items, { productId: 0, quantity: 1, price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof typeof items[0], value: number) => {
    const newItems = [...items];
    const item = newItems[index];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.price = product.price;
        item.total = product.price * item.quantity;
      }
    } else if (field === 'quantity') {
      item.total = item.price * value;
    }
    
    item[field] = value;
    setItems(newItems);
  };

  // Calculate totals whenever items change
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    setOriginalTotal(subtotal);
    
    // Apply discount or fee based on payment option
    let finalAmount = subtotal;
    
    if (paymentOption === 'cash') {
      // Apply cash discount
      const discountAmount = subtotal * (cashDiscount / 100);
      finalAmount = subtotal - discountAmount;
    } else if (paymentOption === 'installment') {
      // Apply installment fee
      const feeAmount = subtotal * (installmentFee / 100) * installments;
      finalAmount = subtotal + feeAmount;
    }
    
    setFinalTotal(finalAmount);
  }, [items, paymentOption, cashDiscount, installments, installmentFee]);

  // Calculate installment value
  const calculateInstallmentValue = () => {
    if (paymentOption !== 'installment' || installments <= 0) {
      return 0;
    }
    return finalTotal / installments;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (isNewClient) {
      if (!validateName(newClientData.name)) {
        newErrors.newClientName = ERROR_MESSAGES.NAME_REQUIRED;
      }
      
      if (!newClientData.cpf.trim()) {
        newErrors.newClientCpf = ERROR_MESSAGES.REQUIRED_FIELD;
      } else if (!validateCPF(newClientData.cpf)) {
        newErrors.newClientCpf = ERROR_MESSAGES.CPF_INVALID;
      } else {
        // Check for duplicate CPF
        const existingClient = clients.find(c => c.cpf === newClientData.cpf);
        if (existingClient) {
          newErrors.newClientCpf = ERROR_MESSAGES.CPF_DUPLICATE;
        }
      }
      
      if (!newClientData.phone.trim()) {
        newErrors.newClientPhone = ERROR_MESSAGES.REQUIRED_FIELD;
      } else if (!validatePhone(newClientData.phone)) {
        newErrors.newClientPhone = ERROR_MESSAGES.PHONE_INVALID;
      }
      
      if (newClientData.email && !validateEmail(newClientData.email)) {
        newErrors.newClientEmail = ERROR_MESSAGES.EMAIL_INVALID;
      }
    } else if (!selectedClient) {
      newErrors.client = 'Selecione um cliente';
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Selecione uma forma de pagamento';
    }

    if (items.some(item => item.productId === 0)) {
      newErrors.items = 'Selecione todos os produtos';
    }

    if (items.some(item => item.quantity <= 0)) {
      newErrors.quantity = 'A quantidade deve ser maior que zero';
    }

    if (finalTotal <= 0) {
      newErrors.totalAmount = 'O valor total deve ser maior que zero';
    }

    // Validate payment options
    if (paymentOption === 'installment') {
      if (installments < 2) {
        newErrors.installments = 'O número de parcelas deve ser pelo menos 2';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Verifique os campos obrigatórios', 'Alguns campos precisam ser corrigidos antes de continuar.');
      return;
    }

    setSaving(true);

    try {
      let clientId = selectedClient;
      let clientName = '';

      // Create new client if needed
      if (isNewClient) {
        try {
          const newClient = await ClientService.create(newClientData);
          clientId = newClient.id;
          clientName = newClient.name;
          setClients(prev => [...prev, newClient]);
        } catch (error) {
          console.error('Failed to create client:', error);
          showError('Erro ao criar cliente', 'Não foi possível criar o cliente. Tente novamente.');
          setSaving(false);
          return;
        }
      } else {
        const client = clients.find(c => c.id === Number(selectedClient));
        clientName = client?.name || '';
      }

      // Find the Caixa Loja account
      const caixaLojaAccount = bankAccounts.find(account => account.name === 'Caixa Loja');
      if (!caixaLojaAccount) {
        showError('Conta não encontrada', 'A conta "Caixa Loja" não foi encontrada. Verifique as configurações.');
        setSaving(false);
        return;
      }

      // Prepare sale data
      const saleData = {
        sale_number: saleNumber,
        date: new Date().toISOString().split('T')[0],
        client_id: clientId,
        client_name: clientName,
        total_amount: finalTotal,
        payment_method: paymentMethod,
        status: 'completed',
        created_by: 'Admin',
        payment_option: paymentOption,
        cash_discount: paymentOption === 'cash' ? cashDiscount : null,
        installments: paymentOption === 'installment' ? installments : null,
        installment_fee: paymentOption === 'installment' ? installmentFee : null,
        original_amount: originalTotal
      };

      // Insert sale into database
      const { data: saleResult, error: saleError } = await supabase
        .from('product_sales')
        .insert(saleData)
        .select()
        .single();

      if (saleError) {
        throw saleError;
      }

      // Prepare items data
      const saleItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          sale_id: saleResult.id,
          product_id: item.productId,
          product_name: product?.name || '',
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.total
        };
      });

      // Insert items into database
      const { error: itemsError } = await supabase
        .from('product_sale_items')
        .insert(saleItems);

      if (itemsError) {
        throw itemsError;
      }

      // Create financial transaction for the sale
      await FinancialService.createTransaction({
        type: 'income',
        amount: finalTotal,
        description: `Venda de produtos ${saleNumber} - ${clientName}`,
        category: 'Produtos',
        reference_type: 'sale',
        reference_id: saleResult.id,
        reference_number: saleNumber,
        payment_method: paymentMethod,
        date: saleData.date,
        created_by: 'Admin',
        destination_account_id: caixaLojaAccount.id
      });

      // Update local state with new sale
      const newSale: ProductSale = {
        id: saleResult.id,
        saleNumber: saleResult.sale_number,
        date: saleResult.date,
        clientId: Number(saleResult.client_id),
        clientName: saleResult.client_name,
        items: saleItems.map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price
        })),
        totalAmount: saleResult.total_amount,
        paymentMethod: saleResult.payment_method,
        status: saleResult.status as 'completed' | 'cancelled',
        createdBy: saleResult.created_by,
        createdAt: saleResult.created_at
      };

      setProductSales(prev => [newSale, ...prev]);
      
      // Update product stock in local state
      const updatedProducts = [...products];
      items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: Math.max(0, updatedProducts[productIndex].stock - item.quantity)
          };
        }
      });
      setProducts(updatedProducts);
      
      // Reload products to update stock levels in the UI
      await loadProducts();
      
      showSuccess('Venda finalizada com sucesso!', `Venda ${saleNumber} registrada com sucesso.`);
      onClose();
    } catch (error) {
      console.error('Failed to save sale:', error);
      showError('Erro ao finalizar venda', error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-4">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">Venda de Produtos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Sale Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número da Venda
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 cursor-not-allowed"
                value={saleNumber}
                readOnly
              />
            </div>

            {/* Client Selection */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 sticky top-0 bg-white z-10 pb-4 border-b">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="clientType"
                    checked={!isNewClient}
                    onChange={() => setIsNewClient(false)}
                    className="mr-2"
                  />
                  Cliente existente
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="clientType"
                    checked={isNewClient}
                    onChange={() => setIsNewClient(true)}
                    className="mr-2"
                  />
                  Novo cliente
                </label>
              </div>

              {!isNewClient ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.client ? 'border-red-500' : ''
                    }`}
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(Number(e.target.value))}
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                  {errors.client && (
                    <p className="text-red-500 text-sm mt-1">{errors.client}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Novo Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Nome completo"
                      value={newClientData.name}
                      onChange={(value) => setNewClientData(prev => ({
                        ...prev,
                        name: value
                      }))}
                      required
                      error={errors.newClientName}
                    />
                    <FormInput
                      type="cpf"
                      label="CPF"
                      value={newClientData.cpf}
                      onChange={(value) => setNewClientData(prev => ({
                        ...prev,
                        cpf: value
                      }))}
                      required
                      error={errors.newClientCpf}
                    />
                    <FormInput
                      type="phone"
                      label="Telefone"
                      value={newClientData.phone}
                      onChange={(value) => setNewClientData(prev => ({
                        ...prev,
                        phone: value
                      }))}
                      required
                      error={errors.newClientPhone}
                    />
                    <FormInput
                      type="email"
                      label="E-mail"
                      value={newClientData.email}
                      onChange={(value) => setNewClientData(prev => ({
                        ...prev,
                        email: value
                      }))}
                      error={errors.newClientEmail}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Rua"
                      value={newClientData.street}
                      onChange={(value) => setNewClientData(prev => ({
                        ...prev,
                        street: value
                      }))}
                    />
                    <FormInput
                      label="Número"
                      value={newClientData.number}
                      onChange={(value) => setNewClientData(prev => ({
                        ...prev,
                        number: value
                      }))}
                    />
                  </div>

                  <FormInput
                    label="Complemento"
                    value={newClientData.complement}
                    onChange={(value) => setNewClientData(prev => ({
                      ...prev,
                      complement: value
                    }))}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      label="Bairro"
                      value={newClientData.neighborhood}
                      onChange={(value) => setNewClientData(prev => ({
                        ...prev,
                        neighborhood: value
                      }))}
                    />
                    <FormInput
                      label="Cidade"
                      value={newClientData.city}
                      onChange={(value) => setNewClientData(prev => ({
                        ...prev,
                        city: value
                      }))}
                    />
                    <FormInput
                      label="Estado"
                      value={newClientData.state}
                      onChange={(value) => setNewClientData(prev => ({
                        ...prev,
                        state: value
                      }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Products */}
            <div className="space-y-4">
              <div className="flex items-center justify-between sticky top-0 bg-white z-10 py-4">
                <h3 className="text-lg font-medium">Produtos</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Produto</span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', Number(e.target.value))}
                        required
                      >
                        <option value="">Selecione um produto</option>
                        {filteredProducts.map(product => (
                          <option key={product.id} value={product.id} disabled={product.stock <= 0}>
                            {product.name} - {formatCurrency(product.price)} - Estoque: {product.stock}
                            {product.stock <= 0 ? ' (Sem estoque)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-32">
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        required
                      />
                    </div>
                    
                    <div className="w-32">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        value={formatCurrency(item.total)}
                        readOnly
                      />
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {errors.items && (
                  <p className="text-red-500 text-sm">{errors.items}</p>
                )}
                {errors.quantity && (
                  <p className="text-red-500 text-sm">{errors.quantity}</p>
                )}
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Opções de Pagamento</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'normal'}
                      onChange={() => setPaymentOption('normal')}
                      className="text-blue-600"
                    />
                    <div>
                      <p className="font-medium">Preço Normal</p>
                      <p className="text-sm text-gray-600">Valor: {formatCurrency(originalTotal)}</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'cash'}
                      onChange={() => setPaymentOption('cash')}
                      className="text-blue-600"
                    />
                    <div>
                      <p className="font-medium">Desconto à Vista</p>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-16 px-2 py-1 border rounded"
                          value={cashDiscount}
                          onChange={(e) => setCashDiscount(Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm text-gray-600">% de desconto</span>
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'installment'}
                      onChange={() => setPaymentOption('installment')}
                      className="text-blue-600"
                    />
                    <div>
                      <p className="font-medium">Parcelado</p>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="2"
                          max="12"
                          className="w-16 px-2 py-1 border rounded"
                          value={installments}
                          onChange={(e) => setInstallments(Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm text-gray-600">parcelas</span>
                      </div>
                    </div>
                  </label>
                </div>
                
                {/* Show additional details based on payment option */}
                {paymentOption === 'cash' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-green-700">Desconto à Vista ({cashDiscount}%)</p>
                        <p className="text-sm text-green-600">
                          Economia de {formatCurrency(originalTotal * (cashDiscount / 100))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Valor Original</p>
                        <p className="text-gray-500 line-through">{formatCurrency(originalTotal)}</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(finalTotal)}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {paymentOption === 'installment' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-blue-700">
                          Parcelado em {installments}x de {formatCurrency(calculateInstallmentValue())}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-gray-600 mr-2">Taxa:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-16 px-2 py-1 border rounded"
                            value={installmentFee}
                            onChange={(e) => setInstallmentFee(Number(e.target.value))}
                          />
                          <span className="text-sm text-gray-600 ml-1">% por parcela</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Valor Original</p>
                        <p className="text-gray-500">{formatCurrency(originalTotal)}</p>
                        <p className="text-sm text-gray-600">Valor com Juros</p>
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(finalTotal)}</p>
                      </div>
                    </div>
                    
                    {errors.installments && (
                      <p className="text-red-500 text-sm mt-2">{errors.installments}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-4">
              <div className="flex items-center justify-between sticky top-0 bg-white z-10 py-4">
                <h3 className="text-lg font-medium">Pagamento</h3>
                <p className="text-xl font-bold text-green-600">
                  Total: {formatCurrency(finalTotal)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de Pagamento *
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.paymentMethod ? 'border-red-500' : ''
                  }`}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.name}>{method.name}</option>
                  ))}
                </select>
                {errors.paymentMethod && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
                )}
              </div>

              {/* Warning about stock */}
              {items.some(item => {
                const product = products.find(p => p.id === item.productId);
                return product && item.quantity > product.stock;
              }) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Atenção: Alguns produtos não possuem estoque suficiente para esta venda.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="p-6 border-t flex justify-end space-x-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando...' : 'Finalizar Venda'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSaleModal;
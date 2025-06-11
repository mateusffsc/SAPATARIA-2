import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { X, Plus, Trash2, Save, AlertTriangle, Upload } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { ClientService } from '../../services/clientService';
import { OrderService } from '../../services/orderService';
import { ImageService } from '../../services/imageService';
import { CEPService, AddressData } from '../../services/cepService';
import FormInput from '../shared/FormInput';
import MobileButton from '../shared/MobileButton';
import MobileModal from '../shared/MobileModal';
import SearchableSelect from '../shared/SearchableSelect';
import AutocompleteInput from '../shared/AutocompleteInput';
import CEPInput from '../shared/CEPInput';
import ImageUpload from '../shared/ImageUpload';
import ServiceCostComposition from './ServiceCostComposition';
import { useContextualSuggestions } from '../../hooks/useAutocomplete';
import { useToast } from '../shared/ToastContainer';
import { 
  validateCPF, 
  validatePhone, 
  validateEmail, 
  validateName, 
  validateFutureDate, 
  validatePositiveNumber,
  validateEntryValue,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES 
} from '../../utils/validators';

const OrderModal: React.FC = () => {
  const { 
    formData, 
    generateOrderNumber, 
    clients, 
    setClients, 
    services, 
    technicians, 
    employees,
    paymentMethods,
    orders, 
    setOrders, 
    setShowModal
  } = useAppContext();

  const { showSuccess, showError } = useToast();

  const [orderData, setOrderData] = useState({
    number: formData.number || '',
    date: formData.date || new Date().toISOString().split('T')[0],
    clientId: formData.clientId || '',
    newClient: formData.newClient || {
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
    },
    isNewClient: formData.isNewClient || false,
    article: formData.article || '',
    brand: formData.brand || '',
    model: formData.model || '',
    color: formData.color || '',
    size: formData.size || '',
    serialNumber: formData.serialNumber || '',
    description: formData.description || '',
    services: formData.services || [{ serviceId: '', name: '', details: '', price: 0, technicianId: '', costComposition: null }],
    deliveryDate: formData.deliveryDate || getDefaultDeliveryDate(),
    paymentMethodEntry: formData.paymentMethodEntry || '',
    totalValue: formData.totalValue || 0,
    entryValue: formData.entryValue || 0,
    remainingValue: formData.remainingValue || 0,
    paymentMethodRemaining: formData.paymentMethodRemaining || '',
    observations: formData.observations || '',
    status: formData.status || 'serviço pronto',
    cancelReason: formData.cancelReason || '',
    images: [],
    // New payment options
    paymentOption: formData.paymentOption || 'normal', // 'normal', 'cash', 'installment'
    cashDiscount: formData.cashDiscount || 5, // Default 5% discount
    installments: formData.installments || 2, // Default 2 installments
    installmentFee: formData.installmentFee || 3, // Default 3% fee per installment
    originalTotalValue: formData.originalTotalValue || 0 // Store original value before discounts/fees
  });

  const [skipEntryPayment, setSkipEntryPayment] = useState(false);
  const [managerPassword, setManagerPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCostComposition, setShowCostComposition] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  const [savedOrderNumber, setSavedOrderNumber] = useState('');

  // Get contextual suggestions
  const { modelSuggestions, sizeSuggestions } = useContextualSuggestions(
    orderData.brand, 
    orderData.article
  );

  // Get default delivery date (7 days from today)
  function getDefaultDeliveryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }

  // Generate order number on mount if creating new order
  useEffect(() => {
    if (!formData.id && !orderData.number) {
      generateOrderNumber().then(number => {
        setOrderData(prev => ({ ...prev, number }));
      });
    }
  }, [formData.id, orderData.number, generateOrderNumber]);

  // Load existing images if editing
  useEffect(() => {
    if (formData.id) {
      ImageService.getOrderImages(formData.id).then(images => {
        setOrderData(prev => ({ ...prev, images }));
      }).catch(console.error);
    }
  }, [formData.id]);

  // Auto-calculate remaining value when total or entry changes
  useEffect(() => {
    const servicesTotal = orderData.services.reduce((sum, service) => sum + (parseFloat(String(service.price)) || 0), 0);
    
    // Store original value before any discounts or fees
    const originalTotal = servicesTotal;
    
    // Apply discount or fee based on payment option
    let finalTotal = originalTotal;
    
    if (orderData.paymentOption === 'cash') {
      // Apply cash discount
      const discountAmount = originalTotal * (orderData.cashDiscount / 100);
      finalTotal = originalTotal - discountAmount;
    } else if (orderData.paymentOption === 'installment') {
      // Apply installment fee
      const feeAmount = originalTotal * (orderData.installmentFee / 100) * orderData.installments;
      finalTotal = originalTotal + feeAmount;
    }
    
    const remaining = Math.max(0, finalTotal - (parseFloat(String(orderData.entryValue)) || 0));
    
    setOrderData(prev => ({
      ...prev,
      originalTotalValue: originalTotal,
      totalValue: finalTotal,
      remainingValue: remaining
    }));
  }, [orderData.services, orderData.entryValue, orderData.paymentOption, orderData.cashDiscount, orderData.installments, orderData.installmentFee]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Client validation
    if (orderData.isNewClient) {
      if (!validateName(orderData.newClient.name)) {
        newErrors.newClientName = ERROR_MESSAGES.NAME_REQUIRED;
      }
      
      if (!orderData.newClient.cpf) {
        newErrors.newClientCpf = ERROR_MESSAGES.REQUIRED_FIELD;
      } else if (!validateCPF(orderData.newClient.cpf)) {
        newErrors.newClientCpf = ERROR_MESSAGES.CPF_INVALID;
      } else {
        // Check for duplicate CPF
        const existingClient = clients.find(c => c.cpf === orderData.newClient.cpf);
        if (existingClient) {
          newErrors.newClientCpf = ERROR_MESSAGES.CPF_DUPLICATE;
        }
      }
      
      if (!orderData.newClient.phone) {
        newErrors.newClientPhone = ERROR_MESSAGES.REQUIRED_FIELD;
      } else if (!validatePhone(orderData.newClient.phone)) {
        newErrors.newClientPhone = ERROR_MESSAGES.PHONE_INVALID;
      }
      
      if (orderData.newClient.email && !validateEmail(orderData.newClient.email)) {
        newErrors.newClientEmail = ERROR_MESSAGES.EMAIL_INVALID;
      }
    } else if (!orderData.clientId) {
      newErrors.client = 'Selecione um cliente';
    }

    // Order validation
    if (!orderData.article.trim()) {
      newErrors.article = ERROR_MESSAGES.REQUIRED_FIELD;
    }

    if (!orderData.deliveryDate) {
      newErrors.deliveryDate = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!validateFutureDate(orderData.deliveryDate)) {
      newErrors.deliveryDate = ERROR_MESSAGES.FUTURE_DATE_REQUIRED;
    }

    if (!validatePositiveNumber(orderData.totalValue)) {
      newErrors.totalValue = ERROR_MESSAGES.POSITIVE_VALUE_REQUIRED;
    }

    if (!skipEntryPayment) {
      if (!validateEntryValue(orderData.entryValue, orderData.totalValue)) {
        newErrors.entryValue = ERROR_MESSAGES.ENTRY_VALUE_INVALID;
      }
      
      if (orderData.entryValue > 0 && !orderData.paymentMethodEntry) {
        newErrors.paymentMethodEntry = 'Selecione a forma de pagamento da entrada';
      }
    }

    // Services validation
    const hasValidService = orderData.services.some(service => 
      service.name.trim() && service.price > 0
    );
    if (!hasValidService) {
      newErrors.services = 'Adicione pelo menos um serviço válido';
    }

    // Payment option validation
    if (orderData.paymentOption === 'installment') {
      if (orderData.installments < 2) {
        newErrors.installments = 'O número de parcelas deve ser pelo menos 2';
      }
      if (!orderData.paymentMethodRemaining) {
        newErrors.paymentMethodRemaining = 'Selecione a forma de pagamento das parcelas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressFound = (address: AddressData) => {
    setOrderData(prev => ({
      ...prev,
      newClient: {
        ...prev.newClient,
        street: address.logradouro,
        neighborhood: address.bairro,
        city: address.localidade,
        state: address.uf,
        zipCode: address.cep
      }
    }));
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'cancelada' && orderData.status !== 'cancelada') {
      setShowCancelModal(true);
      return;
    }
    setOrderData(prev => ({ ...prev, status: newStatus }));
  };

  const handleCancelOrder = (reason: string) => {
    setOrderData(prev => ({ 
      ...prev, 
      status: 'cancelada',
      cancelReason: reason
    }));
    setShowCancelModal(false);
  };

  const handleSkipEntryPayment = () => {
    setShowPasswordModal(true);
  };

  const validateManagerPassword = () => {
    if (managerPassword === 'admin123') {
      setSkipEntryPayment(true);
      setShowPasswordModal(false);
      setManagerPassword('');
      setOrderData(prev => ({ ...prev, entryValue: 0 }));
    } else {
      showError('Senha incorreta!');
    }
  };

  const addService = () => {
    setOrderData(prev => ({
      ...prev,
      services: [...prev.services, { serviceId: '', name: '', details: '', price: 0, technicianId: '', costComposition: null }]
    }));
  };

  const removeService = (index: number) => {
    setOrderData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const updateService = (index: number, field: string, value: any) => {
    setOrderData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));

    if (field === 'serviceId') {
      const selectedService = services?.find(s => s.id === parseInt(value));
      if (selectedService) {
        setOrderData(prev => ({
          ...prev,
          services: prev.services.map((service, i) => 
            i === index ? { 
              ...service, 
              name: selectedService.name,
              price: selectedService.defaultPrice 
            } : service
          )
        }));
      }
    }
  };

  const updateServiceCost = (index: number, costData: any) => {
    setOrderData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { 
          ...service, 
          price: costData.finalPrice,
          costComposition: costData
        } : service
      )
    }));
  };

  const handlePaymentOptionChange = (option: string) => {
    setOrderData(prev => ({
      ...prev,
      paymentOption: option
    }));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showError('Verifique os campos obrigatórios', 'Alguns campos precisam ser corrigidos antes de continuar.');
      return;
    }

    setSaving(true);

    try {
      let clientId = orderData.clientId;

      // Create new client if needed
      if (orderData.isNewClient && orderData.newClient.name) {
        const newClient = await ClientService.create(orderData.newClient);
        clientId = newClient.id;
        setClients(prev => [...prev, newClient]);
      }

      const orderToSave = {
        ...orderData,
        clientId: Number(clientId),
        client: orderData.isNewClient ? orderData.newClient.name : clients?.find(c => c.id === parseInt(String(clientId)))?.name || '',
        payments: formData.payments || [],
        createdBy: 'Admin',
        createdAt: formData.createdAt || new Date().toISOString(),
        lastModifiedBy: 'Admin',
        lastModifiedAt: new Date().toISOString()
      };

      // Add entry payment if exists and not already in payments array
      if (orderToSave.entryValue > 0 && orderToSave.paymentMethodEntry) {
        const entryPayment = {
          date: orderToSave.date,
          value: orderToSave.entryValue,
          method: orderToSave.paymentMethodEntry,
          type: 'entrada'
        };
        
        // Add the payment regardless of duplication - the database trigger will handle deduplication
        orderToSave.payments.push(entryPayment);
      }

      let savedOrder;
      if (formData.id) {
        savedOrder = await OrderService.update(formData.id, orderToSave);
        setOrders(prev => prev.map(o => o.id === formData.id ? savedOrder : o));
        showSuccess(SUCCESS_MESSAGES.ORDER_UPDATED);
      } else {
        savedOrder = await OrderService.create(orderToSave);
        setOrders(prev => [savedOrder, ...prev]);
        setSavedOrderNumber(savedOrder.number);
        setShowSuccessActions(true);
      
        
        return; // Don't close modal yet, show success actions
      }

      setShowModal(false);
    } catch (error) {
      console.error('Failed to save order:', error);
      showError('Erro ao salvar ordem de serviço', error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAnother = () => {
    // Reset form for new order
    setOrderData({
      number: '',
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      newClient: {
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
      },
      isNewClient: false,
      article: '',
      brand: '',
      model: '',
      color: '',
      size: '',
      serialNumber: '',
      description: '',
      services: [{ serviceId: '', name: '', details: '', price: 0, technicianId: '', costComposition: null }],
      deliveryDate: getDefaultDeliveryDate(),
      paymentMethodEntry: '',
      totalValue: 0,
      entryValue: 0,
      remainingValue: 0,
      paymentMethodRemaining: '',
      observations: '',
      status: 'serviço pronto',
      cancelReason: '',
      images: [],
      paymentOption: 'normal',
      cashDiscount: 5,
      installments: 2,
      installmentFee: 3,
      originalTotalValue: 0
    });
    setErrors({});
    setShowSuccessActions(false);
    setSavedOrderNumber('');
    
    // Generate new order number
    generateOrderNumber().then(number => {
      setOrderData(prev => ({ ...prev, number }));
    });
  };

  // Calculate installment value
  const calculateInstallmentValue = () => {
    if (orderData.paymentOption !== 'installment' || orderData.installments <= 0) {
      return 0;
    }
    return orderData.remainingValue / orderData.installments;
  };

  // Prepare options for selects
  const clientOptions = clients?.map(client => ({
    value: client.id,
    label: client.name,
    subtitle: client.cpf
  })) || [];

  const serviceOptions = services?.map(service => ({
    value: service.id,
    label: service.name,
    subtitle: formatCurrency(service.defaultPrice)
  })) || [];

  // Get technicians from employees with role 'technician'
  const technicianOptions = employees
    ?.filter(emp => emp.role === 'technician')
    .map(tech => ({
      value: tech.id,
      label: tech.name,
      subtitle: tech.username
    })) || [];

  const paymentMethodOptions = paymentMethods?.map(method => ({
    value: method.name,
    label: method.name
  })) || [];

  if (showSuccessActions) {
    return (
      <MobileModal
        isOpen={true}
        onClose={() => setShowModal(false)}
        title="Ordem de Serviço Criada!"
        size="md"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {SUCCESS_MESSAGES.ORDER_CREATED(savedOrderNumber)}
            </h3>
            <p className="text-gray-600">
              A ordem de serviço foi criada e está pronta para ser processada.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <MobileButton
              onClick={handleCreateAnother}
              variant="secondary"
              fullWidth
              icon={<Plus className="w-4 h-4" />}
            >
              Criar Outra OS
            </MobileButton>
            <MobileButton
              onClick={() => setShowModal(false)}
              variant="primary"
              fullWidth
            >
              Fechar
            </MobileButton>
          </div>
        </div>
      </MobileModal>
    );
  }

  return (
    <MobileModal
      isOpen={true}
      onClose={() => setShowModal(false)}
      title={formData.id ? `Editar ${orderData.number}` : 'Nova OS'}
      size="full"
      footer={
        <div className="flex flex-col sm:flex-row gap-3">
          <MobileButton
            onClick={() => setShowModal(false)}
            variant="secondary"
            fullWidth
            disabled={saving}
          >
            Cancelar
          </MobileButton>
          <MobileButton
            onClick={handleSave}
            variant="primary"
            fullWidth
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </MobileButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Número da OS"
            value={orderData.number}
            onChange={() => {}} // Read-only
            disabled
            className="bg-gray-50"
          />
          <FormInput
            type="date"
            label="Data de Abertura"
            value={orderData.date}
            onChange={(value) => setOrderData(prev => ({ ...prev, date: value }))}
          />
        </div>

        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="clientType"
                  checked={!orderData.isNewClient}
                  onChange={() => setOrderData(prev => ({ ...prev, isNewClient: false }))}
                  className="mr-2"
                />
                Cliente existente
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="clientType"
                  checked={orderData.isNewClient}
                  onChange={() => setOrderData(prev => ({ ...prev, isNewClient: true }))}
                  className="mr-2"
                />
                Novo cliente
              </label>
            </div>

            {!orderData.isNewClient ? (
              <SearchableSelect
                options={clientOptions}
                value={orderData.clientId}
                onChange={(value) => setOrderData(prev => ({ ...prev, clientId: value }))}
                placeholder="Selecione um cliente"
                error={errors.client}
                required
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Nome completo"
                    value={orderData.newClient.name}
                    onChange={(value) => setOrderData(prev => ({
                      ...prev,
                      newClient: { ...prev.newClient, name: value }
                    }))}
                    required
                    error={errors.newClientName}
                  />
                  <FormInput
                    type="cpf"
                    label="CPF"
                    value={orderData.newClient.cpf}
                    onChange={(value) => setOrderData(prev => ({
                      ...prev,
                      newClient: { ...prev.newClient, cpf: value }
                    }))}
                    required
                    error={errors.newClientCpf}
                  />
                  <FormInput
                    type="phone"
                    label="Telefone"
                    value={orderData.newClient.phone}
                    onChange={(value) => setOrderData(prev => ({
                      ...prev,
                      newClient: { ...prev.newClient, phone: value }
                    }))}
                    required
                    error={errors.newClientPhone}
                  />
                  <FormInput
                    type="email"
                    label="E-mail"
                    value={orderData.newClient.email}
                    onChange={(value) => setOrderData(prev => ({
                      ...prev,
                      newClient: { ...prev.newClient, email: value }
                    }))}
                    error={errors.newClientEmail}
                  />
                </div>

                {/* Address with CEP integration */}
                <div className="space-y-4">
                  <CEPInput
                    value={orderData.newClient.zipCode}
                    onChange={(value) => setOrderData(prev => ({
                      ...prev,
                      newClient: { ...prev.newClient, zipCode: value }
                    }))}
                    onAddressFound={handleAddressFound}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Rua"
                      value={orderData.newClient.street}
                      onChange={(value) => setOrderData(prev => ({
                        ...prev,
                        newClient: { ...prev.newClient, street: value }
                      }))}
                    />
                    <FormInput
                      label="Número"
                      value={orderData.newClient.number}
                      onChange={(value) => setOrderData(prev => ({
                        ...prev,
                        newClient: { ...prev.newClient, number: value }
                      }))}
                    />
                  </div>

                  <FormInput
                    label="Complemento"
                    value={orderData.newClient.complement}
                    onChange={(value) => setOrderData(prev => ({
                      ...prev,
                      newClient: { ...prev.newClient, complement: value }
                    }))}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      label="Bairro"
                      value={orderData.newClient.neighborhood}
                      onChange={(value) => setOrderData(prev => ({
                        ...prev,
                        newClient: { ...prev.newClient, neighborhood: value }
                      }))}
                    />
                    <FormInput
                      label="Cidade"
                      value={orderData.newClient.city}
                      onChange={(value) => setOrderData(prev => ({
                        ...prev,
                        newClient: { ...prev.newClient, city: value }
                      }))}
                    />
                    <FormInput
                      label="Estado"
                      value={orderData.newClient.state}
                      onChange={(value) => setOrderData(prev => ({
                        ...prev,
                        newClient: { ...prev.newClient, state: value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Item */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Informações do Artigo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AutocompleteInput
              label="Tipo do artigo"
              field="article"
              value={orderData.article}
              onChange={(value) => setOrderData(prev => ({ ...prev, article: value }))}
              required
              error={errors.article}
              placeholder="Ex: Sapato social, Tênis, Sandália..."
            />
            
            <AutocompleteInput
              label="Marca"
              field="brand"
              value={orderData.brand}
              onChange={(value) => setOrderData(prev => ({ ...prev, brand: value }))}
              placeholder="Ex: Nike, Adidas, Melissa..."
            />
            
            <FormInput
              label="Modelo"
              value={orderData.model}
              onChange={(value) => setOrderData(prev => ({ ...prev, model: value }))}
              suggestions={modelSuggestions}
              onSuggestionSelect={(value) => setOrderData(prev => ({ ...prev, model: value }))}
              placeholder="Ex: Air Max, Ultraboost..."
            />
            
            <AutocompleteInput
              label="Cor"
              field="color"
              value={orderData.color}
              onChange={(value) => setOrderData(prev => ({ ...prev, color: value }))}
              placeholder="Ex: Preto, Branco, Marrom..."
            />
            
            <FormInput
              label="Tamanho"
              value={orderData.size}
              onChange={(value) => setOrderData(prev => ({ ...prev, size: value }))}
              suggestions={sizeSuggestions}
              onSuggestionSelect={(value) => setOrderData(prev => ({ ...prev, size: value }))}
              placeholder="Ex: 37, 42, M, G..."
            />
            
            <FormInput
              label="Número de Série"
              value={orderData.serialNumber}
              onChange={(value) => setOrderData(prev => ({ ...prev, serialNumber: value }))}
              placeholder="Número de identificação do produto"
            />
          </div>
          
          <FormInput
            label="Descrição detalhada do artigo"
            value={orderData.description}
            onChange={(value) => setOrderData(prev => ({ ...prev, description: value }))}
            placeholder="Descreva detalhes importantes do artigo..."
          />
        </div>

        {/* Images */}
        <div>
          <ImageUpload
            orderId={formData.id}
            existingImages={orderData.images}
            onImagesChange={(images) => setOrderData(prev => ({ ...prev, images }))}
            maxImages={10}
          />
        </div>

        {/* Services */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Serviços</h3>
            <MobileButton
              onClick={addService}
              variant="success"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Adicionar Serviço
            </MobileButton>
          </div>

          {errors.services && (
            <p className="text-red-500 text-sm">{errors.services}</p>
          )}

          {orderData.services.map((service, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Serviço {index + 1}</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCostComposition(showCostComposition === index ? null : index)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {showCostComposition === index ? 'Ocultar Custos' : 'Composição de Custo'}
                  </button>
                  {orderData.services.length > 1 && (
                    <MobileButton
                      onClick={() => removeService(index)}
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                    />
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SearchableSelect
                  options={serviceOptions}
                  value={service.serviceId}
                  onChange={(value) => updateService(index, 'serviceId', value)}
                  placeholder="Selecione o serviço"
                />
                
                <FormInput
                  label="Nome do serviço"
                  value={service.name}
                  onChange={(value) => updateService(index, 'name', value)}
                />
                
                <FormInput
                  type="number"
                  step="0.01"
                  min="0"
                  label="Valor"
                  value={service.price.toString()}
                  onChange={(value) => updateService(index, 'price', parseFloat(value) || 0)}
                />
                
                <SearchableSelect
                  options={technicianOptions}
                  value={service.technicianId}
                  onChange={(value) => updateService(index, 'technicianId', value)}
                  placeholder="Selecione o técnico"
                />
              </div>
              
              <FormInput
                label="Detalhes específicos do serviço"
                value={service.details}
                onChange={(value) => updateService(index, 'details', value)}
                placeholder="Descreva detalhes específicos deste serviço..."
              />

              {/* Cost composition */}
              {showCostComposition === index && (
                <ServiceCostComposition
                  serviceId={`${index}`}
                  initialCost={service.costComposition}
                  onCostChange={(costData) => updateServiceCost(index, costData)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Payment Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Opções de Pagamento</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="radio"
                  name="paymentOption"
                  checked={orderData.paymentOption === 'normal'}
                  onChange={() => handlePaymentOptionChange('normal')}
                  className="text-blue-600"
                />
                <div>
                  <p className="font-medium">Preço Normal</p>
                  <p className="text-sm text-gray-600">Valor: {formatCurrency(orderData.originalTotalValue)}</p>
                </div>
              </label>
              
              <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="radio"
                  name="paymentOption"
                  checked={orderData.paymentOption === 'cash'}
                  onChange={() => handlePaymentOptionChange('cash')}
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
                      value={orderData.cashDiscount}
                      onChange={(e) => setOrderData(prev => ({ 
                        ...prev, 
                        cashDiscount: Number(e.target.value) 
                      }))}
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
                  checked={orderData.paymentOption === 'installment'}
                  onChange={() => handlePaymentOptionChange('installment')}
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
                      value={orderData.installments}
                      onChange={(e) => setOrderData(prev => ({ 
                        ...prev, 
                        installments: Number(e.target.value) 
                      }))}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm text-gray-600">parcelas</span>
                  </div>
                </div>
              </label>
            </div>
            
            {/* Show additional details based on payment option */}
            {orderData.paymentOption === 'cash' && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-green-700">Desconto à Vista ({orderData.cashDiscount}%)</p>
                    <p className="text-sm text-green-600">
                      Economia de {formatCurrency(orderData.originalTotalValue * (orderData.cashDiscount / 100))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Valor Original</p>
                    <p className="text-gray-500 line-through">{formatCurrency(orderData.originalTotalValue)}</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(orderData.totalValue)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {orderData.paymentOption === 'installment' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-blue-700">
                      Parcelado em {orderData.installments}x de {formatCurrency(calculateInstallmentValue())}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-600 mr-2">Taxa:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-16 px-2 py-1 border rounded"
                        value={orderData.installmentFee}
                        onChange={(e) => setOrderData(prev => ({ 
                          ...prev, 
                          installmentFee: Number(e.target.value) 
                        }))}
                      />
                      <span className="text-sm text-gray-600 ml-1">% por parcela</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Valor Original</p>
                    <p className="text-gray-500">{formatCurrency(orderData.originalTotalValue)}</p>
                    <p className="text-sm text-gray-600">Valor com Juros</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(orderData.totalValue)}</p>
                  </div>
                </div>
                
                {errors.installments && (
                  <p className="text-red-500 text-sm mt-2">{errors.installments}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment and values */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Valores e Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormInput
              type="date"
              label="Data de Entrega"
              value={orderData.deliveryDate}
              onChange={(value) => setOrderData(prev => ({ ...prev, deliveryDate: value }))}
              required
              error={errors.deliveryDate}
            />
            
            <FormInput
              label="Valor Total"
              value={formatCurrency(orderData.totalValue)}
              onChange={() => {}} // Read-only
              disabled
              error={errors.totalValue}
            />
            
            <FormInput
              type="number"
              step="0.01"
              min="0"
              max={orderData.totalValue}
              label="Valor de Entrada"
              value={orderData.entryValue.toString()}
              onChange={(value) => setOrderData(prev => ({ ...prev, entryValue: parseFloat(value) || 0 }))}
              disabled={skipEntryPayment}
              error={errors.entryValue}
            />
            
            <SearchableSelect
              options={paymentMethodOptions}
              value={orderData.paymentMethodEntry}
              onChange={(value) => setOrderData(prev => ({ ...prev, paymentMethodEntry: value as string }))}
              placeholder="Selecione"
              label="Forma Pag. Entrada"
              disabled={skipEntryPayment}
              error={errors.paymentMethodEntry}
            />
            
            <FormInput
              label="Valor Restante"
              value={formatCurrency(orderData.remainingValue)}
              onChange={() => {}} // Read-only
              disabled
            />
            
            <SearchableSelect
              options={paymentMethodOptions}
              value={orderData.paymentMethodRemaining}
              onChange={(value) => setOrderData(prev => ({ ...prev, paymentMethodRemaining: value as string }))}
              placeholder="Selecione"
              label="Forma Pag. Restante"
              error={errors.paymentMethodRemaining}
            />

            <div className="lg:col-span-3">
              <SearchableSelect
                options={[
                  { value: 'serviço pronto', label: 'Serviço Pronto' },
                  { value: 'em-andamento', label: 'Em andamento' },
                  { value: 'finalizada', label: 'Finalizada' },
                  { value: 'cancelada', label: 'Cancelada' },
                  { value: 'orçamento', label: 'Orçamento' }
                ]}
                value={orderData.status}
                onChange={(value) => handleStatusChange(value as string)}
                label="Status da OS"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={skipEntryPayment}
                  onChange={() => handleSkipEntryPayment()}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Dispensar entrada (requer senha gerente)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <FormInput
            label="Observações"
            value={orderData.observations}
            onChange={(value) => setOrderData(prev => ({ ...prev, observations: value }))}
            placeholder="Observações adicionais sobre a ordem de serviço..."
          />
        </div>
      </div>

      {/* Manager Password Modal */}
      {showPasswordModal && (
        <MobileModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Senha do Gerente"
          size="sm"
          footer={
            <div className="flex gap-3">
              <MobileButton
                onClick={() => setShowPasswordModal(false)}
                variant="secondary"
                fullWidth
              >
                Cancelar
              </MobileButton>
              <MobileButton
                onClick={validateManagerPassword}
                variant="primary"
                fullWidth
              >
                Confirmar
              </MobileButton>
            </div>
          }
        >
          <FormInput
            type="password"
            label="Digite a senha"
            value={managerPassword}
            onChange={setManagerPassword}
            placeholder="Senha do gerente"
          />
        </MobileModal>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <MobileModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancelar Ordem de Serviço"
          size="md"
          footer={
            <div className="flex gap-3">
              <MobileButton
                onClick={() => setShowCancelModal(false)}
                variant="secondary"
                fullWidth
              >
                Voltar
              </MobileButton>
              <MobileButton
                onClick={() => handleCancelOrder(orderData.cancelReason)}
                variant="danger"
                fullWidth
                icon={<AlertTriangle className="w-4 h-4" />}
              >
                Confirmar Cancelamento
              </MobileButton>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-yellow-800 font-medium">Tem certeza que deseja cancelar esta ordem?</h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    Esta ação não pode ser desfeita. Se houver pagamentos, será necessário processar estorno.
                  </p>
                </div>
              </div>
            </div>
            
            <FormInput
              label="Motivo do cancelamento (opcional)"
              value={orderData.cancelReason}
              onChange={(value) => setOrderData(prev => ({ ...prev, cancelReason: value }))}
              placeholder="Descreva o motivo do cancelamento..."
            />
          </div>
        </MobileModal>
      )}
    </MobileModal>
  );
};

export default OrderModal;
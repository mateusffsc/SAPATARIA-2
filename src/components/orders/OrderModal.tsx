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
import { getCurrentDate } from '../../utils/formatters';
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
    employees,
    paymentMethods,
    orders, 
    setOrders, 
    setShowModal
  } = useAppContext();

  const { showSuccess, showError } = useToast();

  // Filter employees to get only technicians
  const technicians = employees.filter(emp => emp.role === 'technician');

  const [orderData, setOrderData] = useState({
    number: formData.number || '',
    date: formData.date || getCurrentDate(),
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
    paymentOption: formData.paymentOption || 'normal',
    cashDiscount: formData.cashDiscount || 5,
    installments: formData.installments || 2,
    installmentFee: formData.installmentFee || 3,
    originalTotalValue: formData.originalTotalValue || 0
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

  const { modelSuggestions, sizeSuggestions } = useContextualSuggestions(
    orderData.brand, 
    orderData.article
  );

  function getDefaultDeliveryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    if (!formData.id && !orderData.number) {
      generateOrderNumber().then(number => {
        setOrderData(prev => ({ ...prev, number }));
      });
    }
  }, [formData.id, orderData.number, generateOrderNumber]);

  useEffect(() => {
    if (formData.id) {
      ImageService.getOrderImages(formData.id).then(images => {
        setOrderData(prev => ({ ...prev, images }));
      }).catch(console.error);
    }
  }, [formData.id]);

  useEffect(() => {
    const servicesTotal = orderData.services.reduce((sum, service) => sum + (parseFloat(String(service.price)) || 0), 0);
    
    const originalTotal = servicesTotal;
    
    let finalTotal = originalTotal;
    
    if (orderData.paymentOption === 'cash') {
      const discountAmount = originalTotal * (orderData.cashDiscount / 100);
      finalTotal = originalTotal - discountAmount;
    } else if (orderData.paymentOption === 'installment') {
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

  const handleInputChange = (field: string, value: any) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClientChange = (field: string, value: any) => {
    setOrderData(prev => ({
      ...prev,
      newClient: { ...prev.newClient, [field]: value }
    }));
    if (errors[`newClient.${field}`]) {
      setErrors(prev => ({ ...prev, [`newClient.${field}`]: '' }));
    }
  };

  const handleServiceChange = (index: number, field: string, value: any) => {
    const updatedServices = [...orderData.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setOrderData(prev => ({ ...prev, services: updatedServices }));
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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Basic validations
    if (!orderData.number.trim()) newErrors.number = ERROR_MESSAGES.REQUIRED_FIELD;
    if (!orderData.date) newErrors.date = ERROR_MESSAGES.REQUIRED_FIELD;
    if (!orderData.article.trim()) newErrors.article = ERROR_MESSAGES.REQUIRED_FIELD;
    if (!orderData.deliveryDate) newErrors.deliveryDate = ERROR_MESSAGES.REQUIRED_FIELD;

    // Client validation
    if (orderData.isNewClient) {
      if (!validateName(orderData.newClient.name)) newErrors['newClient.name'] = ERROR_MESSAGES.INVALID_NAME;
      if (!validateCPF(orderData.newClient.cpf)) newErrors['newClient.cpf'] = ERROR_MESSAGES.INVALID_CPF;
      if (!validatePhone(orderData.newClient.phone)) newErrors['newClient.phone'] = ERROR_MESSAGES.INVALID_PHONE;
      if (orderData.newClient.email && !validateEmail(orderData.newClient.email)) {
        newErrors['newClient.email'] = ERROR_MESSAGES.INVALID_EMAIL;
      }
    } else if (!orderData.clientId) {
      newErrors.clientId = ERROR_MESSAGES.REQUIRED_FIELD;
    }

    // Services validation
    if (orderData.services.length === 0) {
      newErrors.services = 'Pelo menos um serviço deve ser adicionado';
    } else {
      orderData.services.forEach((service, index) => {
        if (!service.name.trim()) newErrors[`service.${index}.name`] = ERROR_MESSAGES.REQUIRED_FIELD;
        if (!validatePositiveNumber(service.price)) newErrors[`service.${index}.price`] = ERROR_MESSAGES.INVALID_PRICE;
      });
    }

    // Payment validation
    if (!validateEntryValue(orderData.entryValue, orderData.totalValue)) {
      newErrors.entryValue = ERROR_MESSAGES.INVALID_ENTRY_VALUE;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Por favor, corrija os erros no formulário');
      return;
    }

    setSaving(true);
    try {
      let clientId = orderData.clientId;

      // Create new client if needed
      if (orderData.isNewClient) {
        const newClient = await ClientService.createClient(orderData.newClient);
        clientId = newClient.id;
        setClients(prev => [...prev, newClient]);
      }

      const orderPayload = {
        ...orderData,
        client_id: clientId,
        client_name: orderData.isNewClient ? orderData.newClient.name : clients.find(c => c.id === parseInt(clientId))?.name || '',
        services: orderData.services.map(service => ({
          serviceId: service.serviceId,
          name: service.name,
          details: service.details,
          price: service.price,
          technicianId: service.technicianId,
          costComposition: service.costComposition
        }))
      };

      let savedOrder;
      if (formData.id) {
        savedOrder = await OrderService.update(formData.id, orderPayload);
        setOrders(prev => prev.map(order => order.id === formData.id ? savedOrder : order));
        showSuccess(SUCCESS_MESSAGES.ORDER_UPDATED);
      } else {
        savedOrder = await OrderService.createOrder(orderPayload);
        setOrders(prev => [savedOrder, ...prev]);
        showSuccess(SUCCESS_MESSAGES.ORDER_CREATED);
      }

      // Handle image uploads
      if (orderData.images.length > 0) {
        await ImageService.uploadOrderImages(savedOrder.id, orderData.images);
      }

      setSavedOrderNumber(savedOrder.number);
      setShowSuccessActions(true);
    } catch (error) {
      console.error('Error saving order:', error);
      showError('Erro ao salvar ordem de serviço');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <MobileModal
      isOpen={true}
      onClose={handleClose}
      title={formData.id ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
      size="full"
      footer={
        <div className="flex gap-2">
          <MobileButton
            variant="secondary"
            onClick={handleClose}
            disabled={saving}
          >
            Cancelar
          </MobileButton>
          <MobileButton
            variant="primary"
            onClick={handleSubmit}
            disabled={saving}
            icon={<Save className="w-4 h-4" />}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </MobileButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Order Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Número da OS"
            value={orderData.number}
            onChange={(value) => handleInputChange('number', value)}
            error={errors.number}
            disabled={!!formData.id}
          />
          <FormInput
            label="Data"
            type="date"
            value={orderData.date}
            onChange={(value) => handleInputChange('date', value)}
            error={errors.date}
          />
        </div>

        {/* Client Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={orderData.isNewClient}
                onChange={(e) => handleInputChange('isNewClient', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Novo Cliente</span>
            </label>
          </div>

          {orderData.isNewClient ? (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Dados do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Nome"
                  value={orderData.newClient.name}
                  onChange={(value) => handleClientChange('name', value)}
                  error={errors['newClient.name']}
                />
                <FormInput
                  label="CPF"
                  value={orderData.newClient.cpf}
                  onChange={(value) => handleClientChange('cpf', value)}
                  error={errors['newClient.cpf']}
                />
                <FormInput
                  label="Telefone"
                  value={orderData.newClient.phone}
                  onChange={(value) => handleClientChange('phone', value)}
                  error={errors['newClient.phone']}
                />
                <FormInput
                  label="Email"
                  type="email"
                  value={orderData.newClient.email}
                  onChange={(value) => handleClientChange('email', value)}
                  error={errors['newClient.email']}
                />
              </div>
              <CEPInput
                value={orderData.newClient.zipCode}
                onChange={(value) => handleClientChange('zipCode', value)}
                onAddressLoad={(address: AddressData) => {
                  setOrderData(prev => ({
                    ...prev,
                    newClient: {
                      ...prev.newClient,
                      street: address.street,
                      neighborhood: address.neighborhood,
                      city: address.city,
                      state: address.state
                    }
                  }));
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="Rua"
                  value={orderData.newClient.street}
                  onChange={(value) => handleClientChange('street', value)}
                />
                <FormInput
                  label="Número"
                  value={orderData.newClient.number}
                  onChange={(value) => handleClientChange('number', value)}
                />
                <FormInput
                  label="Complemento"
                  value={orderData.newClient.complement}
                  onChange={(value) => handleClientChange('complement', value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="Bairro"
                  value={orderData.newClient.neighborhood}
                  onChange={(value) => handleClientChange('neighborhood', value)}
                />
                <FormInput
                  label="Cidade"
                  value={orderData.newClient.city}
                  onChange={(value) => handleClientChange('city', value)}
                />
                <FormInput
                  label="Estado"
                  value={orderData.newClient.state}
                  onChange={(value) => handleClientChange('state', value)}
                />
              </div>
            </div>
          ) : (
            <SearchableSelect
              label="Cliente"
              value={orderData.clientId}
              onChange={(value) => handleInputChange('clientId', value)}
              options={clients.map(client => ({
                value: client.id.toString(),
                label: `${client.name} - ${client.cpf}`
              }))}
              error={errors.clientId}
              placeholder="Selecione um cliente"
            />
          )}
        </div>

        {/* Item Details */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Dados do Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Artigo"
              value={orderData.article}
              onChange={(value) => handleInputChange('article', value)}
              error={errors.article}
            />
            <FormInput
              label="Marca"
              value={orderData.brand}
              onChange={(value) => handleInputChange('brand', value)}
            />
            <AutocompleteInput
              label="Modelo"
              value={orderData.model}
              onChange={(value) => handleInputChange('model', value)}
              suggestions={modelSuggestions}
            />
            <FormInput
              label="Cor"
              value={orderData.color}
              onChange={(value) => handleInputChange('color', value)}
            />
            <AutocompleteInput
              label="Tamanho"
              value={orderData.size}
              onChange={(value) => handleInputChange('size', value)}
              suggestions={sizeSuggestions}
            />
            <FormInput
              label="Número de Série"
              value={orderData.serialNumber}
              onChange={(value) => handleInputChange('serialNumber', value)}
            />
          </div>
          <FormInput
            label="Descrição"
            value={orderData.description}
            onChange={(value) => handleInputChange('description', value)}
            multiline
            rows={3}
          />
        </div>

        {/* Services */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Serviços</h3>
            <MobileButton
              variant="secondary"
              size="sm"
              onClick={addService}
              icon={<Plus className="w-4 h-4" />}
            >
              Adicionar Serviço
            </MobileButton>
          </div>
          
          {errors.services && (
            <p className="text-sm text-red-600">{errors.services}</p>
          )}

          <div className="space-y-4">
            {orderData.services.map((service, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Serviço {index + 1}</h4>
                  {orderData.services.length > 1 && (
                    <MobileButton
                      variant="danger"
                      size="sm"
                      onClick={() => removeService(index)}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      Remover
                    </MobileButton>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SearchableSelect
                    label="Serviço"
                    value={service.serviceId}
                    onChange={(value) => {
                      const selectedService = services.find(s => s.id.toString() === value);
                      handleServiceChange(index, 'serviceId', value);
                      if (selectedService) {
                        handleServiceChange(index, 'name', selectedService.name);
                        handleServiceChange(index, 'price', selectedService.default_price);
                      }
                    }}
                    options={services.map(s => ({
                      value: s.id.toString(),
                      label: `${s.name} - ${formatCurrency(s.default_price)}`
                    }))}
                    error={errors[`service.${index}.name`]}
                    placeholder="Selecione um serviço"
                  />
                  
                  <FormInput
                    label="Preço"
                    type="number"
                    step="0.01"
                    value={service.price}
                    onChange={(value) => handleServiceChange(index, 'price', parseFloat(value) || 0)}
                    error={errors[`service.${index}.price`]}
                  />
                  
                  <SearchableSelect
                    label="Técnico"
                    value={service.technicianId}
                    onChange={(value) => handleServiceChange(index, 'technicianId', value)}
                    options={technicians.map(tech => ({
                      value: tech.id.toString(),
                      label: tech.name
                    }))}
                    placeholder="Selecione um técnico"
                  />
                  
                  <div className="flex items-end">
                    <MobileButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowCostComposition(index)}
                    >
                      Composição de Custos
                    </MobileButton>
                  </div>
                </div>
                
                <FormInput
                  label="Detalhes do Serviço"
                  value={service.details}
                  onChange={(value) => handleServiceChange(index, 'details', value)}
                  multiline
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Payment Options */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Opções de Pagamento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentOption"
                value="normal"
                checked={orderData.paymentOption === 'normal'}
                onChange={(e) => handleInputChange('paymentOption', e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Normal</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentOption"
                value="cash"
                checked={orderData.paymentOption === 'cash'}
                onChange={(e) => handleInputChange('paymentOption', e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">À Vista</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentOption"
                value="installment"
                checked={orderData.paymentOption === 'installment'}
                onChange={(e) => handleInputChange('paymentOption', e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Parcelado</span>
            </label>
          </div>

          {orderData.paymentOption === 'cash' && (
            <FormInput
              label="Desconto à Vista (%)"
              type="number"
              step="0.01"
              value={orderData.cashDiscount}
              onChange={(value) => handleInputChange('cashDiscount', parseFloat(value) || 0)}
            />
          )}

          {orderData.paymentOption === 'installment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Número de Parcelas"
                type="number"
                value={orderData.installments}
                onChange={(value) => handleInputChange('installments', parseInt(value) || 1)}
              />
              <FormInput
                label="Taxa por Parcela (%)"
                type="number"
                step="0.01"
                value={orderData.installmentFee}
                onChange={(value) => handleInputChange('installmentFee', parseFloat(value) || 0)}
              />
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Detalhes do Pagamento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Valor Original</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(orderData.originalTotalValue)}
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Valor Total</p>
              <p className="text-lg font-semibold text-blue-900">
                {formatCurrency(orderData.totalValue)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Valor de Entrada"
              type="number"
              step="0.01"
              value={orderData.entryValue}
              onChange={(value) => handleInputChange('entryValue', parseFloat(value) || 0)}
              error={errors.entryValue}
            />
            
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Valor Restante</p>
              <p className="text-lg font-semibold text-green-900">
                {formatCurrency(orderData.remainingValue)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchableSelect
              label="Forma de Pagamento - Entrada"
              value={orderData.paymentMethodEntry}
              onChange={(value) => handleInputChange('paymentMethodEntry', value)}
              options={paymentMethods.map(pm => ({
                value: pm.name,
                label: pm.name
              }))}
              placeholder="Selecione a forma de pagamento"
            />
            
            <SearchableSelect
              label="Forma de Pagamento - Restante"
              value={orderData.paymentMethodRemaining}
              onChange={(value) => handleInputChange('paymentMethodRemaining', value)}
              options={paymentMethods.map(pm => ({
                value: pm.name,
                label: pm.name
              }))}
              placeholder="Selecione a forma de pagamento"
            />
          </div>
        </div>

        {/* Delivery and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Data de Entrega"
            type="date"
            value={orderData.deliveryDate}
            onChange={(value) => handleInputChange('deliveryDate', value)}
            error={errors.deliveryDate}
          />
          
          <SearchableSelect
            label="Status"
            value={orderData.status}
            onChange={(value) => handleInputChange('status', value)}
            options={[
              { value: 'aberta', label: 'Aberta' },
              { value: 'em andamento', label: 'Em Andamento' },
              { value: 'serviço pronto', label: 'Serviço Pronto' },
              { value: 'entregue', label: 'Entregue' },
              { value: 'cancelada', label: 'Cancelada' }
            ]}
          />
        </div>

        {/* Observations */}
        <FormInput
          label="Observações"
          value={orderData.observations}
          onChange={(value) => handleInputChange('observations', value)}
          multiline
          rows={3}
        />

        {/* Image Upload */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Imagens</h3>
          <ImageUpload
            images={orderData.images}
            onImagesChange={(images) => handleInputChange('images', images)}
            maxImages={5}
          />
        </div>
      </div>

      {/* Cost Composition Modal */}
      {showCostComposition !== null && (
        <ServiceCostComposition
          isOpen={true}
          onClose={() => setShowCostComposition(null)}
          serviceIndex={showCostComposition}
          service={orderData.services[showCostComposition]}
          onSave={(composition) => {
            handleServiceChange(showCostComposition, 'costComposition', composition);
            setShowCostComposition(null);
          }}
        />
      )}
    </MobileModal>
  );
};

export default OrderModal;
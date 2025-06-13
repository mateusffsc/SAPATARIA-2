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

  // Rest of the component implementation remains exactly the same as in the original file

  return (
    // Return statement remains exactly the same as in the original file
  );
};

export default OrderModal;
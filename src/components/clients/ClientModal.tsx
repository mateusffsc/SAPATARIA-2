import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Save } from 'lucide-react';
import { ClientService } from '../../services/clientService';
import FormInput from '../shared/FormInput';
import MobileButton from '../shared/MobileButton';
import MobileModal from '../shared/MobileModal';
import { 
  validateCPF, 
  validatePhone, 
  validateEmail, 
  validateName,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES 
} from '../../utils/validators';

const ClientModal: React.FC = () => {
  const { formData, clients, setClients, setShowModal } = useAppContext();
  
  const [clientData, setClientData] = useState({
    name: formData.name || '',
    cpf: formData.cpf || '',
    phone: formData.phone || '',
    email: formData.email || '',
    street: formData.street || '',
    number: formData.number || '',
    complement: formData.complement || '',
    neighborhood: formData.neighborhood || '',
    city: formData.city || '',
    state: formData.state || '',
    zipCode: formData.zipCode || ''
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!validateName(clientData.name)) {
      newErrors.name = ERROR_MESSAGES.NAME_REQUIRED;
    }

    if (!clientData.cpf.trim()) {
      newErrors.cpf = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!validateCPF(clientData.cpf)) {
      newErrors.cpf = ERROR_MESSAGES.CPF_INVALID;
    } else {
      // Check for duplicate CPF (only if not editing the same client)
      const existingClient = clients.find(c => c.cpf === clientData.cpf && c.id !== formData.id);
      if (existingClient) {
        newErrors.cpf = ERROR_MESSAGES.CPF_DUPLICATE;
      }
    }

    if (!clientData.phone.trim()) {
      newErrors.phone = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (!validatePhone(clientData.phone)) {
      newErrors.phone = ERROR_MESSAGES.PHONE_INVALID;
    }

    if (clientData.email && !validateEmail(clientData.email)) {
      newErrors.email = ERROR_MESSAGES.EMAIL_INVALID;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      if (formData.id) {
        const updatedClient = await ClientService.update(formData.id, clientData);
        setClients(prev => prev.map(c => c.id === formData.id ? updatedClient : c));
        alert(SUCCESS_MESSAGES.CLIENT_UPDATED);
      } else {
        const newClient = await ClientService.create(clientData);
        setClients(prev => [...prev, newClient]);
        alert(SUCCESS_MESSAGES.CLIENT_CREATED);
      }

      setShowModal(false);
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('Erro ao salvar cliente: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileModal
      isOpen={true}
      onClose={() => setShowModal(false)}
      title={formData.id ? 'Editar Cliente' : 'Novo Cliente'}
      size="lg"
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Nome Completo"
            value={clientData.name}
            onChange={(value) => setClientData(prev => ({ ...prev, name: value }))}
            required
            error={errors.name}
          />
          <FormInput
            type="cpf"
            label="CPF"
            value={clientData.cpf}
            onChange={(value) => setClientData(prev => ({ ...prev, cpf: value }))}
            required
            error={errors.cpf}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            type="phone"
            label="Telefone"
            value={clientData.phone}
            onChange={(value) => setClientData(prev => ({ ...prev, phone: value }))}
            required
            error={errors.phone}
          />
          <FormInput
            type="email"
            label="E-mail"
            value={clientData.email}
            onChange={(value) => setClientData(prev => ({ ...prev, email: value }))}
            error={errors.email}
          />
        </div>

        <FormInput
          type="zipcode"
          label="CEP"
          value={clientData.zipCode}
          onChange={(value) => setClientData(prev => ({ ...prev, zipCode: value }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Rua"
            value={clientData.street}
            onChange={(value) => setClientData(prev => ({ ...prev, street: value }))}
          />
          <FormInput
            label="Número"
            value={clientData.number}
            onChange={(value) => setClientData(prev => ({ ...prev, number: value }))}
          />
        </div>

        <FormInput
          label="Complemento"
          value={clientData.complement}
          onChange={(value) => setClientData(prev => ({ ...prev, complement: value }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Bairro"
            value={clientData.neighborhood}
            onChange={(value) => setClientData(prev => ({ ...prev, neighborhood: value }))}
          />
          <FormInput
            label="Cidade"
            value={clientData.city}
            onChange={(value) => setClientData(prev => ({ ...prev, city: value }))}
          />
          <FormInput
            label="Estado"
            value={clientData.state}
            onChange={(value) => setClientData(prev => ({ ...prev, state: value }))}
          />
        </div>
      </div>
    </MobileModal>
  );
};

export default ClientModal;
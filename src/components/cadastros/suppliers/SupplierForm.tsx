import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Supplier } from '../../../types';
import FormInput from '../../shared/FormInput';
import MobileButton from '../../shared/MobileButton';
import MobileModal from '../../shared/MobileModal';

interface SupplierFormProps {
  supplier: Supplier | null;
  onSave: (data: Partial<Supplier>) => void;
  onClose: () => void;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    cnpj: supplier?.cnpj || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    contact: supplier?.contact || '',
    category: supplier?.category || '',
    isActive: supplier?.isActive ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title={supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row gap-3">
          <MobileButton
            onClick={onClose}
            variant="secondary"
            fullWidth
          >
            Cancelar
          </MobileButton>
          <MobileButton
            onClick={handleSubmit}
            variant="primary"
            fullWidth
            icon={<Save className="w-4 h-4" />}
          >
            Salvar
          </MobileButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Nome do Fornecedor"
            value={formData.name}
            onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
            required
            error={errors.name}
          />

          <FormInput
            type="cnpj"
            label="CNPJ"
            value={formData.cnpj}
            onChange={(value) => setFormData(prev => ({ ...prev, cnpj: value }))}
            required
            error={errors.cnpj}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            type="phone"
            label="Telefone"
            value={formData.phone}
            onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
            required
            error={errors.phone}
          />

          <FormInput
            type="email"
            label="E-mail"
            value={formData.email}
            onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
            error={errors.email}
          />
        </div>

        <FormInput
          label="Endereço"
          value={formData.address}
          onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
          placeholder="Rua, número, bairro, cidade - Estado"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Pessoa de Contato"
            value={formData.contact}
            onChange={(value) => setFormData(prev => ({ ...prev, contact: value }))}
          />
          
          <FormInput
            label="Categoria"
            value={formData.category}
            onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            placeholder="Ex: Materiais e Insumos, Equipamentos, etc."
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            Fornecedor ativo
          </label>
        </div>
      </div>
    </MobileModal>
  );
};

export default SupplierForm;
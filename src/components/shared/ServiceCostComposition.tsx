import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, TrendingUp, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currencyUtils';
import MobileModal from './MobileModal';
import MobileButton from './MobileButton';

interface MaterialCost {
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface ServiceCostData {
  laborCost: number;
  materialCosts: MaterialCost[];
  timeSpent: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  overhead: number;
  margin: number; // percentage
  finalPrice: number;
}

interface ServiceCostCompositionProps {
  isOpen: boolean;
  onClose: () => void;
  serviceIndex: number;
  service: any;
  onSave: (composition: ServiceCostData) => void;
}

const ServiceCostComposition: React.FC<ServiceCostCompositionProps> = ({
  isOpen,
  onClose,
  serviceIndex,
  service,
  onSave
}) => {
  const { products } = useAppContext();
  
  const [costData, setCostData] = useState<ServiceCostData>(
    service.costComposition || {
      laborCost: 0,
      materialCosts: [],
      timeSpent: 0,
      difficulty: 'medium',
      overhead: 0,
      margin: 30, // 30% default margin
      finalPrice: service.price || 0
    }
  );

  const difficultyMultipliers = {
    easy: 1.0,
    medium: 1.2,
    hard: 1.5,
    expert: 2.0
  };

  const difficultyLabels = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
    expert: 'Especialista'
  };

  // Calculate costs automatically
  useEffect(() => {
    const materialTotal = costData.materialCosts.reduce((sum, material) => sum + material.totalCost, 0);
    const difficultyMultiplier = difficultyMultipliers[costData.difficulty];
    const adjustedLaborCost = costData.laborCost * difficultyMultiplier;
    
    const totalCost = adjustedLaborCost + materialTotal + costData.overhead;
    const finalPrice = totalCost * (1 + costData.margin / 100);
    
    setCostData(prev => ({ ...prev, finalPrice }));
  }, [
    costData.laborCost,
    costData.materialCosts,
    costData.difficulty,
    costData.overhead,
    costData.margin
  ]);

  const addMaterial = () => {
    const newMaterial: MaterialCost = {
      productId: 0,
      productName: '',
      quantity: 1,
      unitCost: 0,
      totalCost: 0
    };
    
    setCostData(prev => ({
      ...prev,
      materialCosts: [...prev.materialCosts, newMaterial]
    }));
  };

  const updateMaterial = (index: number, field: keyof MaterialCost, value: any) => {
    setCostData(prev => {
      const newMaterials = [...prev.materialCosts];
      const material = { ...newMaterials[index] };
      
      if (field === 'productId') {
        const product = products.find(p => p.id === parseInt(value));
        if (product) {
          material.productName = product.name;
          material.unitCost = product.cost;
          material.productId = product.id;
        }
      } else {
        (material as any)[field] = value;
      }
      
      // Recalculate total cost for this material
      material.totalCost = material.quantity * material.unitCost;
      newMaterials[index] = material;
      
      return { ...prev, materialCosts: newMaterials };
    });
  };

  const removeMaterial = (index: number) => {
    setCostData(prev => ({
      ...prev,
      materialCosts: prev.materialCosts.filter((_, i) => i !== index)
    }));
  };

  const calculateHourlyRate = () => {
    if (costData.timeSpent === 0) return 0;
    return (costData.laborCost / (costData.timeSpent / 60));
  };

  const handleSave = () => {
    onSave(costData);
  };

  const materialTotal = costData.materialCosts.reduce((sum, material) => sum + material.totalCost, 0);
  const adjustedLaborCost = costData.laborCost * difficultyMultipliers[costData.difficulty];
  const totalCost = adjustedLaborCost + materialTotal + costData.overhead;
  const profitAmount = costData.finalPrice - totalCost;

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Composição de Custo"
      size="lg"
      footer={
        <div className="flex gap-2">
          <MobileButton
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </MobileButton>
          <MobileButton
            variant="primary"
            onClick={handleSave}
          >
            Salvar
          </MobileButton>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Serviço: {service.name || `Serviço ${serviceIndex + 1}`}</h3>
        </div>

        {/* Labor Cost */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custo da Mão de Obra
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={costData.laborCost}
              onChange={(e) => setCostData(prev => ({ ...prev, laborCost: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tempo Gasto (minutos)
            </label>
            <input
              type="number"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={costData.timeSpent}
              onChange={(e) => setCostData(prev => ({ ...prev, timeSpent: parseInt(e.target.value) || 0 }))}
            />
            {costData.timeSpent > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Taxa/hora: {formatCurrency(calculateHourlyRate())}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nível de Dificuldade
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={costData.difficulty}
              onChange={(e) => setCostData(prev => ({ ...prev, difficulty: e.target.value as any }))}
            >
              {Object.entries(difficultyLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label} ({difficultyMultipliers[key as keyof typeof difficultyMultipliers]}x)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Materials */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Materiais Utilizados</h4>
            <MobileButton
              variant="secondary"
              size="sm"
              onClick={addMaterial}
              icon={<Plus className="w-4 h-4" />}
            >
              Adicionar Material
            </MobileButton>
          </div>

          {costData.materialCosts.length > 0 ? (
            <div className="space-y-3">
              {costData.materialCosts.map((material, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-white rounded border">
                  <div>
                    <select
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      value={material.productId}
                      onChange={(e) => updateMaterial(index, 'productId', e.target.value)}
                    >
                      <option value="">Selecione o produto</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Quantidade"
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      value={material.quantity}
                      onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Custo unitário"
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      value={material.unitCost}
                      onChange={(e) => updateMaterial(index, 'unitCost', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded bg-gray-50"
                      value={formatCurrency(material.totalCost)}
                      disabled
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeMaterial(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 bg-white rounded border border-dashed">
              Nenhum material adicionado
            </div>
          )}
        </div>

        {/* Overhead and Margin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custos Indiretos
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={costData.overhead}
              onChange={(e) => setCostData(prev => ({ ...prev, overhead: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Margem de Lucro (%)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={costData.margin}
              onChange={(e) => setCostData(prev => ({ ...prev, margin: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>

        {/* Cost Summary */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Resumo de Custos
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Mão de Obra</p>
              <p className="font-medium">{formatCurrency(adjustedLaborCost)}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Materiais</p>
              <p className="font-medium">{formatCurrency(materialTotal)}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Custos Indiretos</p>
              <p className="font-medium">{formatCurrency(costData.overhead)}</p>
            </div>
            
            <div>
              <p className="text-gray-600">Custo Total</p>
              <p className="font-medium">{formatCurrency(totalCost)}</p>
            </div>
          </div>

          <div className="border-t mt-3 pt-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">Lucro ({costData.margin}%)</p>
                <p className="font-medium text-green-600">{formatCurrency(profitAmount)}</p>
              </div>
              
              <div className="text-right">
                <p className="text-gray-600">Preço Final</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(costData.finalPrice)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileModal>
  );
};

export default ServiceCostComposition;
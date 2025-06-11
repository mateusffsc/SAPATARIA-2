import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  preset: string;
  onChange: (startDate: string, endDate: string, preset: string) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  preset,
  onChange
}) => {
  const [showCustom, setShowCustom] = useState(preset === 'custom');

  const presets = [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mês' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const handlePresetChange = (newPreset: string) => {
    const today = new Date();
    let start = '';
    let end = '';

    switch (newPreset) {
      case 'today':
        start = end = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        start = weekStart.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'custom':
        setShowCustom(true);
        return;
    }

    setShowCustom(false);
    onChange(start, end, newPreset);
  };

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      onChange(value, endDate, 'custom');
    } else {
      onChange(startDate, value, 'custom');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Calendar className="w-4 h-4 inline mr-1" />
        Período
      </label>
      
      <div className="space-y-3">
        {/* Preset Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {presets.map(presetOption => (
            <button
              key={presetOption.value}
              onClick={() => handlePresetChange(presetOption.value)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                preset === presetOption.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {presetOption.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        {showCustom && (
          <div className="space-y-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Data inicial"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Data final"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangePicker;
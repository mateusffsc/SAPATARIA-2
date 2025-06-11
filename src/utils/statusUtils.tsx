import React from 'react';
import { Clock, Wrench, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Function to get status color
export const getStatusColor = (status: string): string => {
  const colors = {
    'serviço pronto': 'bg-blue-100 text-blue-800',
    'em-andamento': 'bg-yellow-100 text-yellow-800',
    'finalizada': 'bg-green-100 text-green-800',
    'cancelada': 'bg-red-100 text-red-800',
    'orçamento': 'bg-orange-100 text-orange-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// Function to get status icon
export const getStatusIcon = (status: string): JSX.Element => {
  const icons = {
    'serviço pronto': <Clock className="w-4 h-4" />,
    'em-andamento': <Wrench className="w-4 h-4" />,
    'finalizada': <CheckCircle className="w-4 h-4" />,
    'cancelada': <XCircle className="w-4 h-4" />,
    'orçamento': <AlertCircle className="w-4 h-4" />
  };
  return icons[status as keyof typeof icons] || <Clock className="w-4 h-4" />;
};

// Format status display
const formatStatus = (status: string): string => {
  return status.replace('-', ' ');
};
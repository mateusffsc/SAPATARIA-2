import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order } from '../../types';

interface OSLinkProps {
  order: Order;
  className?: string;
}

const OSLink: React.FC<OSLinkProps> = ({ order, className = "" }) => {
  const { setModalType, setFormData, setShowModal } = useAppContext();

  const openOrderModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalType('view-order');
    setFormData(order);
    setShowModal(true);
  };

  return (
    <button
      onClick={openOrderModal}
      className={`os-link ${className}`}
    >
      {order.number}
    </button>
  );
};

export default OSLink;
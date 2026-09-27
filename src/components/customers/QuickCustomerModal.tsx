import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { customerService } from '../../services/customerService';
import { Customer } from '../../types/database';

interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
}

export const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({ isOpen, onClose, onCustomerCreated }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setError('El nombre y el teléfono son obligatorios');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      const newCustomer = await customerService.createCustomer({
        full_name: fullName.trim(),
        phone: phone.trim(),
        document_id: documentId.trim() || null,
        address: null,
        email: null,
        
      });
      onCustomerCreated(newCustomer);
      setFullName('');
      setPhone('');
      setDocumentId('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nuevo Cliente">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">Nombre Completo *</label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teléfono (WhatsApp) *</label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cédula / Documento (Opcional)</label>
          <input
            type="text"
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>Guardar Cliente</Button>
        </div>
      </form>
    </Modal>
  );
};

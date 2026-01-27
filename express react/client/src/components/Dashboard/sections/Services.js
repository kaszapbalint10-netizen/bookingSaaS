// sections/Services.js
import React, { useState } from 'react';
import axios from 'axios';
import { AddServiceForm, ServiceCard, useToast } from '../../UI';
import '../css/Services.css';

const Services = ({ services, loadServices }) => {
  const [newService, setNewService] = useState({
    service: '',
    duration: 30,
    price: 0,
    category: '',
    description: ''
  });
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAddService = async (e) => {
    e.preventDefault();
    
    if (!newService.service.trim()) {
      toast.error('Kérjük, add meg a szolgáltatás nevét!', { title: 'Kitöltés szükséges' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/dashboard/services', {
        service: newService.service,
        duration: newService.duration,
        price: newService.price,
        category: newService.category,
        description: newService.description,
      });
      
      if (response.data.success) {
        await loadServices();
        setNewService({ service: '', duration: 30, price: 0, category: '', description: '' });
        toast.success('Szolgáltatás sikeresen hozzáadva!', { title: 'Siker' });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Hiba a szolgáltatás hozzáadásakor!';
      toast.error(errorMsg, { title: 'Hiba' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = async (service) => {
    setLoading(true);
    try {
      const response = await axios.put(`http://localhost:3001/api/dashboard/services/${service.id}`, service);
      if (response.data.success) {
        await loadServices();
        setEditingService(null);
        toast.success('Szolgáltatás sikeresen frissítve!', { title: 'Siker' });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Hiba a szolgáltatás frissítésekor!';
      toast.error(errorMsg, { title: 'Hiba' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (window.confirm('Biztosan törölni szeretné ezt a szolgáltatást?')) {
      setLoading(true);
      try {
        const response = await axios.delete(`http://localhost:3001/api/dashboard/services/${id}`);
        if (response.data.success) {
          await loadServices();
          toast.success('Szolgáltatás sikeresen törölve!', { title: 'Siker' });
        }
      } catch (error) {
        const errorMsg = error.response?.data?.error || 'Hiba a szolgáltatás törlésekor!';
        toast.error(errorMsg, { title: 'Hiba' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <section id="services" className="section shown services-section">
      <div className="section-header">
        <h1 className="title">Szolgáltatások</h1>
        <p className="subtitle">Kezeld a szalon szolgáltatásait</p>
      </div>

      <AddServiceForm
        service={editingService || newService}
        onChange={(updatedService) => {
          if (editingService) {
            setEditingService(updatedService);
          } else {
            setNewService(updatedService);
          }
        }}
        onSubmit={() => {
          if (editingService) {
            handleEditService(editingService);
          } else {
            handleAddService({ preventDefault: () => {} });
          }
        }}
        onCancel={() => {
          setEditingService(null);
          setNewService({ service: '', duration: 30, price: 0, category: '', description: '' });
        }}
        isEditing={!!editingService}
        isLoading={loading}
      />

      <div className="services-container">
        <h2 className="services-title">
          📋 Hozzáadott szolgáltatások ({services.length})
        </h2>
        
        {services.length > 0 ? (
          <div className="services-grid">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => setEditingService(service)}
                onDelete={() => handleDeleteService(service.id)}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">✂️</div>
            <h3>Nincsenek szolgáltatások</h3>
            <p>Adj hozzá az első szolgáltatást a fentiek között</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
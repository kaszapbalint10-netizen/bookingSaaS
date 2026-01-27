import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CarAssistant from '../CarAssistant/CarAssistant';
import { Button, useToast } from '../UI';
import './AssistantSelector.css';

// Asszisztens ikonok függvény
const getAssistantIcon = (type) => {
  const icons = {
    'car-rental': '🚗',
    'nail-salon': '💅',
    'hair-salon': '💇‍♀️',
    'cosmetologist': '💆‍♀️',
    'masseur': '💆‍♂️',
    'default': '🤖'
  };
  return icons[type] || icons.default;
};

const AssistantSelector = () => {
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversationHistory, setConversationHistory] = useState({});
  const [showChat, setShowChat] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/assistants');
      setAssistants(response.data);
      
      if (response.data.length > 0) {
        handleAssistantSelect(response.data[0]);
      }
    } catch (error) {
      console.error('Hiba az asszisztensek betöltésekor:', error);
      const errorMsg = 'Nem sikerült betölteni az asszisztenseket';
      setError(errorMsg);
      toast.error(errorMsg, { title: 'Hiba' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssistantSelect = (assistant) => {
    // Elmentjük az előző asszisztens beszélgetését (ha volt)
    if (selectedAssistant) {
      setConversationHistory(prev => ({
        ...prev,
        [selectedAssistant.type]: prev[selectedAssistant.type] || []
      }));
    }
    
    // Új asszisztens kiválasztása
    setSelectedAssistant(assistant);
    setShowChat(true);
    
    // Új beszélgetés indítása vagy előző betöltése
    if (!conversationHistory[assistant.type]) {
      setConversationHistory(prev => ({
        ...prev,
        [assistant.type]: [
          {
            role: 'assistant',
            content: `${getAssistantIcon(assistant.type)} Üdvözöllek a ${assistant.name}-ben! Hogyan segíthetek? 😊`
          }
        ]
      }));
    }
  };

  const updateConversation = (assistantType, newMessage) => {
    setConversationHistory(prev => ({
      ...prev,
      [assistantType]: [...(prev[assistantType] || []), newMessage]
    }));
  };

  const clearConversation = (assistantType) => {
    setConversationHistory(prev => ({
      ...prev,
      [assistantType]: [
        {
          role: 'assistant',
          content: `${getAssistantIcon(assistantType)} Üdvözöllek újra! Hogyan segíthetek? 😊`
        }
      ]
    }));
  };

  const handleBack = () => {
    setShowChat(false);
  };

  if (loading) {
    return (
      <div className="assistant-selector-loading">
        <div className="loading-spinner"></div>
        <p>Asszisztensek betöltése...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assistant-selector-error">
        <p>❌ {error}</p>
        <button onClick={fetchAssistants} className="retry-btn">
          Újrapróbálkozás
        </button>
      </div>
    );
  }

  return (
    <div className="assistant-selector">
      {!showChat ? (
        /* Asszisztens választó képernyő */
        <>
          <div className="assistant-header">
            <h1>🤖 AI Asszisztensek</h1>
            <p>Válaszd ki, milyen témában szeretnél segítséget kérni!</p>
          </div>

          <div className="assistant-cards">
            {assistants.map((assistant) => (
              <div
                key={assistant.type}
                className="assistant-card"
                onClick={() => handleAssistantSelect(assistant)}
              >
                <div className="card-icon">
                  {getAssistantIcon(assistant.type)}
                </div>
                <div className="card-content">
                  <h3>{assistant.name}</h3>
                  <p>{assistant.description}</p>
                  <div className="features">
                    {assistant.features?.map((feature, index) => (
                      <span key={index} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="card-badge">
                  Kiválasztás
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Chat képernyő */
        <div className="chat-screen">
          <CarAssistant 
            assistantType={selectedAssistant.type}
            assistantConfig={selectedAssistant}
            conversation={conversationHistory[selectedAssistant.type] || []}
            onUpdateConversation={updateConversation}
            onBack={handleBack}
            onClearConversation={() => clearConversation(selectedAssistant.type)}
          />
        </div>
      )}
    </div>
  );
};

export default AssistantSelector;
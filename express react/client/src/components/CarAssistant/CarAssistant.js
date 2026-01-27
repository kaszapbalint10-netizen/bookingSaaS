import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button, Input, useToast } from '../UI';
import './CarAssistant.css';

const CarAssistant = ({ 
  assistantType, 
  assistantConfig, 
  conversation, 
  onUpdateConversation, 
  onBack,
  onClearConversation 
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const toast = useToast();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(87);
  const [wifiStrength, setWifiStrength] = useState(3); // 1-4 skála
  const [signalStrength, setSignalStrength] = useState(4); // 1-4 skála

  useEffect(() => {
    // Idő frissítése másodpercenként
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Akksi szint szimuláció
    const batteryTimer = setInterval(() => {
      setBatteryLevel(prev => {
        const change = Math.random() > 0.8 ? -1 : 0;
        return Math.max(15, Math.min(100, prev + change));
      });
    }, 30000);

    // WiFi és jel erősség szimuláció
    const signalTimer = setInterval(() => {
      setWifiStrength(prev => {
        const change = Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(1, Math.min(4, prev + change));
      });
      
      setSignalStrength(prev => {
        const change = Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(1, Math.min(4, prev + change));
      });
    }, 15000);

    return () => {
      clearInterval(timeTimer);
      clearInterval(batteryTimer);
      clearInterval(signalTimer);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    const userMessage = { role: 'user', content: message };
    
    onUpdateConversation(assistantType, userMessage);
    setMessage('');
    
    try {
      const result = await axios.post(`http://localhost:3001/api/assistants/${assistantType}/chat`, {
        message: message,
        conversation_history: conversation
      });
      
      const assistantMessage = { 
        role: 'assistant', 
        content: result.data.reply,
        intent: result.data.intent
      };
      
      onUpdateConversation(assistantType, assistantMessage);
    } catch (error) {
      console.error('Hiba:', error);
      const errorMsg = 'Technikai hiba történt. Kérlek, próbáld újra kicsit később.';
      const errorMessage = { 
        role: 'assistant', 
        content: `❌ ${errorMsg}` 
      };
      onUpdateConversation(assistantType, errorMessage);
      toast.error(errorMsg, { title: 'Hiba' });
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (quickMessage) => {
    setMessage(quickMessage);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('hu-HU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getBatteryColor = (level) => {
    if (level > 70) return '#4CD964'; // Zöld
    if (level > 30) return '#FFCC00'; // Sárga
    return '#FF3B30'; // Piros
  };

  const getWifiIcon = (strength) => {
    const icons = ['📶', '📶', '📶', '📶'];
    return icons[strength - 1];
  };

  const renderSignalBars = (strength) => {
    return (
      <div className="signal-indicator">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className="signal-bar"
            style={{
              opacity: bar <= strength ? 1 : 0.3,
              background: bar <= strength ? 'white' : 'rgba(255,255,255,0.3)'
            }}
          ></div>
        ))}
      </div>
    );
  };

  return (
    <div className="car-assistant">
      {/* Dynamic Island - CSAK AZ IDŐ */}
      <div className="dynamic-island">
      </div>

      {/* Status Bar - ikonok a Dynamic Island mellett */}
      <div className="status-bar">
        <div className="status-left">
          <div className="status-time">{formatTime(currentTime)}</div>
        </div>
        <div className="status-right">
          {renderSignalBars(signalStrength)}
          <div className="battery-indicator">
            <div className="battery-container">
              <div 
                className="battery-fill" 
                style={{ 
                  width: `${batteryLevel}%`,
                  background: getBatteryColor(batteryLevel)
                }}
              ></div>
              <div className="battery-tip"></div>
            </div>
            <span className="battery-percent">{batteryLevel}%</span>
          </div>
        </div>
      </div>

      {/* Chat header */}
      <div className="chat-header">
        {onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack} 
            title="Vissza"
            className="back-button"
            size="sm"
          >
            ‹
          </Button>
        )}
        <h2>{assistantConfig?.name}</h2>
        <p>{assistantConfig?.description}</p>
        {onClearConversation && (
          <Button 
            variant="ghost"
            onClick={onClearConversation}
            title="Új beszélgetés"
            className="clear-chat-btn"
            size="sm"
          >
            🗑️
          </Button>
        )}
      </div>

      {/* Gyors műveletek */}
      {assistantConfig?.quick_actions && (
        <div className="quick-actions">
          {assistantConfig.quick_actions.map((action, index) => (
            <Button
              key={index}
              variant="secondary"
              onClick={() => handleQuickAction(action.message)}
              disabled={loading}
              className="quick-action-btn"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Csevegés történet */}
      <div className="chat-container">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <div className="message-time">
              {formatTime(new Date())}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Üzenet küldés */}
      <div className="input-area">
        <div className="input-container">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Üzenet..."
            rows="1"
            disabled={loading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={loading || !message.trim()}
            variant="primary"
            className="send-btn"
          >
            {loading ? '⏳' : '↑'}
          </Button>
        </div>
      </div>

      {/* Home indicator */}
      <div className="home-indicator"></div>
    </div>
  );
};

export default CarAssistant;
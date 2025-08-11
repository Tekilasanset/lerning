import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, Code, Search, Upload, History, Settings, Zap, Globe, Cpu, Database } from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [analysisData, setAnalysisData] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [improvementsHistory, setImprovementsHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiStatus, setAiStatus] = useState('Готов к работе');
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Инициализация - получаем начальное сообщение от ИИ
    setMessages([{
      type: 'ai',
      content: 'Привет! Я самомодифицирующийся ИИ системы. Я постоянно изучаю новые технологии в интернете и улучшаю свой код. Спросите меня о чем угодно - я найду информацию и применю новые знания для своего развития!',
      timestamp: new Date().toISOString(),
      improvements: [],
      knowledge_gained: []
    }]);
    loadChatHistory();
    loadImprovementsHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/history`);
      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        const formattedMessages = data.messages.reverse().map(msg => ({
          type: msg.type,
          content: msg.user_message || msg.ai_response,
          timestamp: msg.timestamp,
          improvements: msg.improvements || [],
          knowledge_gained: msg.knowledge_gained || []
        }));
        setMessages(prev => [...prev, ...formattedMessages]);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    }
  };

  const loadImprovementsHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/improvements-history`);
      const data = await response.json();
      setImprovementsHistory(data.improvements || []);
    } catch (error) {
      console.error('Ошибка загрузки истории улучшений:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setAiStatus('Обрабатываю запрос...');

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      const data = await response.json();
      
      const aiMessage = {
        type: 'ai',
        content: data.response,
        timestamp: data.timestamp,
        improvements: data.improvements || [],
        knowledge_gained: data.knowledge_gained || []
      };

      setMessages(prev => [...prev, aiMessage]);
      setAiStatus('Готов к работе');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Извините, произошла ошибка при обработке вашего сообщения.',
        timestamp: new Date().toISOString(),
        improvements: [],
        knowledge_gained: []
      }]);
      setAiStatus('Ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeCode = async () => {
    setIsAnalyzing(true);
    setAiStatus('Анализирую код...');
    
    try {
      const response = await fetch(`${API_URL}/api/analyze`);
      const data = await response.json();
      setAnalysisData(data);
      setActiveTab('analysis');
      setAiStatus('Анализ завершен');
    } catch (error) {
      console.error('Ошибка анализа кода:', error);
      setAiStatus('Ошибка анализа');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyImprovements = async () => {
    setAiStatus('Применяю улучшения...');
    
    try {
      const response = await fetch(`${API_URL}/api/improve`, {
        method: 'POST',
      });
      const data = await response.json();
      
      // Добавляем результат в чат
      setMessages(prev => [...prev, {
        type: 'ai',
        content: `🔧 Автоматическое улучшение кода:\n\n${data.message}\n\nПрименённые улучшения: ${data.details?.applied?.join(', ') || 'нет'}\nОшибки: ${data.details?.errors?.join(', ') || 'нет'}`,
        timestamp: new Date().toISOString(),
        improvements: data.details?.applied || [],
        knowledge_gained: []
      }]);
      
      loadImprovementsHistory();
      setAiStatus('Улучшения применены');
    } catch (error) {
      console.error('Ошибка применения улучшений:', error);
      setAiStatus('Ошибка улучшения');
    }
  };

  const searchInternet = async (query) => {
    setAiStatus('Ищу в интернете...');
    
    try {
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, max_results: 10 }),
      });
      const data = await response.json();
      setSearchResults(data.results || []);
      setActiveTab('search');
      setAiStatus('Поиск завершен');
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setAiStatus('Ошибка поиска');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    setAiStatus('Обрабатываю файл...');
    
    try {
      const response = await fetch(`${API_URL}/api/upload-knowledge`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        type: 'ai',
        content: `📁 ${data.message}\nИзвлечено знаний: ${data.knowledge_extracted}`,
        timestamp: new Date().toISOString(),
        improvements: [],
        knowledge_gained: []
      }]);
      
      setAiStatus('Файл обработан');
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      setAiStatus('Ошибка загрузки');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div className="app">
      {/* Заголовок */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Brain className="logo-icon" />
            <h1>Самомодифицирующийся ИИ</h1>
          </div>
          <div className="status-indicator">
            <div className={`status-dot ${aiStatus.includes('Ошибка') ? 'error' : 'active'}`}></div>
            <span className="status-text">{aiStatus}</span>
          </div>
        </div>
      </header>

      {/* Навигация */}
      <nav className="navigation">
        <button 
          className={`nav-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <Brain size={20} />
          Чат с ИИ
        </button>
        <button 
          className={`nav-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <Code size={20} />
          Анализ кода
        </button>
        <button 
          className={`nav-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={20} />
          Поиск в сети
        </button>
        <button 
          className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={20} />
          История улучшений
        </button>
      </nav>

      {/* Основной контент */}
      <main className="main-content">
        {activeTab === 'chat' && (
          <div className="chat-container">
            <div className="messages-area">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  <div className="message-content">
                    <pre className="message-text">{message.content}</pre>
                    
                    {message.improvements && message.improvements.length > 0 && (
                      <div className="improvements-badge">
                        <Zap size={16} />
                        <span>Найдено улучшений: {message.improvements.length}</span>
                      </div>
                    )}
                    
                    {message.knowledge_gained && message.knowledge_gained.length > 0 && (
                      <div className="knowledge-badge">
                        <Database size={16} />
                        <span>Получено знаний: {message.knowledge_gained.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleString('ru-RU')}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message ai loading">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="input-area">
              <div className="action-buttons">
                <button 
                  className="action-btn analyze" 
                  onClick={analyzeCode}
                  disabled={isAnalyzing}
                >
                  <Code size={18} />
                  {isAnalyzing ? 'Анализирую...' : 'Анализ кода'}
                </button>
                <button 
                  className="action-btn improve" 
                  onClick={applyImprovements}
                >
                  <Zap size={18} />
                  Применить улучшения
                </button>
                <button 
                  className="action-btn search" 
                  onClick={() => searchInternet('новые технологии программирования 2025')}
                >
                  <Globe size={18} />
                  Поиск новых технологий
                </button>
                <label className="action-btn upload">
                  <Upload size={18} />
                  Загрузить файл
                  <input type="file" hidden onChange={handleFileUpload} />
                </label>
              </div>

              <div className="message-input">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Напишите сообщение для ИИ..."
                  disabled={isLoading}
                />
                <button 
                  className="send-button"
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-container">
            <div className="analysis-header">
              <h2>Анализ кода системы</h2>
              <button className="analyze-button" onClick={analyzeCode}>
                <Cpu size={20} />
                Повторить анализ
              </button>
            </div>
            
            {analysisData ? (
              <div className="analysis-results">
                <div className="stat-card">
                  <h3>Статистика анализа</h3>
                  <div className="stats">
                    <div className="stat">
                      <span className="stat-value">{analysisData.files_analyzed}</span>
                      <span className="stat-label">Файлов проанализировано</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{analysisData.potential_improvements?.length || 0}</span>
                      <span className="stat-label">Потенциальных улучшений</span>
                    </div>
                  </div>
                </div>

                {analysisData.potential_improvements && analysisData.potential_improvements.length > 0 && (
                  <div className="improvements-card">
                    <h3>Рекомендуемые улучшения</h3>
                    <ul className="improvements-list">
                      {analysisData.potential_improvements.map((improvement, index) => (
                        <li key={index} className="improvement-item">
                          <Zap size={16} className="improvement-icon" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="analysis-placeholder">
                <Code size={48} />
                <p>Нажмите "Повторить анализ" для проведения анализа кода</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="search-container">
            <div className="search-header">
              <h2>Результаты поиска в интернете</h2>
              <input 
                type="text" 
                placeholder="Введите поисковый запрос..."
                onKeyPress={(e) => e.key === 'Enter' && searchInternet(e.target.value)}
              />
            </div>

            <div className="search-results">
              {searchResults.map((result, index) => (
                <div key={index} className="search-result">
                  <h4 className="result-title">{result.title}</h4>
                  <p className="result-snippet">{result.snippet}</p>
                  {result.url && (
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="result-url">
                      {result.url}
                    </a>
                  )}
                  <div className="result-time">
                    {new Date(result.timestamp).toLocaleString('ru-RU')}
                  </div>
                </div>
              ))}
              
              {searchResults.length === 0 && (
                <div className="search-placeholder">
                  <Globe size={48} />
                  <p>Результаты поиска появятся здесь</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-container">
            <div className="history-header">
              <h2>История улучшений системы</h2>
              <button onClick={loadImprovementsHistory} className="refresh-button">
                <History size={20} />
                Обновить
              </button>
            </div>

            <div className="improvements-history">
              {improvementsHistory.map((improvement, index) => (
                <div key={index} className="history-item">
                  <div className="history-header-item">
                    <div className="history-time">
                      {new Date(improvement.timestamp).toLocaleString('ru-RU')}
                    </div>
                    <div className={`history-status ${improvement.result.success ? 'success' : 'error'}`}>
                      {improvement.result.success ? '✅ Успех' : '❌ Ошибка'}
                    </div>
                  </div>
                  <div className="history-message">
                    {improvement.result.message}
                  </div>
                  {improvement.result.details && (
                    <div className="history-details">
                      {improvement.result.details.applied && (
                        <div className="applied-improvements">
                          <strong>Применено:</strong> {improvement.result.details.applied.join(', ')}
                        </div>
                      )}
                      {improvement.result.details.errors && improvement.result.details.errors.length > 0 && (
                        <div className="improvement-errors">
                          <strong>Ошибки:</strong> {improvement.result.details.errors.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {improvementsHistory.length === 0 && (
                <div className="history-placeholder">
                  <History size={48} />
                  <p>История улучшений пока пуста</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
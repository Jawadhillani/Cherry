import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, CornerDownRight, Car, Zap, Shield, Star, Gauge, 
  Calendar, Settings, Fuel, BarChart3, Activity, ThumbsUp, ThumbsDown, 
  Sparkles, Layers, Map, Share2, Cpu, HardDrive, Network, Terminal,
  ExternalLink, MessageSquare, Wifi 
} from 'lucide-react';

import { useSpring, animated } from 'react-spring'; // Optional import for 3D effects

const AdvancedImmersiveChatInterface = ({ carId, voiceEnabled = false, onSpeakResponse = null }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [carData, setCarData] = useState(null);
  const [visualMode, setVisualMode] = useState('neural'); // 'neural', 'data', 'spec'
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [neuralActivity, setNeuralActivity] = useState([]);
  const [spectrumData, setSpectrumData] = useState(generateRandomSpectrum());
  const [gridAnimation, setGridAnimation] = useState(false);

  const messagesEndRef = useRef(null);
  const neuralCanvasRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    const initialMessage = {
      id: 'welcome',
      text: "Welcome to NeuralDrive AI. Initializing quantum-enhanced automotive analysis matrix...",
      sender: 'ai',
      timestamp: new Date().toISOString(),
      type: 'system'
    };
    setMessages([initialMessage]);

    setTimeout(() => {
      const readyMessage = {
        id: 'ready',
        text: "Neural matrix activated. Advanced automotive intelligence online. How may I assist with your vehicular inquiry?",
        sender: 'ai',
        timestamp: new Date().toISOString(),
        suggestions: [
          "Analyze vehicle specifications",
          "Compare performance metrics",
          "Evaluate reliability factors"
        ]
      };
      setMessages(prev => [...prev, readyMessage]);
      startNeuralAnimation();
      
      if (carId) fetchCarData();
    }, 1500);

    if (typeof window !== 'undefined' && window.AudioContext) {
      audioContextRef.current = new AudioContext();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [carId]);

  useEffect(() => {
    scrollToBottom();
    
    if (messages.length > 0 && messages[messages.length - 1].sender === 'ai') {
      updateNeuralActivity();
    }
  }, [messages]);

  const fetchCarData = async () => {
    try {
      setSystemStatus(prev => ({ ...prev, dataMatrix: { status: 'syncing', connections: 8 } }));
      const response = await fetch(`/api/cars/${carId}`);
      if (response.ok) {
        const data = await response.json();
        setCarData(data);
        setSystemStatus({ ...prev, dataMatrix: { status: 'optimal', connections: 16 } });
        
        const carDataMessage = {
          id: `car-${data.id}`,
          text: `Vehicle recognized: ${data.year} ${data.manufacturer} ${data.model}. All specifications loaded into neural matrix.`,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          type: 'data',
        };
        playConnectionSound();
        setMessages(prev => [...prev, carDataMessage]);
      }
    } catch (error) {
      console.error('Error fetching car data:', error);
      const errorMessage = {
        id: 'fetch-error',
        text: "Data retrieval error. Neural pathways disrupted. Please recalibrate by selecting a valid vehicle identifier.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setGridAnimation(true);
    
    setTimeout(() => setGridAnimation(false), 800);

    try {
      const history = messages.filter(m => m.type !== 'system' && m.type !== 'data').map(m => m.text);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          car_id: carId,
          conversation_history: history
        })
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      
      const aiResponse = {
        id: `ai-${Date.now()}`,
        text: data.response,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        model: data.model_used,
        visualData: generateVisualData(data.response, data.analysis),
        suggestions: generateContextualSuggestions(input, carData),
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      playCompletionSound();

      if (aiResponse.visualData.type === 'analysis') {
        setCurrentAnalysis(aiResponse.visualData);
        setVisualMode('data');
      }

      updateSpectrumData();
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: "Neural processing error. Connection to automotive knowledge matrix failed. Please try rephrasing your query.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const generateContextualSuggestions = (query, carData) => {
    const suggestions = [];
    if (query.includes('performance')) {
      suggestions.push("Analyze acceleration metrics", "Compare to performance rivals");
    }
    if (query.includes('reliability')) {
      suggestions.push("Show common failure points", "Calculate reliability index");
    }
    if (carData) {
      suggestions.push(`Analyze ${carData.model} performance data`, `Generate ${carData.manufacturer} comparison matrix`);
    }
    return suggestions.slice(0, 3);
  };

  const generateVisualData = (text, analysis) => {
    return { 
      type: 'analysis',
      metrics: [
        { name: 'Performance', value: Math.random() * 5, max: 5 },
        { name: 'Reliability', value: Math.random() * 5, max: 5 },
        { name: 'Efficiency', value: Math.random() * 5, max: 5 }
      ]
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playProcessingSound = () => { /* audio context for sound effects */ };
  const playCompletionSound = () => { /* audio context for sound effects */ };
  const playConnectionSound = () => { /* audio context for sound effects */ };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black h-full flex flex-col border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-violet-700 text-white p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center">
          <Bot className="w-6 h-6 mr-2" /> AI Automotive Expert
        </h2>
        <p className="text-sm text-blue-200">
          {carData ? `Exploring ${carData.year} ${carData.manufacturer} ${carData.model}` : 'Ask me anything about cars!'}
        </p>
        {/* Voice toggle */}
        <div className="flex items-center gap-2">
          {/* Other controls */}
        </div>
      </div>

      {/* Neural network canvas */}
      {visualMode === 'neural' && (
        <div className="neural-canvas-container">
          <canvas ref={neuralCanvasRef} />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className="flex justify-start animate-message-appear">
            {/* AI & User messages */}
          </div>
        ))}

        {/* Loading */}
        {loading && <div>Loading...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            className="flex-1 border border-gray-700 bg-gray-800/50 rounded-lg px-4 py-3 text-white"
          />
          <button onClick={handleSend} className="bg-blue-600 text-white p-3 rounded-lg">Send</button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedImmersiveChatInterface;

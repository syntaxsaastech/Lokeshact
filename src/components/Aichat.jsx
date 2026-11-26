import { useState, useEffect, useRef } from 'react';

export default function AIChat({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your AI diet coach. Ask me anything about your food or water today." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // 1. Get current context from localStorage
    const foodData = JSON.parse(localStorage.getItem('food-data') || '[]');
    const waterData = JSON.parse(localStorage.getItem('water-tracker-v2') || '{}');

    // 2. Send to backend
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages,        // for conversation continuity
          context: {
            food: foodData,
            water: waterData,
            date: new Date().toISOString().split('T')[0]
          }
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't reach the server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, width: 360, height: 520,
      background: 'white', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8e24aa, #5e35b1)',
        color: 'white', padding: 12, display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', fontWeight: 800
      }}>
        <span>🤖 AI Diet Coach</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#f7f7fb' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            marginBottom: 10, display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '80%', padding: '8px 12px', borderRadius: 12,
              background: m.role === 'user' ? '#5e35b1' : 'white',
              color: m.role === 'user' ? 'white' : '#333',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: 13
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontStyle: 'italic', color: '#888' }}>Coach is typing…</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', padding: 8, borderTop: '1px solid #eee' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about your diet..."
          style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}
        />
        <button onClick={sendMessage} style={{
          marginLeft: 6, padding: '8px 12px', background: '#5e35b1',
          color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer'
        }}>Send</button>
      </div>
    </div>
  );
}
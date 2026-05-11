// File: src/App.tsx
import { useState, useRef, useEffect } from 'react';
import './index.css';

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  isHtml?: boolean;
  englishPart?: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: "Hello there! My name is Linh. I am so happy to meet you today... How are you feeling right now?<hr><i>(Chào em! Cô tên là Linh. Cô rất vui được gặp em hôm nay... Bây giờ em cảm thấy thế nào?)</i>",
      isHtml: true,
      englishPart: "Hello there! My name is Linh. I am so happy to meet you today... How are you feeling right now?"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [errorLog, setErrorLog] = useState("");
  
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Cuộn xuống cuối mỗi khi có tin nhắn mới
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, inputText]);

  // Khởi tạo Microphone
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript !== '') {
          setInputText(prev => prev + finalTranscript + ' ');
        }
      };
      recognitionRef.current = recognition;
    }
  }, []);

  // Xử lý nút Mic
  const handleMicClick = () => {
    if (!recognitionRef.current) return;

    if (!isRecording) {
      setInputText("");
      recognitionRef.current.start();
      setIsRecording(true);
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
      setTimeout(() => {
        if (inputText.trim() !== "") handleSend(inputText);
      }, 500);
    }
  };

  // Xử lý nút Hủy Mic
  const handleCancelMic = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setInputText("");
    }
  };

  // Xử lý Gửi tin nhắn (Gọi Serverless API)
  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: text }]);
    setInputText("");
    setErrorLog("");

    try {
      // Gọi đến Backend cục bộ (Vercel sẽ lo phần này)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      if (data.error) {
        setErrorLog("Lỗi API: " + data.error);
        return;
      }

      const formattedText = data.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
      const englishPart = data.text.split("---")[0].trim();

      setMessages(prev => [...prev, { 
        id: Date.now(), 
        sender: 'ai', 
        text: formattedText, 
        isHtml: true, 
        englishPart: englishPart 
      }]);

      readAloud(englishPart);
    } catch (error) {
      setErrorLog("Lỗi hệ thống. Vui lòng thử lại.");
    }
  };

  // Xử lý Giọng đọc (Text-to-Speech)
  const readAloud = (text: string) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US';
    speech.rate = 0.9;
    
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Zira') || v.name.includes('Female'));
    if (femaleVoice) speech.voice = femaleVoice;

    window.speechSynthesis.speak(speech);
  };

  const stopTTS = () => window.speechSynthesis.cancel();

  return (
    <div className="app-container">
      <div className="header">Linh - Your Patient English Teacher</div>

      <div className="chat-area" id="chat-box" ref={chatBoxRef}>
        {messages.map((msg) => (
          msg.sender === 'ai' ? (
            <div className="ai-message-block" key={msg.id}>
              <div className="avatar">L</div>
              <div className="msg-content">
                <div className="msg-header">
                  <div className="ai-info"><h3>Cô Linh</h3><p>YOUR PATIENT GUIDE</p></div>
                </div>
                <div className="text-body" dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                {msg.englishPart && (
                  <div className="replay-btn" onClick={() => readAloud(msg.englishPart!)}>
                    <span className="material-symbols-outlined">volume_up</span> Replay voice
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="user-message-block" key={msg.id}>{msg.text}</div>
          )
        ))}
      </div>

      <div className="input-area">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="input-box">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
              placeholder={isRecording ? "Đang nghe... Nhấn lại nút Mic để Gửi!" : "Type your message or use the microphone..."}
            />
            <span className="material-symbols-outlined" id="btn-send" onClick={() => handleSend(inputText)} title="Gửi văn bản">send</span>
          </div>
          
          <button className={`mic-btn ${isRecording ? 'recording' : ''}`} onClick={handleMicClick} title="Bấm để nói / Bấm để Gửi">
            <span className="material-symbols-outlined">{isRecording ? 'send' : 'mic'}</span>
          </button>

          {isRecording && (
            <button className="mic-btn" id="btn-cancel-mic" onClick={handleCancelMic} style={{ display: 'flex' }} title="Nói sai? Bấm để Hủy bỏ">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}

          <button className="mic-btn" style={{ backgroundColor: '#6c757d' }} onClick={stopTTS} title="Dừng AI đọc">
            <span className="material-symbols-outlined">volume_off</span>
          </button>
        </div>
        <div id="error-log">{errorLog}</div>
        <div className="footer-text">Try to speak naturally! Cô Linh will help you if you make mistakes.</div>
      </div>
    </div>
  );
}
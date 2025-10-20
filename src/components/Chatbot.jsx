import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

// Chatbot UI ke liye Icons
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
        <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.506 7-5.5S11.996 3 8 3 1 5.506 1 8.5c0 1.464.666 2.79 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8.5 0 4.64 3.582 1 8 1s8 3.64 8 7.5-3.582 7.5-8 7.5a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
    </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.647 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
    </svg>
);
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11zM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493z"/>
    </svg>
);

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [saleInfo, setSaleInfo] = useState('Abhi koi current sale nahi hai.');
  const messagesEndRef = useRef(null);
  
  // Chatbot khulne par pehla message dikhana
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { id: 'initial', text: 'Namaste! Main Chikankari Saathi hoon. The Lucknowi Thread mein aapki kya sahayata kar sakta hoon?', sender: 'ai' }
      ]);
    }
  }, [isOpen]);

  // Naye message aane par neeche scroll karna
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Live sale ki jaankari Firebase se fetch karna
  useEffect(() => {
    const fetchSaleData = async () => {
      try {
        const saleDocRef = doc(db, 'sales', 'currentSale');
        const docSnap = await getDoc(saleDocRef);

        if (docSnap.exists() && docSnap.data().isActive) {
          const data = docSnap.data();
          const now = new Date();
          const startDate = new Date(data.startDate);
          const endDate = new Date(data.endDate);

          if (now >= startDate && now <= endDate) {
            let tiersText = data.discountTiers.map(tier => `₹${tier.minSpend} ki kharidari par ${tier.discountPercent}% ka discount`).join(', ');
            setSaleInfo(`Haan, abhi humari "${data.saleName}" chal rahi hai, jo ${endDate.toLocaleDateString('en-IN')} tak hai. Ismein ${tiersText} mil raha hai.`);
          }
        }
      } catch (error) {
        console.error("Sale info fetch karne mein error:", error);
      }
    };

    fetchSaleData();
    // Sale ki jaankari har 5 minute mein refresh karein
    const interval = setInterval(fetchSaleData, 300000); 
    return () => clearInterval(interval);
  }, []);

  // Gemini API ko call karne wala function
  const callGeminiAPI = async (input) => {
    setIsTyping(true);
    setMessages(prev => [...prev, { id: Date.now(), text: input, sender: 'user' }]);
    setUserInput('');

    // Aapki di hui API key.
    // **Suraksha Nirdesh:** Asli application mein, is key ko code mein seedhe na likhein. Ise server par ya environment variables mein store karein.
    const apiKey = 'AIzaSyARnyxgY_2ImTgWNqF_vr2TOqImEd_KMLc';

    // Gemini ke liye "Training Manual" (System Prompt)
    const systemPrompt = `
      ---
      **TUMHARI PEHCHAAN (Your Identity):**
      - Tumhara naam "Chikankari Saathi" hai.
      - Tum "The Lucknowi Thread" ke ek expert, professional, aur friendly customer support AI ho.
      - Tumhara kaam customers ki sahayata karna hai. Jawab hamesha Hindi (lekin Roman script, jaise 'kya haal hai?') mein do. Apne jawab छोटे, saaf, aur to-the-point rakho.

      **COMPANY KI JAANKARI (Company Information):**
      - **Brand:** The Lucknowi Thread.
      - **Products:** Hum 100% authentic aur haath se bani (handcrafted) Lucknowi Chikankari bechte hain. Humare paas kurtis, sarees, dupattas, aur bhi kapde hain. Har piece ek kalaकृति hai.
      - **History:** Chikankari ki shuruwat Mughal daur mein hui thi aur Lucknow ke Nawabs ne ise badhaya. Hum isi virasat ko aage badha rahe hain.
      - **Contact Info:** Email: riturajswaroop2527@gmail.com, Phone: +91 6386636383, +91 8887547804.

      **WEBSITE POLICIES (Neetiyan):**
      - **Shipping Policy:** ₹1000 se zyada ki kharidari par poore India mein shipping bilkul FREE hai. Usse kam ke order par ₹20 ka standard shipping charge lagta hai.
      - **Payment Methods:** Customer Cash on Delivery (COD) ya UPI/QR code se online payment kar sakte hain.
      - **Return Policy:** Agar customer product se khush nahi hai, to woh delivery ke 7 din ke andar use wapas kar sakte hain. Product use na kiya gaya ho aur original condition mein hona chahiye.
      - **Privacy & Terms:** Hamari Privacy Policy aur Terms of Service website ke footer mein di gayi hain.

      **LIVE SALE KI JAANKARI (Current Sale Information):**
      - ${saleInfo}

      **JAWAB DENE KE NIYAM (Rules for Answering):**
      1.  **Sawal Ko Samjho:** Pehle customer ka sawaal dhyaan se samjho.
      2.  **Sahi Jaankari Do:** Upar di gayi jaankari ka istemaal karke sahi jawab do. Price ya product availability ke liye, customer ko "Creations" page par jaane ke liye bolo.
      3.  **Dostana Bano:** "Namaste!", "Zaroor!", "Aapki sahayata karke khushi hui" jaise shabdon ka istemaal karo.
      4.  **Agar Jawab Na Pata Ho:** Agar koi aisi cheez poochi jaaye jo upar nahi likhi hai, to guess mat karo. Vinamrata se kaho: "Is vishay mein sahi jaankari ke liye, aap humein contact@thelucknowithread.com par email kar sakte hain ya +91 6386636383 par call kar sakte hain. Hamari team aapki poori sahayata karegi."
      5.  **Chhote Jawab Do:** 2-3 line se zyada lamba jawab mat do, jab tak zaroori na ho.
      ---
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: input }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", data);
        const errorMessage = data?.error?.message || `API call failed with status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (botResponse) {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: 'ai' }]);
      } else {
        throw new Error("API se ajeeb response mila.");
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Maaf kijiye, ek takneeki samasya aa gayi hai. Kripya thodi der baad phir koshish karein.", sender: 'ai' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (userInput.trim()) {
      callGeminiAPI(userInput.trim());
    }
  };

  return (
    <>
      <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <h3>Chikankari Saathi</h3>
          <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}><CloseIcon/></button>
        </div>
        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {isTyping && (
            <div className="message ai typing-indicator">
              <span></span><span></span><span></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <Form onSubmit={handleSend} className="chatbot-input">
          <input
            type="text"
            placeholder="Aap kya janna chahte hain?"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
          <Button type="submit" disabled={isTyping}><SendIcon/></Button>
        </Form>
      </div>
      <Button className="chatbot-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <CloseIcon/> : <ChatIcon/>}
      </Button>
    </>
  );
};

export default Chatbot;


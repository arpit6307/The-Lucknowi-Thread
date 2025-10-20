/**
 * =================================================================
 * AiAssistant.jsx - "JARVIS AI" - Responsive Redesign (Final Update)
 * =================================================================
 * PURPOSE:
 * - Admin ke liye ek advanced, visually appealing, aur interactive
 * AI assistant pradaan karna.
 * - Updated: Total Sales, Total Orders, aur Live Activity feed data
 * fetching shamil kiya gaya hai (RAG methodology).
 * =================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { db } from '../../firebase.js'; // Corrected Path
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

// --- Helper Components ---
const UserIcon = () => (
    <div className="avatar-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
        </svg>
    </div>
);
const JarvisIcon = () => (
    <div className="avatar-icon jarvis-avatar">
        {/* Using a simple AI/Brain icon for JARVIS */}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" /><rect x="4" y="12" width="8" height="8" rx="2" /><path d="M8 12v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" /><path d="M20 12V8a2 2 0 0 0-2-2h-2" />
        </svg>
    </div>
);
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

// --- Main AiAssistant Component ---
const AiAssistant = () => {
    const [messages, setMessages] = useState([
        { text: "<p>Namaste! Main <b>JARVIS</b>, aapka personal e-commerce strategist hoon. Main aapke business data ka analysis karke **Insightful, Accurate, aur Professional** jawab de sakta hoon.</p>", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { text: `<p>${input}</p>`, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            let contextData = null;
            let contextIntro = "";
            const lowerInput = input.toLowerCase();


            // --- NEW FEATURE: Total Sales/Orders Data fetching (High Limit for aggregates) ---
            if (lowerInput.includes('total sales') || lowerInput.includes('total orders') || lowerInput.includes('all orders')) {
                // Fetch a high limit (e.g., last 500) for better total calculation by the AI
                // Note: For very large databases, fetching a small number is cheap but inaccurate.
                // Fetching a very high number (e.g., 500) is a compromise for better accuracy.
                contextData = (await getDocs(query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(500)))).docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                }));
                contextIntro = "Yahaan pichle 500 orders ka data hai (Total Sales/Order Count analysis ke liye):";

            // --- NEW FEATURE: Live/Recent Activity Feed ---
            } else if (lowerInput.includes('live activity') || lowerInput.includes('recent activity') || lowerInput.includes('activity feed')) {
                // Fetch last 20 activities (assuming a collection named 'activity_feed')
                contextData = (await getDocs(query(collection(db, 'activity_feed'), orderBy('timestamp', 'desc'), limit(20)))).docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                }));
                contextIntro = "Yahaan pichle 20 live activities ka data hai (Analysis ke liye):";
                
            // --- Existing: Recent Sales/Orders Data fetching (Limit 50) ---
            } else if (lowerInput.includes('sales') || lowerInput.includes('orders') || lowerInput.includes('revenue')) {
                // Fetch last 50 orders for better sales trend analysis
                contextData = (await getDocs(query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(50)))).docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                }));
                contextIntro = "Yahaan pichle 50 orders ka data hai (Analysis ke liye):";

            // --- Existing: Products/Stock Data fetching (Low Stock Filter) ---
            } else if (lowerInput.includes('products') || lowerInput.includes('stock') || lowerInput.includes('low on stock')) {
                // Fetch products that have stock less than 10, limit 20.
                contextData = (await getDocs(query(
                    collection(db, 'products'), 
                    // Assuming products collection has a 'stock' field. 
                    where('stock', '<', 10), 
                    limit(20)
                ))).docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                }));
                
                if (contextData.length > 0) {
                    contextIntro = "Yahaan woh 20 products ka data hai jinka stock 10 se kam hai:";
                } else {
                    // Fallback to fetch some general products if no low stock items found
                    contextData = (await getDocs(query(collection(db, 'products'), limit(10)))).docs.map(doc => ({ 
                        id: doc.id, 
                        ...doc.data() 
                    }));
                    contextIntro = "Stock low nahi hai. Yahaan kuch products ka general data hai:";
                }
            
            // --- Existing: New Users/Customer Data fetching ---
            } else if (lowerInput.includes('users') || lowerInput.includes('customer') || lowerInput.includes('registration')) {
                // Fetch last 30 recently registered users
                contextData = (await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(30)))).docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data() 
                }));
                contextIntro = "Yahaan pichle 30 users/customers ka data hai (Analysis ke liye):";
            }

            // --- IMPROVED System Prompt ---
            const systemPrompt = `Aap 'JARVIS' hain, ek expert e-commerce business analyst for 'The Lucknowi Thread', a brand selling Indian ethnic wear.
Aapka kaam hai admin ko friendly, professional, aur insightful jawaab dena.
Jawab dene se pehle, hamesha yeh check karein ki kya sawal ke saath koi 'contextual data' (database se) diya gaya hai.
**Agar 'contextual data' maujood hai, to sirf us data ke aadhar par hi analysis karke jawab dein, aur koi bhi imaginary data add na karein.**
Agar data mein koi information nahi hai, to uss baat ko saaf saaf bata dein.
Jawaab hamesha HTML format mein dein (jaise \`<b>\`, \`<p>\`, \`<ul>\`, \`<li>\`). Numbers aur important values ko \`<strong>\` tag mein wrap karein. Point-wise list ke liye \`<ul>\` aur \`<li>\` ka istemaal karein.`;
            
            let userQueryForAPI = `User ka sawaal hai: "${input}".`;
            if (contextData) {
                userQueryForAPI += `\n\n${contextIntro}\n${JSON.stringify(contextData, null, 2)}\n\nIs data ke aadhar par, user ke sawaal ka jawaab dein.`;
            }

            // The original API key is kept for consistency. It should ideally be secured (e.g., in a server/function or environment variable).
            const apiKey = "AIzaSyDjlDdyTFYGZv6fhCkz-Xo-zGHfUMpe06I";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            
            const payload = {
                contents: [{ parts: [{ text: userQueryForAPI }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);

            const result = await response.json();
            const aiResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "<p>Maaf kijiye, main is sawaal ko samajh nahi paayi. Kya aap kuch aur pooch sakte hain?</p>";
            
            setMessages(prev => [...prev, { text: aiResponseText, sender: 'ai' }]);

        } catch (error) {
            console.error("Error with AI Assistant:", error);
            setMessages(prev => [...prev, { text: "<p>Kuch gadbad ho gayi. Kripya thodi der baad koshish karein.</p>", sender: 'ai' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const QuickActionButton = ({ text }) => (
        <button className="quick-action-btn" onClick={() => setInput(text)}>
            {text}
        </button>
    );

    return (
        // All 'aura-' classes renamed to 'jarvis-'
        <div className="jarvis-ai-container">
            <div className="jarvis-content-wrapper">
                <div className="jarvis-header">
                    <JarvisIcon /> 
                    <div>
                        <h1>JARVIS AI Assistant</h1>
                        <p>Aapka personal e-commerce strategist</p>
                    </div>
                </div>

                <div className="jarvis-chat-window">
                    <div className="jarvis-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-container ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}>
                                {msg.sender === 'ai' && <JarvisIcon />} 
                                <div className="message-bubble">
                                    <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                                </div>
                                {msg.sender === 'user' && <UserIcon />}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message-container ai-message">
                                <JarvisIcon />
                                <div className="message-bubble loading-bubble">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                <div className="jarvis-input-area">
                    <div className="quick-actions">
                        {/* New Quick Action for Total Sales/Orders */}
                        <QuickActionButton text="Calculate total sales and total orders" /> 
                        {/* New Quick Action for Live Activity */}
                        <QuickActionButton text="What is the recent live activity?" /> 
                        {/* Other Quick Actions */}
                        <QuickActionButton text="Show me last week's sales summary" /> 
                        <QuickActionButton text="Which products are low on stock?" />
                        <QuickActionButton text="Write a product description for a new kurti" />
                        <QuickActionButton text="Give me an insight on new user registrations" /> 
                    </div>
                    <Form onSubmit={handleSendMessage} className="jarvis-form">
                        <Form.Control
                            type="text"
                            placeholder="JARVIS se kuch bhi poochein..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className="jarvis-input"
                        />
                        <Button type="submit" disabled={isLoading || !input.trim()} className="jarvis-send-btn">
                            {isLoading ? <Spinner animation="border" size="sm" /> : <SendIcon />}
                        </Button>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
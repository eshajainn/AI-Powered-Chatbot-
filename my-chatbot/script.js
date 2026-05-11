// ================================================
// NexusAI Chatbot — Final Year Project
// Powered by Groq API (Free)
// ================================================

// ⚠️  PASTE YOUR GROQ API KEY HERE (from console.groq.com)
const API_KEY = "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";

// Groq model (free & very fast)
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ---- State ----
let conversationHistory = [];
let isLoading = false;

// ---- On Page Load ----
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('userInput').focus();
  renderHistory();
});

// ---- Send Message ----
async function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text || isLoading) return;

  hideWelcome();
  addMessage('user', text);
  input.value = '';
  autoResize(input);

  conversationHistory.push({ role: 'user', content: text });

  setLoading(true);
  const typingId = showTyping();

  try {
    const reply = await fetchGroq(conversationHistory);
    removeTyping(typingId);
    addMessage('ai', reply);
    conversationHistory.push({ role: 'assistant', content: reply });
    saveSessionToHistory(text);
  } catch (err) {
    removeTyping(typingId);
    let errMsg = `⚠️ Error: ${err.message}`;
    if (err.message.includes('401') || err.message.includes('invalid_api_key')) {
      errMsg = '⚠️ Invalid API key. Open script.js and replace YOUR_GROQ_API_KEY_HERE with your real key from console.groq.com';
    }
    addMessage('ai', errMsg);
  } finally {
    setLoading(false);
  }
}

// ---- Call Groq API ----
async function fetchGroq(messages) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are NexusAI, a smart and helpful AI assistant built as a final year computer science project. 
                    You are friendly, knowledgeable, and respond clearly. Format code blocks with triple backticks. 
                    Be concise but thorough.`
        },
        ...messages
      ],
      max_tokens: 1024,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ---- Add Message to Chat ----
function addMessage(role, text) {
  const container = document.getElementById('messages');

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? 'U' : '◈';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = formatText(text);

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  container.appendChild(msgDiv);
  scrollToBottom();
}

// ---- Format Text ----
function formatText(text) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// ---- Typing Indicator ----
function showTyping() {
  const container = document.getElementById('messages');
  const id = 'typing-' + Date.now();

  const msgDiv = document.createElement('div');
  msgDiv.className = 'message ai';
  msgDiv.id = id;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = '◈';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  container.appendChild(msgDiv);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ---- Suggestions ----
function sendSuggestion(text) {
  document.getElementById('userInput').value = text;
  sendMessage();
}

// ---- UI Helpers ----
function hideWelcome() {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.style.display = 'none';
}

function scrollToBottom() {
  const container = document.getElementById('messages');
  container.scrollTop = container.scrollHeight;
}

function setLoading(state) {
  isLoading = state;
  document.getElementById('sendBtn').disabled = state;
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ---- Chat Management ----
function clearChat() {
  conversationHistory = [];
  const container = document.getElementById('messages');
  container.innerHTML = '';

  const welcome = document.createElement('div');
  welcome.id = 'welcome';
  welcome.className = 'welcome';
  welcome.innerHTML = `
    <div class="welcome-icon">◈</div>
    <h1>Hello, I'm NexusAI</h1>
    <p>Your intelligent assistant, ready to help with anything.</p>
    <div class="suggestions">
      <button class="suggest-btn" onclick="sendSuggestion('Explain quantum computing simply')">Explain quantum computing</button>
      <button class="suggest-btn" onclick="sendSuggestion('Write a Python function to sort a list')">Write Python code</button>
      <button class="suggest-btn" onclick="sendSuggestion('What are the best study habits for students?')">Study tips for students</button>
      <button class="suggest-btn" onclick="sendSuggestion('Summarize the history of artificial intelligence')">History of AI</button>
    </div>
  `;
  container.appendChild(welcome);
}

function newChat() {
  clearChat();
  document.getElementById('userInput').focus();
}

// ---- Session History ----
const sessionHistory = [];

function saveSessionToHistory(firstMessage) {
  const label = firstMessage.length > 30 ? firstMessage.slice(0, 30) + '…' : firstMessage;
  sessionHistory.unshift(label);
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('chatHistory');
  container.innerHTML = '';
  sessionHistory.slice(0, 10).forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.textContent = item;
    container.appendChild(div);
  });
}

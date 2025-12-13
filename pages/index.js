import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const TEMPLATES = [
  { icon: '💧', label: 'Plomberie', text: 'J\'ai un problème de plomberie' },
  { icon: '🌡️', label: 'Chauffage', text: 'Mon chauffage ne marche pas' },
  { icon: '⚡', label: 'Électricité', text: 'J\'ai un problème électrique' },
  { icon: '🪟', label: 'Isolation', text: 'Problème d\'isolation thermique' },
  { icon: '🔊', label: 'Bruit', text: 'Problème de bruit/acoustique' },
  { icon: '🏠', label: 'Généraliste', text: 'Problème général de logement' }
];

const TAGS = [
  { icon: '💧', label: 'Plomberie', color: '#3b82f6' },
  { icon: '🌡️', label: 'Chauffage', color: '#ef4444' },
  { icon: '⚡', label: 'Électricité', color: '#f59e0b' },
  { icon: '🪟', label: 'Isolation', color: '#10b981' },
  { icon: '🔊', label: 'Bruit', color: '#8b5cf6' },
  { icon: '🏠', label: 'Généraliste', color: '#6b7280' }
];

const detectTag = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('fuite') || lower.includes('eau') || lower.includes('tuyau')) return 'Plomberie';
  if (lower.includes('chauffage') || lower.includes('chaud') || lower.includes('radiateur')) return 'Chauffage';
  if (lower.includes('électricité') || lower.includes('électrique') || lower.includes('courant') || lower.includes('prise')) return 'Électricité';
  if (lower.includes('isolation') || lower.includes('froid') || lower.includes('température')) return 'Isolation';
  if (lower.includes('bruit') || lower.includes('bruit') || lower.includes('acoustique')) return 'Bruit';
  return 'Généraliste';
};

// ===== LANDING PAGE PREMIUM V2 =====
function LandingPage() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [stat1, setStat1] = useState(0);
  const [stat2, setStat2] = useState(0);
  const [stat3, setStat3] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [diagCount, setDiagCount] = useState(0);
  const [satisfactionCount, setSatisfactionCount] = useState(0);

  // COUNT-UP ANIMATION
  const countUp = (target, setFunc, duration = 1800) => {
    let current = 0;
    const step = target / (duration / 30);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setFunc(target);
        clearInterval(timer);
      } else {
        setFunc(Math.floor(current));
      }
    }, 30);
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    // Animations hero stats
    setTimeout(() => {
      countUp(10, setStat1, 1500);
      countUp(28, setStat2, 1500);
      countUp(100, setStat3, 1500);
    }, 400);
    
    // Animations trust section (plus tard)
    setTimeout(() => {
      countUp(500, setUsersCount, 2000);
      countUp(10000, setDiagCount, 2000);
      countUp(99, setSatisfactionCount, 2000);
    }, 2500);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: 'white', minHeight: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body { overflow-x: hidden; padding: 0; margin: 0; }
        html { scroll-behavior: smooth; }
        
        /* MOBILE RESPONSIVE */
        @media (max-width: 768px) {
          body { font-size: 14px; }
          .wrapper { grid-template-columns: 1fr !important; gap: 10px !important; }
          .sidebar { display: none !important; }
          .container { height: auto !important; }
          input, textarea, button { font-size: 16px; }
        }
        
        @media (max-width: 480px) {
          * { font-size: calc(var(--font-size, 1) * 0.9); }
        }
      `}</style>

      {/* NAVBAR ULTRA-CLEAN */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(30,60,114,0.08)', padding: '24px 50px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: scrollY > 10 ? '0 2px 20px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.3s' }}>
        <div style={{ fontSize: '22px', fontWeight: '900', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', letterSpacing: '-0.5px' }}>
          🏢 Assistant Immobilier
        </div>
      </nav>

      {/* HERO SECTION ÉPOUSTOUFLANTE */}
      <section style={{ padding: '160px 50px 140px', textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f5f8ff 50%, #f0f5ff 100%)', position: 'relative', overflow: 'hidden' }}>
        {/* BACKGROUND ELEMENTS */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(30,60,114,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(42,82,152,0.07) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
        
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* BADGE */}
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#2a5298', marginBottom: '30px', letterSpacing: '2px', textTransform: 'uppercase', display: 'inline-block', padding: '10px 20px', background: 'rgba(42,82,152,0.08)', borderRadius: '50px', backdropFilter: 'blur(10px)' }}>
            ✨ Solution IA pour l'Immobilier
          </div>
          
          {/* MAIN HEADLINE */}
          <h1 style={{ fontSize: '84px', fontWeight: '900', lineHeight: '1.05', marginBottom: '32px', color: '#0f172a', letterSpacing: '-1px' }}>
            Votre Expert<br />en <span style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>10 Secondes</span>
          </h1>
          
          {/* SUBHEADLINE */}
          <p style={{ fontSize: '20px', color: '#4a5568', marginBottom: '50px', lineHeight: '1.8', maxWidth: '750px', margin: '0 auto 50px', fontWeight: '500' }}>
            Diagnostic immobilier instantané avec Claude. Analysez les photos, identifiez les problèmes et recevez des solutions en temps réel.
          </p>

          {/* STATS SECTION */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', marginTop: '80px', maxWidth: '850px', margin: '80px auto 0' }}>
            <div style={{ padding: '30px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(30,60,114,0.1)' }}>
              <div style={{ fontSize: '52px', fontWeight: '900', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', marginBottom: '12px' }}>
                {stat1}<span style={{ fontSize: '20px', marginLeft: '4px' }}>sec</span>
              </div>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '600', letterSpacing: '0.5px' }}>DIAGNOSTIC</div>
            </div>
            <div style={{ padding: '30px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(30,60,114,0.1)' }}>
              <div style={{ fontSize: '52px', fontWeight: '900', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', marginBottom: '12px' }}>
                {stat2}+
              </div>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '600', letterSpacing: '0.5px' }}>FONCTIONNALITÉS</div>
            </div>
            <div style={{ padding: '30px', borderRadius: '16px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(30,60,114,0.1)' }}>
              <div style={{ fontSize: '52px', fontWeight: '900', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', marginBottom: '12px' }}>
                {stat3}%
              </div>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '600', letterSpacing: '0.5px' }}>GRATUIT</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section style={{ padding: '120px 50px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: '60px', fontWeight: '900', color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.5px' }}>Pourquoi ça marche</h2>
            <p style={{ fontSize: '18px', color: '#666', maxWidth: '650px', margin: '0 auto', fontWeight: '500', lineHeight: '1.7' }}>
              Une solution complète pensée pour les propriétaires, syndics et gestionnaires immobiliers. Technologie Claude IA + interface intuitive.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
            {[
              { icon: '🎯', title: 'Diagnostic Précis', desc: 'IA Claude analyse images et contexte avec 99% de précision' },
              { icon: '⚡', title: 'Instantané', desc: 'Résultats en moins de 10 secondes, sans file d\'attente' },
              { icon: '💰', title: 'Coût Estimé', desc: 'Chiffrage automatique des travaux et solutions alternatives' },
              { icon: '🎓', title: 'Conseil Expert', desc: 'Solutions détaillées et recommandations prioritaires' },
              { icon: '📊', title: 'Historique Complet', desc: 'Conservez tous vos diagnostics et suivez l\'historique' },
              { icon: '🔒', title: 'Données Sécurisées', desc: 'Vos données protégées avec chiffrement de niveau entreprise' }
            ].map((feat, i) => (
              <div key={i} onMouseEnter={() => setHoveredCard(i)} onMouseLeave={() => setHoveredCard(null)} style={{ padding: '44px', background: hoveredCard === i ? 'linear-gradient(135deg, #f0f5ff 0%, #f8faff 100%)' : '#f9fafb', border: hoveredCard === i ? '2px solid #2a5298' : '2px solid #f0f0f0', borderRadius: '18px', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)', transform: hoveredCard === i ? 'translateY(-12px)' : 'translateY(0)', boxShadow: hoveredCard === i ? '0 25px 50px rgba(30,60,114,0.15)' : '0 5px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>{feat.icon}</div>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', letterSpacing: '-0.3px' }}>{feat.title}</h3>
                <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.7', fontWeight: '500' }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '120px 50px', background: 'linear-gradient(180deg, #f5f8ff 0%, #f0f5ff 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: '60px', fontWeight: '900', color: '#0f172a', marginBottom: '24px' }}>Comment ça fonctionne</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', maxWidth: '1100px', margin: '0 auto' }}>
            {[
              { num: '1', emoji: '📸', title: 'Capturez', desc: 'Prenez une photo du problème' },
              { num: '2', emoji: '💬', title: 'Décrivez', desc: 'Posez votre question' },
              { num: '3', emoji: '⚡', title: 'Analysez', desc: 'Claude comprend instantanément' },
              { num: '4', emoji: '✅', title: 'Agissez', desc: 'Obtenez des solutions précises' }
            ].map((step, idx) => (
              <div key={idx} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900', margin: '0 auto 24px', boxShadow: '0 10px 30px rgba(30,60,114,0.25)' }}>
                  {step.num}
                </div>
                <div style={{ fontSize: '42px', marginBottom: '16px' }}>{step.emoji}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>{step.title}</h3>
                <p style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>{step.desc}</p>
                {idx < 3 && <div style={{ position: 'absolute', right: '-15px', top: '50px', fontSize: '24px', color: 'rgba(30,60,114,0.2)' }}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section style={{ padding: '100px 50px', background: 'white', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '900', color: '#0f172a', marginBottom: '20px' }}>Fait par des experts</h2>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '60px', fontWeight: '500', lineHeight: '1.7' }}>
            Construit avec la technologie IA la plus avancée (Claude par Anthropic) et optimisé pour les professionnels de l'immobilier qui demandent la qualité.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '900', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>{usersCount}+</div>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '600', marginTop: '8px' }}>Utilisateurs actifs</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '900', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>{diagCount > 0 ? (diagCount / 1000).toFixed(1) : '0'}k+</div>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '600', marginTop: '8px' }}>Diagnostics effectués</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '900', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>{satisfactionCount}%</div>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '600', marginTop: '8px' }}>Satisfaction client</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER PREMIUM */}
      <footer style={{ padding: '60px 50px', background: 'linear-gradient(180deg, #0f172a 0%, #1a2847 100%)', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', letterSpacing: '0.5px' }}>
            🏢 Assistant Immobilier
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginBottom: '30px', fontWeight: '500' }}>
            Diagnostic IA instantané pour l'immobilier
          </div>
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '30px 0' }}></div>
          
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '30px', fontWeight: '500', letterSpacing: '0.3px' }}>
            © 2025 Réalisé par <span style={{ fontWeight: '800', color: 'white' }}>Ali WARI</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

// ===== TON APP PRINCIPALE (INTACTE) =====
export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Bonjour 👋' }]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [ratings, setRatings] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(300);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [reactions, setReactions] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [voiceInterimText, setVoiceInterimText] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [showTagPicker, setShowTagPicker] = useState(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [showSynthesisModal, setShowSynthesisModal] = useState(false);
  const [synthesis, setSynthesis] = useState('');
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [problemScoring, setProblemScoring] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);

  const messagesEndRef = useRef(null);
  const autoSaveTimer = useRef(null);
  const sessionTimer = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'fr-FR';
        recognitionRef.current.onstart = () => { setIsListening(true); setVoiceInterimText(''); };
        recognitionRef.current.onresult = (event) => {
          let interim = '';
          let finalText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalText += transcript + ' ';
            else interim += transcript;
          }
          if (finalText) { setInput(prev => prev + finalText); setVoiceInterimText(''); }
          else setVoiceInterimText(interim);
        };
        recognitionRef.current.onerror = () => { setIsListening(false); };
        recognitionRef.current.onend = () => { setIsListening(false); setVoiceInterimText(''); };
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode_preference');
    if (saved) setDarkMode(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode_preference', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setShowAuth(false);
        loadConversations(currentUser.uid);
        loadHistoryFromConversations(currentUser.uid);
        setSessionTimeLeft(300);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (showAuth) return;
    sessionTimer.current = setInterval(() => {
      setSessionTimeLeft(t => {
        if (t <= 1) { handleLogout(); return 300; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(sessionTimer.current);
  }, [showAuth]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (currentConvId && !startTime) setStartTime(Date.now()); }, [currentConvId, startTime]);
  useEffect(() => {
    if (!currentConvId || !user) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      updateDoc(doc(db, 'conversations', currentConvId), { messages, updatedAt: serverTimestamp() }).catch(err => console.error('Auto-save failed:', err));
    }, 1000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [messages, currentConvId, user]);

  const loadConversations = async (userId) => {
    try {
      const q = query(collection(db, 'conversations'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = convs.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        const aTime = a.updatedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.updatedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      setConversations(sorted);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadHistoryFromConversations = async (userId) => {
    try {
      const q = query(collection(db, 'conversations'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const allQuestions = [];
      snapshot.docs.forEach(doc => {
        const conv = doc.data();
        if (conv.messages && Array.isArray(conv.messages)) {
          conv.messages.forEach(msg => {
            if (msg.role === 'user') {
              allQuestions.push({
                text: msg.content,
                date: conv.createdAt ? new Date(conv.createdAt.toDate?.() || conv.createdAt) : new Date(),
                tag: detectTag(msg.content)
              });
            }
          });
        }
      });
      const saved = localStorage.getItem(`search_history_${userId}`);
      let existingHistory = [];
      if (saved) {
        try {
          existingHistory = JSON.parse(saved).map(item => ({ ...item, date: new Date(item.date) }));
        } catch (e) {}
      }
      const combined = [...allQuestions, ...existingHistory];
      const unique = combined.filter((item, idx, self) => 
        idx === self.findIndex(i => i.text === item.text && Math.abs(i.date.getTime() - item.date.getTime()) < 1000)
      );
      setSearchHistory(unique.sort((a, b) => b.date - a.date));
      localStorage.setItem(`search_history_${userId}`, JSON.stringify(unique));
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setShowAuth(false);
    } catch (error) {
      setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAuth(false);
    } catch (error) {
      setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleGuestLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInAnonymously(auth);
      setShowAuth(false);
    } catch (error) {
      setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setShowAuth(true);
    setMessages([{ role: 'assistant', content: 'Bonjour 👋' }]);
    setConversations([]);
  };

  const startNewConversation = async () => {
    if (!user) {
      setToast('❌ Vous devez être connecté');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'conversations'), {
        userId: user.uid,
        title: 'Nouvelle conversation',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isFavorite: false,
        isPinned: false,
        tag: null,
        messages: [{ role: 'assistant', content: 'Bonjour 👋' }]
      });
      setCurrentConvId(docRef.id);
      setMessages([{ role: 'assistant', content: 'Bonjour 👋' }]);
      setStartTime(null);
      setSuggestions([]);
      setProblemScoring({});
      setSynthesis('');
      setShowTemplates(false);
      await loadConversations(user.uid);
      setToast('✨ Nouvelle conversation créée!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      console.error('Erreur:', error);
      setToast('❌ Erreur lors de la création');
      setTimeout(() => setToast(null), 2000);
    }
  };

  const loadConversation = (conv) => {
    setCurrentConvId(conv.id);
    setMessages(conv.messages || []);
    setStartTime(null);
    setSuggestions([]);
    setProblemScoring({});
  };

  const toggleFavorite = async (convId) => {
    try {
      const conv = conversations.find(c => c.id === convId);
      await updateDoc(doc(db, 'conversations', convId), { isFavorite: !conv.isFavorite });
      loadConversations(user.uid);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const togglePin = async (convId) => {
    try {
      const conv = conversations.find(c => c.id === convId);
      await updateDoc(doc(db, 'conversations', convId), { isPinned: !conv.isPinned });
      loadConversations(user.uid);
      setToast(conv.isPinned ? '📌 Conversation dépinnée' : '📌 Conversation pinnée');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteConversation = async (convId) => {
    if (window.confirm('⚠️ Supprimer cette conversation? (Impossible à annuler)')) {
      try {
        await deleteDoc(doc(db, 'conversations', convId));
        if (currentConvId === convId) {
          setCurrentConvId(null);
          setMessages([{ role: 'assistant', content: 'Bonjour 👋' }]);
        }
        loadConversations(user.uid);
        setToast('❌ Conversation supprimée');
        setTimeout(() => setToast(null), 2000);
      } catch (error) {
        console.error('Error:', error);
        setToast('Erreur lors de la suppression');
        setTimeout(() => setToast(null), 2000);
      }
    }
  };

  const assignTag = async (convId, tagLabel) => {
    try {
      await updateDoc(doc(db, 'conversations', convId), { tag: tagLabel });
      loadConversations(user.uid);
      setToast(`✅ Tag "${tagLabel}" assigné`);
      setTimeout(() => setToast(null), 2000);
      setShowTagPicker(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getTagColor = (tagLabel) => {
    const tag = TAGS.find(t => t.label === tagLabel);
    return tag ? tag.color : '#6b7280';
  };

  const regenerateResponse = async (msgIndex) => {
    if (msgIndex < 1) return;
    let userMessageIndex = -1;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessageIndex = i;
        break;
      }
    }
    if (userMessageIndex === -1) return;

    setRegeneratingIndex(msgIndex);
    setToast('🔄 Régénération en cours...');

    try {
      const messagesForAPI = messages.slice(0, userMessageIndex + 1);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesForAPI }),
      });

      if (!response.ok) throw new Error('Erreur API');
      const data = await response.json();
      const newResponse = data.message;

      const updatedMessages = [
        ...messages.slice(0, msgIndex),
        { role: 'assistant', content: newResponse }
      ];

      setMessages(updatedMessages);
      setToast('✅ Réponse régénérée !');
      setTimeout(() => setToast(null), 2000);

      if (currentConvId) {
        await updateDoc(doc(db, 'conversations', currentConvId), {
          messages: updatedMessages,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setToast('❌ Erreur lors de la régénération');
      setTimeout(() => setToast(null), 2000);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setToast('Réponse copiée !');
    setTimeout(() => { setCopiedId(null); setToast(null); }, 2000);
  };

  const rateMessage = (msgIdx, rating) => {
    setRatings({ ...ratings, [msgIdx]: rating });
  };

  const exportConversationTXT = () => {
    if (!messages || messages.length === 0) return;
    let content = `Assistant Immobilier - Conversation\nDate: ${new Date().toLocaleString('fr-FR')}\n\n${'='.repeat(50)}\n\n`;
    messages.forEach((msg) => {
      const role = msg.role === 'user' ? '👤 Vous' : '🤖 Assistant';
      content += `${role}:\n${msg.content}\n\n${'-'.repeat(50)}\n\n`;
    });
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `conversation_${new Date().getTime()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setToast('📄 Conversation exportée!');
    setTimeout(() => setToast(null), 2000);
  };

  const exportConversationPDF = () => {
    if (!messages || messages.length === 0) return;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;margin:20px;line-height:1.6}h1{color:#1e3c72;text-align:center;margin-bottom:10px}.date{text-align:center;color:#999;margin-bottom:30px;font-size:14px}.message{margin-bottom:20px;padding:15px;border-radius:8px}.user-msg{background:#e8f0ff;border-left:4px solid #1e3c72}.assistant-msg{background:#f5f5f5;border-left:4px solid #2a5298}.role{font-weight:bold;color:#1e3c72;margin-bottom:8px}.content{color:#333}hr{margin:30px 0;border:none;border-top:1px solid #ddd}</style></head><body><h1>🏢 Assistant Immobilier</h1><div class="date">${new Date().toLocaleString('fr-FR')}</div>${messages.map((msg)=>`<div class="message ${msg.role==='user'?'user-msg':'assistant-msg'}"><div class="role">${msg.role==='user'?'👤 Vous':'🤖 Assistant'}</div><div class="content">${msg.content.replace(/\n/g,'<br>')}</div></div>`).join('')}<hr><p style="text-align:center;color:#999;font-size:12px;">Généré par Assistant Immobilier</p></body></html>`;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    setToast('📄 Impression PDF en cours...');
    setTimeout(() => setToast(null), 2000);
  };

  const generateSynthesis = async () => {
    if (messages.length < 2) {
      setToast('⚠️ Besoin d\'au moins une question et une réponse');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setSynthesisLoading(true);
    setToast('📋 Génération de la synthèse...');
    try {
      const conversationText = messages.map(msg => `${msg.role === 'user' ? 'Question' : 'Réponse'}: ${msg.content}`).join('\n\n');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Fais une synthèse CONCISE (5-8 lignes) de cette conversation. Suis ce format:\n\n**Problème identifié:** [description]\n**Solutions proposées:** [2-3 solutions clés]\n**Actions recommandées:** [prochaines étapes]\n**Urgence:** [Oui/Non]\n\nConversation:\n${conversationText}`
          }]
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Erreur API');
      setSynthesis(data.message);
      setShowSynthesisModal(true);
      setToast('✅ Synthèse générée!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      console.error('Error:', error);
      setToast('❌ Erreur lors de la génération');
      setTimeout(() => setToast(null), 2000);
    } finally {
      setSynthesisLoading(false);
    }
  };

  const generateProblemScoring = async (problemDescription) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Analyse ce problème immobilier et réponds UNIQUEMENT avec du JSON valide:\n\nProblème: ${problemDescription}\n\nRéponds avec ce format JSON:\n{"urgency":75,"urgencyLabel":"Urgent","urgencyColor":"#ef4444","estimatedCost":"800-2000€","costLevel":"Modéré","diyDifficulty":5,"diyLabel":"Impossible seul","resolutionTime":"2-3 jours","mainRisks":["Dégâts d'eau","Moisissure"],"priority":"Haute"}\n\nRETOURNE UNIQUEMENT LE JSON!`
          }]
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Erreur API');
      try {
        const scoreData = JSON.parse(data.message);
        setProblemScoring(scoreData);
      } catch (e) {
        console.error('Error parsing scoring:', e);
        setProblemScoring({});
      }
    } catch (error) {
      console.error('Error generating scoring:', error);
      setProblemScoring({});
    }
  };

  const compressImage = (base64String, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64String;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxWidth = 1920;
        const maxHeight = 1920;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        const base64Compressed = compressed.split(',')[1];
        resolve(base64Compressed);
      };
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      setToast('❌ Uniquement PNG ou JPG acceptés');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setToast('❌ Fichier trop volumineux (max 8MB)');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    try {
      setToast('📎 Chargement de l\'image...');
      const reader = new FileReader();
      reader.onload = async (event) => {
        let base64 = event.target?.result?.split(',')[1];
        setToast('🖼️ Compression en cours...');
        base64 = await compressImage(event.target?.result, 0.8);
        setToast('✅ Image compressée!');
        setUploadedFile({
          name: file.name,
          type: file.type,
          base64: base64,
          size: file.size
        });
        setUploadPreview(event.target?.result);
        setToast('✅ Image prête!');
        setTimeout(() => setToast(null), 2000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setToast('❌ Erreur lors du chargement');
      setTimeout(() => setToast(null), 2000);
    }
  };

  const sendFileWithMessage = async () => {
    if (!uploadedFile || !user) {
      setToast('❌ Aucun fichier chargé');
      return;
    }
    let messageContent = input.trim() || 'Analyse ce fichier et dis-moi ce que tu vois';
    try {
      setChatLoading(true);
      const userMessage = { role: 'user', content: `📎 ${uploadedFile.name}: ${messageContent}` };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');
      const fileToSend = { ...uploadedFile };
      setUploadedFile(null);
      setUploadPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{
            role: 'user',
            content: messageContent
          }],
          fileData: fileToSend.base64,
          fileType: fileToSend.type,
          fileName: fileToSend.name
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur API');
      const assistantMessage = data.message;
      let displayedText = '';
      for (let i = 0; i < assistantMessage.length; i++) {
        displayedText += assistantMessage[i];
        setMessages([...newMessages, { role: 'assistant', content: displayedText }]);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      const finalMessages = [...newMessages, { role: 'assistant', content: assistantMessage }];
      setMessages(finalMessages);
      generateSuggestions(messageContent);
      generateProblemScoring(messageContent);
      if (currentConvId) {
        await updateDoc(doc(db, 'conversations', currentConvId), {
          messages: finalMessages,
          updatedAt: serverTimestamp()
        });
      } else {
        const docRef = await addDoc(collection(db, 'conversations'), {
          userId: user.uid,
          title: 'Analyse: ' + fileToSend.name,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isFavorite: false,
          isPinned: false,
          tag: null,
          messages: finalMessages
        });
        setCurrentConvId(docRef.id);
      }
      loadConversations(user.uid);
    } catch (error) {
      console.error('Error:', error);
      setToast(`❌ Erreur: ${error.message}`);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      setToast('Reconnaissance vocale non disponible');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  const parseMarkdown = (text) => {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700">$1</strong>')
      .replace(/^### (.*?)$/gm, '<div style="margin-top:12px;margin-bottom:8px;font-weight:600;font-size:16px">$1</div>')
      .replace(/^## (.*?)$/gm, '<div style="margin-top:12px;margin-bottom:8px;font-weight:600;font-size:18px">$1</div>')
      .replace(/^- (.*?)$/gm, '<div style="margin-left:16px">• $1</div>')
      .replace(/\n/g, '<br/>');
    return html;
  };

  const generateSuggestions = (lastUserMessage) => {
    const keywords = lastUserMessage.toLowerCase();
    const sugg = [];
    if (keywords.includes('fuite') || keywords.includes('eau')) {
      sugg.push('Comment arrêter la fuite ?', 'Qui dois-je appeler ?', 'Est-ce urgent ?');
    } else if (keywords.includes('chauffage')) {
      sugg.push('Comment augmenter la température ?', 'Quand appeler un pro ?', 'Consommation normale ?');
    } else if (keywords.includes('électricité')) {
      sugg.push('C\'est dangereux ?', 'Qui contacter ?', 'Comment le réparer ?');
    } else {
      sugg.push('Comment résoudre ce problème ?', 'Qui contacter pour ça ?', 'Comment prévenir ça ?');
    }
    setSuggestions(sugg);
  };

  const generateSmartTitle = async (firstMessage) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `En 3-5 mots, résume ce sujet: "${firstMessage}". Réponds UNIQUEMENT avec le résumé, rien d'autre.` }]
        }),
      });
      const data = await response.json();
      if (data.message) return data.message.trim().substring(0, 50);
    } catch (error) {
      console.error('Error generating title:', error);
    }
    return firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
  };

  const generateShareLink = () => {
    const convData = btoa(unescape(encodeURIComponent(JSON.stringify({ title: conversations.find(c => c.id === currentConvId)?.title, messages }))));
    const link = `${window.location.origin}?shared=${convData}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedId('share');
    setToast('Lien copié !');
    setTimeout(() => { setCopiedId(null); setToast(null); }, 2000);
  };

  const addReaction = (msgIdx, emoji) => {
    setReactions({ ...reactions, [msgIdx]: emoji });
    setShowReactionPicker(null);
    setToast(`Réaction ajoutée ${emoji}`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || !user) return;
    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const newSearchHistory = [...searchHistory, { text: input, date: new Date(), tag: detectTag(input) }];
    setSearchHistory(newSearchHistory);
    localStorage.setItem(`search_history_${user.uid}`, JSON.stringify(newSearchHistory));
    const userInput = input;
    setInput('');
    setChatLoading(true);
    try {
      let convId = currentConvId;
      if (!currentConvId) {
        const docRef = await addDoc(collection(db, 'conversations'), {
          userId: user.uid,
          title: 'Générer titre...',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isFavorite: false,
          isPinned: false,
          tag: null,
          messages: newMessages
        });
        convId = docRef.id;
        setCurrentConvId(docRef.id);
        const smartTitle = await generateSmartTitle(userInput);
        await updateDoc(doc(db, 'conversations', docRef.id), { title: smartTitle });
      }
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur API');
      const assistantMessage = data.message;
      let displayedText = '';
      for (let i = 0; i < assistantMessage.length; i++) {
        displayedText += assistantMessage[i];
        setMessages([...newMessages, { role: 'assistant', content: displayedText }]);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      const finalMessages = [...newMessages, { role: 'assistant', content: assistantMessage }];
      setMessages(finalMessages);
      generateSuggestions(userInput);
      generateProblemScoring(userInput);
      if (convId) {
        await updateDoc(doc(db, 'conversations', convId), {
          messages: finalMessages,
          updatedAt: serverTimestamp(),
          title: (await generateSmartTitle(userInput)) || userInput.substring(0, 50)
        });
      }
      loadConversations(user.uid);
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: `❌ Erreur: ${error.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorite = !showOnlyFavorites || conv.isFavorite;
    const matchesTag = !selectedTag || conv.tag === selectedTag;
    return matchesSearch && matchesFavorite && matchesTag;
  });

  const getConvDuration = (convId) => {
    if (!startTime) return '0m';
    const duration = Math.floor((Date.now() - startTime) / 60000);
    return duration > 0 ? `${duration}m` : '<1m';
  };

  const getFilteredHistory = () => {
    let filtered = searchHistory;
    if (historyFilter !== 'all' && historyFilter !== '7days') {
      filtered = filtered.filter(item => item.tag === historyFilter);
    }
    if (historyFilter === '7days') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => item.date > sevenDaysAgo);
    }
    return filtered.sort((a, b) => b.date - a.date);
  };

  const getTrendData = () => {
    const trends = {};
    searchHistory.forEach(item => {
      trends[item.tag] = (trends[item.tag] || 0) + 1;
    });
    return Object.entries(trends).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
  };

  const stats = {
    totalConversations: conversations.length,
    totalMessages: messages.length,
    favorites: conversations.filter(c => c.isFavorite).length,
    pinned: conversations.filter(c => c.isPinned).length,
    timeSpent: getConvDuration(currentConvId)
  };

  const bgGradient = darkMode ? 'linear-gradient(135deg, #0f172a 0%, #1a2847 100%)' : 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
  const containerBg = darkMode ? '#1e293b' : 'white';
  const textColor = darkMode ? '#e2e8f0' : '#1a1a1a';
  const borderColor = darkMode ? '#334155' : '#e5e7eb';
  const secondaryBg = darkMode ? '#334155' : '#f0f0f0';

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: bgGradient }}><div style={{ color: 'white' }}>Chargement...</div></div>;

  // SI PAS CONNECTÉ = LANDING PAGE
  if (!user) {
    return (
      <>
        <Head><title>Assistant Immobilier - Diagnostic IA</title></Head>
        <LandingPage />
        
        {/* AUTH MODAL */}
        {showAuth && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: containerBg, borderRadius: '20px', padding: '40px', maxWidth: '400px', width: '100%', boxShadow: '0 25px 80px rgba(0,0,0,0.35)' }}>
              <h1 style={{ fontSize: '28px', textAlign: 'center', color: textColor, marginBottom: '30px' }}>🏢 Se Connecter</h1>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setIsSignUp(false)} style={{ flex: 1, padding: '12px', background: !isSignUp ? bgGradient : secondaryBg, color: !isSignUp ? 'white' : textColor, border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Connexion</button>
                <button onClick={() => setIsSignUp(true)} style={{ flex: 1, padding: '12px', background: isSignUp ? bgGradient : secondaryBg, color: isSignUp ? 'white' : textColor, border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Inscription</button>
              </div>
              {authError && <div style={{ background: '#fee', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{authError}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '12px', border: `1.5px solid ${borderColor}`, borderRadius: '10px', background: containerBg, color: textColor }} />
                <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '12px', border: `1.5px solid ${borderColor}`, borderRadius: '10px', background: containerBg, color: textColor }} />
                <button onClick={isSignUp ? handleSignUp : handleSignIn} disabled={authLoading} style={{ padding: '12px', background: bgGradient, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', opacity: authLoading ? 0.6 : 1 }}>{authLoading ? '...' : (isSignUp ? 'S\'inscrire' : 'Se connecter')}</button>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '20px', color: '#999' }}>ou</div>
              <button onClick={handleGuestLogin} disabled={authLoading} style={{ width: '100%', padding: '12px', background: secondaryBg, color: '#2a5298', border: '2px solid #2a5298', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>👤 Continuer en tant qu'invité</button>
            </div>
          </div>
        )}
      </>
    );
  }

  // SI CONNECTÉ = TON APP
  return (
    <>
      <Head><title>Assistant Immobilier</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${bgGradient}; min-height: 100vh; padding: 20px; }
        .wrapper { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 280px 1fr; gap: 20px; height: 90vh; }
        .sidebar { background: ${containerBg}; border-radius: 20px; box-shadow: 0 25px 80px rgba(0,0,0,0.35); display: flex; flex-direction: column; overflow: hidden; }
        .sidebar-header { background: ${bgGradient}; color: white; padding: 20px; text-align: center; }
        .sidebar-header h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
        .stats-box { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
        .stat-item { background: rgba(255,255,255,0.2); padding: 8px; border-radius: 6px; text-align: center; color: white; font-size: 12px; }
        .stat-number { font-weight: 700; font-size: 16px; }
        .btn { width: 100%; padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; margin-bottom: 8px; transition: all 0.2s; }
        .btn-new { background: ${containerBg}; color: #2a5298; }
        .btn-new:hover { background: ${secondaryBg}; }
        .search-input { width: 100%; padding: 8px; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.2); color: white; margin-bottom: 12px; font-size: 12px; }
        .search-input::placeholder { color: rgba(255,255,255,0.6); }
        .btn-logout { background: #fee; color: #c00; margin-bottom: 0; }
        .conversations-list { flex: 1; overflow-y: auto; padding: 12px; }
        .conv-item { padding: 12px; margin-bottom: 8px; background: ${secondaryBg}; border-radius: 10px; cursor: pointer; border-left: 3px solid transparent; display: flex; justify-content: space-between; align-items: center; color: ${textColor}; font-size: 13px; transition: all 0.2s; }
        .conv-item:hover { background: ${darkMode ? '#475569' : '#f0f2f5'}; }
        .conv-item.active { background: ${darkMode ? '#1e3a5f' : '#e8f0ff'}; border-left-color: #2a5298; font-weight: 600; }
        .conv-item.pinned { border-left-color: #fbbf24; }
        .conv-info { flex: 1; }
        .conv-title { margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-time { color: ${darkMode ? '#94a3b8' : '#999'}; font-size: 12px; }
        .fav-btn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; transition: all 0.2s; }
        .fav-btn:hover { transform: scale(1.2); }
        .container { background: ${containerBg}; border-radius: 20px; box-shadow: 0 25px 80px rgba(0,0,0,0.35); display: flex; flex-direction: column; overflow: hidden; }
        .header { background: ${bgGradient}; color: white; padding: 24px; display: flex; justify-content: space-between; align-items: center; }
        .header-content { flex: 1; }
        .header h1 { font-size: 26px; margin-bottom: 8px; font-weight: 600; }
        .header p { font-size: 14px; opacity: 0.92; }
        .status-indicator { display: inline-block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .theme-toggle { background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 16px; transition: all 0.2s; }
        .theme-toggle:hover { background: rgba(255,255,255,0.3); }
        .toolbar { padding: 12px 24px; display: flex; gap: 10px; justify-content: flex-end; border-bottom: 1px solid ${borderColor}; background: ${containerBg}; flex-wrap: wrap; }
        .toolbar-btn { padding: 8px 16px; background: ${secondaryBg}; color: #2a5298; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; }
        .toolbar-btn:hover { background: ${darkMode ? '#475569' : '#e8f0ff'}; }
        .templates-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px; }
        .template-btn { padding: 12px 8px; background: ${secondaryBg}; color: #2a5298; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
        .template-btn:hover { background: ${darkMode ? '#475569' : '#e8f0ff'}; }
        .messages-container { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 14px; background: ${darkMode ? '#0f172a' : 'linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%)'}; }
        .message { display: flex; gap: 10px; animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .message.user { justify-content: flex-end; }
        .msg-wrapper { display: flex; align-items: flex-start; gap: 8px; flex-direction: column; }
        .message.user .msg-wrapper { align-items: flex-end; }
        .msg-content { max-width: 70%; padding: 14px 18px; border-radius: 14px; line-height: 1.65; font-size: 14px; word-break: break-word; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .message.assistant .msg-content { background: ${secondaryBg}; color: ${textColor}; border-left: 3px solid #2a5298; white-space: pre-wrap; }
        .message.user .msg-content { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; white-space: pre-wrap; }
        .skeleton { background: linear-gradient(90deg, ${secondaryBg} 25%, ${darkMode ? '#475569' : '#f0f2f5'} 50%, ${secondaryBg} 75%); background-size: 200% 100%; animation: loading 1.5s infinite; }
        @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .msg-actions { display: flex; gap: 4px; opacity: 0; transition: all 0.2s; margin-top: 6px; flex-wrap: wrap; }
        .message.assistant:hover .msg-actions { opacity: 1; }
        .action-btn { background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px 8px; border-radius: 4px; color: #999; transition: all 0.2s; }
        .action-btn:hover { background: ${darkMode ? '#475569' : '#e5e7eb'}; color: #2a5298; }
        .action-btn.active { color: #fbbf24; }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .emoji-reaction { display: inline-block; padding: 4px 8px; background: ${secondaryBg}; border-radius: 4px; margin-right: 4px; cursor: pointer; font-size: 16px; }
        .reaction-picker { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
        .reaction-emoji { cursor: pointer; padding: 4px; font-size: 18px; transition: all 0.2s; }
        .reaction-emoji:hover { transform: scale(1.2); }
        .suggestions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .suggestion-btn { padding: 6px 12px; background: ${secondaryBg}; color: #2a5298; border: 1px solid ${borderColor}; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
        .suggestion-btn:hover { background: ${darkMode ? '#475569' : '#e8f0ff'}; }
        .input-section { padding: 18px 24px; border-top: 1px solid ${borderColor}; background: ${containerBg}; display: flex; gap: 12px; flex-direction: column; }
        .input-section input { flex: 1; padding: 12px 16px; border: 1.5px solid ${borderColor}; border-radius: 10px; background: ${containerBg}; color: ${textColor}; font-size: 14px; }
        .input-section input:focus { outline: none; border-color: #2a5298; box-shadow: 0 0 0 4px rgba(42,82,152,0.12); }
        .send-btn { padding: 12px 28px; background: ${bgGradient}; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(42,82,152,0.25); transition: all 0.3s; }
        .send-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(42,82,152,0.35); }
        .send-btn:disabled { opacity: 0.65; }
        .voice-btn { padding: 12px 16px; background: ${isListening ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : bgGradient}; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(42,82,152,0.25); transition: all 0.3s; animation: ${isListening ? 'voicePulse 1s infinite' : 'none'}; }
        @keyframes voicePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .voice-btn:hover { transform: ${isListening ? 'scale(1.05)' : 'translateY(-2px)'}; }
        .voice-interim { font-size: 12px; color: #2a5298; font-style: italic; margin-top: 4px; min-height: 16px; }
        .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: ${containerBg}; border-radius: 16px; padding: 30px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; color: ${textColor}; }
        .modal-close { float: right; background: none; border: none; font-size: 24px; cursor: pointer; color: ${textColor}; }
        .stat-box { margin: 16px 0; padding: 16px; background: ${secondaryBg}; border-radius: 8px; }
        .stat-label { font-weight: 600; color: #2a5298; font-size: 14px; }
        .stat-value { font-size: 28px; font-weight: 700; margin-top: 8px; }
        .history-item { padding: 12px; background: ${secondaryBg}; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #2a5298; }
        .history-text { font-weight: 600; margin-bottom: 4px; }
        .history-meta { font-size: 12px; color: ${darkMode ? '#94a3b8' : '#999'}; }
        .history-tag { display: inline-block; margin-top: 6px; padding: 3px 8px; background: #3b82f6; color: white; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .trend-item { padding: 12px; background: ${secondaryBg}; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .trend-label { font-weight: 600; }
        .trend-count { background: #3b82f6; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 700; }
        .filter-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .filter-tab { padding: 6px 12px; background: ${secondaryBg}; color: #2a5298; border: 1px solid ${borderColor}; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; }
        .filter-tab.active { background: #2a5298; color: white; }
        .toast { position: fixed; bottom: 30px; right: 30px; background: #22c55e; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 2000; animation: slideInUp 0.3s ease-out; }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .session-badge { position: fixed; top: 20px; right: 20px; background: #fbbf24; color: #000; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; z-index: 999; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${darkMode ? '#1e293b' : '#f1f1f1'}; }
        ::-webkit-scrollbar-thumb { background: ${darkMode ? '#64748b' : '#888'}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#94a3b8' : '#555'}; }
        @media (max-width: 768px) { .wrapper { grid-template-columns: 1fr; height: auto; } .sidebar { display: none; } .msg-content { max-width: 85%; } }
      `}</style>

      <div className="wrapper" style={{ gridTemplateColumns: readingMode ? '1fr' : '280px 1fr' }}>
        {!readingMode && (
          <div className="sidebar">
            <div className="sidebar-header">
              <h2>💬 Conversations</h2>
              <div className="stats-box">
                <div className="stat-item"><div className="stat-number">{stats.totalConversations}</div><div>Conversations</div></div>
                <div className="stat-item"><div className="stat-number">{stats.pinned}</div><div>Pinnées</div></div>
              </div>
              <button className="btn btn-new" onClick={startNewConversation}>+ Nouvelle</button>
              <button className="btn btn-new" onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} style={{ background: showOnlyFavorites ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' : secondaryBg, color: showOnlyFavorites ? 'white' : '#2a5298' }}>{showOnlyFavorites ? '⭐' : '☆'} Favoris</button>
              <input type="text" className="search-input" placeholder="🔍 Chercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <div style={{ padding: '8px 0', borderTop: `1px solid rgba(255,255,255,0.2)`, marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', fontWeight: '600' }}>Filtrer par tag</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <button onClick={() => setSelectedTag(null)} style={{ background: !selectedTag ? '#2a5298' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>Tous</button>
                  {TAGS.map(tag => (
                    <button key={tag.label} onClick={() => setSelectedTag(tag.label)} style={{ background: selectedTag === tag.label ? tag.color : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>{tag.icon}</button>
                  ))}
                </div>
              </div>
              <button className="btn btn-logout" onClick={handleLogout}>Déconnexion</button>
            </div>
            <div className="conversations-list">
              {filteredConversations.length === 0 ? (
                <div style={{ color: darkMode ? '#94a3b8' : '#999', textAlign: 'center', padding: '12px', fontSize: '13px' }}>{searchQuery ? 'Aucun résultat' : 'Aucune conversation'}</div>
              ) : (
                filteredConversations.map(conv => (
                  <div key={conv.id}>
                    <div className={`conv-item ${currentConvId === conv.id ? 'active' : ''} ${conv.isPinned ? 'pinned' : ''}`}>
                      <div className="conv-info" onClick={() => loadConversation(conv)}>
                        <div className="conv-title">{conv.title}</div>
                        <div className="conv-time">{conv.createdAt?.toDate?.()?.toLocaleString?.('fr-FR', { hour: '2-digit', minute: '2-digit' }) || ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {conv.tag && (
                          <span style={{ background: getTagColor(conv.tag), color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: '600' }}>
                            {TAGS.find(t => t.label === conv.tag)?.icon}
                          </span>
                        )}
                        <button className="fav-btn" onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }} title={conv.isPinned ? 'Dépingler' : 'Pingler'} style={{ color: conv.isPinned ? '#fbbf24' : 'inherit' }}>📌</button>
                        <button className="fav-btn" onClick={(e) => { e.stopPropagation(); setShowTagPicker(showTagPicker === conv.id ? null : conv.id); }} title="Assigner un tag">🏷️</button>
                        <button className="fav-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(conv.id); }} title="Favoris">{conv.isFavorite ? '⭐' : '☆'}</button>
                        <button className="fav-btn" onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} title="Supprimer" style={{ color: '#e74c3c' }}>🗑️</button>
                      </div>
                    </div>
                    {showTagPicker === conv.id && (
                      <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap', marginLeft: '12px', marginRight: '12px', marginBottom: '8px' }}>
                        {TAGS.map(tag => (
                          <button key={tag.label} onClick={(e) => { e.stopPropagation(); assignTag(conv.id, tag.label); }} style={{ background: tag.color, color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>{tag.icon} {tag.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="container">
          <div className="header">
            <div className="header-content">
              <h1>🏢 Assistant Immobilier</h1>
              <p><span className="status-indicator"></span>Expertise en gestion locative, maintenance et résolution de problèmes</p>
            </div>
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
          </div>
          <div className="toolbar">
            <button onClick={() => setReadingMode(!readingMode)} className="toolbar-btn" style={{ background: readingMode ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' : secondaryBg, color: readingMode ? 'white' : '#2a5298' }}>📖 Lecture</button>
            <button onClick={exportConversationTXT} className="toolbar-btn">📄 TXT</button>
            <button onClick={exportConversationPDF} className="toolbar-btn">📑 PDF</button>
            <button onClick={generateSynthesis} disabled={synthesisLoading} className="toolbar-btn">📋 Synthèse</button>
            <button onClick={() => setShowAnalytics(true)} className="toolbar-btn">📊 Stats</button>
            <button onClick={() => setShowHistoryModal(true)} className="toolbar-btn">📜 Historique</button>
            <button onClick={generateShareLink} className="toolbar-btn">🔗 Partager</button>
            <button onClick={() => setShowTemplates(!showTemplates)} className="toolbar-btn">⚡ Templates</button>
          </div>

          {showTemplates && (
            <div style={{ padding: '0 24px', borderBottom: `1px solid ${borderColor}`, background: secondaryBg }}>
              <div className="templates-grid">
                {TEMPLATES.map((t, i) => (
                  <button key={i} className="template-btn" onClick={() => { setInput(t.text); setShowTemplates(false); }}>{t.icon} {t.label}</button>
                ))}
              </div>
            </div>
          )}

          <div className="messages-container">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="msg-wrapper">
                  <div className="msg-content" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}></div>
                  {msg.role === 'assistant' && (
                    <div>
                      <div className="msg-actions">
                        <button className={`action-btn ${copiedId === idx ? 'active' : ''}`} onClick={() => copyToClipboard(msg.content, idx)} title="Copier">{copiedId === idx ? '✓' : '📋'}</button>
                        <button className={`action-btn ${ratings[idx] === 'up' ? 'active' : ''}`} onClick={() => rateMessage(idx, 'up')} title="Utile">👍</button>
                        <button className={`action-btn ${ratings[idx] === 'down' ? 'active' : ''}`} onClick={() => rateMessage(idx, 'down')} title="Pas utile">👎</button>
                        <button className="action-btn" onClick={() => setShowReactionPicker(showReactionPicker === idx ? null : idx)} title="Réagir">😊</button>
                        <button className="action-btn" onClick={() => regenerateResponse(idx)} disabled={regeneratingIndex === idx} title="Régénérer la réponse">
                          {regeneratingIndex === idx ? '⏳' : '🔄'}
                        </button>
                      </div>
                      {reactions[idx] && <div className="emoji-reaction">{reactions[idx]}</div>}
                      {showReactionPicker === idx && (
                        <div className="reaction-picker">
                          {['😍', '🎉', '🤔', '👍', '👎', '❤️', '🔥', '😂'].map(e => (
                            <button key={e} className="reaction-emoji" onClick={() => addReaction(idx, e)}>{e}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && <div className="message assistant"><div className="msg-content skeleton" style={{ height: '60px', borderRadius: '14px' }}></div></div>}
            
            {suggestions.length > 0 && !chatLoading && (
              <div style={{ padding: '12px', background: secondaryBg, borderRadius: '8px', marginTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#2a5298' }}>💡 Suggestions :</div>
                <div className="suggestions">
                  {suggestions.map((s, i) => (
                    <button key={i} className="suggestion-btn" onClick={() => { setInput(s); handleSendMessage({ preventDefault: () => {} }); }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(problemScoring).length > 0 && !chatLoading && (
              <div style={{ padding: '16px', background: secondaryBg, borderRadius: '8px', marginTop: '12px', border: `2px solid ${problemScoring.urgencyColor || '#3b82f6'}` }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: problemScoring.urgencyColor || '#2a5298', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚡ ANALYSE DU PROBLÈME
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div><div style={{ fontSize: '11px', color: '#999', fontWeight: '600', marginBottom: '4px' }}>🔴 URGENCE</div><div style={{ fontSize: '16px', fontWeight: '700', color: problemScoring.urgencyColor || '#ef4444', marginBottom: '4px' }}>{problemScoring.urgency}%</div><div style={{ fontSize: '12px', fontWeight: '600', color: problemScoring.urgencyColor }}>{problemScoring.urgencyLabel}</div></div>
                  <div><div style={{ fontSize: '11px', color: '#999', fontWeight: '600', marginBottom: '4px' }}>💰 COÛT ESTIMÉ</div><div style={{ fontSize: '14px', fontWeight: '700', color: '#2a5298', marginBottom: '4px' }}>{problemScoring.estimatedCost}</div><div style={{ fontSize: '12px', color: '#666' }}>{problemScoring.costLevel}</div></div>
                  <div><div style={{ fontSize: '11px', color: '#999', fontWeight: '600', marginBottom: '4px' }}>🔧 DIFFICULTÉ DIY</div><div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>{[...Array(5)].map((_, i) => (<span key={i} style={{ fontSize: '14px', color: i < problemScoring.diyDifficulty ? '#fbbf24' : '#ddd' }}>⭐</span>))}</div><div style={{ fontSize: '12px', color: '#666' }}>{problemScoring.diyLabel}</div></div>
                  <div><div style={{ fontSize: '11px', color: '#999', fontWeight: '600', marginBottom: '4px' }}>⏰ RÉSOLUTION</div><div style={{ fontSize: '14px', fontWeight: '700', color: '#2a5298', marginBottom: '4px' }}>{problemScoring.resolutionTime}</div><div style={{ fontSize: '12px', color: '#666' }}>Estimation</div></div>
                </div>

                {problemScoring.mainRisks && problemScoring.mainRisks.length > 0 && (
                  <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#999', fontWeight: '600', marginBottom: '8px' }}>☠️ RISQUES PRINCIPAUX</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {problemScoring.mainRisks.map((risk, i) => (
                        <span key={i} style={{ background: '#fee', color: '#c00', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>⚠️ {risk}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '12px', padding: '8px 12px', background: problemScoring.urgency > 75 ? '#fee' : problemScoring.urgency > 50 ? '#fef3c7' : '#dbeafe', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: problemScoring.urgency > 75 ? '#c00' : problemScoring.urgency > 50 ? '#b45309' : '#1e40af' }}>
                  📊 Priorité: <strong>{problemScoring.priority}</strong>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="input-section">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="voice-btn" onClick={toggleVoiceRecognition} title={isListening ? 'Arrêter l\'écoute' : 'Parler'}>{isListening ? '🔴' : '🎤'}</button>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: uploadPreview ? '8px' : '0' }}>
                  <input 
                    type="text" 
                    placeholder={isListening ? "👂 Écoute en cours..." : uploadPreview ? "Décrivez votre fichier..." : "Posez votre question immobilière..."} 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyPress={(e) => { if (e.key === 'Enter' && !uploadPreview) handleSendMessage(e); }} 
                    disabled={chatLoading}
                    style={{ flex: 1 }}
                  />
                  <label style={{ cursor: 'pointer', padding: '12px 16px', background: '#3b82f6', color: 'white', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    📎
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/png,image/jpeg" 
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                {uploadPreview && (
                  <div style={{ padding: '8px', background: '#e8f0ff', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#2a5298' }}>🖼️ Image chargée</div>
                    <button onClick={() => { setUploadedFile(null); setUploadPreview(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c00', fontSize: '16px' }}>✕</button>
                  </div>
                )}
                {uploadPreview && typeof uploadPreview !== 'string' && (
                  <div style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', maxHeight: '150px' }}>
                    <img src={uploadPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                  </div>
                )}
                {voiceInterimText && <div className="voice-interim">🎙️ {voiceInterimText}</div>}
              </div>
            </div>
            <button onClick={uploadPreview ? sendFileWithMessage : handleSendMessage} className="send-btn" disabled={chatLoading}>{chatLoading ? '...' : (uploadPreview ? 'Analyser' : 'Envoyer')}</button>
          </div>
        </div>
      </div>

      {showAnalytics && (
        <div className="modal" onClick={() => setShowAnalytics(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAnalytics(false)}>✕</button>
            <h2 style={{ marginBottom: '20px' }}>📊 Analytics</h2>
            <div className="stat-box"><div className="stat-label">Total Conversations</div><div className="stat-value">{stats.totalConversations}</div></div>
            <div className="stat-box"><div className="stat-label">Conversations Pinnées</div><div className="stat-value">{stats.pinned}</div></div>
            <div className="stat-box"><div className="stat-label">Conversations Favoritées</div><div className="stat-value">{stats.favorites}</div></div>
            <div className="stat-box"><div className="stat-label">Messages Actuels</div><div className="stat-value">{stats.totalMessages}</div></div>
            <div className="stat-box"><div className="stat-label">Temps passé</div><div className="stat-value">{stats.timeSpent}</div></div>
            <div className="stat-box"><div className="stat-label">Historique Recherche</div><div style={{ marginTop: '8px', fontSize: '13px' }}>{searchHistory.length === 0 ? 'Aucune recherche' : searchHistory.slice(-5).reverse().map((s, i) => <div key={i}>• {s.text}</div>)}</div></div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="modal" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowHistoryModal(false)}>✕</button>
            <h2 style={{ marginBottom: '20px' }}>📜 Historique Avancé</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2a5298' }}>Tendances</h3>
              {getTrendData().length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999' }}>Aucune donnée</div>
              ) : (
                getTrendData().map((trend, idx) => {
                  const tag = TAGS.find(t => t.label === trend.tag);
                  return (
                    <div key={idx} className="trend-item">
                      <span className="trend-label">{tag?.icon} {trend.tag}</span>
                      <span className="trend-count">{trend.count}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2a5298' }}>Filtrer</h3>
              <div className="filter-tabs">
                <button className={`filter-tab ${historyFilter === 'all' ? 'active' : ''}`} onClick={() => setHistoryFilter('all')}>Tous</button>
                <button className={`filter-tab ${historyFilter === '7days' ? 'active' : ''}`} onClick={() => setHistoryFilter('7days')}>7 jours</button>
                {TAGS.map(tag => (
                  <button key={tag.label} className={`filter-tab ${historyFilter === tag.label ? 'active' : ''}`} onClick={() => setHistoryFilter(tag.label)}>{tag.icon} {tag.label}</button>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2a5298' }}>Timeline ({getFilteredHistory().length})</h3>
              {getFilteredHistory().length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999' }}>Aucune recherche</div>
              ) : (
                getFilteredHistory().map((item, idx) => {
                  const tag = TAGS.find(t => t.label === item.tag);
                  return (
                    <div key={idx} className="history-item">
                      <div className="history-text">💬 {item.text}</div>
                      <div className="history-meta">{item.date.toLocaleString('fr-FR')}</div>
                      <span className="history-tag">{tag?.icon} {item.tag}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="modal" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowShareModal(false)}>✕</button>
            <h2 style={{ marginBottom: '20px' }}>🔗 Partager la conversation</h2>
            <div style={{ padding: '16px', background: secondaryBg, borderRadius: '8px', marginBottom: '16px' }}>
              <input type="text" readOnly value={shareLink} style={{ width: '100%', padding: '12px', border: `1px solid ${borderColor}`, borderRadius: '6px', background: containerBg, color: textColor, fontSize: '12px', wordBreak: 'break-all' }} />
            </div>
            <button onClick={copyShareLink} style={{ width: '100%', padding: '12px', background: bgGradient, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{copiedId === 'share' ? '✓ Copié !' : '📋 Copier le lien'}</button>
          </div>
        </div>
      )}

      {showSynthesisModal && (
        <div className="modal" onClick={() => setShowSynthesisModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSynthesisModal(false)}>✕</button>
            <h2 style={{ marginBottom: '20px' }}>📋 Synthèse de la Conversation</h2>
            <div style={{ padding: '16px', background: secondaryBg, borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: parseMarkdown(synthesis) }}></div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => copyToClipboard(synthesis, 'synthesis')} style={{ flex: 1, padding: '12px', background: bgGradient, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{copiedId === 'synthesis' ? '✓ Copié !' : '📋 Copier'}</button>
              <button onClick={() => setShowSynthesisModal(false)} style={{ flex: 1, padding: '12px', background: secondaryBg, color: '#2a5298', border: `1px solid ${borderColor}`, borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
      {sessionTimeLeft < 60 && <div className="session-badge">⏰ Session expire dans {sessionTimeLeft}s</div>}
    </>
  );
}
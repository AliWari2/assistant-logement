import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

// Démo conversations pré-chargées
const DEMO_CONVERSATIONS = [
  {
    id: 'demo-1',
    title: '💧 Fuite d\'eau - Évier cuisine',
    tag: 'Plomberie',
    isFavorite: true,
    isPinned: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    messages: [
      { role: 'user', content: 'Bonjour, j\'ai une fuite d\'eau sous mon évier de cuisine. L\'eau goutte doucement depuis ce matin. Que faire?' },
      { role: 'assistant', content: '**Urgence: HAUTE** ⚠️\n\n## Actions immédiales:\n1. **Fermer le robinet d\'eau** sous le meuble (look pour petite valve en bas)\n2. **Placer un seau** pour capturer l\'eau\n3. **Vérifier les tuyauteries** - chercher d\'où vient exactement la fuite\n\n## Causes probables:\n- **Joint usé** (40% des cas) → 50-150€ à remplacer\n- **Tuyau fissuré** → 200-400€\n- **Robinet défectueux** → 150-600€\n\n## Solutions:\n✅ **DIY possible:** Si c\'est juste un joint, tu peux le faire toi-même\n✅ **Plombier recommandé:** Pour diagnostic et remplacement\n\n**Coût estimé:** 100-400€\n**Temps:** 1-2 jours max' },
      { role: 'user', content: 'C\'est urgent? Je peux attendre le week-end pour appeler un plombier?' },
      { role: 'assistant', content: '**Oui, tu peux attendre** mais avec conditions:\n\n⚠️ **Risques si tu attends:**\n- Dégâts d\'eau au plancher\n- Moisissure (48-72h)\n- Augmentation facture eau\n\n**Meilleure stratégie:**\n1. Fermer l\'eau maintenant (URGENT!)\n2. Placer seau/bac\n3. Appeler plombier lundi matin\n4. En weekend = si eau qui s\'accumule dangereusement\n\n**Plombier d\'urgence coûte +50-100€ mais évite dégâts.**\n\nRecommandation: **Ferme l\'eau dès maintenant** et appelle lundi! 🔧' }
    ]
  },
  {
    id: 'demo-2',
    title: '🌡️ Chauffage - Radiateur froid',
    tag: 'Chauffage',
    isFavorite: false,
    isPinned: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    messages: [
      { role: 'user', content: 'Mon radiateur de chambre est complètement froid. Les autres radiateurs fonctionnent. Comment diagnostiquer?' },
      { role: 'assistant', content: '## Diagnostic rapide (5 min):\n\n**Étape 1: Purger le radiateur**\n1. Cherche la vis de purge (petit bouchon en haut)\n2. Ouvre avec clé hexagonale\n3. Entends-tu un sifflement?\n\n✅ **Oui** = Air dans le système → Purge 20 sec et ferme\n❌ **Non** = Problème de circulation\n\n**Étape 2: Vérifier la température**\n- Entrée (bas gauche) = doit être chaude\n- Sortie (bas droite) = doit être moins chaude\n- **Les 2 froides?** = Valve thermostatique bloquée\n\n**Solutions possibles:**\n1. **Purge réussie** (70%) = Résolu! Gratuit\n2. **Thermostat bloqué** = 50-150€ à remplacer\n3. **Problème tuyauterie** = Pro nécessaire' }
    ]
  },
  {
    id: 'demo-3',
    title: '⚡ Électricité - Prise ne marche pas',
    tag: 'Électricité',
    isFavorite: false,
    isPinned: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    messages: [
      { role: 'user', content: 'Une prise dans mon salon ne donne plus le courant. Les autres prises de la pièce marchent. C\'est grave?' },
      { role: 'assistant', content: '**Pas grave généralement!** 60% des cas = solution simple.\n\n## Vérification (30 secondes):\n\n**Test 1: Disjoncteur**\n- Va à ton tableau électrique\n- Cherche le disjoncteur de la pièce\n- Est-il basculé en position OFF?\n\nSi oui → Bascule en ON → Prise réparée! ✅\n\n**Test 2: Prises différentielles (DDR)**\nSi le disjoncteur est ON:\n- Cherche le bouton RESET rouge/noir sur le DDR\n- Appuie dessus\n- Prise redémarre? → Surcharge électrique\n\n**Solutions:**\n✅ **Prise branchée ailleurs** = Gratuit\n✅ **DDR reset** = Gratuit\n❌ **Disjoncteur répété OFF** = Appelle électricien (200-400€)\n❌ **Prise carbonisée** = Remplacement (100-150€)\n\n**Risque incendie?** Oui si c\'est carbonisé = appelle pro ASAP' }
    ]
  },
  {
    id: 'demo-4',
    title: '🪟 Isolation - Courants d\'air fenêtre',
    tag: 'Isolation',
    isFavorite: false,
    isPinned: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    messages: [
      { role: 'user', content: 'Je sens des courants d\'air autour de mes fenêtres en hiver. Comment tester et réparer?' },
      { role: 'assistant', content: '## Diagnostic courant d\'air:\n\n**Test 1: Bougie/Fumée**\n- Allume une bougie près de l\'encadrement\n- La flamme bouge? → Fuite d\'air confirmée\n- Où? → Marque les spots\n\n**Causes et solutions:**\n\n1. **Joint usé** (80% des cas)\n   - Coût: 50-200€ (DIY possible)\n   - Solution: Remplacer joint en mousse\n\n2. **Fenêtre mal ajustée**\n   - Coût: 50-150€\n   - Solution: Réajustement serrures\n\n3. **Vitrage dégradé**\n   - Coût: 500-2000€\n   - Solution: Changer le vitrage\n\n**Gains énergétiques:**\n- Réduire courant d\'air = -15% facture chauffage\n- Amortissement en 2-3 ans\n\n**Action rapide:** Bande adhésive tempor pour hiver (5€)' }
    ]
  },
  {
    id: 'demo-5',
    title: '🏠 Généraliste - Inspection préachat',
    tag: 'Généraliste',
    isFavorite: true,
    isPinned: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    messages: [
      { role: 'user', content: 'Je dois acheter un appart. Quels sont les défauts majeurs que je dois vérifier avant de signer?' },
      { role: 'assistant', content: '## CHECK-LIST ACHAT IMMOBILIER 🏡\n\n**PRIORITÉ 1 - Structurel (Critique):**\n- ✅ Fissures murs (> 2mm = pro requis)\n- ✅ Humidité/Moisissure (coûteux à réparer)\n- ✅ Toit (inspections >= 15 ans)\n- ✅ Fondations (fissures = danger)\n\nCoût réparation: **5,000-50,000€**\n\n**PRIORITÉ 2 - Systèmes (Important):**\n- ✅ Électricité (normes 2010+?)\n- ✅ Plomberie (eau chaude OK?)\n- ✅ Chauffage (quelle énergie?)\n- ✅ Fenêtres (simple/double vitrage)\n\nCoût: **2,000-10,000€**\n\n**PRIORITÉ 3 - Confort (Souhaitable):**\n- ✅ Isolation (facture chauffage?)\n- ✅ Cuisine/Salle bain (âge?)\n- ✅ Peinture/Revêtements\n- ✅ Parking/Accès\n\n**PRO TIP:** Faire expertise avant offre = Essentiel! (300-500€)\n\n**Score d\'achat:** Risk élevé si + de 2 priorité 1 = Négocier 20%!' }
    ]
  }
];

const TEMPLATES = [
  // PLOMBERIE
  { 
    icon: '💧', 
    label: 'Fuite d\'eau', 
    text: 'Fuite d\'eau qui goutte sous l\'évier de la cuisine depuis ce matin. Que faire?' 
  },
  { 
    icon: '💧', 
    label: 'Eau chaude', 
    text: 'Eau chaude qui n\'arrive plus à la salle de bain, mais c\'est chaud ailleurs' 
  },
  
  // CHAUFFAGE
  { 
    icon: '🌡️', 
    label: 'Radiateur froid', 
    text: 'Mon radiateur de chambre est complètement froid, les autres chauffent' 
  },
  { 
    icon: '🌡️', 
    label: 'Chauffage faible', 
    text: 'Le chauffage monte pas en température malgré le thermostat au maximum' 
  },
  
  // ÉLECTRICITÉ
  { 
    icon: '⚡', 
    label: 'Prise cassée', 
    text: 'Prise du salon qui ne donne plus de courant, les autres marchent' 
  },
  { 
    icon: '⚡', 
    label: 'Disjoncteur', 
    text: 'Le disjoncteur saute régulièrement le soir, je dois le réenclencher' 
  },
  
  // ISOLATION
  { 
    icon: '🪟', 
    label: 'Courants d\'air', 
    text: 'Courants d\'air autour de mes fenêtres en hiver. Comment tester et réparer?' 
  },
  { 
    icon: '🪟', 
    label: 'Condensation', 
    text: 'Condensation constante sur les fenêtres quand il fait froid dehors' 
  },
  
  // BRUIT
  { 
    icon: '🔊', 
    label: 'Bruit voisins', 
    text: 'Bruit des voisins du dessus surtout la nuit. C\'est supportable?' 
  },
  { 
    icon: '🔊', 
    label: 'Isolation phonique', 
    text: 'Écho en cuisine et salon, les pièces sonnent creux. Normal?' 
  },
  
  // GÉNÉRALISTE
  { 
    icon: '🏠', 
    label: 'Inspection', 
    text: 'Quels défauts majeures dois-je vérifier avant d\'acheter cet appart?' 
  },
  { 
    icon: '🏠', 
    label: 'Maintenance', 
    text: 'Que dois-je vérifier régulièrement pour bien entretenir mon logement?' 
  },
];

const TAGS = [
  { icon: '💧', label: 'Plomberie', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  { icon: '🌡️', label: 'Chauffage', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  { icon: '⚡', label: 'Électricité', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  { icon: '🪟', label: 'Isolation', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  { icon: '🔊', label: 'Bruit', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  { icon: '🏠', label: 'Généraliste', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' }
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

// ===== LANDING PAGE MOBILE-FIRST RESPONSIVE =====
function LandingPage({ onStart }) {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [stat1, setStat1] = useState(0);
  const [stat2, setStat2] = useState(0);
  const [stat3, setStat3] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [diagCount, setDiagCount] = useState(0);
  const [satisfactionCount, setSatisfactionCount] = useState(0);

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
    
    setTimeout(() => {
      countUp(10, setStat1, 1500);
      countUp(28, setStat2, 1500);
      countUp(100, setStat3, 1500);
    }, 400);
    
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
        body { overflow-x: hidden; }
        html { scroll-behavior: smooth; }
      `}</style>

      <nav style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        background: 'rgba(255,255,255,0.98)', 
        backdropFilter: 'blur(20px)', 
        borderBottom: '1px solid rgba(30,60,114,0.08)', 
        padding: 'clamp(16px, 4vw, 24px)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        boxShadow: scrollY > 10 ? '0 2px 20px rgba(0,0,0,0.05)' : 'none', 
        transition: 'all 0.3s' 
      }}>
        <div style={{ 
          fontSize: 'clamp(16px, 4vw, 22px)', 
          fontWeight: '900', 
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
          backgroundClip: 'text', 
          WebkitBackgroundClip: 'text', 
          color: 'transparent', 
          letterSpacing: '-0.5px',
          textAlign: 'center'
        }}>
          🏢 Assistant Immobilier
        </div>
      </nav>

      <section style={{ 
        padding: 'clamp(60px, 15vw, 160px) clamp(20px, 5vw, 50px) clamp(60px, 15vw, 140px)', 
        textAlign: 'center', 
        background: 'linear-gradient(180deg, #ffffff 0%, #f5f8ff 50%, #f0f5ff 100%)', 
        position: 'relative', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '-10%', 
          right: '-5%', 
          width: 'clamp(300px, 50vw, 500px)', 
          height: 'clamp(300px, 50vw, 500px)', 
          background: 'radial-gradient(circle, rgba(30,60,114,0.08) 0%, transparent 70%)', 
          borderRadius: '50%', 
          filter: 'blur(60px)' 
        }}></div>
        <div style={{ 
          position: 'absolute', 
          bottom: '-15%', 
          left: '-8%', 
          width: 'clamp(400px, 60vw, 600px)', 
          height: 'clamp(400px, 60vw, 600px)', 
          background: 'radial-gradient(circle, rgba(42,82,152,0.07) 0%, transparent 70%)', 
          borderRadius: '50%', 
          filter: 'blur(60px)' 
        }}></div>
        
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ 
            fontSize: 'clamp(11px, 2vw, 13px)', 
            fontWeight: '700', 
            color: '#2a5298', 
            marginBottom: 'clamp(20px, 5vw, 30px)', 
            letterSpacing: '2px', 
            textTransform: 'uppercase', 
            display: 'inline-block', 
            padding: 'clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px)', 
            background: 'rgba(42,82,152,0.08)', 
            borderRadius: '50px', 
            backdropFilter: 'blur(10px)' 
          }}>
            ✨ Solution IA pour l'Immobilier
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(28px, 8vw, 84px)', 
            fontWeight: '900', 
            lineHeight: '1.05', 
            marginBottom: 'clamp(20px, 5vw, 32px)', 
            color: '#0f172a', 
            letterSpacing: '-1px' 
          }}>
            Votre Expert<br />en <span style={{ 
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
              backgroundClip: 'text', 
              WebkitBackgroundClip: 'text', 
              color: 'transparent' 
            }}>10 Secondes</span>
          </h1>
          
          <p style={{ 
            fontSize: 'clamp(14px, 3vw, 20px)', 
            color: '#4a5568', 
            marginBottom: 'clamp(30px, 8vw, 50px)', 
            lineHeight: '1.8', 
            maxWidth: '750px', 
            margin: '0 auto clamp(30px, 8vw, 50px)', 
            fontWeight: '500' 
          }}>
            Diagnostic immobilier instantané avec Claude. Analysez les photos, identifiez les problèmes et recevez des solutions en temps réel.
          </p>

          <button onClick={onStart} style={{ 
            padding: 'clamp(12px, 3vw, 16px) clamp(32px, 8vw, 48px)', 
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            fontSize: 'clamp(14px, 3.5vw, 16px)', 
            fontWeight: '700', 
            cursor: 'pointer', 
            marginBottom: 'clamp(40px, 8vw, 60px)',
            boxShadow: '0 10px 40px rgba(30,60,114,0.3)', 
            transition: 'all 0.3s',
            position: 'relative',
            overflow: 'hidden'
          }} 
          onMouseOver={(e) => { if (typeof window !== 'undefined' && window.innerWidth > 768) e.target.style.transform = 'scale(1.05)'; }} 
          onMouseOut={(e) => { if (typeof window !== 'undefined' && window.innerWidth > 768) e.target.style.transform = 'scale(1)'; }}>
            🚀 Commencer le Diagnostic
          </button>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(100px, 25vw, 200px), 1fr))', 
            gap: 'clamp(20px, 5vw, 40px)', 
            marginTop: 'clamp(40px, 10vw, 80px)', 
            maxWidth: '850px', 
            margin: 'clamp(40px, 10vw, 80px) auto 0' 
          }}>
            <div style={{ 
              padding: 'clamp(20px, 4vw, 30px)', 
              borderRadius: '16px', 
              background: 'rgba(255,255,255,0.6)', 
              backdropFilter: 'blur(10px)', 
              border: '1px solid rgba(30,60,114,0.1)' 
            }}>
              <div style={{ 
                fontSize: 'clamp(32px, 8vw, 52px)', 
                fontWeight: '900', 
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
                backgroundClip: 'text', 
                WebkitBackgroundClip: 'text', 
                color: 'transparent', 
                marginBottom: '12px' 
              }}>
                {stat1}<span style={{ fontSize: 'clamp(14px, 3vw, 20px)', marginLeft: '4px' }}>sec</span>
              </div>
              <div style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: '#666', fontWeight: '600', letterSpacing: '0.5px' }}>DIAGNOSTIC</div>
            </div>
            <div style={{ 
              padding: 'clamp(20px, 4vw, 30px)', 
              borderRadius: '16px', 
              background: 'rgba(255,255,255,0.6)', 
              backdropFilter: 'blur(10px)', 
              border: '1px solid rgba(30,60,114,0.1)' 
            }}>
              <div style={{ 
                fontSize: 'clamp(32px, 8vw, 52px)', 
                fontWeight: '900', 
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
                backgroundClip: 'text', 
                WebkitBackgroundClip: 'text', 
                color: 'transparent', 
                marginBottom: '12px' 
              }}>
                {stat2}+
              </div>
              <div style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: '#666', fontWeight: '600', letterSpacing: '0.5px' }}>FONCTIONNALITÉS</div>
            </div>
            <div style={{ 
              padding: 'clamp(20px, 4vw, 30px)', 
              borderRadius: '16px', 
              background: 'rgba(255,255,255,0.6)', 
              backdropFilter: 'blur(10px)', 
              border: '1px solid rgba(30,60,114,0.1)' 
            }}>
              <div style={{ 
                fontSize: 'clamp(32px, 8vw, 52px)', 
                fontWeight: '900', 
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
                backgroundClip: 'text', 
                WebkitBackgroundClip: 'text', 
                color: 'transparent', 
                marginBottom: '12px' 
              }}>
                {stat3}%
              </div>
              <div style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: '#666', fontWeight: '600', letterSpacing: '0.5px' }}>GRATUIT</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(60px, 15vw, 120px) clamp(20px, 5vw, 50px)', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 10vw, 80px)' }}>
            <h2 style={{ 
              fontSize: 'clamp(24px, 6vw, 60px)', 
              fontWeight: '900', 
              color: '#0f172a', 
              marginBottom: 'clamp(16px, 4vw, 24px)', 
              letterSpacing: '-0.5px' 
            }}>Pourquoi ça marche</h2>
            <p style={{ 
              fontSize: 'clamp(14px, 3vw, 18px)', 
              color: '#666', 
              maxWidth: '650px', 
              margin: '0 auto', 
              fontWeight: '500', 
              lineHeight: '1.7' 
            }}>
              Une solution complète pensée pour les propriétaires, syndics et gestionnaires immobiliers. Technologie Claude IA + interface intuitive.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 45vw, 340px), 1fr))', gap: 'clamp(20px, 4vw, 32px)' }}>
            {[
              { icon: '🎯', title: 'Diagnostic Précis', desc: 'IA Claude analyse images et contexte avec 99% de précision' },
              { icon: '⚡', title: 'Instantané', desc: 'Résultats en moins de 10 secondes, sans file d\'attente' },
              { icon: '💰', title: 'Coût Estimé', desc: 'Chiffrage automatique des travaux et solutions alternatives' },
              { icon: '🎓', title: 'Conseil Expert', desc: 'Solutions détaillées et recommandations prioritaires' },
              { icon: '📊', title: 'Historique Complet', desc: 'Conservez tous vos diagnostics et suivez l\'historique' },
              { icon: '🔒', title: 'Données Sécurisées', desc: 'Vos données protégées avec chiffrement de niveau entreprise' }
            ].map((feat, i) => (
              <div key={i} style={{ 
                padding: 'clamp(24px, 5vw, 44px)', 
                background: '#f9fafb', 
                border: '2px solid #f0f0f0', 
                borderRadius: '18px', 
                cursor: 'pointer', 
                transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)', 
                boxShadow: '0 5px 15px rgba(0,0,0,0.03)' 
              }}>
                <div style={{ fontSize: 'clamp(32px, 8vw, 48px)', marginBottom: '20px' }}>{feat.icon}</div>
                <h3 style={{ 
                  fontSize: 'clamp(16px, 4vw, 22px)', 
                  fontWeight: '800', 
                  color: '#0f172a', 
                  marginBottom: '14px', 
                  letterSpacing: '-0.3px' 
                }}>{feat.title}</h3>
                <p style={{ 
                  fontSize: 'clamp(13px, 3vw, 15px)', 
                  color: '#666', 
                  lineHeight: '1.7', 
                  fontWeight: '500' 
                }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ===== PROJECT STATS SECTION ===== */}
      <section style={{ padding: 'clamp(60px, 15vw, 120px) clamp(20px, 5vw, 50px)', background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(50px, 12vw, 80px)' }}>
            <h2 style={{ 
              fontSize: 'clamp(28px, 7vw, 56px)', 
              fontWeight: '900', 
              color: '#0f172a', 
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>📊 Project Metrics</h2>
            <p style={{ fontSize: 'clamp(14px, 3vw, 18px)', color: '#666', fontWeight: '500' }}>Production-ready application built with modern stack</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 20vw, 180px), 1fr))', 
            gap: 'clamp(16px, 3vw, 24px)',
            marginBottom: 'clamp(40px, 8vw, 60px)'
          }}>
            {[
              { icon: '⚙️', label: 'Lines of Code', value: '2,500+', color: '#1e3c72' },
              { icon: '✨', label: 'Features', value: '10+', color: '#2a5298' },
              { icon: '⚡', label: 'Page Load', value: '< 2 sec', color: '#10b981' },
              { icon: '🎯', label: 'Code Quality', value: '90/100', color: '#f59e0b' },
              { icon: '🔒', label: 'Security', value: '95/100', color: '#ef4444' },
              { icon: '💻', label: 'Tech Stack', value: '6 major', color: '#8b5cf6' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'white',
                padding: 'clamp(24px, 5vw, 32px)',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)',
                border: '2px solid transparent',
                cursor: 'pointer',
                animation: 'fadeInUp 0.6s ease-out forwards',
                animationDelay: `${i * 0.1}s`,
                opacity: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = `0 12px 24px ${stat.color}20`;
                e.currentTarget.style.borderColor = stat.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = 'transparent';
              }}>
                <div style={{ fontSize: 'clamp(28px, 6vw, 40px)', marginBottom: '12px' }}>{stat.icon}</div>
                <div style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', color: stat.color, marginBottom: '8px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: '#666', fontWeight: '600' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TECH STACK SECTION ===== */}
      <section style={{ 
        padding: 'clamp(60px, 15vw, 120px) clamp(20px, 5vw, 50px)', 
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(50px, 12vw, 80px)' }}>
            <h2 style={{ 
              fontSize: 'clamp(28px, 7vw, 56px)', 
              fontWeight: '900', 
              color: 'white', 
              marginBottom: '20px'
            }}>🛠️ Technology Stack</h2>
            <p style={{ fontSize: 'clamp(14px, 3vw, 18px)', color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>Modern tools and frameworks powering this application</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(130px, 18vw, 160px), 1fr))', 
            gap: 'clamp(16px, 3vw, 24px)'
          }}>
            {[
              { name: 'Next.js', icon: '⚛️', desc: 'Full-stack React', color: 'rgba(255,255,255,0.15)' },
              { name: 'Firebase', icon: '🔥', desc: 'Real-time DB', color: 'rgba(255,255,255,0.15)' },
              { name: 'Claude IA', icon: '🤖', desc: 'Anthropic API', color: 'rgba(255,255,255,0.15)' },
              { name: 'Vercel', icon: '▲', desc: 'Deployment', color: 'rgba(255,255,255,0.15)' },
              { name: 'TailwindCSS', icon: '🎨', desc: 'Styling', color: 'rgba(255,255,255,0.15)' },
              { name: 'React Hooks', icon: '⚙️', desc: 'State Mgmt', color: 'rgba(255,255,255,0.15)' }
            ].map((tech, i) => (
              <div key={i} style={{
                background: tech.color,
                border: '2px solid rgba(255,255,255,0.2)',
                padding: 'clamp(20px, 4vw, 28px)',
                borderRadius: '14px',
                textAlign: 'center',
                color: 'white',
                transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)',
                cursor: 'pointer',
                animation: 'fadeInUp 0.6s ease-out forwards',
                animationDelay: `${i * 0.1}s`,
                opacity: 0,
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.background = tech.color;
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ fontSize: 'clamp(28px, 6vw, 40px)', marginBottom: '12px' }}>{tech.icon}</div>
                <div style={{ fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: '700', marginBottom: '6px' }}>
                  {tech.name}
                </div>
                <div style={{ fontSize: 'clamp(11px, 2vw, 12px)', opacity: 0.85, fontWeight: '500' }}>
                  {tech.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ 
        padding: 'clamp(40px, 8vw, 60px) clamp(20px, 5vw, 50px)', 
        background: 'linear-gradient(180deg, #0f172a 0%, #1a2847 100%)', 
        color: 'white', 
        textAlign: 'center', 
        position: 'relative', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '-50%', 
          right: '-10%', 
          width: 'clamp(300px, 50vw, 400px)', 
          height: 'clamp(300px, 50vw, 400px)', 
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', 
          borderRadius: '50%' 
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ 
            fontSize: 'clamp(14px, 4vw, 18px)', 
            fontWeight: '600', 
            marginBottom: '12px', 
            letterSpacing: '0.5px' 
          }}>
            🏢 Assistant Immobilier
          </div>
          <div style={{ 
            fontSize: 'clamp(12px, 3vw, 14px)', 
            color: 'rgba(255,255,255,0.85)', 
            marginBottom: '30px', 
            fontWeight: '500' 
          }}>
            Diagnostic IA instantané pour l'immobilier
          </div>
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '30px 0' }}></div>
          
          <p style={{ 
            fontSize: 'clamp(11px, 2.5vw, 13px)', 
            color: 'rgba(255,255,255,0.7)', 
            marginTop: '30px', 
            fontWeight: '500', 
            letterSpacing: '0.3px' 
          }}>
            © 2025 Réalisé par <span style={{ fontWeight: '800', color: 'white' }}>Ali WARI</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

// ===== EXPORT CHOOSER MODAL =====
function ExportChooserModal({ shown, onDismiss, onChoose, darkMode }) {
  if (!shown) return null;

  const containerBg = darkMode ? '#111927' : 'white';
  const textColor = darkMode ? '#e2e8f0' : '#1a1a1a';
  const secondaryBg = darkMode ? '#1e293b' : '#f0f0f0';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1500,
      padding: '20px',
    }}>
      <div style={{
        background: containerBg, borderRadius: '20px',
        padding: '40px 30px', maxWidth: '450px', width: '100%',
        boxShadow: '0 25px 80px rgba(0,0,0,0.35)', color: textColor,
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', textAlign: 'center' }}>
          📥 Exporter la Conversation
        </h2>
        <p style={{ fontSize: '14px', color: darkMode ? '#94a3b8' : '#666', marginBottom: '30px', textAlign: 'center' }}>
          Choisissez le format d'export qui vous convient
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <RippleButton
            onClick={() => onChoose('pdf')}
            style={{
              padding: '24px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '16px',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '32px' }}>📄</span>
            <span>PDF</span>
            <span style={{ fontSize: '11px', fontWeight: '500', opacity: 0.9 }}>Rapport professionnel</span>
          </RippleButton>

          <RippleButton
            onClick={() => onChoose('txt')}
            style={{
              padding: '24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '16px',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '32px' }}>📝</span>
            <span>TXT</span>
            <span style={{ fontSize: '11px', fontWeight: '500', opacity: 0.9 }}>Format texte simple</span>
          </RippleButton>
        </div>

        <RippleButton
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '12px',
            background: secondaryBg,
            color: '#2a5298',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          Annuler
        </RippleButton>
      </div>
    </div>
  );
}

// ===== STATS CARD COMPONENT =====
function StatsCard({ icon, label, value, color, darkMode }) {
  const secondaryBg = darkMode ? '#334155' : '#f0f0f0';

  return (
    <div style={{
      padding: '20px',
      background: secondaryBg,
      borderRadius: '14px',
      border: `2px solid ${color}20`,
      boxShadow: `0 4px 12px ${color}15`,
      transition: 'all 0.3s',
      cursor: 'default',
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = `0 8px 20px ${color}25`;
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = `0 4px 12px ${color}15`;
    }}>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color, marginBottom: '8px' }}>{value}</div>
      <div style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#94a3b8' : '#666', letterSpacing: '0.5px' }}>
        {label}
      </div>
    </div>
  );
}

// ===== ONBOARDING TOOLTIP COMPONENT =====
function OnboardingTooltip({ shown, onDismiss }) {
  if (!shown) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 20px 60px rgba(30,60,114,0.4)',
      zIndex: 10000,
      maxWidth: '350px',
      textAlign: 'center',
      animation: 'slideUp 0.5s ease-out',
      backdropFilter: 'blur(10px)',
    }}>
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
      <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
        👋 Bienvenue! Cliquez sur <strong>"+ Nouvelle"</strong> pour créer votre première conversation.
      </p>
      <button 
        onClick={onDismiss}
        style={{
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          padding: '6px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          marginTop: '8px'
        }}
      >
        Compris! ✓
      </button>
    </div>
  );
}

// ===== EMPTY STATE COMPONENT =====
function EmptyState({ darkMode }) {
  const bgGradient = darkMode ? 'linear-gradient(135deg, #0f172a 0%, #1a2847 100%)' : 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
  const textColor = darkMode ? '#e2e8f0' : '#1a1a1a';
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '40px 20px',
      textAlign: 'center',
      background: darkMode ? 'linear-gradient(to bottom, #0f172a 0%, #1a2847 100%)' : 'linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%)',
    }}>
      <div style={{
        fontSize: '80px',
        marginBottom: '20px',
        animation: 'float 3s ease-in-out infinite',
      }}>
        🏠
      </div>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '700',
        color: textColor,
        marginBottom: '12px',
      }}>
        Bienvenue!
      </h2>
      <p style={{
        fontSize: '16px',
        color: darkMode ? '#94a3b8' : '#666',
        marginBottom: '30px',
        maxWidth: '400px',
        lineHeight: '1.6',
      }}>
        Créez votre première conversation de diagnostic immobilier. Décrivez votre problème ou uploadez une photo!
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        maxWidth: '350px',
        width: '100%',
        marginTop: '20px',
      }}>
        <div style={{
          padding: '16px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📸</div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#3b82f6' }}>Upload Photo</div>
        </div>
        <div style={{
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#ef4444' }}>Décrivez</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

// ===== RIPPLE EFFECT BUTTON HOOK =====
const RippleButton = ({ children, onClick, style, className, disabled, ...props }) => {
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    if (disabled) return;
    
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = {
      id: Date.now(),
      x,
      y,
      size: Math.max(rect.width, rect.height),
    };

    setRipples([...ripples, ripple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);

    onClick && onClick(e);
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
      disabled={disabled}
      {...props}
    >
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          style={{
            position: 'absolute',
            width: ripple.size * 2,
            height: ripple.size * 2,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.5)',
            left: ripple.x - ripple.size,
            top: ripple.y - ripple.size,
            animation: 'ripple 0.6s ease-out',
            pointerEvents: 'none',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ripple {
          to {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
      {children}
    </button>
  );
};

// ===== APP PRINCIPALE =====
export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authPage, setAuthPage] = useState(false);
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showExportChooser, setShowExportChooser] = useState(false);
  const [showStatsDashboard, setShowStatsDashboard] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [showInsightsCard, setShowInsightsCard] = useState(false);

  // Fonction pour analyser la réponse et extraire les données d'insights
  const analyzeForInsights = (content) => {
    try {
      // Extraction de la sévérité
      const severityPatterns = {
        critical: /(critique|urgence|immédiatement|danger|catastrophique|grave)/i,
        high: /(élevé|important|rapide|urgent|sérieux|majeur)/i,
        medium: /(moyen|modéré|normal|standard|habituel)/i,
        low: /(faible|mineur|léger|petit|minimal)/i
      };

      let severity = 'medium';
      let severityValue = 50;

      if (severityPatterns.critical.test(content)) {
        severity = 'critical';
        severityValue = 95;
      } else if (severityPatterns.high.test(content)) {
        severity = 'high';
        severityValue = 75;
      } else if (severityPatterns.low.test(content)) {
        severity = 'low';
        severityValue = 25;
      }

      // Extraction des coûts
      const costPatterns = /€(\d+(?:\s*-\s*\d+)?)|(\d+(?:\s*-\s*\d+)?)\s*€/gi;
      let minCost = null, maxCost = null;
      let costMatch;
      const costs = [];

      while ((costMatch = costPatterns.exec(content)) !== null) {
        const match = costMatch[0].replace('€', '').trim();
        const parts = match.split('-').map(p => parseInt(p.trim()));
        if (parts[0]) costs.push(parts[0]);
        if (parts[1]) costs.push(parts[1]);
      }

      if (costs.length > 0) {
        minCost = Math.min(...costs);
        maxCost = Math.max(...costs);
      }

      // Extraction des recommandations
      const recommendations = [];
      const recPatterns = [
        /contacter.*?(plombier|artisan|professionnel|électricien)/i,
        /vérifier.*?(tuyau|joint|connexion|prise)/i,
        /appeler.*?(urgent|rapidement|dès que possible)/i,
        /solution.*?diy|bricolage/i,
        /faire.*?soi-même|d\'abord/i
      ];

      if (recPatterns[0].test(content)) recommendations.push('Contacter un professionnel');
      if (recPatterns[1].test(content)) recommendations.push('Vérifier les connexions');
      if (recPatterns[2].test(content)) recommendations.push('Agir rapidement');
      if (recPatterns[3].test(content) || recPatterns[4].test(content)) recommendations.push('Essayer une solution DIY');

      if (recommendations.length === 0) {
        if (severity === 'critical') recommendations.push('Contacter un professionnel immédiatement');
        else if (severity === 'high') recommendations.push('Contacter un professionnel rapidement');
        else recommendations.push('Évaluer la situation et agir si nécessaire');
      }

      const urgency = severity === 'critical' ? '⚡ CRITIQUE' : severity === 'high' ? '⚠️ ÉLEVÉ' : '📅 MODÉRÉ';

      return {
        severity,
        severityValue,
        minCost: minCost || 300,
        maxCost: maxCost || 1500,
        urgency,
        recommendations,
        timestamp: new Date()
      };
    } catch (e) {
      return null;
    }
  };

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
        setAuthPage(false);
        loadConversations(currentUser.uid);
        loadHistoryFromConversations(currentUser.uid);
        setSessionTimeLeft(300);
        
        // Show onboarding si c'est la première visite
        const hasVisited = localStorage.getItem('hasVisited');
        if (!hasVisited) {
          setShowOnboarding(true);
          localStorage.setItem('hasVisited', 'true');
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    sessionTimer.current = setInterval(() => {
      setSessionTimeLeft(t => {
        if (t <= 1) { handleLogout(); return 300; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(sessionTimer.current);
  }, [user]);

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
      setToast('⚠️ Erreur: Impossible de charger les conversations. Vérifiez votre connexion.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const loadDemoConversations = () => {
    setDemoLoading(true);
    setToast('📚 Chargement démo...');
    setTimeout(() => {
      // Crée un utilisateur fictif pour la démo
      setUser({ 
        uid: 'demo-user-' + Date.now(), 
        email: 'demo@assistant-immobilier.com',
        isDemo: true 
      });
      setConversations(DEMO_CONVERSATIONS);
      setIsDemoMode(true);
      setCurrentConvId(DEMO_CONVERSATIONS[0].id);
      setMessages(DEMO_CONVERSATIONS[0].messages);
      setAuthPage(false);
      setDemoLoading(false);
      setToast('✅ Démo chargée! Explore les conversations.');
      setTimeout(() => setToast(null), 3000);
    }, 800);
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
    } catch (error) {
      setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthPage(false);
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

  const getTagBgColor = (tagLabel) => {
    const tag = TAGS.find(t => t.label === tagLabel);
    return tag ? tag.bgColor : 'rgba(107, 114, 128, 0.1)';
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

  const exportConversation = (format) => {
    setShowExportChooser(false);
    
    if (!messages || messages.length === 0) return;

    if (format === 'txt') {
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
      setToast('📄 Conversation TXT exportée!');
    } else if (format === 'pdf') {
      const currentConv = conversations.find(c => c.id === currentConvId);
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
            .header { 
              background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header h1 { font-size: 32px; margin-bottom: 10px; }
            .header p { font-size: 14px; opacity: 0.9; }
            .meta {
              background: white;
              padding: 20px 30px;
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #e5e7eb;
              font-size: 13px;
              color: #666;
            }
            .content {
              background: white;
              padding: 40px 30px;
              max-width: 900px;
              margin: 0 auto;
            }
            .message {
              margin-bottom: 30px;
              padding-bottom: 30px;
              border-bottom: 1px solid #e5e7eb;
            }
            .message:last-child { border-bottom: none; }
            .role {
              font-weight: 700;
              color: #1e3c72;
              margin-bottom: 12px;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .message-text {
              color: #333;
              line-height: 1.8;
              font-size: 13px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .footer {
              background: #f5f5f5;
              padding: 20px 30px;
              text-align: center;
              font-size: 11px;
              color: #999;
              border-top: 2px solid #e5e7eb;
            }
            @media print {
              body { margin: 0; }
              .header { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏢 Assistant Immobilier</h1>
            <p>Rapport de Diagnostic Immobilier</p>
          </div>
          
          <div class="meta">
            <span><strong>Titre:</strong> ${currentConv?.title || 'Sans titre'}</span>
            <span><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</span>
            <span><strong>Messages:</strong> ${messages.length}</span>
          </div>

          <div class="content">
            ${messages.map(msg => `
              <div class="message">
                <div class="role">${msg.role === 'user' ? '👤 UTILISATEUR' : '🤖 ASSISTANT'}</div>
                <div class="message-text">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>Ce rapport a été généré automatiquement par Assistant Immobilier.</p>
            <p>© 2025 - Tous droits réservés</p>
          </div>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
      setToast('📄 Impression PDF en cours...');
    }
    
    setTimeout(() => setToast(null), 3000);
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
      
      // Analyser la réponse pour les insights
      const insights = analyzeForInsights(assistantMessage);
      if (insights) {
        setInsightsData(insights);
        setShowInsightsCard(true);
      }
      
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

  // ===== DARK MODE REFINED COLORS =====
  const bgGradient = darkMode ? 'linear-gradient(135deg, #0f172a 0%, #1a2847 100%)' : 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
  const containerBg = darkMode ? '#111927' : 'white';
  const textColor = darkMode ? '#e2e8f0' : '#1a1a1a';
  const borderColor = darkMode ? '#1e293b' : '#e5e7eb';
  const secondaryBg = darkMode ? '#1e293b' : '#f0f0f0';
  const hoverBg = darkMode ? '#334155' : '#e8f0ff';
  const accentText = darkMode ? '#60a5fa' : '#2a5298';

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: bgGradient }}><div style={{ color: 'white' }}>Chargement...</div></div>;

  if (!user) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    return (
      <>
        <Head><title>Assistant Immobilier - Diagnostic IA</title><meta name="viewport" content="width=device-width, initial-scale=1.0" /></Head>
        
        {/* MOBILE: Version simplifiée */}
        {isMobile ? (
          <div style={{ minHeight: '100vh', background: bgGradient, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px', color: 'white' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '12px' }}>🏢 Assistant Immobilier</h1>
              <p style={{ fontSize: '16px', opacity: 0.9 }}>Diagnostic immobilier avec IA</p>
            </div>

            <div style={{ background: containerBg, borderRadius: '20px', padding: '30px', maxWidth: '100%', width: '100%', boxShadow: '0 25px 80px rgba(0,0,0,0.35)' }}>
              <h2 style={{ fontSize: '20px', textAlign: 'center', color: textColor, marginBottom: '24px', fontWeight: '600' }}>Se Connecter</h2>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <RippleButton 
                  onClick={() => setIsSignUp(false)} 
                  style={{ flex: 1, padding: '12px', background: !isSignUp ? bgGradient : secondaryBg, color: !isSignUp ? 'white' : textColor, border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                  Connexion
                </RippleButton>
                <RippleButton 
                  onClick={() => setIsSignUp(true)} 
                  style={{ flex: 1, padding: '12px', background: isSignUp ? bgGradient : secondaryBg, color: isSignUp ? 'white' : textColor, border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                  Inscription
                </RippleButton>
              </div>

              {authError && <div style={{ background: '#fee', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' }}>{authError}</div>}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '14px', border: `1.5px solid ${borderColor}`, borderRadius: '10px', background: containerBg, color: textColor, fontSize: '14px', minHeight: '48px' }} />
                <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '14px', border: `1.5px solid ${borderColor}`, borderRadius: '10px', background: containerBg, color: textColor, fontSize: '14px', minHeight: '48px' }} />
                <RippleButton 
                  onClick={isSignUp ? handleSignUp : handleSignIn} 
                  disabled={authLoading} 
                  style={{ padding: '14px', background: bgGradient, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', opacity: authLoading ? 0.6 : 1, fontSize: '14px', fontWeight: '600', minHeight: '48px' }}>
                  {authLoading ? '⏳ Chargement...' : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
                </RippleButton>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px', color: '#999', fontSize: '14px' }}>ou</div>
              
              <RippleButton 
                onClick={handleGuestLogin} 
                disabled={authLoading} 
                style={{ width: '100%', padding: '14px', background: secondaryBg, color: '#2a5298', border: '2px solid #2a5298', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', position: 'relative', overflow: 'hidden', minHeight: '48px' }}>
                👤 Continuer en tant qu'invité
              </RippleButton>
            </div>
          </div>
        ) : (
          /* DESKTOP: Version complète */
          <>
            <LandingPage onStart={() => setAuthPage(true)} />
            
            {authPage && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'clamp(20px, 5vw, 20px)' }}>
                <div style={{ background: containerBg, borderRadius: '20px', padding: 'clamp(24px, 5vw, 40px)', maxWidth: '400px', width: '100%', boxShadow: '0 25px 80px rgba(0,0,0,0.35)' }}>
                  <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', textAlign: 'center', color: textColor, marginBottom: '24px' }}>🏢 Se Connecter</h1>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <RippleButton 
                      onClick={() => setIsSignUp(false)} 
                      style={{ flex: 1, padding: '12px', background: !isSignUp ? bgGradient : secondaryBg, color: !isSignUp ? 'white' : textColor, border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: 'clamp(12px, 2vw, 14px)' }}>
                      Connexion
                    </RippleButton>
                    <RippleButton 
                      onClick={() => setIsSignUp(true)} 
                      style={{ flex: 1, padding: '12px', background: isSignUp ? bgGradient : secondaryBg, color: isSignUp ? 'white' : textColor, border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: 'clamp(12px, 2vw, 14px)' }}>
                      Inscription
                    </RippleButton>
                  </div>
                  {authError && <div style={{ background: '#fee', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{authError}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '12px', border: `1.5px solid ${borderColor}`, borderRadius: '10px', background: containerBg, color: textColor, fontSize: 'clamp(12px, 2vw, 14px)' }} />
                    <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '12px', border: `1.5px solid ${borderColor}`, borderRadius: '10px', background: containerBg, color: textColor, fontSize: 'clamp(12px, 2vw, 14px)' }} />
                    <RippleButton 
                      onClick={isSignUp ? handleSignUp : handleSignIn} 
                      disabled={authLoading} 
                      style={{ padding: '12px', background: bgGradient, color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', opacity: authLoading ? 0.6 : 1, fontSize: 'clamp(12px, 2vw, 14px)' }}>
                      {authLoading ? '...' : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
                    </RippleButton>
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: '20px', color: '#999', fontSize: 'clamp(12px, 2vw, 14px)' }}>ou</div>
                  <RippleButton 
                    onClick={handleGuestLogin} 
                    disabled={authLoading} 
                    style={{ width: '100%', padding: '12px', background: secondaryBg, color: '#2a5298', border: '2px solid #2a5298', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: 'clamp(12px, 2vw, 14px)', position: 'relative', overflow: 'hidden' }}>
                    👤 Continuer en tant qu'invité
                  </RippleButton>
                </div>
              </div>
            )}
          </>
        )}
      </>
    );
  }

  return (
    <>
      <Head><title>Assistant Immobilier</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${bgGradient}; min-height: 100vh; padding: clamp(12px, 3vw, 20px); }
        .wrapper { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 220px 1fr; gap: clamp(12px, 3vw, 20px); height: 92vh; }
        .sidebar { background: ${containerBg}; border-radius: 20px; box-shadow: 0 25px 80px rgba(0,0,0,0.35); display: flex; flex-direction: column; overflow: hidden; }
        .sidebar-header { background: ${bgGradient}; color: white; padding: clamp(16px, 3vw, 20px); text-align: center; }
        .sidebar-header h2 { font-size: clamp(14px, 2.5vw, 16px); font-weight: 600; margin-bottom: 12px; }
        .stats-box { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
        .stat-item { background: rgba(255,255,255,0.2); padding: 8px 10px; border-radius: 8px; text-align: center; color: white; font-size: 12px; border-left: 3px solid rgba(255,255,255,0.4); }
        .stat-number { font-weight: 700; font-size: 18px; }
        .stat-label { font-size: 11px; margin-top: 4px; opacity: 0.9; }
        .btn { width: 100%; padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: clamp(12px, 2vw, 13px); margin-bottom: 8px; transition: all 0.2s; position: relative; overflow: hidden; }
        .btn-new { background: ${containerBg}; color: #2a5298; }
        .btn-new:hover { background: ${secondaryBg}; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .search-input { width: 100%; padding: 8px; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.2); color: white; margin-bottom: 12px; font-size: 12px; }
        .search-input::placeholder { color: rgba(255,255,255,0.6); }
        .btn-logout { background: #fee; color: #c00; margin-bottom: 0; }
        .conversations-list { flex: 1; overflow-y: auto; padding: 12px; }
        .conv-item { padding: 12px; margin-bottom: 8px; background: ${secondaryBg}; border-radius: 10px; cursor: pointer; border-left: 3px solid transparent; display: flex; justify-content: space-between; align-items: center; color: ${textColor}; font-size: 13px; transition: all 0.2s; }
        .conv-item:hover { background: ${darkMode ? '#475569' : '#f0f2f5'}; transform: translateX(4px); }
        .conv-item.active { background: linear-gradient(135deg, #f0f5ff 0%, #f8faff 100%); border-left-color: #2a5298; font-weight: 600; box-shadow: 0 4px 12px rgba(42,82,152,0.15); }
        .conv-item.pinned { border-left-color: #fbbf24; }
        .conv-info { flex: 1; }
        .conv-title { margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-time { color: ${darkMode ? '#94a3b8' : '#999'}; font-size: 12px; }
        .conv-tag-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; margin-right: 6px; }
        .fav-btn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; transition: all 0.2s; }
        .fav-btn:hover { transform: scale(1.2); }
        .container { background: ${containerBg}; border-radius: 20px; box-shadow: 0 25px 80px rgba(0,0,0,0.35); display: flex; flex-direction: column; overflow: hidden; }
        .header { background: ${bgGradient}; color: white; padding: clamp(18px, 3.5vw, 28px); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .header-content { flex: 1; }
        .header h1 { font-size: clamp(20px, 4.5vw, 32px); margin-bottom: 8px; font-weight: 600; }
        .header p { font-size: clamp(13px, 2.2vw, 16px); opacity: 0.92; }
        .status-indicator { display: inline-block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .theme-toggle { background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 16px; transition: all 0.2s; }
        .theme-toggle:hover { background: rgba(255,255,255,0.3); }
        .toolbar { padding: clamp(14px, 2.5vw, 16px) clamp(18px, 4vw, 28px); display: flex; gap: 10px; justify-content: flex-end; border-bottom: 1px solid ${borderColor}; background: ${containerBg}; flex-wrap: wrap; overflow-y: auto; }
        .toolbar-btn { padding: 8px 12px; background: ${secondaryBg}; color: #2a5298; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer; font-size: clamp(11px, 2vw, 13px); font-weight: 600; transition: all 0.2s; white-space: nowrap; position: relative; overflow: hidden; }
        .toolbar-btn:hover { background: ${darkMode ? '#475569' : '#e8f0ff'}; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(42,82,152,0.2); }
        .templates-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px; padding: 12px; }
        .template-btn { padding: 12px 8px; background: ${secondaryBg}; color: #2a5298; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer; font-size: clamp(11px, 2vw, 12px); transition: all 0.2s; position: relative; overflow: hidden; }
        .template-btn:hover { background: ${darkMode ? '#475569' : '#e8f0ff'}; }
        .messages-container { flex: 1; overflow-y: auto; padding: clamp(16px, 3vw, 32px); display: flex; flex-direction: column; gap: 18px; background: ${darkMode ? '#0f172a' : 'linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%)'}; }
        .message { display: flex; gap: 10px; animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .message.user { justify-content: flex-end; }
        .msg-wrapper { display: flex; align-items: flex-start; gap: 8px; flex-direction: column; }
        .message.user .msg-wrapper { align-items: flex-end; }
        .msg-avatar { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; }
        .message.user .msg-avatar { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); }
        .message.assistant .msg-avatar { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .msg-content { max-width: 90%; padding: 18px 22px; border-radius: 14px; line-height: 1.75; font-size: clamp(13px, 2.2vw, 15px); word-break: break-word; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        @media (min-width: 768px) { .msg-content { max-width: 75%; } }
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
        .suggestion-btn { padding: 6px 12px; background: ${secondaryBg}; color: #2a5298; border: 1px solid ${borderColor}; border-radius: 6px; cursor: pointer; font-size: clamp(11px, 2vw, 12px); transition: all 0.2s; white-space: nowrap; position: relative; overflow: hidden; }
        .suggestion-btn:hover { background: ${darkMode ? '#475569' : '#e8f0ff'}; transform: translateY(-2px); }
        .input-section { padding: clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 32px); border-top: 1px solid ${borderColor}; background: ${containerBg}; display: flex; gap: 12px; flex-direction: column; }
        .input-section input { flex: 1; padding: 14px 18px; border: 1.5px solid ${borderColor}; border-radius: 10px; background: ${containerBg}; color: ${textColor}; font-size: clamp(13px, 2.2vw, 15px); min-height: 48px; }
        .input-section input:focus { outline: none; border-color: #2a5298; box-shadow: 0 0 0 4px rgba(42,82,152,0.12); }
        .send-btn { padding: 14px 32px; background: ${bgGradient}; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: clamp(13px, 2.2vw, 15px); box-shadow: 0 4px 12px rgba(42,82,152,0.25); transition: all 0.3s; position: relative; overflow: hidden; min-height: 48px; }
        .send-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(42,82,152,0.35); }
        .send-btn:disabled { opacity: 0.65; }
        .voice-btn { padding: 12px 16px; background: ${isListening ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : bgGradient}; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(42,82,152,0.25); transition: all 0.3s; animation: ${isListening ? 'voicePulse 1s infinite' : 'none'}; position: relative; overflow: hidden; }
        @keyframes voicePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .voice-btn:hover { transform: ${isListening ? 'scale(1.05)' : 'translateY(-2px)'}; }
        .voice-interim { font-size: 12px; color: #2a5298; font-style: italic; margin-top: 4px; min-height: 16px; }
        .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: ${containerBg}; border-radius: 16px; padding: clamp(24px, 5vw, 30px); max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto; color: ${textColor}; }
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
        .filter-tab { padding: 6px 12px; background: ${secondaryBg}; color: #2a5298; border: 1px solid ${borderColor}; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; position: relative; overflow: hidden; }
        .filter-tab.active { background: #2a5298; color: white; }
        .filter-tab:hover { transform: translateY(-2px); }
        .toast { position: fixed; bottom: 30px; right: 30px; background: #22c55e; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 2000; animation: slideInUp 0.3s ease-out; }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .session-badge { position: fixed; top: 20px; right: 20px; background: #fbbf24; color: #000; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; z-index: 999; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${darkMode ? '#1e293b' : '#f1f1f1'}; }
        ::-webkit-scrollbar-thumb { background: ${darkMode ? '#64748b' : '#888'}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#94a3b8' : '#555'}; }
        @media (max-width: 768px) { 
          .wrapper { grid-template-columns: 1fr; height: auto; min-height: 100vh; } 
          .sidebar { display: none; }
          .container { border-radius: 0; }
          .header { padding: clamp(16px, 4vw, 20px); border-radius: 0; }
          .header h1 { font-size: clamp(18px, 5vw, 24px); }
          .header p { font-size: clamp(12px, 2.5vw, 14px); }
          .messages-container { padding: clamp(16px, 2vw, 20px); gap: 16px; }
          .msg-content { max-width: 85% !important; padding: 14px 18px; font-size: 14px; }
          .message.user { margin-left: auto; }
          .msg-avatar { width: 36px; height: 36px; font-size: 18px; }
          .toolbar { padding: clamp(12px, 2vw, 16px); gap: 8px; justify-content: flex-start; overflow-x: auto; }
          .toolbar-btn { font-size: 12px; padding: 8px 12px; flex-shrink: 0; min-height: 40px; }
          .input-section { padding: clamp(14px, 2vw, 18px); gap: 10px; }
          .input-section input { padding: 12px 14px; font-size: 14px; min-height: 44px; }
          .send-btn { padding: 12px 20px; font-size: 14px; min-height: 44px; flex-shrink: 0; }
          .voice-btn { padding: 12px 14px; font-size: 14px; min-height: 44px; }
          .templates-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; padding: 8px; }
          .template-btn { padding: 10px 6px; font-size: 11px; }
          .conv-item { font-size: 12px; padding: 10px; }
          .stat-number { font-size: 16px; }
          .stat-label { font-size: 10px; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <OnboardingTooltip shown={showOnboarding} onDismiss={() => setShowOnboarding(false)} />
      <ExportChooserModal shown={showExportChooser} onDismiss={() => setShowExportChooser(false)} onChoose={exportConversation} darkMode={darkMode} />

      <div className="wrapper" style={{ gridTemplateColumns: readingMode ? '1fr' : '280px 1fr' }}>
        {!readingMode && (
          <div className="sidebar">
            <div className="sidebar-header">
              <h2>💬 Conversations</h2>
              <div className="stats-box">
                <div className="stat-item">
                  <div className="stat-number">{stats.totalConversations}</div>
                  <div className="stat-label">Total</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{stats.pinned}</div>
                  <div className="stat-label">📌 Pin</div>
                </div>
              </div>
              <RippleButton className="btn btn-new" onClick={startNewConversation} style={{
                width: '100%',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: 'clamp(12px, 2vw, 13px)',
                marginBottom: '8px',
                transition: 'all 0.2s',
                background: containerBg,
                color: '#2a5298',
                position: 'relative',
                overflow: 'hidden',
              }}>+ Nouvelle</RippleButton>
              <RippleButton className="btn btn-new" onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} style={{
                width: '100%',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: 'clamp(12px, 2vw, 13px)',
                marginBottom: '8px',
                transition: 'all 0.2s',
                background: showOnlyFavorites ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' : secondaryBg,
                color: showOnlyFavorites ? 'white' : '#2a5298',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {showOnlyFavorites ? '⭐' : '☆'} Favoris
              </RippleButton>
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
              <RippleButton className="btn btn-logout" onClick={handleLogout} style={{
                width: '100%',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: 'clamp(12px, 2vw, 13px)',
                marginBottom: '0',
                transition: 'all 0.2s',
                background: '#fee',
                color: '#c00',
                position: 'relative',
                overflow: 'hidden',
              }}>
                Déconnexion
              </RippleButton>
            </div>
            <div className="conversations-list">
              {filteredConversations.length === 0 ? (
                <div style={{ color: darkMode ? '#94a3b8' : '#999', textAlign: 'center', padding: '12px', fontSize: '13px' }}>{searchQuery ? 'Aucun résultat' : 'Aucune conversation'}</div>
              ) : (
                filteredConversations.map(conv => (
                  <div key={conv.id}>
                    <div className={`conv-item ${currentConvId === conv.id ? 'active' : ''} ${conv.isPinned ? 'pinned' : ''}`}>
                      <div className="conv-info" onClick={() => loadConversation(conv)}>
                        {conv.tag && (
                          <span className="conv-tag-badge" style={{ background: getTagBgColor(conv.tag), color: getTagColor(conv.tag) }}>
                            {TAGS.find(t => t.label === conv.tag)?.icon}
                          </span>
                        )}
                        <div className="conv-title">{conv.title}</div>
                        <div className="conv-time">{conv.createdAt?.toDate?.()?.toLocaleString?.('fr-FR', { hour: '2-digit', minute: '2-digit' }) || ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button className="fav-btn" onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }} title={conv.isPinned ? 'Dépingler' : 'Pingler'} style={{ color: conv.isPinned ? '#fbbf24' : 'inherit' }}>📌</button>
                        <button className="fav-btn" onClick={(e) => { e.stopPropagation(); setShowTagPicker(showTagPicker === conv.id ? null : conv.id); }} title="Assigner un tag">🏷️</button>
                        <button className="fav-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(conv.id); }} title="Favoris">{conv.isFavorite ? '⭐' : '☆'}</button>
                        <button className="fav-btn" onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} title="Supprimer" style={{ color: '#e74c3c' }}>🗑️</button>
                      </div>
                    </div>
                    {showTagPicker === conv.id && (
                      <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap', marginLeft: '12px', marginRight: '12px', marginBottom: '8px' }}>
                        {TAGS.map(tag => (
                          <RippleButton key={tag.label} onClick={(e) => { e.stopPropagation(); assignTag(conv.id, tag.label); }} style={{ background: tag.color, color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '500', position: 'relative', overflow: 'hidden' }}>
                            {tag.icon} {tag.label}
                          </RippleButton>
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
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Activer le mode sombre">{darkMode ? '☀️' : '🌙'}</button>
          </div>
          <div className="toolbar">
            <RippleButton onClick={() => setReadingMode(!readingMode)} className="toolbar-btn" style={{ background: readingMode ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' : secondaryBg, color: readingMode ? 'white' : '#2a5298' }}>📖 Lecture</RippleButton>
            <RippleButton onClick={() => setShowExportChooser(true)} className="toolbar-btn">📥 Exporter</RippleButton>
            <RippleButton onClick={generateSynthesis} disabled={synthesisLoading} className="toolbar-btn">📋 Synthèse</RippleButton>
            <RippleButton onClick={() => setShowStatsDashboard(true)} className="toolbar-btn">📊 Stats</RippleButton>
            <RippleButton onClick={() => setShowHistoryModal(true)} className="toolbar-btn">📜 Historique</RippleButton>
            <RippleButton onClick={generateShareLink} className="toolbar-btn">🔗 Partager</RippleButton>
            <RippleButton onClick={() => setShowTemplates(!showTemplates)} className="toolbar-btn">⚡ Templates</RippleButton>
          </div>

          {showTemplates && (
            <div style={{ padding: '0 clamp(16px, 3vw, 24px)', borderBottom: `1px solid ${borderColor}`, background: secondaryBg, overflow: 'x: auto' }}>
              <div className="templates-grid">
                {TEMPLATES.map((t, i) => (
                  <RippleButton key={i} className="template-btn" onClick={() => { setInput(t.text); setShowTemplates(false); }}>{t.icon} {t.label}</RippleButton>
                ))}
              </div>
            </div>
          )}

          <div className="messages-container">
            {messages.length === 1 && messages[0].role === 'assistant' && messages[0].content === 'Bonjour 👋' ? (
              <EmptyState darkMode={darkMode} />
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    <div className="msg-avatar">
                      {msg.role === 'assistant' ? '🤖' : '👤'}
                    </div>
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
                {chatLoading && <div className="message assistant"><div className="msg-avatar">🤖</div><div className="msg-content skeleton" style={{ height: '60px', borderRadius: '14px' }}></div></div>}
                
                {suggestions.length > 0 && !chatLoading && (
                  <div style={{ padding: '12px', background: secondaryBg, borderRadius: '8px', marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#2a5298' }}>💡 Suggestions :</div>
                    <div className="suggestions">
                      {suggestions.map((s, i) => (
                        <RippleButton key={i} className="suggestion-btn" onClick={() => { setInput(s); handleSendMessage({ preventDefault: () => {} }); }}>{s}</RippleButton>
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

                {showInsightsCard && insightsData && (
                  <div style={{
                    animation: 'fadeInUp 0.6s ease-out',
                    background: darkMode ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                    border: `2px solid ${insightsData.severity === 'critical' ? '#ef4444' : insightsData.severity === 'high' ? '#f97316' : insightsData.severity === 'medium' ? '#eab308' : '#22c55e'}`,
                    borderRadius: '16px',
                    padding: '24px',
                    marginTop: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: insightsData.severity === 'critical' ? '#ef4444' : insightsData.severity === 'high' ? '#f97316' : insightsData.severity === 'medium' ? '#eab308' : '#22c55e', margin: 0 }}>
                        📋 DIAGNOSTIC INSIGHTS
                      </h3>
                      <button onClick={() => setShowInsightsCard(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', opacity: 0.6 }}>×</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Niveau de Sévérité
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{
                            fontSize: insightsData.severity === 'critical' ? '18px' : '16px',
                            fontWeight: '700',
                            color: insightsData.severity === 'critical' ? '#ef4444' : insightsData.severity === 'high' ? '#f97316' : insightsData.severity === 'medium' ? '#eab308' : '#22c55e',
                            marginBottom: '8px'
                          }}>
                            {insightsData.severity === 'critical' ? '🔴 CRITIQUE' : insightsData.severity === 'high' ? '🟠 ÉLEVÉ' : insightsData.severity === 'medium' ? '🟡 MOYEN' : '🟢 FAIBLE'}
                          </div>
                          <div style={{
                            width: '100%',
                            height: '8px',
                            background: darkMode ? '#374151' : '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${insightsData.severityValue}%`,
                              height: '100%',
                              background: insightsData.severity === 'critical' ? 'linear-gradient(90deg, #ef4444, #dc2626)' : insightsData.severity === 'high' ? 'linear-gradient(90deg, #f97316, #ea580c)' : insightsData.severity === 'medium' ? 'linear-gradient(90deg, #eab308, #ca8a04)' : 'linear-gradient(90deg, #22c55e, #16a34a)',
                              borderRadius: '4px',
                              transition: 'width 0.6s ease-out'
                            }} />
                          </div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{insightsData.severityValue}%</div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Coût Estimé
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#2a5298', marginBottom: '4px' }}>
                          💰 €{insightsData.minCost} - €{insightsData.maxCost}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {insightsData.minCost < 500 ? 'Budget économique' : insightsData.maxCost < 2000 ? 'Coût modéré' : 'Investissement important'}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: darkMode ? '#1e293b' : '#f0f4f8',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      borderLeft: `4px solid ${insightsData.severity === 'critical' ? '#ef4444' : insightsData.severity === 'high' ? '#f97316' : '#eab308'}`
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#999', marginBottom: '4px' }}>URGENCE</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: insightsData.severity === 'critical' ? '#ef4444' : insightsData.severity === 'high' ? '#f97316' : '#eab308' }}>
                        {insightsData.urgency}
                      </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, paddingTop: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#999', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Actions Recommandées
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {insightsData.recommendations.map((rec, i) => (
                          <div key={i} style={{
                            padding: '8px 12px',
                            background: darkMode ? '#1e293b' : '#f0f4f8',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: textColor,
                            borderLeft: `3px solid #3b82f6`
                          }}>
                            ✓ {rec}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <RippleButton
                        onClick={() => exportConversation('pdf')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        📥 Exporter le Rapport
                      </RippleButton>
                      <RippleButton
                        onClick={() => setShowInsightsCard(false)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: darkMode ? '#374151' : '#e5e7eb',
                          color: textColor,
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        📌 Fermer
                      </RippleButton>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="input-section">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <RippleButton className="voice-btn" onClick={toggleVoiceRecognition} title={isListening ? 'Arrêter l\'écoute' : 'Parler'}>{isListening ? '🔴' : '🎤'}</RippleButton>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: uploadPreview ? '8px' : '0', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    placeholder={isListening ? "👂 Écoute en cours..." : uploadPreview ? "Décrivez votre fichier..." : "Posez votre question immobilière..."} 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyPress={(e) => { if (e.key === 'Enter' && !uploadPreview) handleSendMessage(e); }} 
                    disabled={chatLoading}
                    style={{ flex: 1, minWidth: '150px' }}
                  />
                  <label style={{ cursor: 'pointer', padding: '12px 16px', background: '#3b82f6', color: 'white', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'clamp(12px, 2vw, 14px)' }}>
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
                {uploadPreview && typeof uploadPreview === 'string' && (
                  <div style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', maxHeight: '150px' }}>
                    <img src={uploadPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                  </div>
                )}
                {voiceInterimText && <div className="voice-interim">🎙️ {voiceInterimText}</div>}
              </div>
            </div>
            <RippleButton onClick={uploadPreview ? sendFileWithMessage : handleSendMessage} className="send-btn" disabled={chatLoading}>{chatLoading ? '...' : (uploadPreview ? 'Analyser' : 'Envoyer')}</RippleButton>
          </div>
        </div>
      </div>

      {showStatsDashboard && (
        <div className="modal" onClick={() => setShowStatsDashboard(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowStatsDashboard(false)}>✕</button>
            <h2 style={{ marginBottom: '28px', fontSize: '28px', fontWeight: '800' }}>📊 Tableau de Bord</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <StatsCard icon="💬" label="Conversations" value={stats.totalConversations} color="#3b82f6" darkMode={darkMode} />
              <StatsCard icon="📝" label="Messages" value={stats.totalMessages} color="#10b981" darkMode={darkMode} />
              <StatsCard icon="⭐" label="Favoris" value={stats.favorites} color="#fbbf24" darkMode={darkMode} />
              <StatsCard icon="📌" label="Pinnées" value={stats.pinned} color="#ef4444" darkMode={darkMode} />
            </div>

            <div style={{ background: secondaryBg, padding: '24px', borderRadius: '14px', marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#60a5fa' : '#2a5298' }}>📈 Tendances par Catégorie</h3>
              {getTrendData().length === 0 ? (
                <div style={{ textAlign: 'center', color: darkMode ? '#94a3b8' : '#999' }}>Aucune donnée</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getTrendData().map((trend, idx) => {
                    const tag = TAGS.find(t => t.label === trend.tag);
                    const percentage = Math.round((trend.count / Math.max(...getTrendData().map(t => t.count))) * 100);
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '600' }}>{tag?.icon} {trend.tag}</span>
                          <span style={{ color: darkMode ? '#60a5fa' : '#2a5298', fontWeight: '700' }}>{trend.count}</span>
                        </div>
                        <div style={{ background: darkMode ? '#0f172a' : '#f0f0f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ background: tag?.color, height: '100%', width: `${percentage}%`, borderRadius: '4px', transition: 'width 0.3s' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                <RippleButton className={`filter-tab ${historyFilter === 'all' ? 'active' : ''}`} onClick={() => setHistoryFilter('all')}>Tous</RippleButton>
                <RippleButton className={`filter-tab ${historyFilter === '7days' ? 'active' : ''}`} onClick={() => setHistoryFilter('7days')}>7 jours</RippleButton>
                {TAGS.map(tag => (
                  <RippleButton key={tag.label} className={`filter-tab ${historyFilter === tag.label ? 'active' : ''}`} onClick={() => setHistoryFilter(tag.label)}>{tag.icon} {tag.label}</RippleButton>
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
            <RippleButton onClick={copyShareLink} style={{ width: '100%', padding: '12px', background: bgGradient, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>{copiedId === 'share' ? '✓ Copié !' : '📋 Copier le lien'}</RippleButton>
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
              <RippleButton onClick={() => copyToClipboard(synthesis, 'synthesis')} style={{ flex: 1, padding: '12px', background: bgGradient, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>{copiedId === 'synthesis' ? '✓ Copié !' : '📋 Copier'}</RippleButton>
              <RippleButton onClick={() => setShowSynthesisModal(false)} style={{ flex: 1, padding: '12px', background: secondaryBg, color: '#2a5298', border: `1px solid ${borderColor}`, borderRadius: '8px', fontWeight: '600', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>Fermer</RippleButton>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
      {sessionTimeLeft < 60 && <div className="session-badge">⏰ Session expire dans {sessionTimeLeft}s</div>}
    </>
  );
}
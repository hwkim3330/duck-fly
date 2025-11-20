/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#87CEEB', // Sky blue background for the container
    overflow: 'hidden',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.9)', // Lighter header
    zIndex: 20,
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  },
  gameWrapper: {
    flex: 1,
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    background: '#87CEEB',
    overflow: 'hidden',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    backgroundColor: '#87CEEB',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  button: (active: boolean) => ({
    background: active ? '#FFD700' : '#ffffff',
    color: active ? '#000000' : '#666666',
    border: '2px solid ' + (active ? '#FFA500' : 'transparent'),
    padding: '6px 16px',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    outline: 'none',
    boxShadow: active ? '0 2px 8px rgba(255, 215, 0, 0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
  }),
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto' as const,
    zIndex: 50,
  },
  modal: {
    background: '#fff',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    borderRadius: '32px',
    padding: '32px',
    width: '480px',
    maxWidth: '90%',
    color: '#444',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    animation: 'fadeIn 0.3s ease-out',
  },
  modalHeader: {
    fontSize: '28px',
    fontWeight: '800' as const,
    marginBottom: '8px',
    color: '#FFA500', // Orange
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  modalSub: {
    color: '#666',
    marginBottom: '24px',
    fontSize: '15px',
    lineHeight: '1.6',
    marginTop: 0,
  },
  remixItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#F0F8FF', // AliceBlue
    borderRadius: '20px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s, background 0.2s',
    border: '2px solid transparent',
  },
  remixIcon: {
    fontSize: '24px',
    background: '#fff',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
  },
  closeBtn: {
    width: '100%',
    padding: '16px',
    marginTop: '12px',
    background: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '800' as const,
    cursor: 'pointer',
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
    transition: 'transform 0.1s',
  },
  promptBox: {
    background: '#f8f9fa',
    border: '1px solid #eee',
    borderRadius: '16px',
    padding: '16px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#555',
    minHeight: '150px',
    maxHeight: '300px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap' as const,
  },
  loadingContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#87CEEB',
    zIndex: 5,
  },
  loadingText: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    animation: 'pulse 1.5s infinite',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
  }
};

const PROMPTS = {
  gemini2p5: `
Create a cheerful, bright 3D endless runner game titled "New Duck Flies" (새 오리 날다) in a single HTML file using Three.js.

### 1. Visual Style
*   **Theme:** "Dazzlingly Cute" (눈부시게 귀여운). Use a pastel color palette: Sky Blue (#87CEEB), Sunshine Yellow (#FFD700), Cloud White (#FFFFFF), and Soft Pink (#FFC0CB).
*   **Lighting:** Bright, warm sunlight (Hemisphere + Directional lights). Shadows should be soft.
*   **Environment:** A blue sky with fluffy white clouds passing by.
*   **Post-Processing:** Use UnrealBloomPass to make the clouds and the duck glow slightly, creating a magical, dazzling effect.

### 2. Gameplay
*   **Player:** A cute geometric Duck (Yellow sphere head, oval body, orange beak, flapping wings). The duck flies forward.
*   **Obstacles:** Grumpy Storm Clouds (Dark Grey) and Mischievous Crows.
*   **Action:**
    *   **Move:** WASD/Arrow keys to move the duck around the screen.
    *   **Shoot:** Spacebar to spit "Water Bubbles" at enemies.
    *   **Score:** Destroying enemies gives points.
*   **Feedback:** Confetti explosion when enemies are defeated.

### 3. Technical
*   Single HTML file.
*   Responsive canvas.
*   Mobile touch controls (Virtual Joystick + Tap to Shoot).
`,
  gemini3: `
Create a highly polished, adorable 3D flying game "New Duck Flies" (새 오리 날다) in a single HTML file using Three.js.

### 1. Visual Style & Atmosphere
*   **Aesthetic:** "Dazzlingly Cute". Think Nintendo-like bright colors, soft shading, and a magical atmosphere.
*   **Colors:** Sky Blue (#87CEEB), Duck Yellow (#FFD700), Beak Orange (#FFA500), Cloud White (#FFFFFF).
*   **Post-Processing:** Strong Bloom effect to make the white clouds and bubbles glow angelically.
*   **Environment:**
    *   Infinite scrolling blue sky.
    *   The "ground" (far below) should be soft white clouds.
    *   Particle effects for wind lines to show speed.

### 2. Characters
*   **Player (The Duck):** Distinct geometry using Three.js primitives. Round head, oval body, flapping wings (animated by rotating/scaling), cute orange beak and feet.
*   **Enemies:** Dark, grumpy rain clouds with lightning bolts or silly-looking crows.
*   **Projectiles:** Shining, transparent water bubbles.

### 3. Gameplay
*   **Movement:** Smooth, floaty physics. The duck tilts (banks) when turning.
*   **Action:** Dodge obstacles and shoot bubbles to clear the path.
*   **Feedback:** Screen shake on hit, particle explosions on enemy defeat.

### 4. Technical
*   Single HTML file.
*   Responsive 3D canvas.
*   Mobile touch controls support.
*   Maintain 60FPS using object pooling.
`
};

function App() {
  const [activeModel, setActiveModel] = useState('gemini3'); 
  const [showPrompt, setShowPrompt] = useState(false);
  const [showRemix, setShowRemix] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  
  const [gameHtml, setGameHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Hatching Duck...');
  
  const htmlCache = useRef<{ [key: string]: string }>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const switchModel = (model: string) => {
    if (activeModel === model) return;
    setGameHtml(null);
    setIsLoading(true);
    setLoadingText('Hatching Duck...');
    setActiveModel(model);
  };

  useEffect(() => {
    // Send pause command to iframe whenever disclaimer visibility changes
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'PAUSE_GAME', payload: showDisclaimer }, '*');
    }
  }, [showDisclaimer]);

  useEffect(() => {
    let isMounted = true;
    const url = activeModel === 'gemini3' ? './init/gemini3.html' : './init/gemini2p5.html';

    const loadGame = async () => {
      if (htmlCache.current[url] && !isLoading) {
         // Cached logic
      }

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load game');
        let html = await response.text();
        
        const baseTag = '<base href="./init/">';
        if (html.includes('<head')) {
            html = html.replace(/<head[^>]*>/i, `$&${baseTag}`);
        } else {
            html = `${baseTag}${html}`;
        }
        
        htmlCache.current[url] = html;
        
        if (isMounted) {
          setGameHtml(html);
          setIsLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setGameHtml('<div style="color:white;display:flex;height:100%;justify-content:center;align-items:center;font-family:sans-serif;">Failed to load game engine.</div>');
          setIsLoading(false);
        }
      }
    };
    
    loadGame();

    return () => {
      isMounted = false;
    };
  }, [activeModel]);

  const handleRemixAction = async (modification: string) => {
    if (!gameHtml) return;
    
    setIsLoading(true);
    setLoadingText('Mixing Magic...');
    setShowRemix(false); 

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const modelId = activeModel === 'gemini3' ? 'gemini-3-pro-preview' : 'gemini-2.5-pro';
        const currentPrompt = PROMPTS[activeModel as keyof typeof PROMPTS];

        const systemInstruction = `
You are an expert Creative Technologist and 3D Web Game Developer.
Your task is to modify the provided web game code based on the user's remix request.
Output ONLY the raw HTML code. Do not include markdown formatting.
IMPORTANT: Preserve the following script snippet exactly as it is in the output to ensure the game can be paused by the parent window:
<script>
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'PAUSE_GAME') {
    if (typeof state !== 'undefined' && state.hasOwnProperty('isPaused')) {
       state.isPaused = e.data.payload;
       if(!state.isPaused && typeof clock !== 'undefined') clock.getDelta();
    } else if (typeof isPaused !== 'undefined') {
       isPaused = e.data.payload;
       if(!isPaused && typeof clock !== 'undefined') clock.getDelta();
    }
  }
});
</script>
`;

        const response = await ai.models.generateContent({
            model: modelId,
            config: { systemInstruction },
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `ORIGINAL PROMPT CONTEXT:\n${currentPrompt}` },
                        { text: `CURRENT SOURCE CODE:\n${gameHtml}` },
                        { text: `REMIX INSTRUCTION: Apply this modification to the game: "${modification}". Ensure the code remains a single HTML file.` }
                    ]
                }
            ]
        });

        let text = response.text;
        text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
        
        const baseTag = '<base href="./init/">';
        if (!text.includes('<base') && !text.includes('init/')) {
             if (text.includes('<head')) {
                text = text.replace(/<head[^>]*>/i, `$&${baseTag}`);
            }
        }
        
        setGameHtml(text);

    } catch (error) {
        console.error("Remix failed", error);
        alert("Remix failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleIFrameLoad = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow && showDisclaimer) {
      iframe.contentWindow.postMessage({ type: 'PAUSE_GAME', payload: true }, '*');
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
      `}</style>

      {/* Header Control Bar */}
      <div style={styles.header}>
        <div style={styles.buttonGroup}>
          <button 
            style={styles.button(activeModel === 'gemini2p5')}
            onClick={() => switchModel('gemini2p5')}
          >
            2.5 Pro (Duck)
          </button>
          <button 
            style={styles.button(activeModel === 'gemini3')}
            onClick={() => switchModel('gemini3')}
          >
            3 Pro (Super Duck)
          </button>
        </div>

        <div style={styles.buttonGroup}>
          <button 
            style={styles.button(showPrompt)}
            onClick={() => setShowPrompt(true)}
          >
            Prompt
          </button>
          <button 
            style={styles.button(showRemix)}
            onClick={() => setShowRemix(true)}
          >
            Remix
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div style={styles.gameWrapper}>
        {/* Loading Screen */}
        {(isLoading || !gameHtml) && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingText}>{loadingText}</div>
          </div>
        )}

        {/* Game Frame */}
        {!isLoading && gameHtml && (
          <iframe 
            ref={iframeRef}
            key={activeModel + gameHtml.length} // Force re-render on content change
            srcDoc={gameHtml}
            style={styles.iframe} 
            title="Game Canvas"
            sandbox="allow-scripts allow-pointer-lock allow-same-origin allow-forms"
            onLoad={handleIFrameLoad}
          />
        )}
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalHeader}>New Duck Flies!</h2>
            <div style={styles.modalSub}>
              <p style={{marginBottom: '12px'}}>
                <strong>Goal:</strong> Guide the cute duck through the clouds! Shoot bubbles to clear the storm.
              </p>

              <p style={{marginBottom: '16px'}}>
                <strong>Controls:</strong> Use <span style={{color: '#333', fontWeight: 700}}>Arrow Keys / WASD</span> to fly and <span style={{color: '#333', fontWeight: 700}}>Spacebar</span> to shoot bubbles.
              </p>
              
              <div style={{background: '#F0F8FF', padding: '16px', borderRadius: '16px', marginTop: '20px'}}>
                <p style={{margin: '0 0 12px 0', color: '#444'}}>
                  <strong>Note:</strong> This 3D game was <strong>one-shot generated</strong> by Google's Gemini.
                </p>
                <p style={{margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#666'}}>
                   Click the <span style={{border: '1px solid #ccc', borderRadius: '4px', padding: '1px 5px', fontSize: '11px', background: '#fff'}}>Prompt</span> button to see how we described the "Dazzling Cute" style to the model.
                </p>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={() => setShowDisclaimer(false)}>
              START FLYING
            </button>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {showPrompt && (
        <div style={styles.modalOverlay} onClick={() => setShowPrompt(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalHeader}>Behind the Scenes</h2>
            <p style={styles.modalSub}>The prompt used to generate this cute world.</p>
            <div style={styles.promptBox}>
              {PROMPTS[activeModel as keyof typeof PROMPTS]}
            </div>
            <button style={styles.closeBtn} onClick={() => setShowPrompt(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Remix Modal */}
      {showRemix && (
        <div style={styles.modalOverlay} onClick={() => setShowRemix(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalHeader}>Remix Station</h2>
            <p style={styles.modalSub}>Add some magic to the world.</p>
            
            {['Rainbow Mode', 'Giant Duck', 'Night Flight'].map((item, i) => (
               <div 
                key={item}
                style={styles.remixItem} 
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = '#E6F2FF'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#F0F8FF'; }}
                onClick={() => handleRemixAction(item)}
              >
                <div style={styles.remixIcon}>{['🌈', '🐥', '🌙'][i]}</div>
                <div>
                  <div style={{fontWeight: 700, color: '#333'}}>{item}</div>
                  <div style={{fontSize: '13px', color: '#666'}}>
                    {['Make everything colorful', 'Increase duck size x3', 'Switch to sleepy night mode'][i]}
                  </div>
                </div>
              </div>
            ))}

            <button style={{...styles.closeBtn, background: '#f0f0f0', color: '#666'}} onClick={() => setShowRemix(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root') || document.body);
root.render(<App />);
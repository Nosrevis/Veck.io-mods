(() => {
  if (window.__MY_MOD_MENU__) {
    window.__MY_MOD_MENU__.toggle();
    return;
  }

  const state = {
    open: false,
    section: null,
    aimbot: false,
    aimbotStrength: 50,
    aimbotFOV: 360,
    teamCheck: true,
    showFOV: false,
    lockThroughWalls: false,
    target: null
  };

  const aimbotCore = {
    getDistanceToEnemy(target) {
      if (target.position) {
        const dx = target.position.x - (window.game?.camera?.position?.x || 0);
        const dy = target.position.y - (window.game?.camera?.position?.y || 0);
        const dz = target.position.z - (window.game?.camera?.position?.z || 0);
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
      }
      if (target.x !== undefined && target.y !== undefined) {
        const playerX = window.game?.localPlayer?.x || window.innerWidth / 2;
        const playerY = window.game?.localPlayer?.y || window.innerHeight / 2;
        const dx = target.x - playerX;
        const dy = target.y - playerY;
        return Math.sqrt(dx*dx + dy*dy);
      }
      const pos = this.getTargetPos(target);
      if (!pos) return Infinity;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      return Math.sqrt(Math.pow(pos.x - cx, 2) + Math.pow(pos.y - cy, 2));
    },
    
    getTargetPos(target, headshot = false) {
      // Try to get head position first for headshots
      if (headshot && target.headPosition) {
        if (target.headPosition.clone) {
          const pos = target.headPosition.clone();
          if (window.game?.camera) {
            pos.project(window.game.camera);
            return { x: (pos.x + 1) * window.innerWidth / 2, y: (-pos.y + 1) * window.innerHeight / 2 };
          }
          return { x: target.headPosition.x, y: target.headPosition.y };
        }
        return { x: target.headPosition.x, y: target.headPosition.y };
      }
      
      // Try head bone for 3D games
      if (headshot && target.bones) {
        const head = target.bones.find(b => b.name === 'head' || b.name === 'HEAD');
        if (head && window.game?.camera) {
          const pos = head.position.clone ? head.position.clone() : { ...head.position };
          pos.project(window.game.camera);
          return { x: (pos.x + 1) * window.innerWidth / 2, y: (-pos.y + 1) * window.innerHeight / 2 };
        }
      }
      
      // Offset for headshot (aim higher)
      if (target.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        if (headshot) {
          // Aim at top 20% of hitbox (head area)
          return { x: centerX, y: rect.top + rect.height * 0.2 };
        }
        return { x: centerX, y: centerY };
      }
      
      if (target.position && window.game?.camera) {
        const pos = target.position.clone ? target.position.clone() : target.position;
        pos.project(window.game.camera);
        const screenX = (pos.x + 1) * window.innerWidth / 2;
        const screenY = (-pos.y + 1) * window.innerHeight / 2;
        if (headshot) {
          // Move up for headshot
          return { x: screenX, y: screenY - 30 };
        }
        return { x: screenX, y: screenY };
      }
      
      if (target.x !== undefined && target.y !== undefined) {
        if (headshot) {
          return { x: target.x, y: target.y - 20 };
        }
        return { x: target.x, y: target.y };
      }
      
      return null;
    },
    
    isOnScreen(pos) {
      if (state.lockThroughWalls) return true; // Skip visibility check
      return pos && pos.x > -100 && pos.x < window.innerWidth + 100 && 
             pos.y > -100 && pos.y < window.innerHeight + 100;
    },
    
    isInFOV(target) {
      if (state.aimbotFOV >= 360) return true;
      const pos = this.getTargetPos(target);
      if (!pos) return false;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const angle = Math.atan2(pos.y - cy, pos.x - cx) * 180 / Math.PI;
      const normalizedAngle = ((angle % 360) + 360) % 360;
      const angleDiff = Math.abs(normalizedAngle - 0);
      return angleDiff <= state.aimbotFOV / 2;
    },
    
    findClosestEnemy() {
      const targets = this.findTargets();
      if (targets.length === 0) return null;
      let closest = null;
      let closestDist = Infinity;
      
      for (const target of targets) {
        // Skip visibility check if lock through walls is on
        if (!state.lockThroughWalls) {
          const pos = this.getTargetPos(target);
          if (!this.isOnScreen(pos)) continue;
        }
        
        if (!this.isInFOV(target)) continue;
        
        const dist = this.getDistanceToEnemy(target);
        if (dist < closestDist) {
          closestDist = dist;
          closest = { element: target, dist };
        }
      }
      
      // Get fresh position for the closest target (with headshot)
      if (closest) {
        closest.pos = this.getTargetPos(closest.element, true); // true = headshot
      }
      
      return closest;
    },
    
    findTargets() {
      const targets = [];
      
      // Scan larger area if lock through walls is on
      const scanAll = state.lockThroughWalls;
      
      if (window.game) {
        if (window.game.players) {
          Object.values(window.game.players).forEach(p => {
            if (p && !p.isLocal && (p.active !== false || scanAll) && (p.health > 0 || scanAll)) {
              if (!state.teamCheck || p.team !== window.game.localPlayer?.team) {
                targets.push(p);
              }
            }
          });
        }
        if (window.game.enemies) {
          Object.values(window.game.enemies).forEach(e => {
            if (e && (e.active !== false || scanAll)) targets.push(e);
          });
        }
        if (window.game.entities) {
          Object.values(window.game.entities).forEach(e => {
            if (e && e.type === 'enemy' && (e.active !== false || scanAll)) targets.push(e);
          });
        }
      }
      
      if (targets.length === 0) {
        const selectors = ['.player:not(.local)', '.enemy', '[class*="enemy"]', 
          '[class*="opponent"]', '[class*="target"]', '[data-team]:not([data-team="own"])'];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            // More lenient size check if locking through walls
            const minSize = scanAll ? 1 : 5;
            if (rect.width > minSize && rect.height > minSize) {
              if (scanAll) {
                targets.push(el);
              } else {
                const style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                  targets.push(el);
                }
              }
            }
          });
        }
      }
      
      return targets;
    },
    
    lockOnto(targetData) {
      if (!targetData || !targetData.pos) return;
      
      const { pos } = targetData;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      
      const dx = pos.x - cx;
      const dy = pos.y - cy;
      
      // INSANE MODE: 100% = INSTANT SNAP, no smoothing
      const strength = state.aimbotStrength;
      
      let moveX, moveY;
      
      if (strength >= 100) {
        // INSTANT SNAP - teleport crosshair to head
        moveX = dx;
        moveY = dy;
      } else if (strength >= 80) {
        // FAST - almost instant
        const speed = 0.5 + (strength / 200);
        moveX = dx * speed;
        moveY = dy * speed;
      } else {
        // NORMAL - smoothed
        const speed = 0.05 + (strength / 200);
        moveX = dx * speed;
        moveY = dy * speed;
      }
      
      // Update visual indicator
      const indicator = document.getElementById('aimbot-target');
      if (indicator) {
        indicator.style.display = 'block';
        indicator.style.left = (pos.x - 8) + 'px';
        indicator.style.top = (pos.y - 8) + 'px';
        // Change color based on strength
        if (strength >= 100) {
          indicator.style.borderColor = '#ff0000';
          indicator.style.boxShadow = '0 0 30px #ff0000, 0 0 60px #ff0000';
        } else if (strength >= 80) {
          indicator.style.borderColor = '#ff8800';
          indicator.style.boxShadow = '0 0 20px #ff8800, 0 0 40px #ff8800';
        } else {
          indicator.style.borderColor = '#ffd700';
          indicator.style.boxShadow = '0 0 20px #ffd700, 0 0 40px #ffd700';
        }
      }
      
      // Apply aim
      if (document.pointerLockElement) {
        const canvas = document.pointerLockElement;
        const event = new MouseEvent('mousemove', { 
          movementX: moveX, 
          movementY: moveY, 
          bubbles: true 
        });
        canvas.dispatchEvent(event);
        
        if (window.game?.controls) {
          const sens = strength >= 100 ? 0.001 : 0.002;
          window.game.controls.yaw -= moveX * sens;
          window.game.controls.pitch -= moveY * sens;
        }
        return;
      }
      
      if (window.game?.camera) {
        const sensitivity = strength >= 100 ? 0.001 : 0.002;
        window.game.camera.rotation.y -= moveX * sensitivity;
        window.game.camera.rotation.x -= moveY * sensitivity;
        return;
      }
      
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const event = new MouseEvent('mousemove', {
          clientX: rect.left + cx + moveX,
          clientY: rect.top + cy + moveY,
          movementX: moveX,
          movementY: moveY,
          bubbles: true
        });
        canvas.dispatchEvent(event);
      }
    },
    
    update() {
      if (!state.aimbot) {
        const indicator = document.getElementById('aimbot-target');
        if (indicator) {
          indicator.style.display = 'none';
          indicator.style.borderColor = '#ffd700';
          indicator.style.boxShadow = '0 0 20px #ffd700, 0 0 40px #ffd700';
        }
        return;
      }
      
      const target = this.findClosestEnemy();
      
      if (target) {
        state.target = target;
        this.lockOnto(target);
      } else {
        state.target = null;
        const indicator = document.getElementById('aimbot-target');
        if (indicator) indicator.style.display = 'none';
      }
    }
  };

  const hookGameLoop = () => {
    if (window.__aimbotHooked) return;
    window.__aimbotHooked = true;
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      aimbotCore.update();
      return originalRAF.call(this, callback);
    };
    setInterval(() => aimbotCore.update(), 1000 / 60);
  };

  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');
    
    #my-mod-menu, #my-mod-menu * {
      box-sizing: border-box;
      font-family: 'Rajdhani', 'Orbitron', sans-serif;
    }
    
    #my-mod-menu {
      position: fixed;
      left: 22px;
      bottom: 22px;
      width: 340px;
      background: linear-gradient(145deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%);
      color: #ffd700;
      border: 2px solid #ffd700;
      border-radius: 4px;
      box-shadow: 
        0 0 20px rgba(255, 215, 0, 0.3),
        0 0 40px rgba(255, 215, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
      z-index: 2147483647;
      overflow: hidden;
      user-select: none;
    }
    
    #my-mod-menu::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.1), transparent);
      animation: shimmer 3s infinite;
      pointer-events: none;
    }
    
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    
    #my-mod-menu .mm-header {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 18px;
      background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
      border-bottom: 2px solid #ffd700;
      cursor: move;
      position: relative;
      overflow: hidden;
    }
    
    #my-mod-menu .mm-header::after {
      content: '◆ MOD MENU ◆';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Orbitron', sans-serif;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 4px;
      color: #ffd700;
      text-shadow: 
        0 0 10px rgba(255, 215, 0, 0.8),
        0 0 20px rgba(255, 215, 0, 0.4),
        0 0 30px rgba(255, 215, 0, 0.2);
      white-space: nowrap;
    }
    
    #my-mod-menu .mm-title { display: none; }
    
    #my-mod-menu .mm-close {
      width: 32px;
      height: 32px;
      border: 1px solid #ffd700;
      border-radius: 2px;
      background: linear-gradient(145deg, #1a1a1a, #0d0d0d);
      color: #ffd700;
      cursor: pointer;
      font-size: 20px;
      font-weight: 700;
      transition: all 0.2s ease;
      z-index: 1;
    }
    
    #my-mod-menu .mm-close:hover {
      background: #ffd700;
      color: #000;
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
      transform: scale(1.05);
    }
    
    #my-mod-menu .mm-body {
      padding: 20px;
      background: linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 100%);
    }
    
    #my-mod-menu .mm-home {
      display: grid;
      gap: 12px;
    }
    
    #my-mod-menu .mm-section {
      height: 64px;
      border: 1px solid #333;
      background: linear-gradient(145deg, #141414 0%, #0a0a0a 100%);
      color: #ccc;
      border-radius: 2px;
      cursor: pointer;
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 3px;
      text-align: center;
      padding: 0;
      transition: all 0.3s ease;
      text-transform: uppercase;
      position: relative;
      overflow: hidden;
    }
    
    #my-mod-menu .mm-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.2), transparent);
      transition: left 0.5s;
    }
    
    #my-mod-menu .mm-section:hover::before {
      left: 100%;
    }
    
    #my-mod-menu .mm-section:hover {
      border-color: #ffd700;
      color: #ffd700;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      transform: translateX(5px);
      box-shadow: 
        -3px 0 0 #ffd700,
        0 0 20px rgba(255, 215, 0, 0.2);
    }
    
    #my-mod-menu .mm-back {
      background: transparent;
      border: 1px solid #333;
      color: #888;
      cursor: pointer;
      padding: 8px 16px;
      font-size: 14px;
      font-family: 'Orbitron', sans-serif;
      letter-spacing: 2px;
      margin-bottom: 16px;
      transition: all 0.2s ease;
      text-transform: uppercase;
    }
    
    #my-mod-menu .mm-back:hover {
      border-color: #ffd700;
      color: #ffd700;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
    }
    
    #my-mod-menu .mm-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    
    #my-mod-menu .mm-mod {
      min-height: 56px;
      background: linear-gradient(145deg, #141414 0%, #0a0a0a 100%);
      border: 1px solid #333;
      color: #888;
      border-radius: 2px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    
    #my-mod-menu .mm-mod::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background: #ffd700;
      transition: width 0.3s ease;
    }
    
    #my-mod-menu .mm-mod:hover {
      border-color: #555;
      color: #ccc;
      transform: translateY(-2px);
    }
    
    #my-mod-menu .mm-mod:hover::after {
      width: 100%;
    }
    
    #my-mod-menu .mm-mod.active {
      background: linear-gradient(145deg, #1a1500 0%, #0d0b00 100%);
      border-color: #ffd700;
      color: #ffd700;
      box-shadow: 
        0 0 15px rgba(255, 215, 0, 0.3),
        inset 0 1px 0 rgba(255, 215, 0, 0.1);
    }
    
    #my-mod-menu .mm-mod.active::after {
      width: 100%;
      box-shadow: 0 0 10px #ffd700;
    }
    
    #my-mod-menu .mm-status {
      margin-top: 16px;
      padding: 14px;
      border-radius: 2px;
      background: linear-gradient(145deg, #0d0d0d 0%, #141414 100%);
      border: 1px solid #333;
      color: #666;
      font-size: 12px;
      line-height: 1.5;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    #my-mod-slider {
      position: fixed;
      display: none;
      z-index: 2147483646;
      width: 240px;
      padding: 20px;
      background: linear-gradient(145deg, #0a0a0a 0%, #141414 100%);
      border: 2px solid #ffd700;
      border-radius: 4px;
      box-shadow: 
        0 0 30px rgba(255, 215, 0, 0.4),
        0 10px 40px rgba(0,0,0,0.9);
      color: #ffd700;
    }
    
    #my-mod-slider .slider-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 3px;
      margin-bottom: 12px;
      text-align: center;
      text-transform: uppercase;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }
    
    #my-mod-slider input {
      width: 100%;
      height: 10px;
      -webkit-appearance: none;
      appearance: none;
      background: linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%);
      border-radius: 5px;
      outline: none;
      border: 1px solid #444;
    }
    
    #my-mod-slider input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 24px;
      height: 24px;
      background: linear-gradient(145deg, #ffd700, #b8860b);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
      border: 3px solid #fff;
      transition: transform 0.1s;
    }
    
    #my-mod-slider input::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }
    
    #my-mod-slider input::-moz-range-thumb {
      width: 24px;
      height: 24px;
      background: linear-gradient(145deg, #ffd700, #b8860b);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
      border: 3px solid #fff;
    }
    
    #my-mod-slider .slider-value {
      text-align: center;
      color: #ffd700;
      font-family: 'Orbitron', sans-serif;
      font-size: 24px;
      font-weight: 800;
      margin: 15px 0;
      text-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
    }
    
    #my-mod-slider .slider-value.insane {
      color: #ff0000;
      text-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000;
      animation: insanePulse 0.5s infinite alternate;
    }
    
    @keyframes insanePulse {
      from { transform: scale(1); }
      to { transform: scale(1.1); }
    }
    
    /* Toggle buttons under slider */
    #aimbot-toggles {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #333;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .aimbot-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: linear-gradient(145deg, #141414 0%, #0a0a0a 100%);
      border: 1px solid #333;
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .aimbot-toggle:hover {
      border-color: #555;
    }
    
    .aimbot-toggle.active {
      border-color: #ffd700;
      background: linear-gradient(145deg, #1a1500 0%, #0d0b00 100%);
    }
    
    .aimbot-toggle-label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      color: #888;
      text-transform: uppercase;
    }
    
    .aimbot-toggle.active .aimbot-toggle-label {
      color: #ffd700;
    }
    
    .aimbot-toggle-switch {
      width: 44px;
      height: 22px;
      background: #333;
      border-radius: 11px;
      position: relative;
      transition: all 0.3s ease;
    }
    
    .aimbot-toggle.active .aimbot-toggle-switch {
      background: #ffd700;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }
    
    .aimbot-toggle-switch::after {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      background: #666;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: all 0.3s ease;
    }
    
    .aimbot-toggle.active .aimbot-toggle-switch::after {
      left: 24px;
      background: #000;
    }
    
    /* Wall lock special styling */
    .aimbot-toggle.wall-lock.active {
      border-color: #ff4444;
      background: linear-gradient(145deg, #1a0000 0%, #0d0000 100%);
    }
    
    .aimbot-toggle.wall-lock.active .aimbot-toggle-label {
      color: #ff4444;
    }
    
    .aimbot-toggle.wall-lock.active .aimbot-toggle-switch {
      background: #ff4444;
      box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
    }
    
    #my-mod-button {
      position: fixed;
      left: 18px;
      bottom: 18px;
      z-index: 2147483647;
      display: none;
      padding: 14px 28px;
      border: 2px solid #ffd700;
      border-radius: 2px;
      background: linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 100%);
      color: #ffd700;
      cursor: pointer;
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 4px;
      text-transform: uppercase;
      box-shadow: 
        0 0 20px rgba(255, 215, 0, 0.3),
        0 5px 20px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
    }
    
    #my-mod-button:hover {
      background: linear-gradient(145deg, #ffd700 0%, #b8860b 100%);
      color: #000;
      box-shadow: 
        0 0 30px rgba(255, 215, 0, 0.6),
        0 5px 30px rgba(0,0,0,0.5);
      transform: translateY(-2px);
    }
    
    #aimbot-fov {
      position: fixed;
      pointer-events: none;
      z-index: 2147483645;
      border: 2px solid rgba(255, 215, 0, 0.2);
      border-radius: 50%;
      display: none;
      box-shadow: 
        0 0 30px rgba(255, 215, 0, 0.1),
        inset 0 0 30px rgba(255, 215, 0, 0.05);
    }
    
    #aimbot-target {
      position: fixed;
      width: 20px;
      height: 20px;
      background: transparent;
      border: 3px solid #ffd700;
      border-radius: 50%;
      pointer-events: none;
      z-index: 2147483646;
      display: none;
      box-shadow: 
        0 0 20px #ffd700,
        0 0 40px #ffd700,
        inset 0 0 10px rgba(255, 215, 0, 0.5);
      animation: targetPulse 0.3s ease-in-out infinite alternate;
    }
    
    @keyframes targetPulse {
      from { 
        transform: scale(1) rotate(0deg); 
        border-color: #ffd700;
        box-shadow: 0 0 20px #ffd700, 0 0 40px #ffd700;
      }
      to { 
        transform: scale(1.5) rotate(45deg); 
        border-color: #fff;
        box-shadow: 0 0 30px #ffd700, 0 0 60px #ffd700, 0 0 90px #ffd700;
      }
    }
    
    .corner {
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid #ffd700;
    }
    .corner-tl { top: 0; left: 0; border-right: 0; border-bottom: 0; }
    .corner-tr { top: 0; right: 0; border-left: 0; border-bottom: 0; }
    .corner-bl { bottom: 0; left: 0; border-right: 0; border-top: 0; }
    .corner-br { bottom: 0; right: 0; border-left: 0; border-top: 0; }
  `;
  document.head.appendChild(style);

  const menu = document.createElement("div");
  menu.id = "my-mod-menu";
  menu.innerHTML = `
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    <div class="mm-header">
      <span class="mm-title">MOD MENU</span>
      <button class="mm-close">×</button>
    </div>
    <div class="mm-body"></div>
  `;

  const slider = document.createElement("div");
  slider.id = "my-mod-slider";
  slider.innerHTML = `
    <div class="slider-title">◆ AIMBOT POWER ◆</div>
    <input type="range" min="1" max="100" value="50">
    <div class="slider-value">50%</div>
    <div id="aimbot-toggles">
      <div class="aimbot-toggle ${state.teamCheck ? 'active' : ''}" id="toggle-team">
        <span class="aimbot-toggle-label">Team Check</span>
        <div class="aimbot-toggle-switch"></div>
      </div>
      <div class="aimbot-toggle ${state.showFOV ? 'active' : ''}" id="toggle-fov">
        <span class="aimbot-toggle-label">Show FOV</span>
        <div class="aimbot-toggle-switch"></div>
      </div>
      <div class="aimbot-toggle wall-lock ${state.lockThroughWalls ? 'active' : ''}" id="toggle-wall">
        <span class="aimbot-toggle-label">🔒 LOCK THROUGH WALLS</span>
        <div class="aimbot-toggle-switch"></div>
      </div>
    </div>
  `;

  const button = document.createElement("button");
  button.id = "my-mod-button";
  button.textContent = "◆ MODS ◆";

  const fovCircle = document.createElement("div");
  fovCircle.id = "aimbot-fov";
  
  const targetIndicator = document.createElement("div");
  targetIndicator.id = "aimbot-target";

  document.body.appendChild(menu);
  document.body.appendChild(slider);
  document.body.appendChild(button);
  document.body.appendChild(fovCircle);
  document.body.appendChild(targetIndicator);

  const body = menu.querySelector(".mm-body");
  const closeButton = menu.querySelector(".mm-close");
  const strengthSlider = slider.querySelector("input");
  const strengthValue = slider.querySelector(".slider-value");
  
  // Toggle handlers
  const teamToggle = slider.querySelector("#toggle-team");
  const fovToggle = slider.querySelector("#toggle-fov");
  const wallToggle = slider.querySelector("#toggle-wall");

  teamToggle.addEventListener("click", () => {
    state.teamCheck = !state.teamCheck;
    teamToggle.classList.toggle("active", state.teamCheck);
    console.log("[◆ MOD MENU ◆] Team check:", state.teamCheck ? "ON" : "OFF");
  });
  
  fovToggle.addEventListener("click", () => {
    state.showFOV = !state.showFOV;
    fovToggle.classList.toggle("active", state.showFOV);
    fovCircle.style.display = (state.aimbot && state.showFOV) ? "block" : "none";
    if (state.aimbot && state.showFOV) updateFOVCircle();
  });
  
  wallToggle.addEventListener("click", () => {
    state.lockThroughWalls = !state.lockThroughWalls;
    wallToggle.classList.toggle("active", state.lockThroughWalls);
    console.log("[◆ MOD MENU ◆] Lock through walls:", state.lockThroughWalls ? "ON" : "OFF");
  });

  function renderHome() {
    state.section = null;
    body.innerHTML = `
      <div class="mm-home">
        <button class="mm-section" data-section="FUN">◆ FUN ◆</button>
        <button class="mm-section" data-section="ADVANTAGES">◆ ADVANTAGES ◆</button>
        <button class="mm-section" data-section="VISUAL">◆ VISUAL ◆</button>
      </div>
    `;
    body.querySelectorAll(".mm-section").forEach(btn => {
      btn.addEventListener("click", () => renderSection(btn.dataset.section));
    });
  }

  function renderSection(section) {
    state.section = section;
    const mods = ["SLOT 1", "SLOT 2", "SLOT 3", "SLOT 4", "SLOT 5", "SLOT 6"];

    if (section === "ADVANTAGES") {
      mods[0] = "AIMBOT";
    }

    body.innerHTML = `
      <button class="mm-back">← RETURN</button>
      <div style="font-family: 'Orbitron', sans-serif; font-size:18px; font-weight:800; margin-bottom:16px; letter-spacing:3px; color: #ffd700; text-shadow: 0 0 10px rgba(255,215,0,0.5); text-align: center;">
        ◆ ${section} ◆
      </div>
      <div class="mm-grid">
        ${mods.map((name, i) => `
          <button class="mm-mod ${section === "ADVANTAGES" && i === 0 && state.aimbot ? "active" : ""}"
            data-index="${i}">${name}</button>
        `).join("")}
      </div>
      <div class="mm-status">
        ${section === "ADVANTAGES"
          ? `◆ AIMBOT: ${state.aimbot ? "ACTIVE" : "STANDBY"} ◆\n◆ POWER: ${state.aimbotStrength}% ${state.aimbotStrength >= 100 ? '◆ INSANE MODE ◆' : ''} ◆\n◆ TARGET: ${state.target ? (state.lockThroughWalls ? "WALL LOCKED" : "LOCKED") : "SCANNING"} ◆`
          : "◆ SYSTEM READY ◆"}
      </div>
    `;

    body.querySelector(".mm-back").addEventListener("click", renderHome);

    if (section === "ADVANTAGES") {
      body.querySelector(".mm-mod[data-index='0']").addEventListener("click", toggleAimbot);
    }
  }

  function toggleAimbot() {
    state.aimbot = !state.aimbot;
    const modButton = body.querySelector(".mm-mod[data-index='0']");
    if (modButton) modButton.classList.toggle("active", state.aimbot);

    slider.style.display = state.aimbot ? "block" : "none";
    fovCircle.style.display = (state.aimbot && state.showFOV) ? "block" : "none";
    
    if (state.aimbot && state.showFOV) updateFOVCircle();

    positionSlider();

    if (state.aimbot) {
      console.log("[◆ MOD MENU ◆] Aimbot engaged - Headshot Mode");
      hookGameLoop();
    } else {
      console.log("[◆ MOD MENU ◆] Aimbot disengaged");
      targetIndicator.style.display = "none";
      state.target = null;
    }
    
    if (state.section === "ADVANTAGES") renderSection("ADVANTAGES");
  }

  function updateFOVCircle() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    fovCircle.style.width = size + "px";
    fovCircle.style.height = size + "px";
    fovCircle.style.left = (window.innerWidth / 2 - size / 2) + "px";
    fovCircle.style.top = (window.innerHeight / 2 - size / 2) + "px";
  }

  function positionSlider() {
    if (!state.aimbot) return;
    const rect = menu.getBoundingClientRect();
    slider.style.left = `${rect.right + 15}px`;
    slider.style.top = `${rect.top + 60}px`;
  }

  strengthSlider.addEventListener("input", () => {
    state.aimbotStrength = Number(strengthSlider.value);
    strengthValue.textContent = `${state.aimbotStrength}%`;
    
    // Visual feedback for insane mode
    if (state.aimbotStrength >= 100) {
      strengthValue.classList.add("insane");
      strengthValue.textContent = "100% ◆ INSANE";
    } else {
      strengthValue.classList.remove("insane");
    }
    
    const status = body.querySelector(".mm-status");
    if (status && state.section === "ADVANTAGES") {
      status.textContent = `◆ AIMBOT: ${state.aimbot ? "ACTIVE" : "STANDBY"} ◆\n◆ POWER: ${state.aimbotStrength}% ${state.aimbotStrength >= 100 ? '◆ INSANE MODE ◆' : ''} ◆\n◆ TARGET: ${state.target ? (state.lockThroughWalls ? "WALL LOCKED" : "LOCKED") : "SCANNING"} ◆`;
    }
  });

  function openMenu() {
    state.open = true;
    menu.style.display = "block";
    button.style.display = "none";
    renderHome();
    positionSlider();
  }

  function closeMenu() {
    state.open = false;
    menu.style.display = "none";
    slider.style.display = "none";
    button.style.display = "block";
  }

  closeButton.addEventListener("click", closeMenu);
  button.addEventListener("click", openMenu);

  const header = menu.querySelector(".mm-header");
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("pointerdown", e => {
    dragging = true;
    const rect = menu.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    header.setPointerCapture(e.pointerId);
  });

  header.addEventListener("pointermove", e => {
    if (!dragging) return;
    menu.style.left = `${Math.max(5, e.clientX - offsetX)}px`;
    menu.style.top = `${Math.max(5, e.clientY - offsetY)}px`;
    menu.style.bottom = "auto";
    positionSlider();
  });

  header.addEventListener("pointerup", () => dragging = false);

  window.addEventListener("resize", () => {
    positionSlider();
    if (state.aimbot && state.showFOV) updateFOVCircle();
  });

  window.__MY_MOD_MENU__ = {
    toggle() { state.open ? closeMenu() : openMenu(); },
    open: openMenu,
    close: closeMenu,
    state
  };

  closeMenu();
})();

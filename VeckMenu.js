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
    aimbotFOV: 360, // 360 = all around, lower = only in front
    teamCheck: true,
    showFOV: true,
    target: null // Track current target for locking
  };

  // AIMBOT CORE - Closest enemy detection with lock-on
  const aimbotCore = {
    active: false,
    
    // Calculate 3D distance or screen distance to enemy
    getDistanceToEnemy(target) {
      // Try to get 3D position first
      if (target.position) {
        // Three.js / game engine format
        const dx = target.position.x - (window.game?.camera?.position?.x || 0);
        const dy = target.position.y - (window.game?.camera?.position?.y || 0);
        const dz = target.position.z - (window.game?.camera?.position?.z || 0);
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
      }
      
      if (target.x !== undefined && target.y !== undefined) {
        // 2D game format
        const playerX = window.game?.localPlayer?.x || window.innerWidth / 2;
        const playerY = window.game?.localPlayer?.y || window.innerHeight / 2;
        const dx = target.x - playerX;
        const dy = target.y - playerY;
        return Math.sqrt(dx*dx + dy*dy);
      }
      
      // Fallback: Use screen position distance from center (your original method)
      const pos = this.getTargetPos(target);
      if (!pos) return Infinity;
      
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      return Math.sqrt(Math.pow(pos.x - cx, 2) + Math.pow(pos.y - cy, 2));
    },
    
    // Get screen position of target
    getTargetPos(target) {
      // DOM element
      if (target.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }
      
      // Game object with 3D to 2D projection
      if (target.position && window.game?.camera) {
        // Simple projection - may need adjustment per game
        const pos = target.position.clone ? target.position.clone() : target.position;
        pos.project(window.game.camera);
        return {
          x: (pos.x + 1) * window.innerWidth / 2,
          y: (-pos.y + 1) * window.innerHeight / 2
        };
      }
      
      // Direct coordinates
      if (target.x !== undefined && target.y !== undefined) {
        return { x: target.x, y: target.y };
      }
      
      return null;
    },
    
    // Check if target is on screen
    isOnScreen(pos) {
      return pos && 
             pos.x > 0 && pos.x < window.innerWidth &&
             pos.y > 0 && pos.y < window.innerHeight;
    },
    
    // Check if target is within FOV angle
    isInFOV(target) {
      if (state.aimbotFOV >= 360) return true;
      
      const pos = this.getTargetPos(target);
      if (!pos) return false;
      
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const angle = Math.atan2(pos.y - cy, pos.x - cx) * 180 / Math.PI;
      const normalizedAngle = ((angle % 360) + 360) % 360;
      const centerAngle = 0; // Forward is 0 degrees
      
      const angleDiff = Math.abs(normalizedAngle - centerAngle);
      return angleDiff <= state.aimbotFOV / 2;
    },
    
    // Find closest enemy by distance
    findClosestEnemy() {
      const targets = this.findTargets();
      if (targets.length === 0) return null;
      
      let closest = null;
      let closestDist = Infinity;
      
      for (const target of targets) {
        // Skip if not on screen
        const pos = this.getTargetPos(target);
        if (!this.isOnScreen(pos)) continue;
        
        // Skip if outside FOV
        if (!this.isInFOV(target)) continue;
        
        const dist = this.getDistanceToEnemy(target);
        
        if (dist < closestDist) {
          closestDist = dist;
          closest = { element: target, pos, dist };
        }
      }
      
      return closest;
    },
    
    // Find all potential targets
    findTargets() {
      const targets = [];
      
      // Method 1: Game object (most common)
      if (window.game) {
        if (window.game.players) {
          Object.values(window.game.players).forEach(p => {
            if (p && !p.isLocal && p.active !== false && p.health > 0) {
              if (!state.teamCheck || p.team !== window.game.localPlayer?.team) {
                targets.push(p);
              }
            }
          });
        }
        if (window.game.enemies) {
          Object.values(window.game.enemies).forEach(e => {
            if (e && e.active !== false) targets.push(e);
          });
        }
        if (window.game.entities) {
          Object.values(window.game.entities).forEach(e => {
            if (e && e.type === 'enemy' && e.active !== false) targets.push(e);
          });
        }
      }
      
      // Method 2: DOM elements
      if (targets.length === 0) {
        const selectors = [
          '.player:not(.local)', '.enemy', '[class*="enemy"]',
          '[class*="opponent"]', '[class*="target"]',
          '[data-team]:not([data-team="own"])'
        ];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 5 && rect.height > 5) {
              // Check if visible
              const style = window.getComputedStyle(el);
              if (style.display !== 'none' && style.visibility !== 'hidden') {
                targets.push(el);
              }
            }
          });
        }
      }
      
      return targets;
    },
    
    // Lock onto target and aim
    lockOnto(targetData) {
      if (!targetData || !targetData.pos) return;
      
      const { pos } = targetData;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      
      // Calculate how far we need to move
      const dx = pos.x - cx;
      const dy = pos.y - cy;
      
      // Apply strength as smoothing (higher = faster lock)
      const strength = state.aimbotStrength / 100;
      const speed = 0.05 + (strength * 0.95); // 5% to 100% speed per frame
      
      // Move toward target
      const moveX = dx * speed;
      const moveY = dy * speed;
      
      // Update visual indicator
      const indicator = document.getElementById('aimbot-target');
      if (indicator) {
        indicator.style.display = 'block';
        indicator.style.left = (pos.x - 5) + 'px';
        indicator.style.top = (pos.y - 5) + 'px';
      }
      
      // Method 1: Pointer lock games (FPS)
      if (document.pointerLockElement) {
        const canvas = document.pointerLockElement;
        const event = new MouseEvent('mousemove', {
          movementX: moveX,
          movementY: moveY,
          bubbles: true
        });
        canvas.dispatchEvent(event);
        
        // Some games read raw movement
        if (window.game?.controls) {
          window.game.controls.yaw -= moveX * 0.002;
          window.game.controls.pitch -= moveY * 0.002;
        }
        return;
      }
      
      // Method 2: Camera-based games
      if (window.game?.camera) {
        const sensitivity = 0.002;
        window.game.camera.rotation.y -= moveX * sensitivity;
        window.game.camera.rotation.x -= moveY * sensitivity;
        return;
      }
      
      // Method 3: Mouse-based games
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
    
    // Main update loop
    update() {
      if (!state.aimbot) {
        const indicator = document.getElementById('aimbot-target');
        if (indicator) indicator.style.display = 'none';
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

  // Hook into game loop
  const hookGameLoop = () => {
    if (window.__aimbotHooked) return;
    window.__aimbotHooked = true;
    
    // Patch requestAnimationFrame
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      aimbotCore.update();
      return originalRAF.call(this, callback);
    };
    
    // Backup interval
    setInterval(() => aimbotCore.update(), 1000 / 60);
  };

  const style = document.createElement("style");
  style.textContent = `
    #my-mod-menu, #my-mod-menu * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
    }
    #my-mod-menu {
      position: fixed;
      left: 22px;
      bottom: 22px;
      width: 310px;
      background: #17171d;
      color: white;
      border: 1px solid #444451;
      border-radius: 10px;
      box-shadow: 0 12px 35px rgba(0,0,0,.55);
      z-index: 2147483647;
      overflow: hidden;
      user-select: none;
    }
    #my-mod-menu .mm-header {
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 15px;
      background: #202027;
      border-bottom: 1px solid #383842;
      cursor: move;
      font-weight: 800;
      letter-spacing: 1px;
    }
    #my-mod-menu .mm-title { font-size: 16px; }
    #my-mod-menu .mm-close {
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 6px;
      background: #30303a;
      color: #ddd;
      cursor: pointer;
      font-size: 18px;
    }
    #my-mod-menu .mm-close:hover { background: #444450; }
    #my-mod-menu .mm-body { padding: 14px; }
    #my-mod-menu .mm-home { display: grid; gap: 10px; }
    #my-mod-menu .mm-section {
      height: 58px;
      border: 1px solid #454550;
      background: #24242d;
      color: white;
      border-radius: 7px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 700;
      text-align: left;
      padding: 0 17px;
      transition: .12s;
    }
    #my-mod-menu .mm-section:hover {
      background: #30303b;
      border-color: #656575;
      transform: translateX(2px);
    }
    #my-mod-menu .mm-back {
      background: transparent;
      border: 0;
      color: #aaa;
      cursor: pointer;
      padding: 0 0 12px;
      font-size: 13px;
    }
    #my-mod-menu .mm-back:hover { color: white; }
    #my-mod-menu .mm-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    #my-mod-menu .mm-mod {
      min-height: 48px;
      background: #25252e;
      border: 1px solid #40404c;
      color: #ddd;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }
    #my-mod-menu .mm-mod:hover { background: #30303b; }
    #my-mod-menu .mm-mod.active {
      background: #34344a;
      border-color: #7777ff;
      color: white;
    }
    #my-mod-menu .mm-status {
      margin-top: 12px;
      padding: 10px;
      border-radius: 6px;
      background: #202027;
      color: #999;
      font-size: 11px;
      line-height: 1.4;
    }
    #my-mod-slider {
      position: fixed;
      display: none;
      z-index: 2147483646;
      width: 190px;
      padding: 13px;
      background: #17171d;
      border: 1px solid #444451;
      border-radius: 9px;
      box-shadow: 0 10px 30px rgba(0,0,0,.5);
      color: white;
    }
    #my-mod-slider .slider-title {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    #my-mod-slider input { width: 100%; accent-color: #7777ff; }
    #my-mod-slider .slider-value {
      text-align: center;
      color: #aaa;
      font-size: 11px;
      margin-top: 5px;
    }
    #my-mod-button {
      position: fixed;
      left: 18px;
      bottom: 18px;
      z-index: 2147483647;
      display: none;
      padding: 11px 17px;
      border: 1px solid #555563;
      border-radius: 7px;
      background: #202027;
      color: white;
      cursor: pointer;
      font-size: 13px;
      font-weight: 800;
      box-shadow: 0 7px 22px rgba(0,0,0,.45);
    }
    #my-mod-button:hover { background: #30303b; }
    #aimbot-fov {
      position: fixed;
      pointer-events: none;
      z-index: 2147483645;
      border: 2px solid rgba(119, 119, 255, 0.3);
      border-radius: 50%;
      display: none;
    }
    #aimbot-target {
      position: fixed;
      width: 12px;
      height: 12px;
      background: #ff4444;
      border: 2px solid white;
      border-radius: 50%;
      pointer-events: none;
      z-index: 2147483646;
      display: none;
      box-shadow: 0 0 15px #ff4444, 0 0 30px #ff4444;
      animation: pulse 0.3s ease-in-out infinite alternate;
    }
    @keyframes pulse {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(1.3); opacity: 0.7; }
    }
  `;
  document.head.appendChild(style);

  const menu = document.createElement("div");
  menu.id = "my-mod-menu";
  menu.innerHTML = `
    <div class="mm-header">
      <span class="mm-title">MOD MENU</span>
      <button class="mm-close">×</button>
    </div>
    <div class="mm-body"></div>
  `;

  const slider = document.createElement("div");
  slider.id = "my-mod-slider";
  slider.innerHTML = `
    <div class="slider-title">AIMBOT STRENGTH</div>
    <input type="range" min="1" max="100" value="50">
    <div class="slider-value">50%</div>
  `;

  const button = document.createElement("button");
  button.id = "my-mod-button";
  button.textContent = "MODS";

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

  function renderHome() {
    state.section = null;
    body.innerHTML = `
      <div class="mm-home">
        <button class="mm-section" data-section="FUN">FUN</button>
        <button class="mm-section" data-section="ADVANTAGES">ADVANTAGES</button>
        <button class="mm-section" data-section="VISUAL">VISUAL</button>
      </div>
    `;
    body.querySelectorAll(".mm-section").forEach(btn => {
      btn.addEventListener("click", () => renderSection(btn.dataset.section));
    });
  }

  function renderSection(section) {
    state.section = section;
    const mods = ["Mod Slot 1", "Mod Slot 2", "Mod Slot 3", "Mod Slot 4", "Mod Slot 5", "Mod Slot 6"];

    if (section === "ADVANTAGES") {
      mods[0] = "Aimbot (Closest)";
      mods[1] = "Team Check";
      mods[2] = "Show FOV";
    }

    body.innerHTML = `
      <button class="mm-back">← Back</button>
      <div style="font-size:17px; font-weight:800; margin-bottom:12px;">${section}</div>
      <div class="mm-grid">
        ${mods.map((name, i) => `
          <button class="mm-mod ${section === "ADVANTAGES" && i === 0 && state.aimbot ? "active" : ""}
            ${section === "ADVANTAGES" && i === 1 && state.teamCheck ? "active" : ""}
            ${section === "ADVANTAGES" && i === 2 && state.showFOV ? "active" : ""}"
            data-index="${i}">${name}</button>
        `).join("")}
      </div>
      <div class="mm-status">
        ${section === "ADVANTAGES"
          ? `Aimbot: ${state.aimbot ? "ON" : "OFF"} | Strength: ${state.aimbotStrength}% | Target: ${state.target ? "LOCKED" : "NONE"}`
          : "More mods coming soon."}
      </div>
    `;

    body.querySelector(".mm-back").addEventListener("click", renderHome);

    if (section === "ADVANTAGES") {
      body.querySelector(".mm-mod[data-index='0']").addEventListener("click", toggleAimbot);
      body.querySelector(".mm-mod[data-index='1']").addEventListener("click", toggleTeamCheck);
      body.querySelector(".mm-mod[data-index='2']").addEventListener("click", toggleShowFOV);
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
      console.log("[Mod Menu] Aimbot enabled - Closest Enemy Mode");
      hookGameLoop();
    } else {
      console.log("[Mod Menu] Aimbot disabled");
      targetIndicator.style.display = "none";
      state.target = null;
    }
    
    if (state.section === "ADVANTAGES") renderSection("ADVANTAGES");
  }
  
  function toggleTeamCheck() {
    state.teamCheck = !state.teamCheck;
    const modButton = body.querySelector(".mm-mod[data-index='1']");
    if (modButton) modButton.classList.toggle("active", state.teamCheck);
    console.log("[Mod Menu] Team check:", state.teamCheck);
  }
  
  function toggleShowFOV() {
    state.showFOV = !state.showFOV;
    const modButton = body.querySelector(".mm-mod[data-index='2']");
    if (modButton) modButton.classList.toggle("active", state.showFOV);
    fovCircle.style.display = (state.aimbot && state.showFOV) ? "block" : "none";
    if (state.aimbot && state.showFOV) updateFOVCircle();
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
    slider.style.left = `${rect.right + 10}px`;
    slider.style.top = `${rect.top + 48}px`;
  }

  strengthSlider.addEventListener("input", () => {
    state.aimbotStrength = Number(strengthSlider.value);
    strengthValue.textContent = `${state.aimbotStrength}%`;
    const status = body.querySelector(".mm-status");
    if (status && state.section === "ADVANTAGES") {
      status.textContent = `Aimbot: ${state.aimbot ? "ON" : "OFF"} | Strength: ${state.aimbotStrength}% | Target: ${state.target ? "LOCKED" : "NONE"}`;
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

  // Dragging
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

javascript:(function(){
    // --- Configuration ---
    const config = {
        aimbot: {
            enabled: false,
            fov: 180,
            smooth: 5,
            maxDistance: 800,
            showFov: true
        },
    };

    // --- Global State ---
    let target = null;
    let menuDiv = null;
    let modsBtn = null;
    let isMenuOpen = false;
    let settingsDiv = null; 
    let contentDiv = null;
    let fovCanvas = null;
    let ctx = null;
    let currentSection = 'home';
    
    // --- Menu UI ---
    const createMenu = () => {
        if (menuDiv) return;

        // Toggle Button
        modsBtn = document.createElement('button');
        modsBtn.innerText = "Mods";
        modsBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 10000;
            padding: 12px 24px;
            background: #007aff;
            color: white;
            border: 2px solid transparent;
            cursor: pointer;
            border-radius: 20px;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            touch-action: manipulation;
            font-family: sans-serif;
        `;
        modsBtn.onclick = () => {
            isMenuOpen = !isMenuOpen;
            menuDiv.style.display = isMenuOpen ? 'block' : 'none';
            settingsDiv.style.display = isMenuOpen ? 'block' : 'none';
        };
        document.body.appendChild(modsBtn);

        // Main Menu Container
        menuDiv = document.createElement('div');
        menuDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1c1c1e;
            color: white;
            padding: 0;
            border-radius: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            z-index: 9999;
            width: 300px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 1px solid #333;
            transition: transform 0.2s ease;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 15px;
            background: #2c2c2e;
            text-align: center;
            font-weight: bold;
            border-bottom: 1px solid #444;
            user-select: none;
        `;
        header.innerText = "Veck Menu";
        menuDiv.appendChild(header);

        // Content Area
        contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            touch-action: pan-y;
        `;
        menuDiv.appendChild(contentDiv);

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 10px;
            background: #2c2c2e;
            text-align: center;
            border-top: 1px solid #444;
        `;
        const closeBtn = document.createElement('button');
        closeBtn.innerText = "Close";
        closeBtn.style.cssText = `
            background: #ff3b30;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            width: 100%;
        `;
        closeBtn.onclick = () => {
            isMenuOpen = false;
            menuDiv.style.display = 'none';
            settingsDiv.style.display = 'none';
        };
        footer.appendChild(closeBtn);
        menuDiv.appendChild(footer);

        // --- External Settings Panel (To the right) ---
        settingsDiv = document.createElement('div');
        settingsDiv.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            background: #1c1c1e;
            color: white;
            padding: 20px;
            border-radius: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            z-index: 9998;
            width: 250px;
            display: none;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 1px solid #333;
        `;
        const settingsHeader = document.createElement('h3');
        settingsHeader.innerText = "Settings";
        settingsHeader.style.marginTop = '0';
        settingsDiv.appendChild(settingsHeader);
        
        const settingsContent = document.createElement('div');
        settingsContent.id = 'settings-content';
        settingsContent.style.display = 'flex';
        settingsContent.style.flexDirection = 'column';
        settingsContent.style.gap = '10px';
        settingsDiv.appendChild(settingsContent);

        document.body.appendChild(menuDiv);
        document.body.appendChild(settingsDiv);
        
        makeDraggable(menuDiv, header);
        makeDraggable(settingsDiv, settingsHeader);

        renderHome();
    };

    // --- View Rendering ---
    const renderHome = () => {
        currentSection = 'home';
        settingsDiv.style.display = 'none';
        menuDiv.style.transform = 'translate(-50%, -50%)'; // Center menu
        contentDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <button onclick="window._vSwitch('fun')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 600;">
                    🎉 Fun
                </button>
                <button onclick="window._vSwitch('advantages')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 600;">
                    ⚡ Advantages
                </button>
                <button onclick="window._vSwitch('visual')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 600;">
                    👁️ Visual
                </button>
            </div>
        `;
    };

    const renderFun = () => {
        currentSection = 'fun';
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <button onclick="window._vSwitch('home')" style="background: none; border: none; color: #007aff; font-size: 16px; padding: 0; margin-right: 10px;">← Back</button>
                <h3 style="margin: 0;">Fun</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button onclick="alert('Speed mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🏃 Speed</button>
                <button onclick="alert('Fly mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🦅 Fly</button>
                <button onclick="alert('Jump mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🦘 Jump</button>
                <button onclick="alert('Skin mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🎨 Skin</button>
                <button onclick="alert('Emote mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">😂 Emote</button>
                <button onclick="alert('Pet mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🐶 Pet</button>
            </div>
        `;
    };

    const renderAdvantages = () => {
        currentSection = 'advantages';
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <button onclick="window._vSwitch('home')" style="background: none; border: none; color: #007aff; font-size: 16px; padding: 0; margin-right: 10px;">← Back</button>
                <h3 style="margin: 0;">Advantages</h3>
            </div>
            
            <!-- Main Aimbot Button (Now in the exact spot Settings was) -->
            <button id="aimbotMainBtn" onclick="window._toggleAimbotBtn()" style="padding: 20px; background: #3a3a3c; color: white; border: 2px solid #555; border-radius: 12px; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
                🎯 Aimbot
            </button>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <!-- Now Aimbot opens settings -->
                <button onclick="window._vSwitch('aimbot')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">
                    ⚙️ Settings
                </button>
                <button onclick="alert('Regen mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🛡️ Regen</button>
                <button onclick="alert('Speed mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">⚡ Speed</button>
                <button onclick="alert('Fly mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🚀 Fly</button>
                <button onclick="alert('Explosive mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">💥 Explosive</button>
                <button onclick="alert('Rocket mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🔥 Rocket</button>
            </div>
        `;
    };

    const renderVisuals = () => {
        currentSection = 'visual';
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <button onclick="window._vSwitch('home')" style="background: none; border: none; color: #007aff; font-size: 16px; padding: 0; margin-right: 10px;">← Back</button>
                <h3 style="margin: 0;">Visual</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button onclick="alert('ESP Box mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">📦 ESP Box</button>
                <button onclick="alert('Lines mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">📏 Lines</button>
                <button onclick="alert('Health Bar mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">❤️ Health</button>
                <button onclick="alert('Name Tags mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🏷️ Names</button>
                <button onclick="alert('Chams mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🎨 Chams</button>
                <button onclick="alert('No Fog mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🌫️ No Fog</button>
            </div>
        `;
    };

    const renderAimbotSettings = () => {
        // Slide menu to left
        menuDiv.style.transform = 'translate(calc(-50% - 140px), -50%)';
        settingsDiv.style.display = 'block';

        const container = document.getElementById('settings-content');
        container.innerHTML = `
            <div style="margin-bottom: 10px;">
                <label style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Smoothness</span>
                    <span id="smoothVal">${config.aimbot.smooth}</span>
                </label>
                <input type="range" id="smoothRange" min="1" max="20" value="${config.aimbot.smooth}" style="width: 100%;">
                <small style="color: #888;">Higher = Smoother</small>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                <label>Show FOV Circle</label>
                <input type="checkbox" id="showFov" ${config.aimbot.showFov ? 'checked' : ''} onchange="window._toggleShowFov(this.checked)">
            </div>

            <div style="margin-bottom: 10px;">
                <label style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>FOV Radius</span>
                    <span id="fovVal">${config.aimbot.fov}</span>
                </label>
                <input type="range" id="fovRange" min="1" max="360" value="${config.aimbot.fov}" style="width: 100%;">
            </div>
            
            <button onclick="window._vSwitch('advantages')" style="padding: 10px; background: #ff3b30; color: white; border: none; border-radius: 8px; margin-top: 10px;">
                Back to Menu
            </button>
        `;

        const smoothRange = container.querySelector('#smoothRange');
        const fovRange = container.querySelector('#fovRange');
        const showFov = container.querySelector('#showFov');

        smoothRange.oninput = (e) => {
            config.aimbot.smooth = parseInt(e.target.value);
            container.querySelector('#smoothVal').innerText = e.target.value;
        };
        fovRange.oninput = (e) => {
            config.aimbot.fov = parseInt(e.target.value);
            container.querySelector('#fovVal').innerText = e.target.value;
        };
    };

    // Global switcher
    window._vSwitch = (section) => {
        if (section === 'fun') renderFun();
        else if (section === 'advantages') renderAdvantages();
        else if (section === 'visual') renderVisuals();
        else if (section === 'aimbot') renderAimbotSettings();
        else if (section === 'home') renderHome();
        
        updateAimbotButton();
    };

    // --- Logic for Aimbot Button ---
    window._toggleAimbotBtn = () => {
        config.aimbot.enabled = !config.aimbot.enabled;
        target = null; 
        updateAimbotButton();
    };

    const updateAimbotButton = () => {
        const btn = document.getElementById('aimbotMainBtn');
        if (btn) {
            if (config.aimbot.enabled) {
                btn.style.borderColor = '#32d74b'; // Green outline
                btn.style.boxShadow = '0 0 10px rgba(50, 215, 75, 0.5)';
                btn.innerText = "🎯 Aimbot: ON";
            } else {
                btn.style.borderColor = '#555'; // Grey outline
                btn.style.boxShadow = 'none';
                btn.innerText = "🎯 Aimbot";
            }
        }
    };

    window._toggleShowFov = (checked) => {
        config.aimbot.showFov = checked;
    };

    // --- Drag Logic ---
    const makeDraggable = (el, handle) => {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const onStart = (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            initialLeft = el.offsetLeft;
            initialTop = el.offsetTop;
            el.style.transition = 'none';
            el.style.transform = 'none';
        };

        const onMove = (e) => {
            if (!isDragging) return;
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            el.style.left = `${initialLeft + dx}px`;
            el.style.top = `${initialTop + dy}px`;
        };

        const onEnd = () => {
            isDragging = false;
            el.style.transition = 'all 0.1s ease';
        };

        const h = handle || el.querySelector('div[style*="padding: 15px"]');
        if(h) {
            h.addEventListener('mousedown', onStart);
            h.addEventListener('touchstart', onStart, { passive: false });
        }

        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);
    };

    // --- Aimbot Logic ---
    const aimbotCore = {
        update: () => {
            // Use DOM scanning for Veck.io
            const camEl = document.querySelector('[class*="camera"]') || document.querySelector('[class*="Camera"]');
            if (!camEl) return;

            if (!config.aimbot.enabled) {
                target = null;
                return;
            }

            const players = Array.from(document.querySelectorAll('[class*="player"]'));
            if (!players.length) return;

            // Get camera transform
            const camTransform = camEl.getAttribute('transform');
            const camMatch = camTransform.match(/-?\d+/g);
            if (!camMatch) return;
            
            const camX = parseFloat(camMatch[0]);
            const camY = parseFloat(camMatch[1]);
            const camZ = parseFloat(camMatch[2]);

            let closestDist = Infinity;
            let closestPlayer = null;

            players.forEach(p => {
                if (!p.style.display || p.style.display === 'none') return;
                
                const pTransform = p.getAttribute('transform');
                const pMatch = pTransform.match(/-?\d+/g);
                if (!pMatch) return;

                const pX = parseFloat(pMatch[0]);
                const pY = parseFloat(pMatch[1]);
                const pZ = parseFloat(pMatch[2]);

                const dx = pX - camX;
                const dy = pY - camY;
                const dz = pZ - camZ;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

                if (dist > config.aimbot.maxDistance) return;

                // Angle check
                const angle = Math.atan2(dx, dz);
                const camRot = camMatch[3] ? parseFloat(camMatch[3]) : 0;
                let angleDiff = Math.abs(angle - camRot);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                if (angleDiff < (config.aimbot.fov / 2) * (Math.PI / 180)) {
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestPlayer = p;
                    }
                }
            });

            target = closestPlayer;

            if (target) {
                const tTransform = target.getAttribute('transform');
                const tMatch = tTransform.match(/-?\d+/g);
                const tX = parseFloat(tMatch[0]);
                const tY = parseFloat(tMatch[1]);
                const tZ = parseFloat(tMatch[2]);

                const targetAngle = Math.atan2(tX - camX, tZ - camZ);
                const camRotX = parseFloat(camMatch[3]) || 0;
                let diff = targetAngle - camRotX;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                
                camEl.setAttribute('transform', 
                    `${camX} ${camY} ${camZ} ${camRotX + diff / config.aimbot.smooth} 0 0`
                );
            }
        }
    };

    // --- Visuals (FOV) ---
    const hookRender = () => {
        if (window.__aimbotRendered) return;
        window.__aimbotRendered = true;

        if (!document.getElementById('veks-fov-canvas')) {
            fovCanvas = document.createElement('canvas');
            fovCanvas.id = 'veks-fov-canvas';
            fovCanvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9998;
            `;
            document.body.appendChild(fovCanvas);
            ctx = fovCanvas.getContext('2d');
        }

        window.requestAnimationFrame(function renderLoop() {
            if (fovCanvas && config.aimbot.showFov && target) {
                const canvas = fovCanvas;
                const ctx = canvas.getContext('2d');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;

                const screenPos = projectToScreen(target);
                if (screenPos) {
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, 20, 0, Math.PI * 2);
                    ctx.strokeStyle = '#007aff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(screenPos.x - 5, screenPos.y);
                    ctx.lineTo(screenPos.x + 5, screenPos.y);
                    ctx.moveTo(screenPos.x, screenPos.y - 5);
                    ctx.lineTo(screenPos.x, screenPos.y + 5);
                    ctx.stroke();
                }
            } else if (fovCanvas) {
                const ctx = fovCanvas.getContext('2d');
                ctx.clearRect(0, 0, fovCanvas.width, fovCanvas.height);
            }
            
            requestAnimationFrame(renderLoop);
        });
    };

    // --- Helper ---
    const projectToScreen = (el) => {
        const camEl = document.querySelector('[class*="camera"]');
        if (!camEl) return null;
        
        const transform = camEl.getAttribute('transform');
        const match = transform.match(/-?\d+/g);
        if (!match) return null;
        
        const camX = parseFloat(match[0]);
        const camY = parseFloat(match[1]);
        const camZ = parseFloat(match[2]);
        const camRot = parseFloat(match[3]) || 0;

        const pTransform = el.getAttribute('transform');
        const pMatch = pTransform.match(/-?\d+/g);
        if (!pMatch) return null;

        const pX = parseFloat(pMatch[0]);
        const pY = parseFloat(pMatch[1]);
        const pZ = parseFloat(pMatch[2]);

        const dx = pX - camX;
        const dz = pZ - camZ;
        const dy = pY - camY;
        
        const cosX = Math.cos(camRot);
        const sinX = Math.sin(camRot);
        
        const rx = dx * cosX - dz * sinX;
        const rz = dx * sinX + dz * cosX;
        
        const fov = 60; 
        const fovRad = fov * (Math.PI / 180);
        
        if (rz <= 0) return null; 
        
        const screenX = window.innerWidth / 2 + (rx / rz) * (window.innerWidth / (2 * Math.tan(fovRad / 2)));
        const screenY = window.innerHeight / 2 - (dy / rz) * (window.innerHeight / (2 * Math.tan(fovRad / 2)));
        
        return { x: screenX, y: screenY };
    };

    // --- Initialization ---
    const init = () => {
        createMenu();
        hookRender();
    };

    init();

})();

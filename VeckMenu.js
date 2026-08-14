javascript:(function(){
    // --- Configuration ---
    const config = {
        aimbot: {
            enabled: true,
            fov: 180,
            smooth: 5,
            maxDistance: 800,
            silent: false,
            autoFire: false,
            autoFireDelay: 150
        }
    };

    // --- State ---
    let target = null;
    let isFiring = false;
    let fireTimer = 0;

    // --- DOM Elements ---
    let menuDiv = null;
    let modsBtn = null;
    let isMenuOpen = false;

    // --- Initialization ---
    const init = () => {
        createMenu();
        hookGameLoop();
    };

    // --- Menu UI ---
    const createMenu = () => {
        if (menuDiv) return;

        // Create the small "Mods" toggle button
        modsBtn = document.createElement('button');
        modsBtn.innerText = "Mods";
        modsBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 10000;
            padding: 10px 20px;
            background: #333;
            color: white;
            border: 1px solid #666;
            cursor: pointer;
            border-radius: 4px;
            font-size: 14px;
            touch-action: manipulation;
        `;
        modsBtn.onclick = () => {
            isMenuOpen = !isMenuOpen;
            menuDiv.style.display = isMenuOpen ? 'block' : 'none';
        };
        document.body.appendChild(modsBtn);

        // Create the main menu
        menuDiv = document.createElement('div');
        menuDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            z-index: 9999;
            min-width: 220px;
            border: 1px solid #444;
            display: none;
            touch-action: none; /* Prevent scrolling while dragging */
        `;

        menuDiv.innerHTML = `
            <h3 style="margin: 0 0 15px; text-align: center; border-bottom: 1px solid #444; padding-bottom: 10px;">Veck Aimbot</h3>
            
            <label style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span>FOV: <span id="fovVal">${config.aimbot.fov}</span></span>
                <input type="range" id="fovRange" min="1" max="360" value="${config.aimbot.fov}" style="width: 100px;">
            </label>

            <label style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span>Smooth: <span id="smoothVal">${config.aimbot.smooth}</span></span>
                <input type="range" id="smoothRange" min="1" max="20" value="${config.aimbot.smooth}" style="width: 100px;">
            </label>

            <label style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span>Range: <span id="distVal">${config.aimbot.maxDistance}</span></span>
                <input type="range" id="distRange" min="100" max="2000" value="${config.aimbot.maxDistance}" style="width: 100px;">
            </label>

            <label style="margin-bottom: 10px; display: block;">
                <input type="checkbox" id="silentCheck"> Silent Aim
            </label>
            
            <label style="margin-bottom: 15px; display: block;">
                <input type="checkbox" id="autoFireCheck"> Auto Fire
            </label>

            <div style="text-align: center; font-size: 12px; color: #888;">
                Status: <span id="statusText" style="color: #0f0;">On</span>
            </div>
        `;

        document.body.appendChild(menuDiv);

        // Bind Inputs
        const fovInput = menuDiv.querySelector('#fovRange');
        const smoothInput = menuDiv.querySelector('#smoothRange');
        const distInput = menuDiv.querySelector('#distRange');
        const silentCheckbox = menuDiv.querySelector('#silentCheck');
        const autoFireCheckbox = menuDiv.querySelector('#autoFireCheck');
        const statusText = menuDiv.querySelector('#statusText');

        fovInput.oninput = (e) => { 
            config.aimbot.fov = parseInt(e.target.value); 
            menuDiv.querySelector('#fovVal').innerText = e.target.value; 
        };
        smoothInput.oninput = (e) => { 
            config.aimbot.smooth = parseInt(e.target.value); 
            menuDiv.querySelector('#smoothVal').innerText = e.target.value; 
        };
        distInput.oninput = (e) => { 
            config.aimbot.maxDistance = parseInt(e.target.value); 
            menuDiv.querySelector('#distVal').innerText = e.target.value; 
        };
        silentCheckbox.onchange = (e) => { config.aimbot.silent = e.target.checked; };
        autoFireCheckbox.onchange = (e) => { config.aimbot.autoFire = e.target.checked; };
        
        // Make the menu draggable for mobile
        makeDraggable(menuDiv);
    };

    // --- Drag Logic for Mobile ---
    const makeDraggable = (el) => {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const onStart = (e) => {
            isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            initialLeft = el.offsetLeft;
            initialTop = el.offsetTop;
            el.style.transition = 'none';
        };

        const onMove = (e) => {
            if (!isDragging) return;
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            el.style.left = `${initialLeft + dx}px`;
            el.style.top = `${initialTop + dy}px`;
            el.style.transform = 'none'; // Remove center transform while dragging
        };

        const onEnd = () => {
            isDragging = false;
            el.style.transition = 'all 0.1s ease';
        };

        el.addEventListener('mousedown', onStart);
        el.addEventListener('touchstart', onStart, { passive: false });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);
    };

    // --- Aimbot Logic ---
    const aimbotCore = {
        update: () => {
            if (!window.game || !window.game.camera) return;
            if (!config.aimbot.enabled) {
                target = null;
                return;
            }

            const players = window.game.entities.players;
            if (!players) return;

            let closestDist = Infinity;
            let closestPlayer = null;
            const camPos = window.game.camera.position;

            players.forEach(p => {
                if (!p || !p.visible) return;
                
                const dx = p.position.x - camPos.x;
                const dy = p.position.y - camPos.y;
                const dz = p.position.z - camPos.z;
                const dist = Math.sqrt(dx*dx + dz*dz);

                if (dist > config.aimbot.maxDistance) return;

                const angle = Math.atan2(dx, dz);
                const camRot = window.game.camera.rotation;
                
                // Simple FOV check
                let angleDiff = Math.abs(angle - camRot.x);
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
                const camRot = window.game.camera.rotation;
                const targetAngle = Math.atan2(target.position.x - camPos.x, target.position.z - camPos.z);
                
                let diff = targetAngle - camRot.x;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                camRot.x += diff / config.aimbot.smooth;

                if (config.aimbot.silent) {
                    const targetY = target.position.y + 1.5;
                    const pitch = Math.atan2(targetY - camPos.y, closestDist);
                    window.game.camera.rotation.y += (pitch - window.game.camera.rotation.y) / config.aimbot.smooth;
                }

                if (config.aimbot.autoFire) {
                    if (!isFiring) {
                        window.game.actions.fire();
                        isFiring = true;
                        fireTimer = config.aimbot.autoFireDelay;
                    }
                } else {
                    isFiring = false;
                }
            } else {
                isFiring = false;
            }
        }
    };

    // --- Hooking ---
    const hookGameLoop = () => {
        if (window.__aimbotHooked) return;
        
        if (!window.game) {
            setTimeout(hookGameLoop, 100);
            return;
        }

        window.__aimbotHooked = true;

        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
            aimbotCore.update();
            return originalRAF.call(this, callback);
        };
    };

    // Run
    init();

})();

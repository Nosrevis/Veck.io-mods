/* VeckMenu - Combined Script */
(function() {
    // --- Configuration ---
    const config = {
        aimbot: {
            enabled: true,
            fov: 180,
            smooth: 5,
            maxDistance: 800,
            silent: false,
            key: 'Space', // Toggle key
            autoFire: false,
            autoFireDelay: 150
        }
    };

    // --- State ---
    let target = null;
    let isFiring = false;
    let fireTimer = 0;
    let keyHeld = false;

    // --- DOM Elements ---
    let menuDiv = null;
    let fovInput = null;
    let smoothInput = null;
    let distInput = null;
    let silentCheckbox = null;
    let autoFireCheckbox = null;
    let toggleBtn = null;

    // --- Initialization ---
    const init = () => {
        createMenu();
        setupInput();
        hookGameLoop();
    };

    // --- Menu UI ---
    const createMenu = () => {
        if (menuDiv) return;

        menuDiv = document.createElement('div');
        menuDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            z-index: 9999;
            min-width: 200px;
            border: 1px solid #444;
        `;

        menuDiv.innerHTML = `
            <h3 style="margin: 0 0 10px; font-size: 16px;">Veck Aimbot</h3>
            <label>FOV: <input type="range" id="fovRange" min="1" max="360" value="${config.aimbot.fov}"> <span id="fovVal">${config.aimbot.fov}</span></label><br>
            <label>Smooth: <input type="range" id="smoothRange" min="1" max="20" value="${config.aimbot.smooth}"> <span id="smoothVal">${config.aimbot.smooth}</span></label><br>
            <label>Max Dist: <input type="range" id="distRange" min="100" max="2000" value="${config.aimbot.maxDistance}"> <span id="distVal">${config.aimbot.maxDistance}</span></label><br>
            <label><input type="checkbox" id="silentCheck"> Silent Aim</label><br>
            <label><input type="checkbox" id="autoFireCheck"> Auto Fire</label><br>
            <div style="margin-top: 10px; font-size: 12px; color: #aaa;">
                Key: Space (Toggle)<br>
                Status: <span id="statusText">Off</span>
            </div>
        `;

        document.body.appendChild(menuDiv);

        // Bind Inputs
        fovInput = menuDiv.querySelector('#fovRange');
        smoothInput = menuDiv.querySelector('#smoothRange');
        distInput = menuDiv.querySelector('#distRange');
        silentCheckbox = menuDiv.querySelector('#silentCheck');
        autoFireCheckbox = menuDiv.querySelector('#autoFireCheck');
        const fovVal = menuDiv.querySelector('#fovVal');
        const smoothVal = menuDiv.querySelector('#smoothVal');
        const distVal = menuDiv.querySelector('#distVal');
        const statusText = menuDiv.querySelector('#statusText');

        fovInput.oninput = (e) => { config.aimbot.fov = parseInt(e.target.value); fovVal.innerText = e.target.value; };
        smoothInput.oninput = (e) => { config.aimbot.smooth = parseInt(e.target.value); smoothVal.innerText = e.target.value; };
        distInput.oninput = (e) => { config.aimbot.maxDistance = parseInt(e.target.value); distVal.innerText = e.target.value; };
        silentCheckbox.onchange = (e) => { config.aimbot.silent = e.target.checked; };
        autoFireCheckbox.onchange = (e) => { config.aimbot.autoFire = e.target.checked; };

        // Toggle Visibility
        menuDiv.style.display = 'none';
        toggleBtn = document.createElement('button');
        toggleBtn.innerText = "VeckMenu";
        toggleBtn.style.cssText = `
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
        `;
        toggleBtn.onclick = () => {
            menuDiv.style.display = menuDiv.style.display === 'none' ? 'block' : 'none';
        };
        document.body.appendChild(toggleBtn);
    };

    // --- Input Handling ---
    const setupInput = () => {
        document.addEventListener('keydown', (e) => {
            if (e.code === config.aimbot.key) {
                keyHeld = true;
                // Toggle status
                config.aimbot.enabled = !config.aimbot.enabled;
                const statusText = document.querySelector('#statusText');
                if(statusText) statusText.innerText = config.aimbot.enabled ? "On" : "Off";
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === config.aimbot.key) {
                keyHeld = false;
            }
        });
    };

    // --- Aimbot Logic ---
    const aimbotCore = {
        update: () => {
            if (!window.game || !window.game.camera) return;
            if (!config.aimbot.enabled) {
                target = null;
                return;
            }

            // Find Target
            const players = window.game.entities.players;
            if (!players) return;

            let closestDist = Infinity;
            let closestPlayer = null;

            // Get Camera Position
            const camPos = window.game.camera.position;

            players.forEach(p => {
                if (!p || !p.visible) return;
                
                // Simple distance check
                const dist = Math.sqrt(
                    Math.pow(p.position.x - camPos.x, 2) + 
                    Math.pow(p.position.z - camPos.z, 2)
                );

                if (dist > config.aimbot.maxDistance) return;

                // Calculate Angle to Player
                const dx = p.position.x - camPos.x;
                const dy = p.position.y - camPos.y; // Approximate height diff
                const dz = p.position.z - camPos.z;

                // Project into screen space (simplified)
                const angle = Math.atan2(dx, dz);
                const cameraAngle = Math.atan2(window.game.camera.rotation.x, window.game.camera.rotation.z); // Simplified rotation check
                
                // Basic FOV check (simplified for this engine)
                // We check if the player is roughly in front of the camera
                // For a robust solution, you'd project 3D to 2D, but this is a quick fix
                const distZ = Math.cos(Math.atan2(dx, dz) - window.game.camera.rotation.x); // Approx
                
                // Better FOV check using vector math
                const camDir = window.game.camera.rotation; // Assuming rotation.x is yaw
                const playerAngle = Math.atan2(dx, dz);
                let angleDiff = Math.abs(playerAngle - camDir.x);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                if (angleDiff < (config.aimbot.fov / 2) * (Math.PI / 180)) {
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestPlayer = p;
                    }
                }
            });

            target = closestPlayer;

            // Apply Aim
            if (target) {
                // Smoothly rotate camera to target
                const camRot = window.game.camera.rotation;
                const targetAngle = Math.atan2(target.position.x - camPos.x, target.position.z - camPos.z);
                
                // Normalize angles
                let diff = targetAngle - camRot.x;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                camRot.x += diff / config.aimbot.smooth;

                // Silent Aim: Move player's "hitbox" to camera line of sight
                if (config.aimbot.silent) {
                    // Adjust player position so they appear centered? 
                    // Or adjust camera Y to look at head height
                    // Simple approach: Move camera Y to target Y
                    const targetY = target.position.y + 1.5; // Head height
                    const currentCamY = camPos.y;
                    const yDiff = targetY - currentCamY;
                    
                    // Smooth Y rotation (pitch)
                    const pitch = Math.atan2(yDiff, closestDist);
                    window.game.camera.rotation.y += (pitch - window.game.camera.rotation.y) / config.aimbot.smooth;
                }

                // Auto Fire
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

// ZOE NEURAL DASHBOARD - SCRIPT v1.0
// ---------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Lucide Icons
    lucide.createIcons();

    // Elements
    const loginOverlay = document.getElementById('login-overlay');
    const dashboardContent = document.getElementById('dashboard-content');
    const pinInput = document.getElementById('pin-input');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const logContainer = document.getElementById('log-container');
    const botStatus = document.getElementById('bot-status');
    const restartBtn = document.getElementById('restart-btn');
    const clearLogsBtn = document.getElementById('clear-logs');
    const currentDate = document.getElementById('current-date');

    // State
    let socket;
    let uptimeInterval = null;
    const authKey = 'zoe_neural_auth';

    // Set Tanggal
    const now = new Date();
    currentDate.innerText = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    // Check Existing Auth
    if (localStorage.getItem(authKey)) {
        showDashboard();
    }

    // Login Action
    loginBtn.addEventListener('click', async () => {
        const pin = pinInput.value;
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const data = await response.json();

            if (data.success) {
                localStorage.setItem(authKey, data.token);
                showDashboard();
            } else {
                loginError.innerText = data.message;
                pinInput.value = '';
            }
        } catch (err) {
            loginError.innerText = 'Connection Error';
        }
    });

    function showDashboard() {
        loginOverlay.style.display = 'none';
        dashboardContent.style.display = 'grid';
        initNeuralSocket();
        
        // Initial Fetch
        fetchBotInfo();
        loadRandomAvatar();
        setInterval(fetchBotInfo, 5000);
    }

    // Dynamic Avatar Loader
    function loadRandomAvatar() {
        const avatarImg = document.getElementById('bot-avatar-img');
        if (!avatarImg) return;
        
        avatarImg.src = `/api/bot/avatar?t=${Date.now()}`;
        avatarImg.onload = () => avatarImg.classList.add('loaded');
    }

    // Bot Identity Fetcher
    async function fetchBotInfo() {
        if (loginOverlay.style.display !== 'none') return;
        try {
            const res = await fetch('/api/bot/info');
            if (!res.ok) throw new Error('API Sync Failed');
            const data = await res.json();
            
            // Defensive Mapping (Prevents 'undefined' at all costs)
            document.getElementById('hero-bot-name').innerText = data.name || 'Zoe Core';
            document.getElementById('bot-owner').innerText = data.owner || 'Admin';
            document.getElementById('bot-version').innerText = data.version || 'v3.3.1';
            document.getElementById('ai-brain-model').innerText = data.aiModel || 'Neural Engine';
            
            // Live Uptime Counter — ticks every second from server seed
            if (data.uptimeSeconds !== undefined) {
                if (uptimeInterval) clearInterval(uptimeInterval);
                let secs = Math.floor(data.uptimeSeconds);
                const uptimeEl = document.getElementById('bot-uptime');
                const formatUptime = (s) => {
                    const h = Math.floor(s / 3600);
                    const m = Math.floor((s % 3600) / 60);
                    const sec = s % 60;
                    return `${h}h ${m}m ${String(sec).padStart(2,'0')}s`;
                };
                uptimeEl.innerText = formatUptime(secs);
                uptimeInterval = setInterval(() => {
                    secs++;
                    uptimeEl.innerText = formatUptime(secs);
                }, 1000);
            }
            
            // Update resource bars
            const cpu = data.cpuLoad || '0';
            const ram = data.ramUsage || '0';
            document.getElementById('cpu-load-fill').style.width = cpu + '%';
            document.getElementById('ram-load-fill').style.width = ram + '%';
        } catch (err) {
            console.error('[Dashboard] Neural specs sync error:', err);
        }
    }

    // Page Switching Logic
    function switchPage(pageId) {
        // Update Nav UI
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageId) link.classList.add('active');
        });

        // Hide All Pages
        document.querySelectorAll('.page-container').forEach(p => p.classList.remove('active'));
        
        // Show Target Page
        const target = document.getElementById(`page-${pageId}`);
        if (target) {
            target.classList.add('active');
            
            // Trigger Page Specific Loads
            if (pageId === 'users') fetchUserList();
            if (pageId === 'messages') fetchCommandHistory();
            
            // Update Breadcrumbs
            const titleMap = { 
                'status': 'Dashboard', 
                'users': 'Management', 
                'messages': 'Messages',
                'activity': 'Activity Telemetry',
                'settings': 'Matrix Configuration'
            };
            document.getElementById('page-title').innerText = titleMap[pageId] || pageId;
        }
    }

    // --- SETTINGS HUB LOGIC ---
    function initSettings() {
        // Internal Tab Switching
        const tabBtns = document.querySelectorAll('.settings-tab-btn');
        const panels = document.querySelectorAll('.settings-panel');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                
                const targetId = e.currentTarget.getAttribute('data-tab');
                e.currentTarget.classList.add('active');
                document.getElementById(targetId).classList.add('active');
                
                if (targetId === 'set-mod') fetchBannedCommands();
            });
        });

        // Bio Update Hook
        document.getElementById('btn-save-bio').addEventListener('click', async () => {
            const botBio = document.getElementById('setting-bot-bio').value;
            if(!botBio) return;
            try {
                const res = await fetch('/api/settings/update-bio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bio: botBio })
                });
                const data = await res.json();
                if(data.success) {
                    alert('Neural Bio Updated');
                } else alert('Failed to update Bio');
            } catch (err) { alert('Network Error'); }
        });

        // Maintenance Toggle Hook
        document.getElementById('setting-maintenance-toggle').addEventListener('change', async (e) => {
            const isEnabled = e.target.checked;
            try {
                await fetch('/api/settings/maintenance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled: isEnabled })
                });
            } catch (err) {}
        });

        // Sync initial state
        try {
            fetch('/api/settings/status')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById('setting-maintenance-toggle').checked = !!data.maintenance;
                    }
                })
                .catch(() => {});
        } catch (e) {}

        // Profile Picture Upload Logic (Preview & Upload)
        const pfpBox = document.getElementById('pfp-upload-box');
        const pfpInput = document.getElementById('pfp-input');
        const pfpBtn = document.getElementById('btn-save-pfp');
        const cropModal = document.getElementById('crop-modal');
        const cropImage = document.getElementById('crop-image');
        let cropperInstance = null;
        let croppedBlob = null;
        
        pfpBox.addEventListener('click', () => pfpInput.click());
        
        pfpInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    cropImage.src = event.target.result;
                    cropModal.style.display = 'flex';
                    
                    if (cropperInstance) cropperInstance.destroy();
                    
                    cropperInstance = new Cropper(cropImage, {
                        aspectRatio: 1,
                        viewMode: 1,
                        dragMode: 'move',
                        autoCropArea: 0.8,
                        background: false
                    });
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });

        document.getElementById('btn-crop-cancel').addEventListener('click', () => {
            cropModal.style.display = 'none';
            pfpInput.value = '';
        });

        document.getElementById('btn-crop-apply').addEventListener('click', () => {
            const canvas = cropperInstance.getCroppedCanvas({
                width: 500,
                height: 500
            });
            
            canvas.toBlob((blob) => {
                croppedBlob = blob;
                const previewUrl = URL.createObjectURL(blob);
                pfpBox.innerHTML = `<img src="${previewUrl}" class="preview" style="display:block;">`;
                pfpBtn.style.display = 'inline-block';
                cropModal.style.display = 'none';
            }, 'image/jpeg', 0.9);
        });

        pfpBtn.addEventListener('click', async () => {
            if (!croppedBlob) return;
            pfpBtn.innerText = 'Syncing...';
            
            const formData = new FormData();
            formData.append('pfp', croppedBlob, 'profile_cropped.jpg');

            try {
                const res = await fetch('/api/settings/update-pfp', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    alert('Neural Identity Synchronized');
                    pfpBtn.style.display = 'none';
                } else {
                    alert('Failed: ' + data.error);
                }
            } catch (err) {
                alert('Connection Error');
            }
            pfpBtn.innerText = 'Update Picture';
        });
        
        // Settings triggers
        document.getElementById('btn-ban-cmd').addEventListener('click', async () => {
            const cmd = document.getElementById('setting-ban-input').value.trim();
            if(!cmd) return;
            try {
                const res = await fetch('/api/settings/ban-command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: cmd, action: 'ban' })
                });
                const data = await res.json();
                } catch(e) {}
        });

    }

    async function fetchBannedCommands() {
        const container = document.getElementById('banned-command-list');
        try {
            const res = await fetch('/api/settings/banned-commands');
            const data = await res.json();
            if (data.success && data.banned.length > 0) {
                container.innerHTML = data.banned.map(cmd => `
                    <div class="banned-chip">
                        ${cmd}
                        <button onclick="unbanCommand('${cmd}')"><i data-lucide="x"></i></button>
                    </div>
                `).join('');
                lucide.createIcons();
            } else {
                container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%;">No banned commands</p>';
            }
        } catch (e) {
            container.innerHTML = '<p style="color: #f43f5e; text-align: center;">Failed to load</p>';
        }
    }

    window.unbanCommand = async function(cmd) {
        if(!confirm(`Unban .${cmd}?`)) return;
        try {
            const res = await fetch('/api/settings/ban-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd, action: 'unban' })
            });
            const data = await res.json();
            if (data.success) fetchBannedCommands();
        } catch(e) {}
    }

    // History Command Log from DB
    async function fetchCommandHistory() {
        try {
            const res = await fetch('/api/commands/stats');
            if (!res.ok) return;
            const data = await res.json();
            
            // Update stat badges in header
            const successEl = document.getElementById('msg-stat-success');
            const failedEl = document.getElementById('msg-stat-failed');
            if (successEl) successEl.innerText = data.success;
            if (failedEl) failedEl.innerText = data.failed;

            // Populate table with historical records
            const tbody = document.getElementById('cmd-log-body');
            if (!tbody || data.recent.length === 0) return;
            tbody.innerHTML = '';
            
            // Limit to max 4 commands
            const recentFour = data.recent.slice(0, 4);
            recentFour.forEach(log => {
                const row = document.createElement('tr');
                const badge = log.status === 'SUCCESS'
                    ? `<span class="badge-success">✅ OK</span>`
                    : `<span class="badge-failed">❌ ERR</span>`;
                const time = new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                row.innerHTML = `
                    <td style="font-family:monospace">${log.command}</td>
                    <td>${log.user}</td>
                    <td>${badge}${log.reason ? `<br><small style="color:#888">${log.reason.slice(0,50)}</small>` : ''}</td>
                    <td style="color:var(--text-secondary)">${time}</td>`;
                tbody.appendChild(row);
            });
        } catch (err) {
            console.error('[Dashboard] Command history fetch error:', err);
        }
    }

    // User Management Matrix
    async function fetchUserList() {
        const tbody = document.getElementById('user-table-body');
        try {
            const res = await fetch('/api/users/list');
            const users = await res.json();
            
            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>${u.jid.split('@')[0]}</td>
                    <td><span class="badge badge-${u.tier}">${u.tier}</span></td>
                    <td>${u.usage.mb} MB / ${u.usage.stickers} Stk</td>
                    <td>${u.addedAt}</td>
                    <td>
                        <div class="action-group">
                            <button class="action-btn" onclick="updateUserTier('${u.jid}', 'premium')">Prem</button>
                            <button class="action-btn vip" onclick="updateUserTier('${u.jid}', 'vip')">VIP</button>
                            <button class="action-btn free" onclick="updateUserTier('${u.jid}', 'free')">Demote</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Failed to sync matrix.</td></tr>';
        }
    }

    window.updateUserTier = async function(jid, tier) {
        if (!confirm(`Upgrade/Demote user ${jid} to ${tier.toUpperCase()}?`)) return;
        try {
            const res = await fetch('/api/users/update-tier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jid, tier })
            });
            const data = await res.json();
            if (data.success) fetchUserList();
        } catch (err) { alert('Sync failed.'); }
    }

    document.getElementById('refresh-users').addEventListener('click', fetchUserList);

    // WebSocket Connection
    function initNeuralSocket() {
        socket = io();

        // 1. Live Log Monitor
        socket.on('neuralLog', (data) => {
            const entry = document.createElement('div');
            entry.className = `log-entry ${data.level.toLowerCase()}`;
            entry.innerHTML = `<span style="color: grey">[${data.time}]</span> [${data.level}] ${data.message}`;
            
            logContainer.appendChild(entry);
            logContainer.scrollTop = logContainer.scrollHeight;

            // Batasi log biar gak berat (max 50)
            if (logContainer.children.length > 50) {
                logContainer.removeChild(logContainer.firstChild);
            }
        });

        // 2. Status Update
        socket.on('statusUpdate', (data) => {
            if (data.connected) {
                botStatus.innerHTML = '<span class="dot"></span> Connected';
                botStatus.className = 'status-pill online';
            } else {
                botStatus.innerHTML = '<span class="dot"></span> Disconnected';
                botStatus.className = 'status-pill offline';
            }
        });

        // 3. Daily Metrics Update
        socket.on('metricsUpdate', (data) => {
            const dlEl = document.getElementById('stat-dl');
            const sEl  = document.getElementById('stat-s');
            const imgEl = document.getElementById('stat-img');
            if (dlEl) dlEl.innerText = `${data.totalMB} MB`;
            if (sEl)  sEl.innerText  = `${data.totalStickers} Qty`;
            if (imgEl) imgEl.innerText = `${data.totalAiImages || 0} Qty`;
        });

        // 4. Command Execution Log
        socket.on('commandLog', (data) => {
            const tbody = document.getElementById('cmd-log-body');
            if (!tbody) return;
            // Clear placeholder
            if (tbody.firstChild && tbody.firstChild.textContent.includes('Awaiting')) tbody.innerHTML = '';
            const row = document.createElement('tr');
            const badge = data.status === 'SUCCESS'
                ? `<span class="badge-success">✅ OK</span>`
                : `<span class="badge-failed">❌ ERR</span>`;
            row.innerHTML = `
                <td style="font-family:monospace">${data.command}</td>
                <td>${data.user}</td>
                <td>${badge}${data.reason ? `<br><small style="color:#888">${data.reason.slice(0,50)}</small>` : ''}</td>
                <td style="color:var(--text-secondary)">${data.time}</td>`;
            tbody.prepend(row);
            // Keep max 4 rows as requested by user
            while (tbody.children.length > 4) tbody.removeChild(tbody.lastChild);
            
            // Auto increment local stats
            const sEl = document.getElementById('msg-stat-success');
            const fEl = document.getElementById('msg-stat-failed');
            if (data.status === 'SUCCESS' && sEl) sEl.innerText = parseInt(sEl.innerText) + 1;
            if (data.status === 'FAILED' && fEl) fEl.innerText = parseInt(fEl.innerText) + 1;
        });
    }

    // Broadcast Center Handler
    document.getElementById('broadcast-btn').addEventListener('click', async () => {
        const jid = document.getElementById('broadcast-jid').value.trim();
        const message = document.getElementById('broadcast-msg').value.trim();
        const statusEl = document.getElementById('broadcast-status');
        if (!jid || !message) { statusEl.className = 'broadcast-status err'; statusEl.innerText = 'JID and message required.'; return; }
        statusEl.className = 'broadcast-status'; statusEl.innerText = 'Transmitting...';
        try {
            const res = await fetch('/api/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jid, message }) });
            const data = await res.json();
            if (data.success) {
                statusEl.className = 'broadcast-status ok'; statusEl.innerText = `✅ Sent to ${data.to}`;
                document.getElementById('broadcast-msg').value = '';
            } else {
                statusEl.className = 'broadcast-status err'; statusEl.innerText = `❌ ${data.error}`;
            }
        } catch (err) { statusEl.className = 'broadcast-status err'; statusEl.innerText = '❌ Network error'; }
    });

    // Clear Buttons
    document.getElementById('clear-cmd-log').addEventListener('click', () => {
        document.getElementById('cmd-log-body').innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-secondary)">Cleared.</td></tr>';
    });

    // Sidebar Navigation UI
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page || 'status';
            switchPage(pageId);
        });
    });

    // Neural Brain Restart
    restartBtn.addEventListener('click', async () => {
        if (confirm('Jalankan Neural Restart? Koneksi WhatsApp akan diputus sementara.')) {
            try {
                await fetch('/api/control/restart', { method: 'POST' });
                alert('Restart sequence initiated. Refresh dashboard in 5 seconds.');
            } catch (err) {
                alert('Failed to send restart command.');
            }
        }
    });

    // Utility
    clearLogsBtn.addEventListener('click', () => {
        logContainer.innerHTML = '<div class="log-entry system">[SYSTEM] Neural Logs cleared.</div>';
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem(authKey);
        location.reload();
    });

    // Initialize Settings Logic
    initSettings();
});

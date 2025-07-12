// Data docelowa - 7 sierpnia 2025, godzina 15:30
const targetDate = new Date('2025-08-07T15:30:00');
const username = 'Piotr20111';

// Data startowa - będzie ustawiona na pierwszy raz uruchomienia
let startDate;
let firebaseDb, firebaseRef, firebaseSet, firebaseGet, firebaseOnValue;
let countdownInterval;

// Wait for Firebase to be ready
window.addEventListener('firebaseReady', () => {
    firebaseDb = window.firebaseDb;
    firebaseRef = window.firebaseRef;
    firebaseSet = window.firebaseSet;
    firebaseGet = window.firebaseGet;
    firebaseOnValue = window.firebaseOnValue;
    
    initializeCountdown();
});

// Initialize countdown with Firebase
async function initializeCountdown() {
    const userRef = firebaseRef(firebaseDb, `users/${username}`);
    
    try {
        // Check if user has a saved start date
        const snapshot = await firebaseGet(userRef);
        const data = snapshot.val();
        
        if (data && data.startDate) {
            // Use existing start date from Firebase
            startDate = new Date(data.startDate);
            console.log('📅 Using saved start date:', startDate);
        } else {
            // First time - save current date as start
            startDate = new Date(); // TERAZ - aktualna data i czas
            console.log('🆕 First time! Setting start date to NOW:', startDate);
            
            // Save to Firebase
            await firebaseSet(userRef, {
                username: username,
                startDate: startDate.toISOString(),
                targetDate: targetDate.toISOString(),
                hotelName: 'Kamelya Fulya',
                firstVisit: new Date().toISOString()
            });
        }
        
        document.getElementById('start-date').textContent = formatDate(startDate);
        document.getElementById('end-date').textContent = formatDate(targetDate);
        
        updateSyncStatus(true);
        
        // Start realtime updates
        startRealtimeUpdates();
        
    } catch (error) {
        console.error('Firebase error:', error);
        updateSyncStatus(false);
        // If Firebase fails, use current time as start
        startDate = new Date();
        document.getElementById('start-date').textContent = formatDate(startDate);
        document.getElementById('end-date').textContent = formatDate(targetDate);
    }
    
    // Start countdown - update every 10ms for ultra-smooth live updates
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 10); // 100 updates per second!
}

// Start realtime synchronization
function startRealtimeUpdates() {
    const statusRef = firebaseRef(firebaseDb, `users/${username}/liveStatus`);
    
    // Update Firebase every second with current status
    setInterval(() => {
        const now = new Date();
        const difference = targetDate - now;
        
        if (difference > 0) {
            const remainingPercentage = calculateRemainingPercentage();
            
            firebaseSet(statusRef, {
                currentTime: now.toISOString(),
                remainingTime: difference,
                remainingPercentage: remainingPercentage,
                remainingDays: Math.floor(difference / (1000 * 60 * 60 * 24)),
                remainingHours: Math.floor(difference / (1000 * 60 * 60)),
                remainingMinutes: Math.floor(difference / (1000 * 60)),
                remainingSeconds: Math.floor(difference / 1000),
                remainingMilliseconds: difference,
                isLive: true
            });
        }
    }, 1000);
}

// Calculate remaining percentage LIVE
function calculateRemainingPercentage() {
    const now = new Date(); // Always use current time
    const totalTime = targetDate.getTime() - startDate.getTime();
    const elapsedTime = now.getTime() - startDate.getTime();
    const remainingTime = targetDate.getTime() - now.getTime();
    
    // Calculate percentage remaining
    let percentage = (remainingTime / totalTime) * 100;
    
    // Make sure it's between 0 and 100
    percentage = Math.min(Math.max(percentage, 0), 100);
    
    return percentage;
}

// Get dynamic color based on remaining percentage
function getProgressColor(remainingPercentage) {
    if (remainingPercentage < 0.01) {
        // Last seconds! - Pulsing bright red
        const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5;
        return `linear-gradient(90deg, rgb(255, ${Math.floor(pulse * 50)}, 0), #ff1744, rgb(255, ${Math.floor(pulse * 100)}, 0))`;
    } else if (remainingPercentage < 0.1) {
        // Last minutes - Animated red
        return 'linear-gradient(90deg, #ff0000, #ff1744, #ff3333)';
    } else if (remainingPercentage < 1) {
        // Last hours - Bright red
        return 'linear-gradient(90deg, #ff3333, #ff4444, #ff5555)';
    } else if (remainingPercentage < 5) {
        // Last days - Orange-red
        return 'linear-gradient(90deg, #ff5722, #ff6347, #ff7043)';
    } else if (remainingPercentage < 10) {
        // Getting close - Orange
        return 'linear-gradient(90deg, #ff8a65, #ffa726, #ffb74d)';
    } else if (remainingPercentage < 20) {
        // Warming up - Yellow-orange
        return 'linear-gradient(90deg, #ffb74d, #ffc107, #ffd54f)';
    } else if (remainingPercentage < 30) {
        // Medium - Yellow
        return 'linear-gradient(90deg, #ffd54f, #ffeb3b, #fff176)';
    } else if (remainingPercentage < 50) {
        // Still time - Light green
        return 'linear-gradient(90deg, #aed581, #9ccc65, #8bc34a)';
    } else if (remainingPercentage < 70) {
        // Plenty of time - Blue-green
        return 'linear-gradient(90deg, #4fc3f7, #29b6f6, #03a9f4)';
    } else if (remainingPercentage < 90) {
        // Far away - Blue
        return 'linear-gradient(90deg, #42a5f5, #2196f3, #1e88e5)';
    } else {
        // Just started - Purple-blue
        return 'linear-gradient(90deg, #667eea, #764ba2, #8e44ad)';
    }
}

// Update countdown display - LIVE!
let lastSecond = -1;
let lastPercentage = -1;
let finalCountdownActive = false;

function updateCountdown() {
    const now = new Date(); // Always get CURRENT time
    const difference = targetDate - now;
    
    // If countdown finished
    if (difference <= 0) {
        showVacationMessage();
        return;
    }
    
    // Calculate time units from LIVE difference
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    const totalSeconds = Math.floor(difference / 1000);
    
    // FINAL COUNTDOWN - Last 60 seconds
    if (totalSeconds <= 60 && !finalCountdownActive) {
        finalCountdownActive = true;
        activateFinalCountdown();
    }
    
    if (finalCountdownActive) {
        // Show only seconds in big format
        document.getElementById('countdown').innerHTML = `
            <div class="final-seconds-container">
                <div class="final-seconds-box">
                    <span class="final-seconds-number">${totalSeconds}</span>
                    <span class="final-seconds-label">SEKUND DO WAKACJI!</span>
                </div>
                <div class="final-countdown-effects">
                    <div class="pulse-ring"></div>
                    <div class="pulse-ring"></div>
                    <div class="pulse-ring"></div>
                </div>
            </div>
        `;
        
        // Add pulsing color effect
        const finalBox = document.querySelector('.final-seconds-box');
        const hue = (totalSeconds / 60) * 120; // From red to green
        finalBox.style.background = `linear-gradient(135deg, hsl(${hue}, 100%, 50%), hsl(${hue + 30}, 100%, 40%))`;
        
        // Add shake effect for last 10 seconds
        if (totalSeconds <= 10) {
            finalBox.classList.add('shake-animation');
            createMiniFireworks();
        }
        
    } else {
        // Normal countdown display
        if (seconds !== lastSecond) {
            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
            
            // Animate seconds box
            animateTimeBox(document.getElementById('seconds').parentElement);
            lastSecond = seconds;
        }
    }
    
    // Calculate LIVE percentage
    const remainingPercentage = calculateRemainingPercentage();
    const usedPercentage = 100 - remainingPercentage;
    
    // Update progress bar smoothly
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = usedPercentage + '%';
    progressFill.style.transition = 'width 0.1s linear'; // Smooth transition
    
    // Update color based on remaining percentage
    progressFill.style.background = getProgressColor(remainingPercentage);
    
    // Update percentage text with LIVE values
    const progressText = document.getElementById('progress-text');
    let displayText = '';
    
    if (remainingPercentage < 0.0001) {
        // Last milliseconds! Show 7 decimal places
        displayText = remainingPercentage.toFixed(7) + '%';
        document.querySelector('.progress-bar').classList.add('pulse-bar');
        progressText.style.fontSize = '1.5rem';
    } else if (remainingPercentage < 0.001) {
        // Last seconds - show 6 decimal places
        displayText = remainingPercentage.toFixed(6) + '%';
        document.querySelector('.progress-bar').classList.add('pulse-bar');
    } else if (remainingPercentage < 0.01) {
        // Very close - show 5 decimal places
        displayText = remainingPercentage.toFixed(5) + '%';
        document.querySelector('.progress-bar').classList.add('pulse-bar');
    } else if (remainingPercentage < 0.1) {
        // Close - show 4 decimal places
        displayText = remainingPercentage.toFixed(4) + '%';
        document.querySelector('.progress-bar').classList.add('pulse-bar');
    } else if (remainingPercentage < 1) {
        // Less than 1% - show 3 decimal places
        displayText = remainingPercentage.toFixed(3) + '%';
    } else if (remainingPercentage < 10) {
        // Less than 10% - show 2 decimal places
        displayText = remainingPercentage.toFixed(2) + '%';
    } else {
        // Normal - show 2 decimal places
        displayText = remainingPercentage.toFixed(2) + '%';
        document.querySelector('.progress-bar').classList.remove('pulse-bar');
        progressText.style.fontSize = '1.2rem';
    }
    
    progressText.textContent = displayText;
    
    // Update progress title LIVE
    const progressTitle = document.querySelector('.progress-title');
    if (remainingPercentage < 0.1) {
        progressTitle.innerHTML = `🔥🔥🔥 SEKUNDY DO WAKACJI! ${remainingPercentage.toFixed(4)}% 🔥🔥🔥`;
        progressTitle.style.color = '#ff0000';
        progressTitle.style.animation = 'glow 0.2s ease-in-out infinite alternate';
    } else if (remainingPercentage < 1) {
        progressTitle.innerHTML = `🔥 OSTATNIE CHWILE! Pozostało: ${remainingPercentage.toFixed(3)}%`;
        progressTitle.style.color = '#ff1744';
        progressTitle.style.animation = 'glow 0.5s ease-in-out infinite alternate';
    } else if (remainingPercentage < 5) {
        progressTitle.textContent = `🌟 Już niedługo! Pozostało: ${remainingPercentage.toFixed(2)}%`;
        progressTitle.style.color = '#ff5722';
    } else if (remainingPercentage < 10) {
        progressTitle.textContent = `☀️ Coraz bliżej! Pozostało: ${remainingPercentage.toFixed(2)}%`;
        progressTitle.style.color = '#ff8a65';
    } else {
        progressTitle.textContent = `Pozostało do wakacji: ${remainingPercentage.toFixed(2)}%`;
        progressTitle.style.color = '#667eea';
        progressTitle.style.animation = 'none';
    }
    
    // Time boxes color change when close
    if (remainingPercentage < 10 && !finalCountdownActive) {
        document.querySelectorAll('.time-box').forEach(box => {
            box.style.background = getProgressColor(remainingPercentage);
        });
    }
    
    // Milestone effects
    const currentWholePercent = Math.floor(remainingPercentage);
    const lastWholePercent = Math.floor(lastPercentage);
    
    if (lastPercentage !== -1 && currentWholePercent < lastWholePercent && remainingPercentage < 10) {
        // Crossed a percentage milestone
        createMiniConfetti();
    }
    
    lastPercentage = remainingPercentage;
}

// Activate final countdown mode
function activateFinalCountdown() {
    // Add special CSS for final countdown
    const style = document.createElement('style');
    style.textContent = `
        .final-seconds-container {
            position: relative;
            animation: finalPulse 1s ease-in-out infinite;
        }
        
        .final-seconds-box {
            padding: 3rem 5rem;
            border-radius: 30px;
            box-shadow: 0 0 50px rgba(255, 0, 0, 0.5);
            animation: finalGlow 0.5s ease-in-out infinite alternate;
            transition: all 0.3s ease;
        }
        
        .final-seconds-number {
            font-size: 10rem;
            font-weight: 900;
            color: white;
            text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
            display: block;
            line-height: 1;
        }
        
        .final-seconds-label {
            font-size: 2rem;
            color: white;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-top: 1rem;
            display: block;
            font-weight: 700;
        }
        
        .final-countdown-effects {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        
        .pulse-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            border: 3px solid rgba(255, 255, 255, 0.5);
            border-radius: 30px;
            animation: pulseRing 1.5s ease-out infinite;
        }
        
        .pulse-ring:nth-child(2) {
            animation-delay: 0.5s;
        }
        
        .pulse-ring:nth-child(3) {
            animation-delay: 1s;
        }
        
        @keyframes finalPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes finalGlow {
            from { box-shadow: 0 0 30px rgba(255, 0, 0, 0.5); }
            to { box-shadow: 0 0 60px rgba(255, 0, 0, 0.8), 0 0 100px rgba(255, 100, 0, 0.5); }
        }
        
        @keyframes pulseRing {
            0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(1.5);
                opacity: 0;
            }
        }
        
        .shake-animation {
            animation: shake 0.1s ease-in-out infinite !important;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px) rotate(-1deg); }
            75% { transform: translateX(5px) rotate(1deg); }
        }
    `;
    document.head.appendChild(style);
}

// Create mini fireworks for final countdown
function createMiniFireworks() {
    const colors = ['#ff0000', '#ff6347', '#ffd700', '#ff1493', '#00ff00'];
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.style.position = 'fixed';
            firework.style.width = '4px';
            firework.style.height = '4px';
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.style.left = Math.random() * 100 + '%';
            firework.style.top = Math.random() * 50 + '%';
            firework.style.borderRadius = '50%';
            firework.style.pointerEvents = 'none';
            firework.style.zIndex = '10000';
            document.body.appendChild(firework);
            
            // Explode effect
            const particles = 8;
            for (let j = 0; j < particles; j++) {
                const particle = firework.cloneNode();
                document.body.appendChild(particle);
                const angle = (j / particles) * 360;
                const distance = 50 + Math.random() * 50;
                
                particle.animate([
                    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                    { 
                        transform: `translate(${Math.cos(angle * Math.PI / 180) * distance}px, 
                                             ${Math.sin(angle * Math.PI / 180) * distance}px) scale(0)`, 
                        opacity: 0 
                    }
                ], {
                    duration: 1000,
                    easing: 'ease-out'
                }).onfinish = () => particle.remove();
            }
            
            firework.remove();
        }, i * 200);
    }
}

// Format date for display
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Update sync status
function updateSyncStatus(synced) {
    const indicator = document.getElementById('sync-indicator');
    const text = document.getElementById('sync-text');
    
    if (synced) {
        indicator.textContent = '✅';
        indicator.classList.add('synced');
        text.textContent = 'Na żywo z Firebase';
    } else {
        indicator.textContent = '❌';
        indicator.classList.remove('synced');
        text.textContent = 'Błąd synchronizacji';
    }
}

// Animate time box
function animateTimeBox(element) {
    element.classList.add('pulse');
    setTimeout(() => {
        element.classList.remove('pulse');
    }, 300);
}

// Show vacation message - MODIFIED
function showVacationMessage() {
    // Hide all countdown elements
    document.getElementById('countdown').style.display = 'none';
    document.querySelector('.progress-section').style.display = 'none';
    document.querySelector('.hotel-info').style.display = 'none';
    document.querySelector('.title').style.display = 'none';
    document.querySelector('.decorations').style.display = 'none';
    
    // Create custom vacation message
    const container = document.querySelector('.content');
    container.innerHTML = `
        <div class="vacation-celebration">
            <h1 class="vacation-title">🎉 Zaraz wylatuję! ✈️</h1>
            <p class="vacation-subtitle">Do zobaczenia w krótce!</p>
            <div class="plane-flying">✈️</div>
            <div class="continuous-fireworks" id="fireworks-container"></div>
        </div>
        <style>
            .vacation-celebration {
                padding: 3rem;
                text-align: center;
                position: relative;
                min-height: 400px;
            }
            
            .vacation-title {
                font-size: 4rem;
                color: #ff1744;
                margin-bottom: 1rem;
                animation: celebrationPulse 1s ease-in-out infinite;
                text-shadow: 0 0 20px rgba(255, 23, 68, 0.5);
            }
            
            .vacation-subtitle {
                font-size: 2rem;
                color: #667eea;
                margin-bottom: 2rem;
                font-weight: 600;
            }
            
            .plane-flying {
                font-size: 5rem;
                animation: flyAway 4s ease-in-out infinite;
                margin: 2rem 0;
            }
            
            @keyframes celebrationPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            @keyframes flyAway {
                0% { transform: translateX(-200px) translateY(0) rotate(-10deg); }
                50% { transform: translateX(0) translateY(-30px) rotate(0deg); }
                100% { transform: translateX(200px) translateY(0) rotate(10deg); }
            }
            
            .continuous-fireworks {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                overflow: hidden;
            }
        </style>
    `;
    
    // Update Firebase with completion
    const userRef = firebaseRef(firebaseDb, `users/${username}`);
    firebaseSet(userRef, {
        username: username,
        startDate: startDate.toISOString(),
        targetDate: targetDate.toISOString(),
        hotelName: 'Kamelya Fulya',
        completed: true,
        completedAt: new Date().toISOString()
    });
    
    // Start continuous fireworks
    startContinuousFireworks();
    clearInterval(countdownInterval);
}

// Continuous fireworks animation
function startContinuousFireworks() {
    const fireworksContainer = document.getElementById('fireworks-container');
    
    // Create fireworks every 500ms
    setInterval(() => {
        createFireworkBurst(fireworksContainer);
    }, 500);
    
    // Create initial burst
    for (let i = 0; i < 5; i++) {
        setTimeout(() => createFireworkBurst(fireworksContainer), i * 100);
    }
}

// Create a single firework burst
function createFireworkBurst(container) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493'];
    const x = Math.random() * 100;
    const y = 20 + Math.random() * 60;
    
    // Create explosion center
    const burst = document.createElement('div');
    burst.style.position = 'absolute';
    burst.style.left = x + '%';
    burst.style.top = y + '%';
    burst.style.width = '4px';
    burst.style.height = '4px';
    container.appendChild(burst);
    
    // Create particles
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = '0';
        particle.style.top = '0';
        particle.style.width = '6px';
        particle.style.height = '6px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = '50%';
        particle.style.boxShadow = `0 0 6px ${particle.style.backgroundColor}`;
        burst.appendChild(particle);
        
        const angle = (i / particleCount) * Math.PI * 2;
        const velocity = 50 + Math.random() * 100;
        const lifetime = 1000 + Math.random() * 1000;
        
        particle.animate([
            {
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            {
                transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity + 30}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: lifetime,
            easing: 'cubic-bezier(0, 0, 0.2, 1)'
        }).onfinish = () => particle.remove();
    }
    
    // Remove burst container after animation
    setTimeout(() => burst.remove(), 2000);
}

// Create confetti effect
function createConfetti() {
    const colors = ['#ff6347', '#32cd32', '#1e90ff', '#ffd700', '#ff1493'];
    const confettiCount = 200;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = confetti.style.width;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.opacity = Math.random();
            confetti.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
            confetti.style.transition = 'all 3s ease-out';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.zIndex = '9999';
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.style.top = '100%';
                confetti.style.transform = 'rotate(' + Math.random() * 720 + 'deg) translateX(' + (Math.random() - 0.5) * 200 + 'px)';
                confetti.style.opacity = '0';
            }, 10);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 10);
    }
}

// Create mini confetti for milestones
function createMiniConfetti() {
    const colors = ['#ffd700', '#ff6347', '#32cd32'];
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '8px';
            confetti.style.height = '8px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '50%';
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            document.body.appendChild(confetti);
            
            // Animate
            confetti.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${(Math.random() - 0.5) * 200}px, ${-Math.random() * 200}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1500,
                easing: 'ease-out'
            }).onfinish = () => confetti.remove();
        }, i * 50);
    }
}

// Add mouse parallax effect
document.addEventListener('mousemove', (e) => {
    const waves = document.querySelectorAll('.wave');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    waves.forEach((wave, index) => {
        const speed = (index + 1) * 50;
        wave.style.transform = `translateX(${x * speed}px) translateY(${y * speed / 2}px)`;
    });
});

// Decoration animations
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.decoration').forEach(decoration => {
        decoration.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.5) rotate(360deg)';
        });
        
        decoration.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });
});

// Live clock in console for debugging
setInterval(() => {
    const now = new Date();
    const remaining = calculateRemainingPercentage();
    console.log(`⏰ LIVE: ${now.toLocaleTimeString()} | Pozostało: ${remaining.toFixed(4)}%`);
}, 5000);


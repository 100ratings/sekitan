document.addEventListener('DOMContentLoaded', () => {
    // Sistema de persistência local
    const CONFIG_KEY = 't9t-config';
    const DEFAULT_CONFIG = { offsetX: 0, offsetY: 0, scale: 1, phoneGap: 16 };
    
    function loadConfig() {
        const saved = localStorage.getItem(CONFIG_KEY);
        if (!saved) return { ...DEFAULT_CONFIG };
        try {
            return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        } catch (error) {
            return { ...DEFAULT_CONFIG };
        }
    }
    
    function saveConfig(config) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    }
    
    const config = loadConfig();

    const phoneWrapper = document.getElementById('phone-wrapper');
    const listSelect = document.getElementById('list-select');
    const addPhoneBtn = document.getElementById('add-phone-btn');
    const generateBtn = document.getElementById('generate-btn');
    const revealBtn = document.getElementById('reveal-btn');
    const scaleUpBtn = document.getElementById('scale-up-btn');
    const scaleDownBtn = document.getElementById('scale-down-btn');
    const scaleResetBtn = document.getElementById('scale-reset-btn');
    const scaleDisplay = document.getElementById('scale-display');
    const gapDownBtn = document.getElementById('gap-down-btn');
    const gapUpBtn = document.getElementById('gap-up-btn');
    const gapResetBtn = document.getElementById('gap-reset-btn');
    const gapDisplay = document.getElementById('gap-display');
    const posUpBtn = document.getElementById('pos-up-btn');
    const posDownBtn = document.getElementById('pos-down-btn');
    const posLeftBtn = document.getElementById('pos-left-btn');
    const posRightBtn = document.getElementById('pos-right-btn');
    
    if (config.offsetX !== 0) phoneWrapper.style.left = `${config.offsetX}px`;
    if (config.offsetY !== 0) phoneWrapper.style.top = `${config.offsetY}px`;

    let currentScale = config.scale;
    let currentOffsetX = config.offsetX;
    let currentOffsetY = config.offsetY;
    let currentPhoneGap = config.phoneGap;
    const POSITION_STEP = 2;
    const GAP_STEP = 4;
    const MIN_PHONE_GAP = 0;
    const MAX_PHONE_GAP = 120;

    let currentWordList = [];
    let isRevealed = false;
    let phones = [];
    let currentListCategory = 'dicionario'; // Padrão inicial

    function updateScaleDisplay() {
        if (scaleDisplay) {
            scaleDisplay.textContent = `${Math.round(currentScale * 100)}%`;
        }
    }

    function persistConfig() {
        saveConfig({
            offsetX: currentOffsetX,
            offsetY: currentOffsetY,
            scale: currentScale,
            phoneGap: currentPhoneGap
        });
    }

    function applyScaleToAllPhones() {
        updatePhonePositions();
    }

    function increaseScale() {
        currentScale = Math.min(currentScale + 0.1, 2);
        applyScaleToAllPhones();
        updateScaleDisplay();
        persistConfig();
    }

    function decreaseScale() {
        currentScale = Math.max(currentScale - 0.1, 0.3);
        applyScaleToAllPhones();
        updateScaleDisplay();
        persistConfig();
    }

    function resetScale() {
        currentScale = 1;
        applyScaleToAllPhones();
        updateScaleDisplay();
        persistConfig();
    }

    function movePosition(dx, dy) {
        currentOffsetX += dx;
        currentOffsetY += dy;
        phoneWrapper.style.left = `${currentOffsetX}px`;
        phoneWrapper.style.top = `${currentOffsetY}px`;
        persistConfig();
    }

    function updateGapDisplay() {
        if (gapDisplay) gapDisplay.textContent = `${currentPhoneGap}px`;
    }

    function changePhoneGap(delta) {
        currentPhoneGap = Math.max(MIN_PHONE_GAP, Math.min(MAX_PHONE_GAP, currentPhoneGap + delta));
        updateGapDisplay();
        updatePhonePositions();
        persistConfig();
    }

    function resetPhoneGap() {
        currentPhoneGap = DEFAULT_CONFIG.phoneGap;
        updateGapDisplay();
        updatePhonePositions();
        persistConfig();
    }

    if (scaleUpBtn) scaleUpBtn.addEventListener('click', increaseScale);
    if (scaleDownBtn) scaleDownBtn.addEventListener('click', decreaseScale);
    if (scaleResetBtn) scaleResetBtn.addEventListener('click', resetScale);
    if (gapDownBtn) gapDownBtn.addEventListener('click', () => changePhoneGap(-GAP_STEP));
    if (gapUpBtn) gapUpBtn.addEventListener('click', () => changePhoneGap(GAP_STEP));
    if (gapResetBtn) gapResetBtn.addEventListener('click', resetPhoneGap);
    if (posUpBtn) posUpBtn.addEventListener('click', () => movePosition(0, -POSITION_STEP));
    if (posDownBtn) posDownBtn.addEventListener('click', () => movePosition(0, POSITION_STEP));
    if (posLeftBtn) posLeftBtn.addEventListener('click', () => movePosition(-POSITION_STEP, 0));
    if (posRightBtn) posRightBtn.addEventListener('click', () => movePosition(POSITION_STEP, 0));

    updateScaleDisplay();
    updateGapDisplay();

    const t9Map = {
        'a': '2', 'b': '2', 'c': '2',
        'd': '3', 'e': '3', 'f': '3',
        'g': '4', 'h': '4', 'i': '4',
        'j': '5', 'k': '5', 'l': '5',
        'm': '6', 'n': '6', 'o': '6',
        'p': '7', 'q': '7', 'r': '7', 's': '7',
        't': '8', 'u': '8', 'v': '8',
        'w': '9', 'x': '9', 'y': '9', 'z': '9',
    };

    function convertToT9(word) {
        const noDiacritics = word
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .split('')
            .map(char => t9Map[char] || '')
            .join('');
        return noDiacritics;
    }

    function formatBrazilianPhone(digits) {
        return digits.replace(/\D/g, '');
    }

    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.querySelectorAll('.time').forEach(el => {
            el.textContent = `${hours}:${minutes}`;
        });
    }

    updateTime();
    setInterval(updateTime, 1000);

    function loadSekitanData(category = 'dicionario') {
        let source = [];
        const data = window.SEKITAN_DATA;
        
        if (category === 'all') {
            source = [...data.NOMES, ...data.OBJETOS, ...data.PAISES, ...data.ANIMAIS, ...data.DICIONARIO];
        } else {
            const key = category.toUpperCase();
            source = data[key] || [];
        }

        currentWordList = source.map(item => ({
            name: item.w,
            score: item.s,
            t9: convertToT9(item.w)
        }));
    }

    function getWeightedRandom(matches) {
        if (matches.length === 0) return null;
        const totalScore = matches.reduce((sum, item) => sum + item.score, 0);
        if (totalScore === 0) {
            return matches[Math.floor(Math.random() * matches.length)];
        }
        let random = Math.random() * totalScore;
        for (const item of matches) {
            if (random < item.score) return item;
            random -= item.score;
        }
        return matches[matches.length - 1];
    }

    function updatePhonePositions() {
        const count = phones.length;
        const wrapper = phoneWrapper;
        const wrapperWidth = wrapper.clientWidth;
        const wrapperHeight = wrapper.clientHeight;
        const phoneBaseWidth = 420;
        const phoneBaseHeight = 900;
        const availableWidth = wrapperWidth - 60;
        const availableHeight = wrapperHeight - 120;
        const gap = currentPhoneGap;
        
        let scale = 1;
        if (count === 1) {
            const scaleByWidth = availableWidth / phoneBaseWidth;
            const scaleByHeight = availableHeight / phoneBaseHeight;
            scale = Math.min(scaleByWidth, scaleByHeight, 1.1);
        } else {
            const totalWidthNeeded = (phoneBaseWidth * count) + (gap * (count - 1));
            const scaleByWidth = availableWidth / totalWidthNeeded;
            const scaleByHeight = availableHeight / phoneBaseHeight;
            scale = Math.min(scaleByWidth, scaleByHeight, 1);
        }
        
        const finalScale = scale * currentScale;
        const scaledWidth = phoneBaseWidth * finalScale;
        const scaledHeight = phoneBaseHeight * finalScale;
        const topOffset = (wrapperHeight - scaledHeight) / 2;
        
        phones.forEach((phone, index) => {
            const totalWidthUsed = (scaledWidth * count) + (gap * (count - 1));
            const startX = (wrapperWidth - totalWidthUsed) / 2;
            const xPosition = startX + (index * (scaledWidth + gap));
            
            phone.style.left = xPosition + 'px';
            phone.style.top = topOffset + 'px';
            phone.style.transform = `scale(${finalScale})`;
            phone.style.transformOrigin = 'top center';
        });
    }

    function createPhoneTemplate() {
        return `
            <div class="phone-container">
                <button class="close-btn" title="Remover">✖</button>
                <div class="resize-handle" title="Redimensionar">⤡</div>
                <div class="status-bar">
                    <span class="time">09:41</span>
                    <div class="icons">
                        <span class="signal">📶</span>
                        <span class="wifi">📶</span>
                        <span class="battery">🔋</span>
                    </div>
                </div>
                <div class="display">
                    <div class="number-view"></div>
                    <div class="add-contact-btn">Adicionar Número</div>
                </div>
                <div class="keypad">
                    <div class="row">
                        <button class="key" data-value="1"><span class="number">1</span><span class="letters"> </span></button>
                        <button class="key" data-value="2"><span class="number">2</span><span class="letters">ABC</span></button>
                        <button class="key" data-value="3"><span class="number">3</span><span class="letters">DEF</span></button>
                    </div>
                    <div class="row">
                        <button class="key" data-value="4"><span class="number">4</span><span class="letters">GHI</span></button>
                        <button class="key" data-value="5"><span class="number">5</span><span class="letters">JKL</span></button>
                        <button class="key" data-value="6"><span class="number">6</span><span class="letters">MNO</span></button>
                    </div>
                    <div class="row">
                        <button class="key" data-value="7"><span class="number">7</span><span class="letters">PQRS</span></button>
                        <button class="key" data-value="8"><span class="number">8</span><span class="letters">TUV</span></button>
                        <button class="key" data-value="9"><span class="number">9</span><span class="letters">WXYZ</span></button>
                    </div>
                    <div class="row">
                        <button class="key special" data-value="*"><span class="number">*</span><span class="letters"> </span></button>
                        <button class="key" data-value="0"><span class="number">0</span><span class="letters">+</span></button>
                        <button class="key special" data-value="#"><span class="number">#</span><span class="letters"> </span></button>
                    </div>
                    <div class="row actions">
                        <div class="spacer"></div>
                        <button class="call-btn"><span class="call-icon">📞</span></button>
                        <button class="backspace-btn"><span class="back-icon">⌫</span></button>
                    </div>
                </div>
                <nav class="tab-bar">
                    <div class="tab"><span class="icon">⭐</span><span class="label">Favoritos</span></div>
                    <div class="tab"><span class="icon">🕒</span><span class="label">Recentes</span></div>
                    <div class="tab"><span class="icon">👤</span><span class="label">Contatos</span></div>
                    <div class="tab active"><span class="icon">🔢</span><span class="label">Teclado</span></div>
                </nav>
            </div>
        `;
    }

    function createPhoneInstance() {
        const phoneHTML = createPhoneTemplate();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = phoneHTML;
        const phone = tempDiv.firstElementChild;
        phoneWrapper.appendChild(phone);
        phones.push(phone);

        phone._state = { t9: '', word: '' };

        const numberDisplay = phone.querySelector('.number-view');
        const addContactBtn = phone.querySelector('.add-contact-btn');
        const backspaceBtn = phone.querySelector('.backspace-btn');
        const closeBtn = phone.querySelector('.close-btn');
        const keys = phone.querySelectorAll('.key');
        const callBtn = phone.querySelector('.call-btn');

        function adjustFontSize(text) {
            const defaultFontSize = 32;
            const minFontSize = 10;
            // O visor comporta confortavelmente cerca de 13 caracteres com 32px.
            // A partir daí, começamos a reduzir.
            const threshold = 13; 
            
            if (text.length > threshold) {
                // Redução proporcional baseada no comprimento
                const newSize = (threshold / text.length) * defaultFontSize;
                // Ajuste extra para garantir que caiba (fator de segurança 0.95)
                const safeSize = Math.floor(newSize * 0.95);
                numberDisplay.style.fontSize = `${Math.max(safeSize, minFontSize)}px`;
            } else {
                numberDisplay.style.fontSize = `${defaultFontSize}px`;
            }
        }

        phone._updateDisplay = function() {
            let textToDisplay = '';
            if (isRevealed && phone._state.word) {
                textToDisplay = phone._state.word;
            } else if (phone._state.t9) {
                textToDisplay = formatBrazilianPhone(phone._state.t9);
            }
            
            numberDisplay.textContent = textToDisplay;
            adjustFontSize(textToDisplay);
            addContactBtn.classList.toggle('visible', phone._state.t9.length > 0);
            backspaceBtn.classList.toggle('visible', phone._state.t9.length > 0);
        };

        phone._generateRandom = function() {
            if (currentWordList.length > 0) {
                const picked = getWeightedRandom(currentWordList);
                if (picked) {
                    phone._state.t9 = picked.t9;
                    phone._state.word = picked.name;
                    phone._updateDisplay();
                }
            }
        };

        keys.forEach(key => {
            key.addEventListener('click', () => {
                phone._state.t9 += key.dataset.value;
                phone._state.word = '';
                phone._updateDisplay();
            });
        });

        backspaceBtn.addEventListener('click', () => {
            phone._state.t9 = phone._state.t9.slice(0, -1);
            phone._state.word = '';
            phone._updateDisplay();
        });

        callBtn.addEventListener('click', () => {
            if (phone._state.t9 && currentWordList.length > 0) {
                const matches = currentWordList.filter(w => w.t9 === phone._state.t9);
                const picked = getWeightedRandom(matches);
                if (picked) {
                    phone._state.word = picked.name;
                    phone._updateDisplay();
                }
            }
        });

        closeBtn.addEventListener('click', () => {
            phone.remove();
            phones = phones.filter(p => p !== phone);
            updatePhonePositions();
        });

        updatePhonePositions();
        phone._updateDisplay();
    }

    addPhoneBtn.addEventListener('click', createPhoneInstance);

    generateBtn.addEventListener('click', () => {
        isRevealed = false;
        revealBtn.textContent = '👁️';
        phones.forEach(p => {
            if (p._generateRandom) p._generateRandom();
        });
    });

    revealBtn.addEventListener('click', () => {
        isRevealed = !isRevealed;
        revealBtn.textContent = isRevealed ? '🙈' : '👁️';
        phones.forEach(p => {
            if (p._updateDisplay) p._updateDisplay();
        });
    });

    listSelect.addEventListener('change', (e) => {
        currentListCategory = e.target.value;
        loadSekitanData(currentListCategory);
    });

    // Inicialização
    loadSekitanData('dicionario'); // Iniciar com dicionário
    createPhoneInstance();
    window.addEventListener('resize', updatePhonePositions);
});

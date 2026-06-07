document.addEventListener('DOMContentLoaded', () => {
    // Sistema de persistência local
    const CONFIG_KEY = 't9t-config';
    
    function loadConfig() {
        const saved = localStorage.getItem(CONFIG_KEY);
        return saved ? JSON.parse(saved) : { offsetX: 0, offsetY: 0, scale: 1 };
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
    const posUpBtn = document.getElementById('pos-up-btn');
    const posDownBtn = document.getElementById('pos-down-btn');
    const posLeftBtn = document.getElementById('pos-left-btn');
    const posRightBtn = document.getElementById('pos-right-btn');
    const posResetBtn = document.getElementById('pos-reset-btn');
    
    // Aplicar o offset inicial via propriedades de posição
    if (config.offsetX !== 0) phoneWrapper.style.left = `${config.offsetX}px`;
    if (config.offsetY !== 0) phoneWrapper.style.top = `${config.offsetY}px`;

    let currentScale = config.scale;
    let currentOffsetX = config.offsetX;
    let currentOffsetY = config.offsetY;
    const POSITION_STEP = 20; // pixels por clique

    let currentWordList = [];
    let isRevealed = false;
    let zIndex = 1000;
    const phones = [];
    let currentListCategory = 'all';

    function updateScaleDisplay() {
        if (scaleDisplay) {
            scaleDisplay.textContent = `${Math.round(currentScale * 100)}%`;
        }
    }

    function applyScaleToAllPhones() {
        updatePhonePositions();
    }

    function increaseScale() {
        currentScale = Math.min(currentScale + 0.1, 2);
        applyScaleToAllPhones();
        updateScaleDisplay();
        saveConfig({ offsetX: currentOffsetX, offsetY: currentOffsetY, scale: currentScale });
    }

    function decreaseScale() {
        currentScale = Math.max(currentScale - 0.1, 0.3);
        applyScaleToAllPhones();
        updateScaleDisplay();
        saveConfig({ offsetX: currentOffsetX, offsetY: currentOffsetY, scale: currentScale });
    }

    function resetScale() {
        currentScale = 1;
        applyScaleToAllPhones();
        updateScaleDisplay();
        saveConfig({ offsetX: currentOffsetX, offsetY: currentOffsetY, scale: currentScale });
    }

    function movePosition(dx, dy) {
        currentOffsetX += dx;
        currentOffsetY += dy;
        phoneWrapper.style.left = `${currentOffsetX}px`;
        phoneWrapper.style.top = `${currentOffsetY}px`;
        saveConfig({ offsetX: currentOffsetX, offsetY: currentOffsetY, scale: currentScale });
    }

    function resetPosition() {
        currentOffsetX = 0;
        currentOffsetY = 0;
        phoneWrapper.style.left = '0px';
        phoneWrapper.style.top = '0px';
        saveConfig({ offsetX: currentOffsetX, offsetY: currentOffsetY, scale: currentScale });
    }

    if (scaleUpBtn) scaleUpBtn.addEventListener('click', increaseScale);
    if (scaleDownBtn) scaleDownBtn.addEventListener('click', decreaseScale);
    if (scaleResetBtn) scaleResetBtn.addEventListener('click', resetScale);
    if (posUpBtn) posUpBtn.addEventListener('click', () => movePosition(0, -POSITION_STEP));
    if (posDownBtn) posDownBtn.addEventListener('click', () => movePosition(0, POSITION_STEP));
    if (posLeftBtn) posLeftBtn.addEventListener('click', () => movePosition(-POSITION_STEP, 0));
    if (posRightBtn) posRightBtn.addEventListener('click', () => movePosition(POSITION_STEP, 0));
    if (posResetBtn) posResetBtn.addEventListener('click', resetPosition);

    updateScaleDisplay();

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

    // Retornar apenas os números sem formatação
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

    function loadSekitanData(category = 'all') {
        let words = [];
        if (window.SEKITAN_LISTS) {
            if (category === 'all') {
                words = [
                    ...window.SEKITAN_LISTS.nomes || [],
                    ...window.SEKITAN_LISTS.objetos || [],
                    ...window.SEKITAN_LISTS.paises || [],
                    ...window.SEKITAN_LISTS.animais || [],
                    ...window.SEKITAN_LISTS.dicionario || []
                ];
            } else {
                words = window.SEKITAN_LISTS[category] || [];
            }
        }
        currentWordList = words.map(word => ({
            name: word,
            t9: convertToT9(word)
        }));
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
        const gap = Math.max(10, Math.min(30, availableWidth * 0.02));
        
        let scale = 1;
        let scaledWidth = phoneBaseWidth;
        
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
        
        // Aplicar a escala manual do usuário ao scale automático
        const finalScale = scale * currentScale;
        
        scaledWidth = phoneBaseWidth * finalScale;
        const scaledHeight = phoneBaseHeight * finalScale;
        const topOffset = (wrapperHeight - scaledHeight) / 2;
        
        phones.forEach((phone, index) => {
            let xPosition;
            if (count === 1) {
                xPosition = (wrapperWidth - scaledWidth) / 2;
            } else {
                const totalWidthUsed = (scaledWidth * count) + (gap * (count - 1));
                const startX = (wrapperWidth - totalWidthUsed) / 2;
                xPosition = startX + (index * (scaledWidth + gap));
            }
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
                    <div class="add-contact-btn">Adicionar número</div>
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

        let displayValue = '';
        let currentT9Value = '';
        const numberDisplay = phone.querySelector('.number-view');
        const addContactBtn = phone.querySelector('.add-contact-btn');
        const backspaceBtn = phone.querySelector('.backspace-btn');
        const closeBtn = phone.querySelector('.close-btn');
        const resizeHandle = phone.querySelector('.resize-handle');
        const keys = phone.querySelectorAll('.key');
        const callBtn = phone.querySelector('.call-btn');

        function updateDisplay() {
            if (isRevealed && displayValue) {
                numberDisplay.textContent = displayValue;
            } else if (currentT9Value) {
                numberDisplay.textContent = formatBrazilianPhone(currentT9Value);
            } else {
                numberDisplay.textContent = '';
            }
            addContactBtn.classList.toggle('visible', currentT9Value.length > 0);
            backspaceBtn.classList.toggle('visible', currentT9Value.length > 0);
        }

        keys.forEach(key => {
            key.addEventListener('click', () => {
                currentT9Value += key.dataset.value;
                updateDisplay();
            });
        });

        backspaceBtn.addEventListener('click', () => {
            currentT9Value = currentT9Value.slice(0, -1);
            displayValue = '';
            updateDisplay();
        });

        callBtn.addEventListener('click', () => {
            if (currentT9Value && currentWordList.length > 0) {
                const matches = currentWordList.filter(w => w.t9 === currentT9Value);
                if (matches.length > 0) {
                    const randomMatch = matches[Math.floor(Math.random() * matches.length)];
                    displayValue = randomMatch.name;
                    updateDisplay();
                }
            }
        });

        closeBtn.addEventListener('click', () => {
            phone.remove();
            phones.splice(phones.indexOf(phone), 1);
            updatePhonePositions();
        });

        let isDragging = false;
        let startX, startY, startLeft, startTop;

        phone.addEventListener('mousedown', (e) => {
            if (e.target === closeBtn || e.target === resizeHandle || e.target.closest('.key') || e.target.closest('.backspace-btn') || e.target.closest('.call-btn')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = phone.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            phone.classList.add('active-phone');
            phone.style.zIndex = ++zIndex;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            phone.style.left = (startLeft + deltaX) + 'px';
            phone.style.top = (startTop + deltaY) + 'px';
            phone.style.transform = 'scale(0.8)';
        });

        document.addEventListener('mouseup', () => { isDragging = false; });

        let isResizing = false;
        let startScale = 0.8;

        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const delta = Math.max(e.clientX - startX, e.clientY - startY);
            const newScale = Math.max(0.5, Math.min(1.2, startScale + delta * 0.005));
            phone.style.transform = `scale(${newScale})`;
        });

        document.addEventListener('mouseup', () => { isResizing = false; });

        updateDisplay();
        updatePhonePositions();
        return phone;
    }

    addPhoneBtn.addEventListener('click', createPhoneInstance);

    generateBtn.addEventListener('click', () => {
        if (currentWordList.length > 0) {
            phones.forEach(phone => {
                const randomWord = currentWordList[Math.floor(Math.random() * currentWordList.length)];
                const numberDisplay = phone.querySelector('.number-view');
                phone.dataset.displayValue = randomWord.name;
                phone.dataset.t9Value = randomWord.t9;
                
                if (isRevealed) {
                    numberDisplay.textContent = randomWord.name;
                } else {
                    numberDisplay.textContent = formatBrazilianPhone(randomWord.t9);
                }
                
                phone.querySelector('.add-contact-btn').classList.add('visible');
                phone.querySelector('.backspace-btn').classList.add('visible');
            });
        }
    });

    revealBtn.addEventListener('click', () => {
        isRevealed = !isRevealed;
        phones.forEach(phone => {
            const numberDisplay = phone.querySelector('.number-view');
            const t9Value = phone.dataset.t9Value || '';
            const displayValue = phone.dataset.displayValue || '';
            
            if (isRevealed && displayValue) {
                numberDisplay.textContent = displayValue;
            } else if (t9Value) {
                numberDisplay.textContent = formatBrazilianPhone(t9Value);
            } else {
                numberDisplay.textContent = '';
            }
        });
    });

    listSelect.addEventListener('change', () => {
        currentListCategory = listSelect.value;
        loadSekitanData(currentListCategory);
    });

        // CSV import removed as requested

    loadSekitanData();
    createPhoneInstance();
    window.addEventListener('resize', updatePhonePositions);
});

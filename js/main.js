/* ============================================
   ОСНОВНАЯ ЛОГИКА САЙТА
   ============================================ */

// ===== 1. Бургер-меню =====
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
const overlay = document.getElementById('overlay');
const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

function toggleMenu() {
    burger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
}

if (burger) burger.addEventListener('click', toggleMenu);
if (overlay) overlay.addEventListener('click', toggleMenu);
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (mobileMenu.classList.contains('active')) toggleMenu();
    });
});

// ===== 2. Плавная прокрутка =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const headerOffset = 100;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    });
});

// ===== 3. Анимация появления =====
const fadeElements = document.querySelectorAll('.fade-in');
const observerOptions = { root: null, rootMargin: '0px 0px -60px 0px', threshold: 0.1 };
const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
        }
    });
}, observerOptions);
fadeElements.forEach(el => observer.observe(el));

// ===== 4. Слайдер отзывов =====
const track = document.getElementById('reviewsTrack');
if (track) {
    const cards = track.querySelectorAll('.review-card');
    const prevBtn = document.getElementById('prevReview');
    const nextBtn = document.getElementById('nextReview');
    const dotsContainer = document.getElementById('sliderDots');
    let currentIndex = 0;
    const totalCards = cards.length;

    for (let i = 0; i < totalCards; i++) {
        const dot = document.createElement('button');
        dot.classList.add('slider-dot');
        if (i === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', `Отзыв ${i + 1}`);
        dot.addEventListener('click', () => { goToSlide(i); resetAutoSlide(); });
        dotsContainer.appendChild(dot);
    }
    const dots = dotsContainer.querySelectorAll('.slider-dot');

    function updateSlider() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    }
    function goToSlide(index) { currentIndex = index; updateSlider(); }
    function nextSlide() { currentIndex = (currentIndex + 1) % totalCards; updateSlider(); }
    function prevSlide() { currentIndex = (currentIndex - 1 + totalCards) % totalCards; updateSlider(); }

    nextBtn.addEventListener('click', () => { nextSlide(); resetAutoSlide(); });
    prevBtn.addEventListener('click', () => { prevSlide(); resetAutoSlide(); });

    let autoSlide = setInterval(nextSlide, 6000);
    function resetAutoSlide() {
        clearInterval(autoSlide);
        autoSlide = setInterval(nextSlide, 6000);
    }
}

// ===== 5. Форма записи =====
const form = document.getElementById('appointmentForm');
if (form) {
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const serviceSelect = document.getElementById('service');
    const messageInput = document.getElementById('message');
    const groupName = document.getElementById('groupName');
    const groupPhone = document.getElementById('groupPhone');
    const formSuccess = document.getElementById('formSuccess');
    const successAppNumber = document.getElementById('successAppNumber');

    function validateName() {
        const value = nameInput.value.trim();
        if (value.length < 2) { groupName.classList.add('invalid'); return false; }
        groupName.classList.remove('invalid'); return true;
    }
    function validatePhone() {
        const digits = phoneInput.value.replace(/\D/g, '');
        if (digits.length < 10) { groupPhone.classList.add('invalid'); return false; }
        groupPhone.classList.remove('invalid'); return true;
    }

    nameInput.addEventListener('input', validateName);
    phoneInput.addEventListener('input', validatePhone);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const isNameValid = validateName();
        const isPhoneValid = validatePhone();
        if (!isNameValid || !isPhoneValid) return;

        const appNumber = generateAppNumber();

        const application = {
            number: appNumber,
            name: nameInput.value.trim(),
            phone: phoneInput.value,
            service: serviceSelect.value || 'Не выбрано',
            message: messageInput.value.trim(),
            date: new Date().toISOString(),
            status: 'new',
            reply: '',
            replyDate: null
        };

        const success = await addApplication(application);
        if (!success) return;

        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && adminPanel.classList.contains('active')) {
            if (typeof renderApplications === 'function') renderApplications();
            if (typeof renderJournal === 'function') renderJournal();
        }

        successAppNumber.textContent = '№ ' + appNumber;
        formSuccess.classList.add('show');
        form.reset();
        groupName.classList.remove('invalid');
        groupPhone.classList.remove('invalid');
        setTimeout(() => formSuccess.classList.remove('show'), 15000);
    });

    phoneInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        let formatted = '';
        if (value.length > 0) {
            if (value[0] === '7' || value[0] === '8') {
                formatted = '+7';
                if (value.length > 1) formatted += ' (' + value.slice(1, 4);
                if (value.length >= 5) formatted += ') ' + value.slice(4, 7);
                if (value.length >= 8) formatted += '-' + value.slice(7, 9);
                if (value.length >= 10) formatted += '-' + value.slice(9, 11);
            } else {
                formatted = '+7';
                if (value.length > 0) formatted += ' (' + value.slice(0, 3);
                if (value.length >= 4) formatted += ') ' + value.slice(3, 6);
                if (value.length >= 7) formatted += '-' + value.slice(6, 8);
                if (value.length >= 9) formatted += '-' + value.slice(8, 10);
            }
        }
        this.value = formatted;
    });
}

// ===== 6. Кнопка "наверх" =====
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
    if (scrollTopBtn) scrollTopBtn.classList.toggle('show', window.pageYOffset > 400);
});
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== 7. Тень шапки =====
const headerEl = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (!headerEl) return;
    headerEl.style.boxShadow = window.pageYOffset > 50
        ? '0 2px 12px rgba(30, 58, 95, 0.10)'
        : 'none';
});

// ===== 8. Проверка заявки пациентом =====
const checkModal = document.getElementById('checkModal');
const openCheckBtn = document.getElementById('openCheckBtn');
const openCheckBtnMobile = document.getElementById('openCheckBtnMobile');
const closeCheckBtn = document.getElementById('closeCheckBtn');
const checkForm = document.getElementById('checkForm');
const checkQuery = document.getElementById('checkQuery');
const checkError = document.getElementById('checkError');
const checkResult = document.getElementById('checkResult');

async function openCheck() {
    checkModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (mobileMenu && mobileMenu.classList.contains('active')) toggleMenu();
    checkQuery.value = '';
    checkError.classList.remove('show');
    checkResult.classList.remove('show');
    checkResult.innerHTML = '';
    await loadApplicationsFromDB();
    setTimeout(() => checkQuery.focus(), 100);
}

function closeCheck() {
    checkModal.classList.remove('active');
    document.body.style.overflow = '';
}

if (openCheckBtn) openCheckBtn.addEventListener('click', openCheck);
if (openCheckBtnMobile) openCheckBtnMobile.addEventListener('click', openCheck);
if (closeCheckBtn) closeCheckBtn.addEventListener('click', closeCheck);
if (checkModal) {
    checkModal.addEventListener('click', (e) => {
        if (e.target === checkModal) closeCheck();
    });
}

function normalizePhone(str) {
    return (str || '').replace(/\D/g, '');
}

function findApplication(query) {
    const apps = getApplications();
    const trimmed = query.trim();
    if (!trimmed) return null;

    const byNumber = apps.find(a => a.number === trimmed);
    if (byNumber) return byNumber;

    const digits = normalizePhone(trimmed);
    if (digits.length >= 10) {
        const byPhone = apps.find(a => normalizePhone(a.phone) === digits);
        if (byPhone) return byPhone;
    }
    return null;
}

function renderCheckResult(app) {
    const status = app.status || 'new';
    const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.new;

    let replyBlock = '';
    if (app.reply && app.reply.trim()) {
        replyBlock = `
            <div class="check-reply-block">
                <h5><i class="fas fa-comment-medical"></i> Ответ главного врача</h5>
                <div class="check-reply-text">${escapeHtml(app.reply)}</div>
                ${app.replyDate ? `<div class="check-reply-date"><i class="far fa-clock"></i> ${formatDateFull(app.replyDate)}</div>` : ''}
            </div>
        `;
    } else if (status === 'reject') {
        replyBlock = `
            <div class="check-no-reply" style="border-left-color: var(--status-reject-color);">
                <i class="fas fa-times-circle" style="color: var(--status-reject-color);"></i>
                <p>К сожалению, по вашей заявке принято решение об отказе. Свяжитесь с клиникой по телефону для уточнения деталей.</p>
            </div>
        `;
    } else if (status === 'progress') {
        replyBlock = `
            <div class="check-no-reply">
                <i class="fas fa-hourglass-half"></i>
                <p>Ваша заявка находится на рассмотрении. Ответ появится здесь после обработки главным врачом.</p>
            </div>
        `;
    } else {
        replyBlock = `
            <div class="check-no-reply">
                <i class="fas fa-hourglass-half"></i>
                <p>Заявка принята и ожидает рассмотрения. Пожалуйста, проверьте статус позже.</p>
            </div>
        `;
    }

    checkResult.innerHTML = `
        <div class="check-result-card status-${status}">
            <div class="check-result-header">
                <span class="status-badge status-${status}">
                    <i class="fas ${statusInfo.icon}"></i> ${statusInfo.label}
                </span>
                <span class="app-num">№ ${escapeHtml(app.number || '—')}</span>
            </div>

            <div class="check-result-info">
                <div class="row">
                    <i class="fas fa-user"></i>
                    <span><strong>${escapeHtml(app.name)}</strong></span>
                </div>
                <div class="row">
                    <i class="fas fa-phone"></i>
                    <span>${escapeHtml(app.phone)}</span>
                </div>
                <div class="row">
                    <i class="fas fa-stethoscope"></i>
                    <span>${escapeHtml(app.service)}</span>
                </div>
                <div class="row">
                    <i class="far fa-calendar-alt"></i>
                    <span>Заявка от ${formatDateFull(app.date)}</span>
                </div>
            </div>

            ${replyBlock}
        </div>
    `;
    checkResult.classList.add('show');
}

if (checkForm) {
    checkForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const query = checkQuery.value.trim();

        checkError.classList.remove('show');
        checkResult.classList.remove('show');
        checkResult.innerHTML = '';

        if (!query) {
            checkError.classList.add('show');
            return;
        }

        await loadApplicationsFromDB();
        const app = findApplication(query);
        if (app) {
            renderCheckResult(app);
        } else {
            checkError.classList.add('show');
        }
    });
}
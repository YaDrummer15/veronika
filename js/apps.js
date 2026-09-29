/* ============================================
   РАБОТА С ЗАЯВКАМИ И ЛОГАМИ
   ============================================ */

const STORAGE_KEY = 'shumilovskaya_applications';
const LOG_KEY = 'shumilovskaya_log';

// Статусы
const STATUS_LABELS = {
    'new': { label: 'Новая', icon: 'fa-circle' },
    'progress': { label: 'На рассмотрении', icon: 'fa-hourglass-half' },
    'done': { label: 'Рассмотрено', icon: 'fa-check-circle' },
    'reject': { label: 'Отказано', icon: 'fa-times-circle' }
};

// Типы событий для логирования
const LOG_TYPES = {
    'create': { label: 'Создание заявки', icon: 'fa-plus-circle', class: 'log-create' },
    'status': { label: 'Смена статуса', icon: 'fa-exchange-alt', class: 'log-status' },
    'reply': { label: 'Ответ врача', icon: 'fa-reply', class: 'log-reply' },
    'delete': { label: 'Удаление', icon: 'fa-trash', class: 'log-delete' },
    'view': { label: 'Просмотр', icon: 'fa-eye', class: 'log-view' }
};

// ===== Заявки =====
function getApplications() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
}

function saveApplications(apps) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

function addApplication(app) {
    const apps = getApplications();
    apps.unshift(app);
    saveApplications(apps);
    updateAdminBadge();
    logEvent('create', app, `Поступила новая заявка на «${app.service}»`);
}

function deleteApplication(id) {
    let apps = getApplications();
    const app = apps.find(a => a.id === id);
    apps = apps.filter(a => a.id !== id);
    saveApplications(apps);
    updateAdminBadge();
    if (app) {
        logEvent('delete', app, `Заявка удалена из системы`);
    }
}

function updateApplication(id, updates) {
    const apps = getApplications();
    const idx = apps.findIndex(a => a.id === id);
    if (idx === -1) return null;
    const oldApp = Object.assign({}, apps[idx]);
    apps[idx] = Object.assign({}, apps[idx], updates);
    saveApplications(apps);
    updateAdminBadge();
    return { oldApp, newApp: apps[idx] };
}

// ===== Логи =====
function getLog() {
    try {
        const data = localStorage.getItem(LOG_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
}

function saveLog(log) {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

function logEvent(type, app, details) {
    const log = getLog();
    log.unshift({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        type: type,
        appId: app.id,
        appNumber: app.number || '—',
        appName: app.name || '—',
        details: details || '',
        date: new Date().toISOString()
    });
    if (log.length > 500) log.length = 500;
    saveLog(log);
    updateJournalBadge();
}

// ===== Утилиты =====
function generateAppNumber() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'только что';
    if (diffMin < 60) return `${diffMin} мин. назад`;
    if (diffHour < 24) return `${diffHour} ч. назад`;
    if (diffDay < 7) return `${diffDay} дн. назад`;

    return date.toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatDateFull(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Счётчики =====
function updateAdminBadge() {
    const apps = getApplications();
    const newCount = apps.filter(a => (a.status || 'new') === 'new').length;
    const badge = document.getElementById('adminBadge');
    const badgeMobile = document.getElementById('adminBadgeMobile');
    [badge, badgeMobile].forEach(b => {
        if (!b) return;
        if (newCount > 0) {
            b.textContent = newCount;
            b.classList.add('show');
        } else {
            b.classList.remove('show');
        }
    });
}

function updateJournalBadge() {
    const log = getLog();
    const tabCountJournal = document.getElementById('tabCountJournal');
    if (tabCountJournal) tabCountJournal.textContent = log.length;
}
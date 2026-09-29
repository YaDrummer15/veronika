/* ============================================
   РАБОТА С ЗАЯВКАМИ И ЛОГАМИ (Firebase Firestore)
   ============================================ */

// ===== 1. Ваш конфиг Firebase =====
const firebaseConfig = {
    apiKey: "AIzaSyCKhtVVFg8YjpLnsm7gOR3WyX8Dj8ijbqM",
    authDomain: "vdasdas-b437d.firebaseapp.com",
    projectId: "vdasdas-b437d",
    storageBucket: "vdasdas-b437d.firebasestorage.app",
    messagingSenderId: "252990860062",
    appId: "1:252990860062:web:8872f57e98a0bab92a770f"
};

// ===== 2. Инициализация Firebase =====
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const appsCollection = db.collection('applications');
const logsCollection = db.collection('logs');

// ===== 3. Кэш локально =====
let appsCache = [];
let logsCache = [];

// ===== 4. Статусы =====
const STATUS_LABELS = {
    'new': { label: 'Новая', icon: 'fa-circle' },
    'progress': { label: 'На рассмотрении', icon: 'fa-hourglass-half' },
    'done': { label: 'Рассмотрено', icon: 'fa-check-circle' },
    'reject': { label: 'Отказано', icon: 'fa-times-circle' }
};

const LOG_TYPES = {
    'create': { label: 'Создание заявки', icon: 'fa-plus-circle', class: 'log-create' },
    'status': { label: 'Смена статуса', icon: 'fa-exchange-alt', class: 'log-status' },
    'reply': { label: 'Ответ врача', icon: 'fa-reply', class: 'log-reply' },
    'delete': { label: 'Удаление', icon: 'fa-trash', class: 'log-delete' },
    'view': { label: 'Просмотр', icon: 'fa-eye', class: 'log-view' }
};

// ===== 5. Загрузка данных =====
async function loadApplicationsFromDB() {
    try {
        const snapshot = await appsCollection.orderBy('date', 'desc').get();
        appsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateAdminBadge();
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && adminPanel.classList.contains('active')) {
            if (typeof renderApplications === 'function') renderApplications();
        }
    } catch (e) {
        console.error('Ошибка загрузки заявок:', e);
    }
}

async function loadLogsFromDB() {
    try {
        const snapshot = await logsCollection.orderBy('date', 'desc').limit(500).get();
        logsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateJournalBadge();
        const journalTab = document.getElementById('tab-journal');
        if (journalTab && journalTab.classList.contains('active')) {
            if (typeof renderJournal === 'function') renderJournal();
        }
    } catch (e) {
        console.error('Ошибка загрузки логов:', e);
    }
}

// ===== 6. Геттеры =====
function getApplications() {
    return appsCache;
}

function getLog() {
    return logsCache;
}

// ===== 7. Добавление заявки =====
async function addApplication(app) {
    try {
        const docRef = await appsCollection.add(app);
        app.id = docRef.id;
        appsCache.unshift(app);
        updateAdminBadge();
        await logEvent('create', app, `Поступила новая заявка на «${app.service}»`);
        return true;
    } catch (e) {
        console.error('Ошибка добавления заявки:', e);
        alert('Не удалось отправить заявку. Проверьте интернет и попробуйте снова.');
        return false;
    }
}

// ===== 8. Обновление заявки =====
async function updateApplication(id, updates) {
    try {
        await appsCollection.doc(id).update(updates);
        const idx = appsCache.findIndex(a => a.id === id);
        if (idx !== -1) {
            appsCache[idx] = Object.assign({}, appsCache[idx], updates);
        }
        updateAdminBadge();
    } catch (e) {
        console.error('Ошибка обновления заявки:', e);
    }
}

// ===== 9. Удаление заявки =====
async function deleteApplication(id) {
    try {
        const app = appsCache.find(a => a.id === id);
        await appsCollection.doc(id).delete();
        appsCache = appsCache.filter(a => a.id !== id);
        updateAdminBadge();
        if (app) {
            await logEvent('delete', app, `Заявка удалена из системы`);
        }
    } catch (e) {
        console.error('Ошибка удаления заявки:', e);
    }
}

// ===== 10. Логирование =====
async function logEvent(type, app, details) {
    const logItem = {
        type: type,
        appId: app.id,
        appNumber: app.number || '—',
        appName: app.name || '—',
        details: details || '',
        date: new Date().toISOString()
    };
    try {
        const docRef = await logsCollection.add(logItem);
        logItem.id = docRef.id;
        logsCache.unshift(logItem);
        if (logsCache.length > 500) logsCache.length = 500;
        updateJournalBadge();
    } catch (e) {
        console.error('Ошибка логирования:', e);
    }
}

// ===== 11. Утилиты =====
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

// ===== 12. Счётчики =====
function updateAdminBadge() {
    const newCount = appsCache.filter(a => (a.status || 'new') === 'new').length;
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
    const tabCountJournal = document.getElementById('tabCountJournal');
    if (tabCountJournal) tabCountJournal.textContent = logsCache.length;
}

// ===== 13. Автообновление каждые 10 секунд =====
setInterval(() => {
    loadApplicationsFromDB();
    loadLogsFromDB();
}, 10000);

// ===== 14. Первоначальная загрузка =====
loadApplicationsFromDB();
loadLogsFromDB();
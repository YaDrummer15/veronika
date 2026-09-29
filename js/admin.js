/* ============================================
   ЛИЧНЫЙ КАБИНЕТ ГЛАВНОГО ВРАЧА
   ============================================ */

// ===== Настройки входа =====
const ADMIN_LOGIN = 'admin';
const ADMIN_PASSWORD = 'veronika2025';

// ===== Элементы =====
const adminModal = document.getElementById('adminModal');
const adminLoginBox = document.getElementById('adminLoginBox');
const adminPanel = document.getElementById('adminPanel');
const openAdminBtn = document.getElementById('openAdminBtn');
const openAdminBtnMobile = document.getElementById('openAdminBtnMobile');
const closeAdminBtn = document.getElementById('closeAdminBtn');
const closePanelBtn = document.getElementById('closePanelBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLogin = document.getElementById('adminLogin');
const adminPassword = document.getElementById('adminPassword');
const adminError = document.getElementById('adminError');
const applicationsList = document.getElementById('applicationsList');
const listTitle = document.getElementById('listTitle');

let isLoggedIn = false;
let currentFilter = 'all';
let currentLogFilter = 'all';
const expandedIds = new Set();

// ===== Открытие/закрытие =====
function openAdmin() {
    adminModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (mobileMenu && mobileMenu.classList.contains('active')) toggleMenu();

    if (isLoggedIn) {
        adminLoginBox.style.display = 'none';
        adminPanel.classList.add('active');
        renderApplications();
        renderJournal();
        updateJournalBadge();
    } else {
        adminLoginBox.style.display = 'block';
        adminPanel.classList.remove('active');
        adminLogin.value = '';
        adminPassword.value = '';
        adminError.classList.remove('show');
        setTimeout(() => adminLogin.focus(), 100);
    }
}

function closeAdmin() {
    adminModal.classList.remove('active');
    document.body.style.overflow = '';
}

if (openAdminBtn) openAdminBtn.addEventListener('click', openAdmin);
if (openAdminBtnMobile) openAdminBtnMobile.addEventListener('click', openAdmin);
if (closeAdminBtn) closeAdminBtn.addEventListener('click', closeAdmin);
if (closePanelBtn) closePanelBtn.addEventListener('click', closeAdmin);

if (adminModal) {
    adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) closeAdmin();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (adminModal && adminModal.classList.contains('active')) closeAdmin();
        if (typeof checkModal !== 'undefined' && checkModal && checkModal.classList.contains('active')) closeCheck();
    }
});

// ===== Вход =====
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const login = adminLogin.value.trim();
        const password = adminPassword.value;

        if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
            isLoggedIn = true;
            adminError.classList.remove('show');
            adminLoginBox.style.display = 'none';
            adminPanel.classList.add('active');
            renderApplications();
            renderJournal();
            updateJournalBadge();
        } else {
            adminError.classList.add('show');
            adminPassword.value = '';
            adminPassword.focus();
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        isLoggedIn = false;
        adminPanel.classList.remove('active');
        adminLoginBox.style.display = 'block';
        adminLogin.value = '';
        adminPassword.value = '';
        adminError.classList.remove('show');
    });
}

// ===== Вкладки =====
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('tab-' + tabName).classList.add('active');
        if (tabName === 'journal') {
            renderJournal();
        } else {
            renderApplications();
        }
    });
});

// ===== Фильтры заявок =====
document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', function() {
        currentFilter = this.dataset.filter;
        document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderApplications();
    });
});

// ===== Фильтры журнала =====
document.querySelectorAll('.filter-btn[data-log-filter]').forEach(btn => {
    btn.addEventListener('click', function() {
        currentLogFilter = this.dataset.logFilter;
        document.querySelectorAll('.filter-btn[data-log-filter]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderJournal();
    });
});

// ===== Действия с заявками =====
function toggleExpand(id) {
    if (expandedIds.has(id)) {
        expandedIds.delete(id);
    } else {
        expandedIds.add(id);
        const app = getApplications().find(a => a.id === id);
        if (app && (!app.status || app.status === 'new')) {
            updateApplication(id, { status: 'progress' });
            logEvent('status', app, `Статус изменён: «Новая» → «На рассмотрении» (автоматически при просмотре)`);
        } else if (app) {
            logEvent('view', app, `Главный врач просмотрел заявку`);
        }
    }
    renderApplications();
    const journalTab = document.getElementById('tab-journal');
    if (journalTab && journalTab.classList.contains('active')) {
        renderJournal();
    }
}

function changeStatus(id, status, event) {
    if (event) event.stopPropagation();
    const apps = getApplications();
    const app = apps.find(a => a.id === id);
    if (!app) return;

    const oldStatus = app.status || 'new';
    if (oldStatus === status) return;

    const oldLabel = STATUS_LABELS[oldStatus]?.label || oldStatus;
    const newLabel = STATUS_LABELS[status]?.label || status;

    updateApplication(id, { status: status });
    logEvent('status', app, `Статус изменён: «${oldLabel}» → «${newLabel}»`);
    renderApplications();
    const journalTab = document.getElementById('tab-journal');
    if (journalTab && journalTab.classList.contains('active')) renderJournal();
}

function saveReply(id, event) {
    if (event) event.stopPropagation();
    const textarea = document.getElementById('reply-' + id);
    if (!textarea) return;
    const text = textarea.value.trim();
    if (!text) {
        alert('Введите текст ответа');
        return;
    }

    const apps = getApplications();
    const app = apps.find(a => a.id === id);
    if (!app) return;

    const isEdit = !!(app.reply && app.reply.trim());
    const oldStatus = app.status || 'new';

    updateApplication(id, {
        reply: text,
        replyDate: new Date().toISOString(),
        status: 'done'
    });

    if (isEdit) {
        logEvent('reply', app, `Ответ врача отредактирован`);
    } else {
        logEvent('reply', app, `Оставлен ответ пациенту`);
    }

    if (oldStatus !== 'done') {
        const oldLabel = STATUS_LABELS[oldStatus]?.label || oldStatus;
        logEvent('status', app, `Статус изменён: «${oldLabel}» → «Рассмотрено» (при сохранении ответа)`);
    }

    renderApplications();
    const journalTab = document.getElementById('tab-journal');
    if (journalTab && journalTab.classList.contains('active')) renderJournal();
}

function deleteReply(id, event) {
    if (event) event.stopPropagation();
    if (!confirm('Удалить сохранённый ответ?')) return;
    const apps = getApplications();
    const app = apps.find(a => a.id === id);
    if (!app) return;

    updateApplication(id, { reply: '', replyDate: null });
    logEvent('reply', app, `Ответ врача удалён`);
    renderApplications();
    const journalTab = document.getElementById('tab-journal');
    if (journalTab && journalTab.classList.contains('active')) renderJournal();
}

function confirmDelete(id, event) {
    if (event) event.stopPropagation();
    const apps = getApplications();
    const app = apps.find(a => a.id === id);
    if (!app) return;

    if (confirm(`Удалить заявку №${app.number} от ${app.name}?`)) {
        expandedIds.delete(id);
        deleteApplication(id);
        renderApplications();
        const journalTab = document.getElementById('tab-journal');
        if (journalTab && journalTab.classList.contains('active')) renderJournal();
    }
}

// ===== Счётчики =====
function updateCounters(apps) {
    const counts = {
        all: apps.length,
        new: apps.filter(a => (a.status || 'new') === 'new').length,
        progress: apps.filter(a => a.status === 'progress').length,
        done: apps.filter(a => a.status === 'done').length,
        reject: apps.filter(a => a.status === 'reject').length
    };

    document.getElementById('countAll').textContent = counts.all;
    document.getElementById('countNew').textContent = counts.new;
    document.getElementById('countProgress').textContent = counts.progress;
    document.getElementById('countDone').textContent = counts.done;
    document.getElementById('countReject').textContent = counts.reject;

    document.getElementById('statNew').textContent = counts.new;
    document.getElementById('statProgress').textContent = counts.progress;
    document.getElementById('statDone').textContent = counts.done;
    document.getElementById('statReject').textContent = counts.reject;

    const tabCountApps = document.getElementById('tabCountApps');
    if (tabCountApps) tabCountApps.textContent = counts.all;
}

// ===== История заявки =====
function getAppHistory(appId) {
    const log = getLog();
    return log.filter(item => item.appId === appId).reverse();
}

function renderAppHistory(appId) {
    const history = getAppHistory(appId);
    if (history.length === 0) {
        return '<div style="font-size:0.82rem;color:var(--grey-muted);padding:8px 0;">История пуста</div>';
    }
    return history.map(item => {
        const type = LOG_TYPES[item.type] || LOG_TYPES.view;
        return `
            <div class="history-item">
                <div class="history-icon ${type.class}">
                    <i class="fas ${type.icon}"></i>
                </div>
                <div class="history-content">
                    <div class="history-text">${escapeHtml(item.details)}</div>
                    <span class="history-time">${formatDateFull(item.date)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Отрисовка заявок =====
function renderApplications() {
    const allApps = getApplications();
    updateCounters(allApps);
    updateAdminBadge();

    let apps = allApps;
    if (currentFilter !== 'all') {
        apps = allApps.filter(a => (a.status || 'new') === currentFilter);
    }

    const titles = {
        all: 'Все заявки',
        new: 'Новые заявки',
        progress: 'На рассмотрении',
        done: 'Рассмотренные',
        reject: 'Отказано'
    };
    listTitle.textContent = titles[currentFilter] || 'Заявки';

    if (apps.length === 0) {
        applicationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>${currentFilter === 'all' ? 'Пока нет поступивших заявок' : 'В этой категории заявок нет'}</p>
                <small>${currentFilter === 'all' ? 'Заявки с формы «Записаться на приём» появятся здесь' : 'Попробуйте выбрать другой фильтр'}</small>
            </div>
        `;
        return;
    }

    applicationsList.innerHTML = apps.map(app => {
        const status = app.status || 'new';
        const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.new;
        const initials = app.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const isExpanded = expandedIds.has(app.id);

        let replyBlock = '';
        if (app.reply) {
            replyBlock = `
                <div class="app-details-section">
                    <h5><i class="fas fa-comment-medical"></i> Ваш ответ пациенту</h5>
                    <div class="existing-reply">
                        ${escapeHtml(app.reply)}
                        <div class="existing-reply-meta">
                            <i class="far fa-clock"></i> Отправлено ${formatDate(app.replyDate)}
                            <button class="btn-delete-app" onclick="deleteReply('${app.id}', event)" title="Удалить ответ" style="margin-left:auto; width:28px; height:28px; font-size:0.75rem;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="application-item status-${status} ${isExpanded ? 'expanded' : ''}" data-id="${app.id}">
                <div class="app-main" onclick="toggleExpand('${app.id}')">
                    <div class="application-avatar">${initials || '?'}</div>
                    <div class="application-info">
                        <strong>
                            ${escapeHtml(app.name)}
                            <span class="app-num">№ ${escapeHtml(app.number || '—')}</span>
                            <span class="status-badge status-${status}">
                                <i class="fas ${statusInfo.icon}"></i> ${statusInfo.label}
                            </span>
                            ${app.reply ? '<span class="status-badge status-done"><i class="fas fa-comment"></i> Ответ отправлен</span>' : ''}
                        </strong>
                        <div class="app-meta">
                            <span><i class="fas fa-phone"></i> ${escapeHtml(app.phone)}</span>
                            <span><i class="fas fa-stethoscope"></i> ${escapeHtml(app.service)}</span>
                        </div>
                        ${app.message ? `<div class="app-message">«${escapeHtml(app.message)}»</div>` : ''}
                    </div>
                    <div class="application-actions">
                        <span class="app-time"><i class="far fa-clock"></i> ${formatDate(app.date)}</span>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <i class="fas fa-chevron-${isExpanded ? 'up' : 'down'}" style="color:#718096; font-size:0.8rem;"></i>
                            <button class="btn-delete-app" title="Удалить заявку" onclick="confirmDelete('${app.id}', event)"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>

                <div class="app-details">
                    <div class="app-details-section">
                        <h5><i class="fas fa-exchange-alt"></i> Изменить статус заявки</h5>
                        <div class="status-buttons">
                            <button class="status-btn status-btn-new ${status === 'new' ? 'active' : ''}" onclick="changeStatus('${app.id}', 'new', event)">
                                <i class="fas fa-circle"></i> Новая
                            </button>
                            <button class="status-btn status-btn-progress ${status === 'progress' ? 'active' : ''}" onclick="changeStatus('${app.id}', 'progress', event)">
                                <i class="fas fa-hourglass-half"></i> На рассмотрении
                            </button>
                            <button class="status-btn status-btn-done ${status === 'done' ? 'active' : ''}" onclick="changeStatus('${app.id}', 'done', event)">
                                <i class="fas fa-check-circle"></i> Рассмотрено
                            </button>
                            <button class="status-btn status-btn-reject ${status === 'reject' ? 'active' : ''}" onclick="changeStatus('${app.id}', 'reject', event)">
                                <i class="fas fa-times-circle"></i> Отказано
                            </button>
                        </div>
                    </div>

                    ${replyBlock}

                    <div class="app-details-section">
                        <h5><i class="fas fa-reply"></i> ${app.reply ? 'Изменить ответ' : 'Оставить ответ пациенту'}</h5>
                        <textarea
                            class="reply-textarea"
                            id="reply-${app.id}"
                            placeholder="Например: Здравствуйте! Записал вас на приём 15 октября в 10:00. Пожалуйста, подтвердите...">${app.reply ? escapeHtml(app.reply) : ''}</textarea>
                        <div class="reply-actions">
                            <button class="btn-save-reply" onclick="saveReply('${app.id}', event)">
                                <i class="fas fa-paper-plane"></i> Сохранить ответ
                            </button>
                        </div>
                    </div>

                    <div class="app-details-section">
                        <h5><i class="fas fa-history"></i> История заявки</h5>
                        <div class="app-history">
                            ${renderAppHistory(app.id)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Отрисовка журнала =====
function renderJournal() {
    const log = getLog();
    updateJournalBadge();

    let filtered = log;
    if (currentLogFilter !== 'all') {
        filtered = log.filter(item => item.type === currentLogFilter);
    }

    const logCountAll = document.getElementById('logCountAll');
    if (logCountAll) logCountAll.textContent = log.length;

    const journalList = document.getElementById('journalList');
    if (!journalList) return;

    if (filtered.length === 0) {
        journalList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>${currentLogFilter === 'all' ? 'Журнал пока пуст' : 'В этой категории событий нет'}</p>
                <small>${currentLogFilter === 'all' ? 'Здесь будут отображаться все действия с заявками' : 'Попробуйте выбрать другой фильтр'}</small>
            </div>
        `;
        return;
    }

    journalList.innerHTML = filtered.map(item => {
        const type = LOG_TYPES[item.type] || LOG_TYPES.view;
        return `
            <div class="journal-item">
                <div class="journal-icon ${type.class}">
                    <i class="fas ${type.icon}"></i>
                </div>
                <div class="journal-content">
                    <div class="journal-title">
                        ${type.label} · ${escapeHtml(item.appName)}
                    </div>
                    <div class="journal-detail">${escapeHtml(item.details)}</div>
                </div>
                <div class="journal-meta">
                    <span class="app-num-small">№ ${escapeHtml(item.appNumber)}</span>
                    <span><i class="far fa-clock"></i> ${formatDateFull(item.date)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Экспорт журнала =====
const exportJournalBtn = document.getElementById('exportJournalBtn');
if (exportJournalBtn) {
    exportJournalBtn.addEventListener('click', function() {
        const log = getLog();
        if (log.length === 0) {
            alert('Журнал пуст — нечего экспортировать');
            return;
        }
        const dataStr = JSON.stringify(log, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `journal_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// ===== Глобальные функции для inline-обработчиков =====
window.toggleExpand = toggleExpand;
window.changeStatus = changeStatus;
window.saveReply = saveReply;
window.deleteReply = deleteReply;
window.confirmDelete = confirmDelete;

// ===== Инициализация =====
updateAdminBadge();
updateJournalBadge();
setInterval(updateAdminBadge, 5000);
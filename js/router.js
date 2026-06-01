// Enrutador simple basado en hash
function navigateTo(page) {
    window.location.hash = page;
}

// Renderizar página según el hash
function renderPage() {
    const hash = window.location.hash.slice(1) || 'home';
    const app = document.getElementById('app');
    
    if (!app) return;
    
    switch(hash) {
        case 'home':
            renderHomePage(app);
            break;
        default:
            renderHomePage(app);
    }
}

// Escuchar cambios de hash
window.addEventListener('hashchange', renderPage);

// Carga inicial
window.addEventListener('DOMContentLoaded', renderPage);

// Hacer disponible globalmente
window.navigateTo = navigateTo;
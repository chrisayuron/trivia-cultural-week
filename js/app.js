// Función principal para renderizar la página de inicio
function renderHomePage(container) {
    const games = window.GAMES_DATA || [];
    
    container.innerHTML = `
        <!-- Hero Section -->
        <section class="relative overflow-hidden">
            <div class="max-w-7xl mx-auto px-4 pt-12 pb-20 text-center relative z-10">
                <div class="animate-float inline-block mb-6">
                    <span class="text-8xl">🏆</span>
                </div>
                <h1 class="text-5xl md:text-7xl font-black text-white mb-6 animate-fadeIn">
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400">
                        TRIVIA MUNDIALISTA
                    </span>
                </h1>
                <p class="text-xl md:text-2xl text-slate-300 font-light mb-4 animate-slideInLeft">
                    Cultural Week 2026
                </p>
                <p class="text-lg text-slate-400 mb-8 animate-fadeIn">
                    ¡Explora el mundo, un gol a la vez! 🌍⚽
                </p>
                <div class="flex gap-4 justify-center animate-scaleIn">
                    <a href="#juegos" 
                       class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        🎮 Ver Juegos
                    </a>
                </div>
            </div>
            
            <!-- Decoración de fondo -->
            <div class="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                <div class="absolute top-10 left-10 text-9xl">⚽</div>
                <div class="absolute top-20 right-20 text-8xl">🌍</div>
                <div class="absolute bottom-10 left-1/4 text-7xl">🏟️</div>
                <div class="absolute bottom-20 right-1/4 text-9xl">🎯</div>
            </div>
        </section>

        <!-- Sección de Juegos -->
        <section id="juegos" class="max-w-7xl mx-auto px-4 pb-20">
            <div class="text-center mb-12">
                <h2 class="text-4xl font-bold text-white mb-4 animate-fadeIn">
                    🎮 Elige tu Desafío
                </h2>
                <p class="text-slate-400 text-lg">
                    Descubre nuestra colección de juegos educativos mundialistas
                </p>
            </div>
            
            <!-- Filtros -->
            <div class="flex flex-wrap gap-3 justify-center mb-8">
                <button onclick="filterGames('all')" class="filter-btn px-4 py-2 rounded-full font-semibold transition-colors bg-emerald-500 text-white">
                    Todos
                </button>
                <button onclick="filterGames('available')" class="filter-btn px-4 py-2 rounded-full font-semibold transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600">
                    Disponibles
                </button>
                <button onclick="filterGames('soon')" class="filter-btn px-4 py-2 rounded-full font-semibold transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600">
                    Próximamente
                </button>
                <button onclick="filterGames('popular')" class="filter-btn px-4 py-2 rounded-full font-semibold transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600">
                    🔥 Populares
                </button>
            </div>
            
            <!-- Grid de juegos -->
            <div id="gamesGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                <!-- Las tarjetas se generarán dinámicamente -->
            </div>
        </section>
    `;
    
    // Poblar el grid después de renderizar
    setTimeout(() => {
        const grid = document.getElementById('gamesGrid');
        if (grid) {
            grid.innerHTML = games.map(game => createGameCard(game)).join('');
        }
    }, 0);
}

// Función para filtrar juegos
function filterGames(filter) {
    const games = window.GAMES_DATA;
    let filteredGames = games;
    
    // Actualizar botones de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-500', 'text-white');
        btn.classList.add('bg-slate-700', 'text-slate-300');
    });
    
    // Encontrar el botón clickeado y actualizarlo
    const clickedButton = event.target;
    clickedButton.classList.add('bg-emerald-500', 'text-white');
    clickedButton.classList.remove('bg-slate-700', 'text-slate-300');
    
    // Aplicar filtro
    switch(filter) {
        case 'available':
            filteredGames = games.filter(g => g.status === 'available');
            break;
        case 'soon':
            filteredGames = games.filter(g => g.status === 'soon' || g.status === 'building');
            break;
        case 'popular':
            filteredGames = games.filter(g => g.isPopular);
            break;
        default:
            filteredGames = games;
    }
    
    // Actualizar grid
    const grid = document.getElementById('gamesGrid');
    if (grid) {
        grid.innerHTML = filteredGames.map(game => createGameCard(game)).join('');
    }
}

// Función para toggle menú móvil
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Hacer funciones disponibles globalmente
window.filterGames = filterGames;
window.toggleMobileMenu = toggleMobileMenu;
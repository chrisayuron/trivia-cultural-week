// Función para crear tarjeta de juego con diseño Tailwind original
function createGameCard(game) {
    const statusBadgeHTML = getStatusBadge(game.status);
    const difficultyStarsHTML = getDifficultyStars(game.difficulty);
    const isPlayable = game.status === 'available';

    return `
        <article class="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group flex flex-col h-full">
            <!-- Imagen y overlay -->
            <div class="relative overflow-hidden h-48 flex-shrink-0">
                <img 
                    src="${game.image}" 
                    alt="${game.name}" 
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onerror="this.src='https://placehold.co/400x300/1E293B/FFFFFF?text=${encodeURIComponent(game.name)}'"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                <!-- Badges superiores -->
                <div class="absolute top-3 left-3 flex gap-2 flex-wrap">
                    ${game.isPopular ? '<span class="bg-amber-400 text-slate-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><span>🔥</span> Popular</span>' : ''}
                    ${statusBadgeHTML}
                </div>
            </div>

            <!-- Contenido flexible -->
            <div class="p-5 flex flex-col flex-1">
                <h3 class="text-xl font-bold text-slate-800 mb-1">${game.name}</h3>
                
                <!-- Descripción con scroll si es necesario -->
                <div class="text-slate-600 text-sm mb-4 max-h-16 overflow-y-auto pr-1 scrollbar-thin">
                    ${game.description}
                </div>
                
                <!-- Metadatos -->
                <div class="flex flex-wrap gap-2 mb-4">
                    <span class="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full">👤 ${game.minAge}+ años</span>
                    <span class="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">⏱️ ${game.estimatedTime}</span>
                    <span class="text-xs bg-purple-100 text-purple-800 font-semibold px-2.5 py-0.5 rounded-full">👥 ${game.maxPlayers} ${game.maxPlayers === 1 ? 'Jug.' : 'Jugs.'}</span>
                </div>

                <!-- Dificultad y competencias (empujados hacia abajo) -->
                <div class="flex items-center justify-between mb-4 mt-auto">
                    <div class="flex items-center gap-1">
                        <span class="text-xs text-slate-500">Dificultad:</span>
                        ${difficultyStarsHTML}
                    </div>
                    <span class="text-xs text-slate-500 italic">${game.competencies[0]}</span>
                </div>

                <!-- Botones de acción (siempre mismo tamaño) -->
                <div class="flex gap-3 border-t pt-4 border-slate-200 mt-auto">
                    ${isPlayable ? `
                        <a href="${game.gameUrl}" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm">
                            <span>⚽</span> Jugar Ahora
                        </a>
                    ` : `
                        <button disabled class="flex-1 bg-slate-300 text-slate-500 font-bold py-2.5 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                            <span>🔒</span> ${game.status === 'soon' ? 'Próximamente' : 'En construcción'}
                        </button>
                    `}
                    <button onclick="showGameInfo('${game.id}')" class="flex-1 bg-white border-2 border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm">
                        ℹ️ Ver info
                    </button>
                </div>
            </div>
        </article>
    `;
}

// Función para obtener badge de estado (HTML string)
function getStatusBadge(status) {
    const badges = {
        'available': '<span class="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">✅ Disponible</span>',
        'soon': '<span class="bg-amber-400 text-slate-900 text-xs font-bold px-2 py-1 rounded-full">⏳ Próximamente</span>',
        'building': '<span class="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">🚧 En construcción</span>'
    };
    return badges[status] || badges['available'];
}

// Función para estrellas de dificultad
function getDifficultyStars(level) {
    let stars = '<div class="flex gap-0.5">';
    for (let i = 1; i <= 3; i++) {
        stars += `<span class="text-lg ${i <= level ? 'text-amber-400' : 'text-slate-300'}">★</span>`;
    }
    stars += '</div>';
    return stars;
}

// Función para mostrar información detallada del juego
function showGameInfo(gameId) {
    const game = window.GAMES_DATA.find(g => g.id === gameId);
    if (!game) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div class="relative h-48 rounded-t-2xl overflow-hidden">
                <img src="${game.image}" alt="${game.name}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <button onclick="this.closest('.fixed').remove()" 
                        class="absolute top-3 right-3 bg-white/20 hover:bg-white/30 text-white rounded-full w-8 h-8 flex items-center justify-center">
                    ✕
                </button>
                <h2 class="absolute bottom-4 left-4 text-white text-2xl font-bold">${game.name}</h2>
            </div>
            
            <div class="p-6">
                <p class="text-slate-600 mb-6">${game.description}</p>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-slate-50 p-4 rounded-xl">
                        <span class="text-sm text-slate-500">Edad</span>
                        <p class="font-bold text-slate-800">${game.minAge}+ años</p>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-xl">
                        <span class="text-sm text-slate-500">Jugadores</span>
                        <p class="font-bold text-slate-800">Hasta ${game.maxPlayers}</p>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-xl">
                        <span class="text-sm text-slate-500">Tiempo</span>
                        <p class="font-bold text-slate-800">${game.estimatedTime}</p>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-xl">
                        <span class="text-sm text-slate-500">Categoría</span>
                        <p class="font-bold text-slate-800">${game.category}</p>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h3 class="font-bold text-slate-800 mb-2">🎯 Objetivos Educativos</h3>
                    <div class="flex flex-wrap gap-2">
                        ${game.objectives.map(obj => `<span class="bg-emerald-100 text-emerald-800 text-sm px-3 py-1 rounded-full">${obj}</span>`).join('')}
                    </div>
                </div>
                
                <div class="mb-6">
                    <h3 class="font-bold text-slate-800 mb-2">💡 Competencias que Desarrolla</h3>
                    <div class="flex flex-wrap gap-2">
                        ${game.competencies.map(comp => `<span class="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">${comp}</span>`).join('')}
                    </div>
                </div>
                
                ${game.status === 'available' 
                    ? `<button onclick="openGame('${game.gameUrl}')" 
                       class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2">
                       ⚽ Jugar Ahora
                       </button>`
                    : `<button disabled class="w-full bg-slate-300 text-slate-500 font-bold py-3 rounded-xl cursor-not-allowed">
                       ${game.status === 'soon' ? '⏳ Próximamente' : '🚧 En construcción'}
                       </button>`
                }
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Función para abrir un juego
function openGame(url) {
    if (!url || url === '#') {
        alert('Este juego aún no está disponible');
        return;
    }
    window.location.href = url;
}

// Hacer funciones disponibles globalmente
window.createGameCard = createGameCard;
window.showGameInfo = showGameInfo;
window.openGame = openGame;
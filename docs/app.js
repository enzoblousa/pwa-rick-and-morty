class RickAndMortyPWA {
    constructor() {
        this.baseUrl = 'https://rickandmortyapi.com/api';
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.bindEvents();
        this.loadInitialCharacters();
    }

    registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered successfully: ', registration);
                
                // Verifica se há uma nova versão
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('New Service Worker found:', newWorker);
                });
                
                // Força atualização
                return registration.update();
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
        
        // Ouvinte para SW pronto
        navigator.serviceWorker.ready.then(registration => {
            console.log('Service Worker ready and controlling the page');
        });
    }
}

    bindEvents() {
        const searchButton = document.getElementById('searchButton');
        const searchInput = document.getElementById('searchInput');
        const closeModal = document.querySelector('.close');
        const modal = document.getElementById('characterModal');

        searchButton.addEventListener('click', () => this.searchCharacters());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCharacters();
        });

        closeModal.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    }

    async loadInitialCharacters() {
        try {
            const response = await fetch(`${this.baseUrl}/character`);
            const data = await response.json();
            this.displayCharacters(data.results);
        } catch (error) {
            this.showError();
        }
    }

    async searchCharacters() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.trim();

        this.showLoading();

        try {
            let url;
            if (query) {
                url = `${this.baseUrl}/character?name=${encodeURIComponent(query)}`;
            } else {
                url = `${this.baseUrl}/character`;
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Character not found');
            }

            const data = await response.json();
            this.displayCharacters(data.results);
        } catch (error) {
            this.showError('Personagem não encontrado. Tente outro nome.');
        } finally {
            this.hideLoading();
        }
    }

    displayCharacters(characters) {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';

        characters.forEach(character => {
            const characterCard = this.createCharacterCard(character);
            resultsContainer.appendChild(characterCard);
        });
    }

    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <img src="${character.image}" alt="${character.name}" class="character-image">
            <div class="character-info">
                <div class="character-name">${character.name}</div>
                <div class="character-details">
                    <div>Espécie: ${character.species}</div>
                    <div>Origem: ${character.origin.name}</div>
                </div>
                <span class="character-status status-${character.status.toLowerCase()}">
                    ${character.status}
                </span>
            </div>
        `;

        card.addEventListener('click', () => this.showCharacterDetails(character));
        return card;
    }

    showCharacterDetails(character) {
        const modal = document.getElementById('characterModal');
        const detailsContainer = document.getElementById('characterDetails');

        detailsContainer.innerHTML = `
            <div class="character-detail">
                <img src="${character.image}" alt="${character.name}">
                <h2>${character.name}</h2>
                <div class="detail-item"><strong>Status:</strong> ${character.status}</div>
                <div class="detail-item"><strong>Espécie:</strong> ${character.species}</div>
                <div class="detail-item"><strong>Gênero:</strong> ${character.gender}</div>
                <div class="detail-item"><strong>Origem:</strong> ${character.origin.name}</div>
                <div class="detail-item"><strong>Localização:</strong> ${character.location.name}</div>
                <div class="detail-item"><strong>Episódios:</strong> ${character.episode.length}</div>
                <div class="detail-item"><strong>Criado em:</strong> ${new Date(character.created).toLocaleDateString('pt-BR')}</div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    closeModal() {
        const modal = document.getElementById('characterModal');
        modal.classList.add('hidden');
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('results').innerHTML = '';
        document.getElementById('error').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message = 'Erro ao carregar dados. Tente novamente.') {
        const errorElement = document.getElementById('error');
        errorElement.querySelector('p').textContent = message;
        errorElement.classList.remove('hidden');
        document.getElementById('results').innerHTML = '';
    }
}

// Initialize the PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RickAndMortyPWA();
});
// ===== CÓDIGO DE INSTALAÇÃO DO PWA =====
class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    init() {
        this.createInstallButton();
        this.listenToInstallPrompt();
    }

    createInstallButton() {
        // Remove botão existente se houver
        const existingButton = document.getElementById('pwa-install-button');
        if (existingButton) {
            existingButton.remove();
        }

        // Cria novo botão
        this.installButton = document.createElement('button');
        this.installButton.id = 'pwa-install-button';
        this.installButton.innerHTML = '📱 INSTALAR APP';
        this.installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            z-index: 10000;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;

        this.installButton.addEventListener('mouseenter', () => {
            this.installButton.style.transform = 'scale(1.05)';
        });

        this.installButton.addEventListener('mouseleave', () => {
            this.installButton.style.transform = 'scale(1)';
        });

        this.installButton.addEventListener('click', () => {
            this.installPWA();
        });

        document.body.appendChild(this.installButton);
        this.installButton.style.display = 'none';
    }

    listenToInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('✅ beforeinstallprompt disparado!');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('🎉 PWA instalado com sucesso!');
            this.hideInstallButton();
            this.deferredPrompt = null;
        });
    }

    showInstallButton() {
        if (this.installButton) {
            this.installButton.style.display = 'block';
            console.log('📱 Botão de instalação mostrado');
        }
    }

    hideInstallButton() {
        if (this.installButton) {
            this.installButton.style.display = 'none';
        }
    }

    async installPWA() {
        if (this.deferredPrompt) {
            console.log('🔄 Iniciando instalação...');
            this.deferredPrompt.prompt();
            
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`📊 Resultado da instalação: ${outcome}`);
            
            this.deferredPrompt = null;
            this.hideInstallButton();
        }
    }
}

// Inicializa o gerenciador de instalação
let pwaInstallManager;

document.addEventListener('DOMContentLoaded', () => {
    new RickAndMortyPWA();
    pwaInstallManager = new PWAInstallManager();
});

// Verifica se já está instalado
window.addEventListener('load', () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 App rodando em modo standalone (já instalado)');
    }
});
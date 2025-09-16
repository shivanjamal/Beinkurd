
/*
  Gemini Code Assist: Refactored and modularized JavaScript
  - Moved all JS to an external file.
  - Created a main `CinemaApp` object to encapsulate functionality.
  - Used event delegation for more efficient channel switching.
  - Consolidated redundant code into helper functions.
  - Introduced a state object for better management.
*/

const CinemaApp = {
    // --- STATE ---
    version: '1.1.0', // Update this to show the "What's New" pop-up
    state: {
        isMuted: false,
        favorites: [],
        currentStreamSrc: null,
        recentlyWatched: [],
        contextMenuChannel: null,
        mouseIdleTimer: null,
    },

    // --- CHANNEL DATA ---
    channels: [],
    // --- DOM ELEMENTS ---
    elements: {
        lobbyChannelList: document.querySelector('.lobby-channel-list'),
        lobbyError: document.getElementById('lobby-error'),
        refreshBtn: document.getElementById('refresh-btn'),
        lobbyScreen: document.getElementById('lobby-screen'),
        cinemaContainer: document.querySelector('.cinema-container'),
        iframe: document.querySelector('iframe'),
        channelGrid: document.querySelector('.channel-grid'),
        channelList: document.querySelector('.channel-list'),
        header: document.querySelector('.theater-header'),
        footer: document.querySelector('.theater-footer'),
        screenLabel: document.querySelector('.screen-label'),
        currentChannelInfo: document.querySelector('.current-channel'),
        loader: document.querySelector('.loader-container'),
        matchInfo: document.querySelector('.match-info'),
        muteBtn: document.getElementById('mute-btn'),
        volumeSlider: document.querySelector('.volume-slider'),
        fullscreenBtn: document.getElementById('fullscreen-btn'),
        pipBtn: document.querySelector('.controls .theater-btn:first-child'), // Placeholder selector
        theaterBtn: document.getElementById('theater-mode-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        settingsPanel: document.querySelector('.settings-panel'),
        closeSettingsBtn: document.getElementById('close-settings-btn'),
        colorSwatches: document.querySelectorAll('.color-swatches .swatch'),
        channelSearch: document.getElementById('channel-search'),
        clearSearchBtn: document.getElementById('clear-search-btn'),
        noResultsMessage: document.querySelector('.no-results-message'),
        darkModeToggle: document.getElementById('dark-mode-toggle'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        recentChannelsContainer: document.getElementById('recent-channels-container'),
        lobbyLoaderText: document.querySelector('.lobby-loader-text'),
        recentChannelsList: document.getElementById('recent-channels-list'),
        contextMenu: document.getElementById('context-menu'),
        viewTabs: document.querySelectorAll('.tab-btn'),
        viewPanes: document.querySelectorAll('.view-pane'),
        notificationContainer: document.getElementById('notification-container'),
        clearFavoritesBtn: document.getElementById('clear-favorites-btn'),
        whatsNewModal: document.getElementById('whats-new-modal'),
        closeWhatsNewBtn: document.getElementById('close-whats-new-btn'),
        shareAppBtn: document.getElementById('share-app-btn'),
        shareModal: document.getElementById('share-modal'),
        closeShareModalBtn: document.getElementById('close-share-modal-btn'),
        appLinkInput: document.getElementById('app-link-input'),
        copyLinkBtn: document.getElementById('copy-link-btn'),
        copyCurrentStreamBtn: document.getElementById('copy-current-stream-btn'),
        mobileChannelsBtn: document.getElementById('mobile-channels-btn'),
        closeSidebarBtn: document.getElementById('close-sidebar-btn'),
    },

    // --- INITIALIZATION ---
    init() {
        document.addEventListener('DOMContentLoaded', async () => {
            this.checkVersion();
            await this.loadChannelData();
            this.renderAllChannels();
            this.loadFavorites();
            // this.loadRecentlyWatched(); // Defer this
            this.bindEvents();
            this.startLobbySequence();
            this.loadTheme();
            this.loadDarkMode();
            // this.loadLastView(); // Defer this
        });
    },
    async loadChannelData() {
        try {
            const response = await fetch('channels.json?t=' + new Date().getTime()); // Cache-busting
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.channels = await response.json();
        } catch (error) {
            console.error("Could not load channel data:", error);
            // Display an error message to the user
            this.elements.lobbyChannelList.classList.add('hidden');
            document.querySelector('.lobby-loader').classList.add('hidden');
            this.elements.lobbyError.classList.remove('hidden');
            throw error; // Stop further execution
        }
    },
    renderAllChannels() {
        this.channels.forEach((channel, index) => {
            // Render for Lobby
            const lobbyItem = `
                <div class="lobby-channel-item" data-channel="${channel.id}" data-src="${channel.src}" style="animation-delay: ${0.6 + index * 0.2}s">
                    <div class="lobby-channel-icon">
                        <i class="fas fa-tv"></i>
                    </div>
                    <span>${channel.name}</span>
                </div>`;
            this.elements.lobbyChannelList.innerHTML += lobbyItem;

            // Render for Sidebar Grid
            const gridItem = `
                <div class="channel-item" data-channel="${channel.id}" data-src="${channel.src}">
                    <button class="favorite-btn" data-tooltip="زیادکردن بۆ دڵخوازەکان">
                        <i class="far fa-star"></i>
                    </button>
                    <div class="channel-icon">
                        <i class="fas fa-futbol"></i>
                    </div>
                    <div class="channel-name">${channel.name} <span class="live-badge">ڕاستەوخۆ</span></div>
                </div>`;
            this.elements.channelGrid.innerHTML += gridItem;

            // Render for Sidebar List
            const listItem = `
                <div class="channel-row" data-channel="${channel.id}" data-src="${channel.src}">
                    <button class="favorite-btn" data-tooltip="زیادکردن بۆ دڵخوازەکان">
                        <i class="far fa-star"></i>
                    </button>
                    <div class="channel-row-icon">
                        <i class="fas fa-futbol"></i>
                    </div>
                    <div class="channel-row-info">
                        <div class="channel-row-name">${channel.name} <span class="live-badge">ڕاستەوخۆ</span></div>
                        <div class="channel-row-event">${channel.event}</div>
                    </div>
                </div>`;
            this.elements.channelList.innerHTML += listItem;
        });

        // After rendering, select all items for future use
        // This will be handled dynamically now
    },

    // --- EVENT BINDING ---
    bindEvents() {
        // Use event delegation for channel clicks
        this.elements.channelGrid.addEventListener('click', (e) => this.delegateSidebarClick(e));

        // Lobby screen channel selection
        this.elements.lobbyChannelList.addEventListener('click', (e) => this.handleLobbyChoice(e));

        // Sidebar clicks
        this.elements.channelGrid.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        // Error refresh button
        this.elements.refreshBtn.addEventListener('click', () => location.reload());

        // Mobile sidebar toggles
        this.elements.mobileChannelsBtn.addEventListener('click', () => this.toggleMobileSidebar(true));
        this.elements.closeSidebarBtn.addEventListener('click', () => this.toggleMobileSidebar(false));

        // What's New modal close button
        this.elements.closeWhatsNewBtn.addEventListener('click', () => this.hideWhatsNew());

        // Share Modal
        this.elements.shareAppBtn.addEventListener('click', () => this.toggleShareModal(true));
        this.elements.closeShareModalBtn.addEventListener('click', () => this.toggleShareModal(false));

        // Copy buttons
        this.elements.copyLinkBtn.addEventListener('click', () => this.copyAppLink());
        this.elements.copyCurrentStreamBtn.addEventListener('click', () => this.copyCurrentStreamLink());

        this.elements.channelList.addEventListener('click', (e) => {
            this.delegateSidebarClick(e);
        });
        this.elements.channelList.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        this.elements.recentChannelsList.addEventListener('click', (e) => {
            if (e.target.closest('.channel-row')) this.handleChannelClick(e);
        });

        // Control buttons
        this.elements.muteBtn.onclick = () => this.toggleMute();
        this.elements.volumeSlider.addEventListener('input', this.handleVolumeChange.bind(this));
        this.elements.fullscreenBtn.onclick = () => this.toggleFullscreen();
        this.elements.pipBtn.onclick = () => this.togglePiP();
        this.elements.theaterBtn.onclick = () => this.toggleTheaterView();
        this.elements.settingsBtn.onclick = () => this.toggleSettings(true);
        this.elements.closeSettingsBtn.onclick = () => this.toggleSettings(false);

        // Theme color swatches
        this.elements.colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', this.handleThemeChange.bind(this));
        });

        // Dark mode toggle
        this.elements.darkModeToggle.addEventListener('change', this.handleDarkModeToggle.bind(this));

        // Clear favorites button
        this.elements.clearFavoritesBtn.addEventListener('click', this.clearAllFavorites.bind(this));

        // Filter buttons
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', this.handleFilterClick.bind(this));
        });

        // View tabs
        this.elements.viewTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleViewTabClick(e));
        });

        // Context Menu
        document.addEventListener('click', () => this.hideContextMenu());
        this.elements.contextMenu.addEventListener('click', (e) => this.handleContextMenuAction(e));

        // UI interaction
        document.addEventListener('mousemove', this.handleMouseActivity.bind(this));

        // Search input event
        this.elements.channelSearch.addEventListener('input', this.handleSearch.bind(this));
        this.elements.clearSearchBtn.addEventListener('click', this.clearSearch.bind(this));

        // Iframe load event
        this.elements.iframe.addEventListener('load', this.hideLoader.bind(this));

        // Fullscreen change event
        document.addEventListener('fullscreenchange', this.updateFullscreenIcon.bind(this));
    },

    // --- EVENT HANDLERS ---
    checkVersion() {
        const lastVersion = localStorage.getItem('appVersion');
        if (lastVersion !== this.version) {
            this.elements.whatsNewModal.classList.remove('hidden');
            localStorage.setItem('appVersion', this.version); // Save version as soon as modal is shown
        }
    },

    hideWhatsNew() {
        this.elements.whatsNewModal.classList.add('hidden');
    },

    toggleShareModal(show) {
        this.elements.shareModal.classList.toggle('hidden', !show);
        if (show) this.handleShare();
    },

    toggleMobileSidebar(show) {
        this.elements.channelSidebar.classList.toggle('open', show);
    },

    delegateSidebarClick(event) {
        if (event.target.closest('.favorite-btn')) this.handleFavoriteClick(event);
        else if (event.target.closest('.channel-item, .channel-row')) this.handleChannelClick(event);
    },

    startLobbySequence() {
        // Disable channel clicks initially
        this.elements.lobbyChannelList.style.pointerEvents = 'none';

        // Animate loading text
        setTimeout(() => {
            this.elements.lobbyLoaderText.textContent = '...بارکردنی پێکهاتەکان';
        }, 1500);

        setTimeout(() => {
            this.elements.lobbyLoaderText.textContent = '...پەیوەستبوون';
        }, 2500);

        setTimeout(() => {
            // Enable clicks after the loading animation is complete
            this.elements.lobbyLoaderText.textContent = 'ئامادەیە';
            this.elements.lobbyChannelList.style.pointerEvents = 'auto';
        }, 3500); // Corresponds to the fillLoader animation duration + delay
    },
    handleLobbyChoice(event) {
        const targetChannel = event.target.closest('.lobby-channel-item');
        if (!targetChannel) return;

        const channelId = targetChannel.dataset.channel;
        const channelSrc = targetChannel.dataset.src;

        // Load the selected channel
        this.updatePlayer(channelSrc);
        this.updateActiveChannel(channelId);
        this.updateChannelInfo(document.querySelector(`.channel-item[data-channel="${channelId}"]`));
        this.addRecentlyWatched(channelId);

        // Transition from lobby to main app
        this.elements.lobbyScreen.style.opacity = '0';
        this.elements.lobbyScreen.addEventListener('transitionend', () => {
            this.elements.lobbyScreen.classList.add('hidden');
            this.elements.cinemaContainer.classList.remove('hidden');
        }, { once: true });
    },

    handleChannelClick(event) {
        const targetChannel = event.target.closest('.channel-item, .channel-row');
        if (!targetChannel) return;

        const channelSrc = targetChannel.dataset.src;
        const channelId = targetChannel.dataset.channel;

        if (channelSrc && channelId) {
            this.updatePlayer(channelSrc);
            this.updateActiveChannel(channelId);
            this.updateChannelInfo(targetChannel);
            this.addRecentlyWatched(channelId);
            localStorage.setItem('lastChannelId', channelId); // Save the selected channel
        }
    },

    handleMouseActivity() {
        this.elements.header.style.opacity = '1';
        this.elements.footer.style.opacity = '1';
        this.elements.screenLabel.style.opacity = '1';

        clearTimeout(this.state.mouseIdleTimer);
        this.state.mouseIdleTimer = setTimeout(() => {
            this.elements.header.style.opacity = '0';
            this.elements.footer.style.opacity = '0';
            this.elements.screenLabel.style.opacity = '0';
        }, 3000);
    },

    handleFavoriteClick(event) {
        const favoriteBtn = event.target.closest('.favorite-btn');
        const channelElement = favoriteBtn.closest('.channel-item, .channel-row');
        const channelId = channelElement.dataset.channel;

        if (this.state.favorites.includes(channelId)) {
            // Ask for confirmation before removing (only if it's not from the context menu)
            if (confirm('ئایا دڵنیایت لە سڕینەوەی ئەم کەناڵە لە دڵخوازەکانت؟')) {
                // Remove from favorites
                this.state.favorites = this.state.favorites.filter(id => id !== channelId);
                this.showNotification(`'${channelElement.querySelector('.channel-name, .channel-row-name').textContent.trim()}' لابرا لە دڵخوازەکان`, 'warning');
            } else { return; } // Stop if user cancels
        } else {
            // Add to favorites
            this.state.favorites.push(channelId);
            this.showNotification(`'${channelElement.querySelector('.channel-name, .channel-row-name').textContent.trim()}' زیادکرا بۆ دڵخوازەکان`);
        }

        // Save to localStorage
        localStorage.setItem('favoriteChannels', JSON.stringify(this.state.favorites));
        // Update UI
        this.updateFavoriteIcons();
        this.handleSearch({ target: this.elements.channelSearch }); // Re-apply filter
    },

    handleContextMenu(event) {
        const targetChannel = event.target.closest('.channel-item, .channel-row');
        if (!targetChannel) return;

        event.preventDefault();
        this.state.contextMenuChannel = targetChannel;

        const { clientX: mouseX, clientY: mouseY } = event;

        this.elements.contextMenu.style.top = `${mouseY}px`;
        this.elements.contextMenu.style.left = `${mouseX}px`;

        // Update menu text based on favorite status
        const isFavorited = targetChannel.classList.contains('favorited');
        const favoriteAction = this.elements.contextMenu.querySelector('[data-action="favorite"]');
        favoriteAction.innerHTML = isFavorited
            ? '<i class="fas fa-star-half-alt"></i> لابردن لە دڵخوازەکان'
            : '<i class="fas fa-star"></i> زیادکردن بۆ دڵخوازەکان';

        this.elements.contextMenu.classList.remove('hidden');
    },

    hideContextMenu() {
        this.elements.contextMenu.classList.add('hidden');
        this.state.contextMenuChannel = null;
    },

    handleContextMenuAction(event) {
        const action = event.target.closest('li').dataset.action;
        const channel = this.state.contextMenuChannel;
        if (!action || !channel) return;

        switch (action) {
            case 'play':
                channel.click();
                break;
            case 'favorite':
                const channelId = channel.dataset.channel;
                if (this.state.favorites.includes(channelId)) {
                    this.state.favorites = this.state.favorites.filter(id => id !== channelId);
                    this.showNotification(`'${channel.querySelector('.channel-name, .channel-row-name').textContent.trim()}' لابرا لە دڵخوازەکان`, 'warning');
                } else {
                    this.state.favorites.push(channelId);
                    this.showNotification(`'${channel.querySelector('.channel-name, .channel-row-name').textContent.trim()}' زیادکرا بۆ دڵخوازەکان`);
                }
                localStorage.setItem('favoriteChannels', JSON.stringify(this.state.favorites));
                this.updateFavoriteIcons();
                this.handleSearch({ target: this.elements.channelSearch });
                break;
            case 'copy-link':
                const streamSrc = channel.dataset.src;
                if (streamSrc) {
                    navigator.clipboard.writeText(streamSrc).then(() => {
                        this.showNotification('بەستەری ستریم کۆپی کرا', 'success');
                    }).catch(err => console.error('Failed to copy stream link: ', err));
                }
                break;
        }
        this.hideContextMenu();
    },

    handleSearch(event) {
        const query = event.target.value.toLowerCase().trim();
        // Show or hide the clear button based on input
        this.elements.clearSearchBtn.classList.toggle('hidden', query.length === 0);

        let visibleItems = 0;
        document.querySelectorAll('.channel-item, .channel-row').forEach(item => {
            const nameElement = item.querySelector('.channel-name, .channel-row-name');
            const eventElement = item.querySelector('.channel-row-event');

            const channelName = nameElement ? nameElement.textContent.toLowerCase() : '';
            const eventInfo = eventElement ? eventElement.textContent.toLowerCase() : '';

            const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
            const isFavorited = this.state.favorites.includes(item.dataset.channel);

            const isMatch = channelName.includes(query) || eventInfo.includes(query);
            const passesFilter = activeFilter === 'all' || (activeFilter === 'favorites' && isFavorited);

            // The 'hidden' class will be added if there is no match in either the name or the event info.
            const shouldHide = !(isMatch && passesFilter);
            if (!shouldHide) {
                visibleItems++;
            }
            item.classList.toggle('hidden', shouldHide);
        });

        // Show or hide the 'no results' message
        this.elements.noResultsMessage.classList.toggle('hidden', visibleItems > 0);
    },

    clearSearch() {
        this.elements.channelSearch.value = '';
        // Manually trigger the input event to re-run the search/filter logic
        this.elements.channelSearch.dispatchEvent(new Event('input'));
    },

    handleShare() {
        const url = window.location.href;
        const text = "Check out this awesome football streaming app!";
        const shareLinks = this.elements.shareModal.querySelectorAll('.share-link');

        shareLinks.forEach(link => {
            const platform = link.dataset.platform;
            let shareUrl = '';

            switch (platform) {
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
                    break;
            }
            link.href = shareUrl;
            link.target = '_blank'; // Open in a new tab
        });
    },

    copyCurrentStreamLink() {
        if (this.state.currentStreamSrc) {
            navigator.clipboard.writeText(this.state.currentStreamSrc).then(() => {
                this.showNotification('بەستەری ستریمی ئێستا کۆپی کرا', 'success');
            }).catch(err => console.error('Failed to copy stream link: ', err));
        } else {
            this.showNotification('هیچ ستریمێک کار ناکات بۆ کۆپیکردن', 'warning');
        }
    },

    copyAppLink() {
        this.elements.appLinkInput.select();
        this.elements.appLinkInput.setSelectionRange(0, 99999); // For mobile devices
        try {
            navigator.clipboard.writeText(this.elements.appLinkInput.value);
            this.showNotification('بەستەر کۆپی کرا!', 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    },

    handleFilterClick(event) {
        const filter = event.target.dataset.filter;

        this.elements.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // We can just re-run the search logic, it will handle showing/hiding based on the new filter
        this.handleSearch({ target: this.elements.channelSearch });
    },

    handleViewTabClick(event) {
        const tab = event.currentTarget;
        const view = tab.dataset.view;

        this.elements.viewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        this.elements.viewPanes.forEach(p => p.classList.remove('active'));
        document.querySelector(`.view-pane.${view}`).classList.add('active');
        localStorage.setItem('lastView', view);
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        let iconClass = 'fa-star';
        if (type === 'warning') {
            iconClass = 'fa-trash-alt';
        } else if (type === 'success') {
            iconClass = 'fa-check-circle';
        }

        notification.innerHTML = `<i class="fas ${iconClass}"></i> <span>${message}</span>`;
        this.elements.notificationContainer.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000); // Remove from DOM after animation
    },

    // --- UI & PLAYER UPDATES ---
    updatePlayer(src) {
        this.showLoader();
        this.state.currentStreamSrc = src; // Store the current stream source
        this.elements.iframe.src = src;
    },

    showLoader() {
        this.elements.iframe.style.visibility = 'hidden';
        this.elements.loader.classList.add('visible');
    },

    hideLoader() {
        this.elements.loader.classList.remove('visible');
        this.elements.iframe.style.visibility = 'visible';
    },

    updateActiveChannel(channelId) {
        document.querySelectorAll('.channel-item, .channel-row').forEach(item => {
            item.classList.toggle('active', item.dataset.channel === channelId);
        });
    },

    updateChannelInfo(element) {
        const isRow = element.classList.contains('channel-row');
        const nameSelector = isRow ? '.channel-row-name' : '.channel-name';
        const eventSelector = isRow ? '.channel-row-event' : null;

        // Clone the name element to manipulate it without affecting the original
        const nameElement = element.querySelector(nameSelector)?.cloneNode(true);
        // Remove the live badge from the cloned element before getting text
        nameElement?.querySelector('.live-badge')?.remove();
        const channelName = nameElement?.textContent.trim() || 'Unknown Channel';

        const eventInfo = eventSelector ? element.querySelector(eventSelector)?.textContent : null;

        this.elements.screenLabel.querySelector('span').textContent = channelName;
        this.elements.currentChannelInfo.innerHTML = `<span class="live-indicator">ڕاستەوخۆ</span> ${channelName}`;

        if (eventInfo) {
            this.elements.matchInfo.textContent = eventInfo;
        }
    },

    loadLastChannel() {
        // This is now handled by the lobby screen logic
    },

    loadLastView() {
        const lastView = localStorage.getItem('lastView');
        if (lastView) {
            const tabToActivate = document.querySelector(`.tab-btn[data-view="${lastView}"]`);
            if (tabToActivate) tabToActivate.click();
        }
    },

    loadFavorites() {
        const savedFavorites = localStorage.getItem('favoriteChannels');
        if (savedFavorites) {
            this.state.favorites = JSON.parse(savedFavorites);
        }
        this.updateFavoriteIcons();
    },

    loadRecentlyWatched() {
        const savedRecents = localStorage.getItem('recentlyWatched');
        if (savedRecents) {
            this.state.recentlyWatched = JSON.parse(savedRecents);
        }
        this.renderRecentlyWatched();
    },

    addRecentlyWatched(channelId) {
        // Remove if it already exists to move it to the front
        this.state.recentlyWatched = this.state.recentlyWatched.filter(id => id !== channelId);
        // Add to the beginning of the array
        this.state.recentlyWatched.unshift(channelId);
        // Limit the list to 5 items
        if (this.state.recentlyWatched.length > 5) {
            this.state.recentlyWatched.pop();
        }
        localStorage.setItem('recentlyWatched', JSON.stringify(this.state.recentlyWatched));
        this.renderRecentlyWatched();
    },

    renderRecentlyWatched() {
        this.elements.recentChannelsList.innerHTML = '';
        if (this.state.recentlyWatched.length > 0) {
            this.elements.recentChannelsContainer.classList.remove('hidden');
            this.state.recentlyWatched.forEach(channelId => {
                const originalChannel = document.querySelector(`.channel-row[data-channel="${channelId}"]`);
                if (originalChannel) {
                    const clonedChannel = originalChannel.cloneNode(true);
                    this.elements.recentChannelsList.appendChild(clonedChannel);
                }
            });
        }
    },

    updateFavoriteIcons() {
        document.querySelectorAll('.channel-item, .channel-row').forEach(item => {
            item.classList.toggle('favorited', this.state.favorites.includes(item.dataset.channel));
        });
    },

    loadTheme() {
        const savedColor = localStorage.getItem('themeColor');
        const savedShadow = localStorage.getItem('themeShadow');
        if (savedColor && savedShadow) {
            this.setTheme(savedColor, savedShadow);
        }
    },

    handleThemeChange(event) {
        const swatch = event.target;
        const color = swatch.dataset.color;
        const shadow = swatch.dataset.shadow;
        this.setTheme(color, shadow);
        localStorage.setItem('themeColor', color);
        localStorage.setItem('themeShadow', shadow);
    },

    setTheme(color, shadow) {
        document.documentElement.style.setProperty('--primary-color', color);
        document.documentElement.style.setProperty('--primary-color-shadow', shadow);

        this.elements.colorSwatches.forEach(s => {
            s.classList.toggle('active', s.dataset.color === color);
        });
    },

    loadDarkMode() {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'enabled') {
            document.body.setAttribute('data-theme', 'dark');
            this.elements.darkModeToggle.checked = true;
        }
    },

    handleDarkModeToggle(event) {
        if (event.target.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'disabled');
        }
    },

    // --- CONTROLS ---
    toggleMute() {
        this.state.isMuted = !this.state.isMuted;
        this.elements.volumeSlider.value = this.state.isMuted ? 0 : 1;
        this.updateVolumeUI();
        
        // Attempt to mute by toggling the 'allow' attribute. This is not guaranteed to work.
        if (this.state.isMuted) {
            this.elements.iframe.removeAttribute('allow');
        } else {
            this.elements.iframe.setAttribute('allow', 'fullscreen; microphone; camera');
        }
    },

    handleVolumeChange(event) {
        const volume = parseFloat(event.target.value);
        this.state.isMuted = volume === 0;
        this.updateVolumeUI();
    },

    updateVolumeUI() {
        const icon = this.elements.muteBtn.querySelector('i');
        const volume = parseFloat(this.elements.volumeSlider.value);
        this.elements.volumeSlider.style.setProperty('--volume-percentage', `${volume * 100}%`);
        icon.classList.toggle('fa-volume-mute', volume === 0);
        icon.classList.toggle('fa-volume-low', volume > 0 && volume <= 0.5);
        icon.classList.toggle('fa-volume-up', volume > 0.5);
    },

    toggleFullscreen() {
        const elem = this.elements.cinemaContainer;
        const icon = this.elements.fullscreenBtn.querySelector('i');

        if (!document.fullscreenElement) {
            (elem.requestFullscreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen).call(elem);
            icon.classList.replace('fa-expand', 'fa-compress');
        } else {
            (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
            icon.classList.replace('fa-compress', 'fa-expand');
        }
    },

    updateFullscreenIcon() {
        const icon = this.elements.fullscreenBtn.querySelector('i');
        icon.classList.toggle('fa-compress', !!document.fullscreenElement);
        icon.classList.toggle('fa-expand', !document.fullscreenElement);
    },

    togglePiP() {
        // Picture-in-Picture for iframes is complex and often blocked.
        // This remains a placeholder.
        alert('شێوازی پیکچەر-ئین-پیکچەر چالاک/ناچالاک کراو');
    },

    toggleTheaterView() {
        this.elements.cinemaContainer.classList.toggle('theater-mode');
    },

    toggleSettings(show) {
        this.elements.settingsPanel.classList.toggle('visible', show);
    },

    clearAllFavorites() {
        if (confirm('ئایا دڵنیایت لە سڕینەوەی هەموو دڵخوازەکانت؟ ئەم کارە ناتوانرێت بگەڕێنرێتەوە.')) {
            this.state.favorites = [];
            localStorage.removeItem('favoriteChannels');
            this.updateFavoriteIcons();
            this.handleSearch({ target: this.elements.channelSearch }); // Re-apply filter
            this.showNotification('هەموو دڵخوازەکان سڕدرانەوە', 'warning');
        }
    }
};

// Start the application
CinemaApp.init();
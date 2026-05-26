// ===== GLOBAL STATE =====
let currentUser = JSON.parse(localStorage.getItem('mj_user')) || null;
let isAdmin = currentUser && currentUser.role === 'admin';
let cart = JSON.parse(localStorage.getItem('mj_cart')) || [];
let workers = [];
let products = [];
let slides = [];
let adminBookings = [];
let adminOrders = [];
let notifications = [];
let socket;

// ===== COMPONENT LOADER =====
async function loadComponent(elementId, componentPath) {
    const el = document.getElementById(elementId);
    if (!el) return;
    try {
        const response = await fetch(componentPath);
        if (response.ok) el.innerHTML = await response.text();
    } catch (e) { console.error(`Failed to load ${componentPath}`, e); }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load shared components
    await Promise.all([
        loadComponent('navbar-container', 'components/navbar.html?v=15'),
        loadComponent('modals-container', 'components/modals.html?v=15'),
        loadComponent('footer-container', 'components/footer.html?v=15')
    ]);

    document.body.style.display = 'block';

    // 2. Fetch data from backend
    try {
        workers = await api.getWorkers();
        products = await api.getProducts();
        if (typeof api.getSlides === 'function') {
            slides = await api.getSlides();
        }
    } catch (e) {
        console.error("Backend not reachable. Is server running on port 3000?", e);
    }

    // 3. Socket.io
    try {
        socket = io(window.location.origin);
        socket.on('workerStatusUpdate', (updatedWorkers) => {
            workers = updatedWorkers;
            if (typeof renderServicesPage === 'function') renderServicesPage();
            if (typeof renderAdmin === 'function') renderAdmin();
        });
        socket.on('newBooking', async () => {
            if (isAdmin && typeof loadAdminBookings === 'function') {
                await loadAdminBookings();
                if (typeof fetchAdminStats === 'function') fetchAdminStats();
                if (typeof showToast === 'function') showToast('New booking received', 'info');
            }
        });
        socket.on('newOrder', async () => {
            if (isAdmin && typeof loadAdminOrders === 'function') {
                await loadAdminOrders();
                if (typeof fetchAdminStats === 'function') fetchAdminStats();
                if (typeof showToast === 'function') showToast('New order received', 'info');
            }
        });
        socket.on('orderStatusUpdate', (order) => {
            if (currentUser && typeof renderOrdersPage === 'function' && document.querySelector('main')?.dataset.page === 'orders') {
                renderOrdersPage();
            }
            if (isAdmin && order && typeof renderAdminOrders === 'function') {
                const idx = adminOrders.findIndex(o => (o._id || o.id) === (order._id || order.id));
                if (idx >= 0) adminOrders[idx] = order;
                renderAdminOrders();
            }
        });
        socket.on('bookingStatusUpdate', (booking) => {
            if (currentUser && typeof renderBookingsPage === 'function' && document.querySelector('main')?.dataset.page === 'bookings') {
                renderBookingsPage();
            }
            if (isAdmin && booking && typeof renderAdminBookings === 'function') {
                const idx = adminBookings.findIndex(b => (b._id || b.id) === (booking._id || booking.id));
                if (idx >= 0) adminBookings[idx] = booking;
                renderAdminBookings();
            }
        });
    } catch(e) { console.error('Socket.io connection failed', e); }

    // 4. Init UI
    updateAuthUI();
    updateCartUI();
    highlightActiveNav();
    highlightActiveMobileNav();

    // 5. Page-specific init
    const page = document.querySelector('main')?.dataset.page;
    if (page === 'index') { initHomeSlider(); animateCounters(); initScrollReveal(); }
    if (page === 'services') { applyServiceFilter(); renderServicesPage(); }
    if (page === 'mart') { applyMartFilter(); renderMartPage('all'); initCategoryChips(); }
    if (page === 'admin') initAdminPage();
    if (page === 'checkout') renderCheckoutPage();
    if (page === 'orders') renderOrdersPage();
    if (page === 'bookings') renderBookingsPage();
    if (page === 'account') renderAccountPage();

    // 6. Global event listeners
    attachGlobalListeners();
    if (typeof initGlobalSearch === 'function') initGlobalSearch();
});

// ===== NAV HIGHLIGHTING =====
function highlightActiveNav() {
    const page = document.querySelector('main')?.dataset.page || 'index';
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('text-orange', 'font-semibold');
        if (link.dataset.page === page) link.classList.add('text-orange', 'font-semibold');
    });
}

function highlightActiveMobileNav() {
    const page = document.querySelector('main')?.dataset.page || 'index';
    document.querySelectorAll('.mob-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) item.classList.add('active');
    });
}

// ===== HOME SLIDER =====
let _sliderIdx = 0;
let _sliderTimer = null;

function initHomeSlider() {
    const track = document.getElementById('sliderTrack');
    const dotsContainer = document.getElementById('sliderDots');
    if (!track || !slides || slides.length === 0) return;
    
    track.innerHTML = slides.map((s, i) => {
        const hasGallery = s.galleryImages && s.galleryImages.length > 0;
        const btnAction = hasGallery 
            ? `onclick="openLightbox(${JSON.stringify(s.galleryImages).replace(/"/g, '&quot;')}, 0)"` 
            : `href="${s.buttonLink}"`;
            
        return `
        <div class="slider-slide min-w-full relative">
            <img src="${s.img}" alt="Slide ${i+1}" class="w-full h-64 md:h-96 object-cover">
            <div class="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/40 to-transparent"></div>
            <div class="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white max-w-md">
                <h3 class="text-2xl md:text-3xl font-extrabold leading-tight">${s.title}</h3>
                <p class="text-sm md:text-base text-gray-200 mt-2">${s.subtitle}</p>
                ${hasGallery 
                    ? `<button ${btnAction} class="inline-block mt-4 bg-orange text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-orange-600 transition">${s.buttonText}</button>`
                    : `<a ${btnAction} class="inline-block mt-4 bg-orange text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-orange-600 transition">${s.buttonText}</a>`
                }
            </div>
        </div>
        `;
    }).join('');

    if (dotsContainer) {
        dotsContainer.innerHTML = slides.map((_, i) => `
            <button onclick="goSlider(${i})" class="w-3 h-3 rounded-full ${i===0?'bg-white':'bg-white/50'} shadow slider-dot ${i===0?'active':''}"></button>
        `).join('');
    }

    _sliderIdx = 0;
    resetSliderTimer();
}

function moveSlider(dir) {
    const track = document.getElementById('sliderTrack');
    if (!track) return;
    const total = track.children.length;
    _sliderIdx = ((_sliderIdx || 0) + dir + total) % total;
    track.style.transform = `translateX(-${_sliderIdx * 100}%)`;
    updateSliderDots();
    resetSliderTimer();
}

function goSlider(idx) {
    _sliderIdx = idx;
    const track = document.getElementById('sliderTrack');
    if (track) track.style.transform = `translateX(-${idx * 100}%)`;
    updateSliderDots();
    resetSliderTimer();
}

function updateSliderDots() {
    document.querySelectorAll('.slider-dot').forEach((d, i) => {
        d.classList.toggle('active', i === _sliderIdx);
        d.classList.toggle('bg-white', i === _sliderIdx);
        d.classList.toggle('bg-white/50', i !== _sliderIdx);
    });
}

function resetSliderTimer() {
    if (_sliderTimer) clearTimeout(_sliderTimer);
    let duration = 5000;
    // slides 1 & 2 (idx 0 & 1) show for more time, slides 3 & 4 (idx 2 & 3) show for half that time
    if (_sliderIdx === 0 || _sliderIdx === 1) duration = 6000;
    else duration = 3000;
    _sliderTimer = setTimeout(() => moveSlider(1), duration);
}

// ===== URL PARAM FILTERS =====
function applyServiceFilter() {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    if (role) {
        const sel = document.getElementById('serviceTypeFilter');
        if (sel) sel.value = role;
    }
}

function applyMartFilter() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    if (cat) {
        // Activate the correct category chip
        setTimeout(() => {
            document.querySelectorAll('.category-chip').forEach(chip => {
                chip.classList.remove('active');
                if (chip.dataset.cat === cat) {
                    chip.classList.add('active');
                    renderMartPage(cat);
                }
            });
        }, 100);
    }
}

// ===== GLOBAL LISTENERS =====
function attachGlobalListeners() {
    // Profile dropdown
    document.getElementById('userAvatar')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('profileDropdown')?.classList.toggle('show');
        document.getElementById('notifDropdown')?.classList.remove('show');
    });

    // Notifications
    document.getElementById('notifBell')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('notifDropdown')?.classList.toggle('show');
        document.getElementById('profileDropdown')?.classList.remove('show');
    });

    // Cart icon
    document.getElementById('cartIcon')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openCartSidebar();
    });

    // Close cart sidebar
    document.getElementById('closeCartSidebar')?.addEventListener('click', closeCartSidebar);

    // Chatbot
    document.getElementById('chatbotBtn')?.addEventListener('click', () => openModal('chatbotModal'));
    document.getElementById('closeChat')?.addEventListener('click', () => closeModal('chatbotModal'));
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChat(); });

    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.getElementById('mobileMenu')?.classList.toggle('hidden');
    });

    // Close dropdowns on outside click
    document.addEventListener('click', closeDropdowns);
}

function closeDropdowns() {
    document.getElementById('profileDropdown')?.classList.remove('show');
    document.getElementById('notifDropdown')?.classList.remove('show');
}

const API_BASE = (() => {
    const configuredBase =
        window.MAJDOORS_API_BASE ||
        document.querySelector('meta[name="api-base"]')?.content ||
        localStorage.getItem('mj_api_base');
    const base = (configuredBase || window.location.origin).replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
})();
const API_ORIGIN = API_BASE.replace(/\/api$/, '');

const REQUEST_TIMEOUT_MS = 25000;

async function apiRequest(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            signal: controller.signal
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok) {
            throw new Error(data.message || `Request failed with status ${res.status}`);
        }

        return data;
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Server took too long to respond. Please try again.');
        }
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

const getHeaders = () => {
    const user = JSON.parse(localStorage.getItem('mj_user'));
    return {
        'Content-Type': 'application/json',
        ...(user && user.token ? { 'Authorization': `Bearer ${user.token}` } : {})
    };
};

const api = {
    // Auth
    login: async (email, password) => {
        return apiRequest('/auth/login', { method: 'POST', headers: getHeaders(), body: JSON.stringify({ email, password }) });
    },
    register: async (userData) => {
        return apiRequest('/auth/register', { method: 'POST', headers: getHeaders(), body: JSON.stringify(userData) });
    },

    // Public
    getWorkers: async () => { const res = await fetch(`${API_BASE}/workers`); return res.json(); },
    getProducts: async () => { const res = await fetch(`${API_BASE}/products`); return res.json(); },
    getCategories: async () => { const res = await fetch(`${API_BASE}/categories`); return res.json(); },
    getSlides: async () => { const res = await fetch(`${API_BASE}/slides`); return res.json(); },
    getInteriors: async () => { const res = await fetch(`${API_BASE}/interiors`); return res.json(); },
    getPublicReviews: async () => { const res = await fetch(`${API_BASE}/reviews/public`); return res.json(); },
    getWorkerById: async (id) => { const res = await fetch(`${API_BASE}/workers/${id}`); return res.json(); },
    getProductById: async (id) => { const res = await fetch(`${API_BASE}/products/${id}`); return res.json(); },

    // Chatbot
    sendChatMessage: async (message) => {
        const res = await fetch(`${API_BASE}/chatbot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
        return res.json();
    },

    // Contact
    sendContactMessage: async (data) => {
        const res = await fetch(`${API_BASE}/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.json();
    },

    // Orders (Protected)
    createOrder: async (orderData) => {
        const res = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(orderData) });
        return res.json();
    },
    getOrders: async () => { const res = await fetch(`${API_BASE}/orders`, { headers: getHeaders() }); return res.json(); },
    reviewOrder: async (id, review) => {
        const res = await fetch(`${API_BASE}/orders/${id}/review`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(review) });
        return res.json();
    },

    // Bookings (Protected)
    createBooking: async (bookingData) => {
        const res = await fetch(`${API_BASE}/bookings`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(bookingData) });
        return res.json();
    },
    getBookings: async () => { const res = await fetch(`${API_BASE}/bookings`, { headers: getHeaders() }); return res.json(); },
    reviewBooking: async (id, review) => {
        const res = await fetch(`${API_BASE}/bookings/${id}/review`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(review) });
        return res.json();
    },

    // Admin - Products
    addProduct: async (product) => {
        const res = await fetch(`${API_BASE}/admin/products`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(product) });
        return res.json();
    },
    deleteProduct: async (id) => {
        const res = await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE', headers: getHeaders() });
        return res.json();
    },
    updateProduct: async (id, updates) => {
        const res = await fetch(`${API_BASE}/admin/products/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(updates) });
        return res.json();
    },

    // Admin - Workers
    addWorker: async (worker) => {
        const res = await fetch(`${API_BASE}/admin/workers`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(worker) });
        return res.json();
    },
    deleteWorker: async (id) => {
        const res = await fetch(`${API_BASE}/admin/workers/${id}`, { method: 'DELETE', headers: getHeaders() });
        return res.json();
    },
    updateWorker: async (id, updates) => {
        const res = await fetch(`${API_BASE}/admin/workers/${id}/status`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(updates) });
        return res.json();
    },

    // Admin - Categories
    addCategory: async (category) => {
        const res = await fetch(`${API_BASE}/admin/categories`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(category) });
        return res.json();
    },
    deleteCategory: async (id) => {
        const res = await fetch(`${API_BASE}/admin/categories/${id}`, { method: 'DELETE', headers: getHeaders() });
        return res.json();
    },
    updateCategory: async (id, updates) => {
        const res = await fetch(`${API_BASE}/admin/categories/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(updates) });
        return res.json();
    },

    // Admin - Interior Categories
    getAdminInteriors: async () => { const res = await fetch(`${API_BASE}/admin/interiors`, { headers: getHeaders() }); return res.json(); },
    addInterior: async (interior) => {
        const res = await fetch(`${API_BASE}/admin/interiors`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(interior) });
        return res.json();
    },
    updateInterior: async (id, updates) => {
        const res = await fetch(`${API_BASE}/admin/interiors/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(updates) });
        return res.json();
    },
    deleteInterior: async (id) => {
        const res = await fetch(`${API_BASE}/admin/interiors/${id}`, { method: 'DELETE', headers: getHeaders() });
        return res.json();
    },

    // Admin - Slides
    getAdminSlides: async () => { const res = await fetch(`${API_BASE}/admin/slides`, { headers: getHeaders() }); return res.json(); },
    addSlide: async (slide) => {
        const res = await fetch(`${API_BASE}/admin/slides`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(slide) });
        return res.json();
    },
    deleteSlide: async (id) => {
        const res = await fetch(`${API_BASE}/admin/slides/${id}`, { method: 'DELETE', headers: getHeaders() });
        return res.json();
    },
    updateSlide: async (id, updates) => {
        const res = await fetch(`${API_BASE}/admin/slides/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(updates) });
        return res.json();
    },

    // Admin - Stats & Messages
    getAdminStats: async () => { const res = await fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() }); return res.json(); },
    getAdminOrders: async () => { const res = await fetch(`${API_BASE}/admin/orders`, { headers: getHeaders() }); return res.json(); },
    updateAdminOrderStatus: async (id, status) => {
        const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }) });
        const text = await res.text();
        try { return JSON.parse(text); }
        catch (e) { return { success: false, message: res.status === 404 ? 'Backend route not loaded. Restart npm start.' : (text || 'Update failed') }; }
    },
    getAdminBookings: async () => { const res = await fetch(`${API_BASE}/admin/bookings`, { headers: getHeaders() }); return res.json(); },
    updateAdminBookingStatus: async (id, status) => {
        const res = await fetch(`${API_BASE}/admin/bookings/${id}/status`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }) });
        const text = await res.text();
        try { return JSON.parse(text); }
        catch (e) { return { success: false, message: res.status === 404 ? 'Backend route not loaded. Restart npm start.' : (text || 'Update failed') }; }
    },
    getAdminReviews: async () => { const res = await fetch(`${API_BASE}/admin/reviews`, { headers: getHeaders() }); return res.json(); },
    updateAdminReviewPublic: async (type, id, isPublic) => {
        const res = await fetch(`${API_BASE}/admin/reviews/${type}/${id}/public`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ isPublic }) });
        return res.json();
    },
    getAdminMessages: async () => { const res = await fetch(`${API_BASE}/admin/messages`, { headers: getHeaders() }); return res.json(); },
    updateAdminMessageRead: async (id, isRead) => {
        const res = await fetch(`${API_BASE}/admin/messages/${id}/read`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ isRead }) });
        return res.json();
    },
    deleteAdminMessage: async (id) => {
        const res = await fetch(`${API_BASE}/admin/messages/${id}`, { method: 'DELETE', headers: getHeaders() });
        return res.json();
    }
};

const API_BASE = window.location.origin + '/api';

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
        const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ email, password }) });
        return res.json();
    },
    register: async (userData) => {
        const res = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(userData) });
        return res.json();
    },

    // Public
    getWorkers: async () => { const res = await fetch(`${API_BASE}/workers`); return res.json(); },
    getProducts: async () => { const res = await fetch(`${API_BASE}/products`); return res.json(); },
    getCategories: async () => { const res = await fetch(`${API_BASE}/categories`); return res.json(); },
    getSlides: async () => { const res = await fetch(`${API_BASE}/slides`); return res.json(); },
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

    // Bookings (Protected)
    createBooking: async (bookingData) => {
        const res = await fetch(`${API_BASE}/bookings`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(bookingData) });
        return res.json();
    },
    getBookings: async () => { const res = await fetch(`${API_BASE}/bookings`, { headers: getHeaders() }); return res.json(); },

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
    getAdminMessages: async () => { const res = await fetch(`${API_BASE}/admin/messages`, { headers: getHeaders() }); return res.json(); }
};

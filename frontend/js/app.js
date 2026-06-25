// ===== UI HELPERS =====
function showToast(msg, type = 'success') {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    t.className = `toast toast-${type}`;
    t.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('toast-exit'); setTimeout(() => t.remove(), 300); }, 3000);
}

function openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
}

function requireLogin(action) {
    if (!currentUser) { showToast('Please login to ' + action, 'warning'); openModal('loginModal'); return false; }
    return true;
}

function openCartSidebar() { document.getElementById('cartSidebar')?.classList.add('open'); }
function closeCartSidebar() { document.getElementById('cartSidebar')?.classList.remove('open'); }

// ===== PASSWORD TOGGLE =====
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ===== AUTH =====
async function handleLogin() {
    const em = document.getElementById('loginEmail')?.value?.trim();
    const pw = document.getElementById('loginPassword')?.value;
    if (!em || !pw) { showToast('Fill all fields', 'warning'); return; }
    try {
        const r = await api.login(em, pw);
        if (r.success) {
            currentUser = r.user;
            isAdmin = currentUser.role === 'admin';
            localStorage.setItem('mj_user', JSON.stringify(currentUser));
            updateAuthUI();
            closeModal('loginModal');
            showToast('Welcome, ' + currentUser.name + '!');
        } else {
            showToast(r.message || 'Invalid credentials', 'error');
        }
    } catch (e) { showToast(e.message || 'Login failed. Please try again.', 'error'); }
}

async function handleRegister() {
    const n = document.getElementById('regName')?.value?.trim();
    const em = document.getElementById('regEmail')?.value?.trim();
    const p = document.getElementById('regPhone')?.value?.trim();
    const pw = document.getElementById('regPassword')?.value;
    if (!n || !em || !pw) { showToast('Fill all required fields', 'warning'); return; }
    if (pw.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }
    try {
        const r = await api.register({ name: n, email: em, phone: p, password: pw });
        if (r.success) {
            currentUser = r.user;
            localStorage.setItem('mj_user', JSON.stringify(currentUser));
            updateAuthUI();
            closeModal('registerModal');
            showToast('Account created successfully!');
        } else {
            showToast(r.message || 'Registration failed', 'error');
        }
    } catch (e) { showToast(e.message || 'Registration failed', 'error'); }
}

async function handleLoginPage() {
    const em = document.getElementById('loginEmailPage')?.value?.trim();
    const pw = document.getElementById('loginPasswordPage')?.value;
    if (!em || !pw) { showToast('Fill all fields', 'warning'); return; }
    try {
        const r = await api.login(em, pw);
        if (r.success) {
            currentUser = r.user;
            isAdmin = currentUser.role === 'admin';
            localStorage.setItem('mj_user', JSON.stringify(currentUser));
            showToast('Welcome!');
            setTimeout(() => window.location.href = 'index.html', 500);
        } else { showToast(r.message || 'Invalid credentials', 'error'); }
    } catch (e) { showToast(e.message || 'Login failed', 'error'); }
}

async function handleRegisterPage() {
    const n = document.getElementById('regNamePage')?.value?.trim();
    const em = document.getElementById('regEmailPage')?.value?.trim();
    const p = document.getElementById('regPhonePage')?.value?.trim();
    const pw = document.getElementById('regPasswordPage')?.value;
    if (!n || !em || !pw) { showToast('Fill all required fields', 'warning'); return; }
    if (pw.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }
    try {
        const r = await api.register({ name: n, email: em, phone: p, password: pw });
        if (r.success) {
            currentUser = r.user;
            localStorage.setItem('mj_user', JSON.stringify(currentUser));
            showToast('Account created!');
            setTimeout(() => window.location.href = 'index.html', 500);
        } else { showToast(r.message || 'Failed', 'error'); }
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

function logout() {
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem('mj_user');
    updateAuthUI();
    showToast('Logged out', 'info');
    if (window.location.pathname.includes('admin')) window.location.href = 'index.html';
}

function updateAuthUI() {
    const n = document.getElementById('profileName');
    const e = document.getElementById('profileEmail');
    if (!n) return;
    if (currentUser) {
        n.textContent = currentUser.name;
        e.textContent = currentUser.email;
        document.getElementById('accName') && (document.getElementById('accName').textContent = currentUser.name);
        document.getElementById('accEmail') && (document.getElementById('accEmail').textContent = currentUser.email);
        const lb = document.getElementById('loginNavBtn');
        const lo = document.getElementById('logoutNavBtn');
        if (lb) lb.style.display = 'none';
        if (lo) lo.style.display = 'flex';
        const av = document.getElementById('userAvatar');
        if (av) av.innerHTML = `<span class="font-bold text-orange text-sm">${currentUser.name[0]}</span>`;
        const al = document.getElementById('adminNavLink');
        const alm = document.getElementById('adminNavLinkMobile');
        if (al) al.style.display = isAdmin ? 'flex' : 'none';
        if (alm) alm.style.display = isAdmin ? 'block' : 'none';
    } else {
        n.textContent = 'Guest User';
        e.textContent = 'Not logged in';
        const lb = document.getElementById('loginNavBtn');
        const lo = document.getElementById('logoutNavBtn');
        if (lb) lb.style.display = 'flex';
        if (lo) lo.style.display = 'none';
        const av = document.getElementById('userAvatar');
        if (av) av.innerHTML = '<i class="fas fa-user text-gray-500"></i>';
        const al = document.getElementById('adminNavLink');
        const alm = document.getElementById('adminNavLinkMobile');
        if (al) al.style.display = 'none';
        if (alm) alm.style.display = 'none';
    }
}

// ===== CART =====
function updateCartUI() {
    const c = document.getElementById('cartCount');
    if (c) c.textContent = cart.length;
    const list = document.getElementById('cartItemsList');
    let total = 0;
    if (list) {
        if (!cart.length) {
            list.innerHTML = '<div class="text-center py-10"><i class="fas fa-shopping-cart text-4xl text-gray-200 mb-3"></i><p class="text-gray-400 text-sm">Your cart is empty</p></div>';
        } else {
            list.innerHTML = cart.map((p, i) => {
                total += p.price * (p.qty || 1);
                return `<div class="flex items-center gap-3 bg-gray-50 rounded-xl p-3"><img src="${p.img}" class="w-14 h-14 rounded-lg object-cover"><div class="flex-1"><p class="font-semibold text-sm">${p.name}</p><p class="text-orange font-bold text-sm">₹${p.price}</p><div class="flex items-center gap-2 mt-1"><button onclick="changeQty(${i},-1)" class="w-6 h-6 bg-gray-200 rounded-full text-xs hover:bg-orange-500 hover:text-white transition">-</button><span class="text-sm font-medium">${p.qty || 1}</span><button onclick="changeQty(${i},1)" class="w-6 h-6 bg-gray-200 rounded-full text-xs hover:bg-orange-500 hover:text-white transition">+</button></div></div><i class="fas fa-trash text-gray-300 cursor-pointer hover:text-red-500 transition" onclick="removeFromCart(${i})"></i></div>`;
            }).join('');
        }
    }
    const t = document.getElementById('cartTotal');
    if (t) t.textContent = '₹' + total;
    localStorage.setItem('mj_cart', JSON.stringify(cart));
}

function addToCart(product) {
    const ex = cart.find(p => p.id === product.id);
    if (ex) { ex.qty = (ex.qty || 1) + 1; }
    else { cart.push({ ...product, qty: 1 }); }
    updateCartUI();
    showToast(product.name + ' added to cart');
}

function removeFromCart(i) {
    const name = cart[i].name;
    cart.splice(i, 1);
    updateCartUI();
    showToast(name + ' removed', 'info');
}

function changeQty(i, d) {
    cart[i].qty = (cart[i].qty || 1) + d;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    updateCartUI();
}

function handleCheckout() {
    if (!requireLogin('checkout')) return;
    if (!cart.length) { showToast('Cart is empty', 'warning'); return; }
    window.location.href = 'checkout.html';
}

// ===== CONTACT FORM =====
async function submitContactForm() {
    const btn = document.getElementById('contactSubmitBtn');
    const name = document.getElementById('contactName')?.value?.trim();
    const email = document.getElementById('contactEmail')?.value?.trim();
    const phone = document.getElementById('contactPhone')?.value?.trim();
    const subject = document.getElementById('contactSubject')?.value;
    const message = document.getElementById('contactMessage')?.value?.trim();
    if (!name || !email || !message) { showToast('Please fill Name, Email and Message', 'warning'); return; }
    btn.disabled = true; btn.textContent = 'Sending...';
    try {
        const r = await api.sendContactMessage({ name, email, phone, subject, message });
        if (r.success) { showToast(r.message || 'Message sent to admin!'); document.getElementById('contactForm').reset(); }
        else { showToast(r.message || 'Failed to send', 'error'); }
    } catch (e) { showToast('Network error. Please try again.', 'error'); }
    btn.disabled = false; btn.textContent = 'Send Message';
}

// ===== GLOBAL SEARCH =====
let searchTimeout;
function initGlobalSearch() {
    const input = document.getElementById('globalSearch');
    if (!input) return;
    const dropdown = document.createElement('div');
    dropdown.id = 'searchDropdown';
    dropdown.className = 'absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto z-50 hidden';
    input.parentElement.appendChild(dropdown);
    input.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const q = input.value.trim();
        if (q.length < 2) { dropdown.classList.add('hidden'); return; }
        searchTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                let html = '';
                if (data.products?.length) {
                    html += '<p class="px-4 py-2 text-xs font-bold text-gray-400 uppercase">Products</p>';
                    data.products.forEach(p => {
                        html += `<a href="mart.html" class="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition cursor-pointer no-underline text-gray-700"><img src="${p.img}" class="w-10 h-10 rounded-lg object-cover"><div><p class="font-medium text-sm">${p.name}</p><p class="text-xs text-gray-400">₹${p.price} · ${p.category}</p></div></a>`;
                    });
                }
                if (data.workers?.length) {
                    html += '<p class="px-4 py-2 text-xs font-bold text-gray-400 uppercase border-t">Workers</p>';
                    data.workers.forEach(w => {
                        html += `<a href="services.html" class="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition cursor-pointer no-underline text-gray-700"><img src="${w.img}" class="w-10 h-10 rounded-full object-cover"><div><p class="font-medium text-sm">${w.name}</p><p class="text-xs text-gray-400">${w.role} · ${w.city}</p></div></a>`;
                    });
                }
                if (!html) html = '<p class="text-center py-6 text-gray-400 text-sm">No results found</p>';
                dropdown.innerHTML = html;
                dropdown.classList.remove('hidden');
            } catch(e) { dropdown.classList.add('hidden'); }
        }, 300);
    });
    document.addEventListener('click', (e) => { if (!input.parentElement.contains(e.target)) dropdown.classList.add('hidden'); });
}

// ===== IMAGE UPLOAD FOR ADMIN =====
async function uploadImage(fileInput) {
    const file = fileInput.files[0];
    if (!file) return null;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'warning'); return null; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'warning'); return null; }
    const formData = new FormData();
    formData.append('image', file);
    try {
        const user = JSON.parse(localStorage.getItem('mj_user'));
        const res = await fetch(API_BASE + '/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user?.token}` },
            body: formData
        });
        const data = await res.json();
        if (data.success) return data.imageUrl;
        showToast(data.message || 'Upload failed', 'error');
        return null;
    } catch(e) { showToast('Upload failed', 'error'); return null; }
}

// ===== ADMIN CHANGE CREDENTIALS =====
async function changeAdminCredentials() {
    const curPw = document.getElementById('adminCurPass')?.value;
    const newPw = document.getElementById('adminNewPass')?.value;
    const newEm = document.getElementById('adminNewEmail')?.value?.trim();
    const errBox = document.getElementById('adminSettingsError');
    const btn = document.getElementById('adminSettingsSaveBtn');
    const showErr = (msg) => { if(errBox){errBox.textContent=msg;errBox.classList.remove('hidden');} };
    const hideErr = () => { if(errBox) errBox.classList.add('hidden'); };
    hideErr();
    if (!curPw) { showErr('Current password is required'); return; }
    // Client-side strong password validation
    if (newPw) {
        if (newPw.length < 8) { showErr('Password must be at least 8 characters'); return; }
        if (!/[A-Z]/.test(newPw)) { showErr('Password must contain at least one uppercase letter (A-Z)'); return; }
        if (!/[a-z]/.test(newPw)) { showErr('Password must contain at least one lowercase letter (a-z)'); return; }
        if (!/[0-9]/.test(newPw)) { showErr('Password must contain at least one number (0-9)'); return; }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPw)) { showErr('Password must contain at least one special character (!@#$%...)'); return; }
    }
    if (newEm && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEm)) { showErr('Please enter a valid email address'); return; }
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
        const user = JSON.parse(localStorage.getItem('mj_user'));
        const res = await fetch(API_BASE + '/admin/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
            body: JSON.stringify({ currentPassword: curPw, newPassword: newPw || undefined, newEmail: newEm || undefined })
        });
        const data = await res.json();
        if (data.success) {
            if (data.user) { currentUser = data.user; localStorage.setItem('mj_user', JSON.stringify(data.user)); updateAuthUI(); }
            showToast('Credentials updated successfully! ✅');
            closeModal('adminSettingsModal');
            document.getElementById('adminCurPass').value = '';
            document.getElementById('adminNewPass').value = '';
            document.getElementById('adminNewEmail').value = '';
        } else { showErr(data.message || 'Failed to update credentials'); }
    } catch(e) { showErr('Network error. Please try again.'); }
    btn.disabled = false; btn.textContent = 'Save Changes';
}

function openInteriorWhatsApp() {
    const msg = encodeURIComponent('Hi, I want to book interior design consultation.');
    window.open(`https://wa.me/919279509297?text=${msg}`, '_blank');
}

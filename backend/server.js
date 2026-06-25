require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');

// ===== IMAGE UPLOAD SETUP =====
const uploadDir = path.join(__dirname, '../frontend/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
}});

// Models
const User = require('./models/User');
const Worker = require('./models/Worker');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Booking = require('./models/Booking');
const Category = require('./models/Category');
const ContactMessage = require('./models/ContactMessage');
const Slide = require('./models/Slide');
const InteriorCategory = require('./models/InteriorCategory');
const { protect, admin } = require('./middleware/auth');

const defaultInteriorCategories = [
    { name: 'Wardrobe Design', slug: 'wardrobe-design', icon: 'fas fa-door-closed', description: 'Sliding, hinged and premium storage ideas for bedrooms.', coverImage: 'img/interior_option_1.png', images: ['img/interior_option_1.png', 'img/interior_option_2.png', 'img/interior_option_3.png'], sortOrder: 1, isActive: true },
    { name: 'Modular Kitchen', slug: 'modular-kitchen', icon: 'fas fa-utensils', description: 'Smart kitchen layouts, cabinets and utility-focused finishes.', coverImage: 'img/slider_interior.png', images: ['img/slider_interior.png', 'img/interior_offer.png', 'img/interior_option_2.png'], sortOrder: 2, isActive: true },
    { name: 'False Ceiling', slug: 'false-ceiling', icon: 'fas fa-border-top-left', description: 'Modern ceiling concepts with lighting and clean detailing.', coverImage: 'img/interior_offer.png', images: ['img/interior_offer.png', 'img/interior_option_3.png', 'img/slider_interior.png'], sortOrder: 3, isActive: true },
    { name: 'Living Room Design', slug: 'living-room-design', icon: 'fas fa-couch', description: 'TV units, wall panels, storage and seating inspiration.', coverImage: 'img/interior_option_2.png', images: ['img/interior_option_2.png', 'img/interior_option_1.png', 'img/interior_offer.png'], sortOrder: 4, isActive: true },
    { name: 'Bedroom Interior', slug: 'bedroom-interior', icon: 'fas fa-bed', description: 'Calm bedroom layouts with wardrobes, panels and lighting.', coverImage: 'img/interior_option_3.png', images: ['img/interior_option_3.png', 'img/interior_option_1.png', 'img/slider_interior.png'], sortOrder: 5, isActive: true },
    { name: 'Bathroom Vanity', slug: 'bathroom-vanity', icon: 'fas fa-sink', description: 'Compact vanity, mirror and storage ideas for bathrooms.', coverImage: 'img/interior_offer.png', images: ['img/interior_offer.png', 'img/interior_option_2.png'], sortOrder: 6, isActive: true }
];

async function ensureDefaultInteriors() {
    try {
        const existing = await InteriorCategory.find({
            slug: { $in: defaultInteriorCategories.map(category => category.slug) }
        }).select('slug name coverImage').lean();
        const existingBySlug = new Map(existing.map(category => [category.slug, category]));
        await Promise.all(defaultInteriorCategories.map(category => {
            const saved = existingBySlug.get(category.slug);
            if (!saved) {
                return InteriorCategory.create(category);
            }
            if (!saved.name || !saved.coverImage) {
                return InteriorCategory.updateOne({ slug: category.slug }, { $set: category });
            }
            return Promise.resolve();
        }));
    } catch (err) {
        if (err.code !== 11000) throw err;
    }
}

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
const io = new Server(server, {
    cors: { origin: allowedOrigins.length ? allowedOrigins : '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'majdoors_secure_jwt_key_2026_production_x9k2m';

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || (process.env.NODE_ENV === 'production' ? null : 'mongodb://127.0.0.1:27017/majdoors');
    if (!mongoUri) {
        throw new Error('MONGO_URI is required in production');
    }

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000
        });
        console.log('✅ MongoDB Connected successfully!');
    } catch (err) {
        if (process.env.NODE_ENV === 'production') {
            throw err;
        }

        console.warn('\nMongoDB connection failed:', err.message);
        console.warn('Starting In-Memory MongoDB Server as a temporary local fallback...');
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            await mongoose.connect(mongoServer.getUri());
            console.log('✅ In-Memory MongoDB running');
            require('./seed_memory');
        } catch(memErr) {
            throw memErr;
        }
    }
};

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/health', (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.status(dbConnected ? 200 : 503).json({
        success: dbConnected,
        status: dbConnected ? 'ok' : 'database_unavailable'
    });
});

app.use('/api', (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'Database is reconnecting. Please try again in a few seconds.'
        });
    }
    next();
});

// ===== HELPERS =====
const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const emitWorkerUpdate = async () => {
    try {
        const workers = await Worker.find({});
        io.emit('workerStatusUpdate', workers);
    } catch(err) { console.error("Worker update error:", err.message); }
};

// ===== CHATBOT KNOWLEDGE BASE =====
const chatbotKB = {
    greeting: ['hello','hi','hey','namaste','good morning','good evening'],
    location: ['location','address','where','office','shop','store location','kahan','direction'],
    contact: ['contact','phone','call','number','email','reach'],
    timing: ['timing','time','open','close','hours','kab','schedule'],
    delivery: ['delivery','shipping','deliver','ship','dispatch'],
    products: ['product','material','item','buy','purchase','sell','available'],
    services: ['service','worker','electrician','plumber','carpenter','painter','book','hire'],
    payment: ['payment','pay','upi','cash','card','cod'],
    returns: ['return','refund','exchange','replace'],
    owner: ['owner','ravi','kumar','founder','who owns'],
    categories: ['category','categories','electrical','plumbing','paint','flooring','hardware','construction']
};

const chatbotResponses = {
    greeting: "Hello! 👋 Welcome to Majdoors Mart. I'm here to help you find construction materials, book services, or answer any questions. How can I assist you today?",
    location: "📍 Our store is located at:\nNear Digital Duniya, Nala Road,\nBihar Sharif, Nalanda,\nBihar, India\n\nYou can visit us during business hours or order online!",
    contact: "📞 You can reach us at:\nPhone: +91 9279509297\nEmail: Service@majdoors.com\nWhatsApp: +91 9279509297\n\nOwner: Ravi Kumar",
    timing: "🕐 Our business hours are:\nMonday - Saturday: 9:00 AM - 7:00 PM\nSunday: 10:00 AM - 4:00 PM",
    delivery: "🚚 We offer delivery across Bihar Sharif and nearby areas.\n• Orders above ₹1999 get FREE delivery\n• Standard delivery: 2-4 business days\n• Express delivery available on request\n\nCall +91 9279509297 for bulk orders.",
    products: "🏗️ We offer a wide range of construction & interior materials:\n• Electrical supplies\n• Plumbing materials\n• Paints & finishes\n• Flooring & tiles\n• Hardware & tools\n• Construction materials\n\nBrowse our Mart section or visit our store!",
    services: "👷 We connect you with verified professionals:\n• Electricians\n• Plumbers\n• Carpenters\n• Painters\n• Masons\n• Welders\n• AC Technicians\n\nCheck our Services page to book instantly!",
    payment: "💳 We accept multiple payment methods:\n• Cash on Delivery (COD)\n• UPI / Google Pay\n• Credit / Debit Cards\n• Net Banking\n• Cash at Store",
    returns: "🔄 Our return policy:\n• 7 days hassle-free returns for unused products\n• Products must be in original packaging\n• Contact us at +91 9279509297 for returns\n• Refund processed within 5-7 business days",
    owner: "👤 Majdoors Mart is owned by Ravi Kumar.\nContact: +91 9279509297\nEmail: Service@majdoors.com\n\nWe're a trusted construction & interior materials supplier in Bihar Sharif.",
    categories: "📦 Our main product categories:\n1. Electrical (switches, wires, MCBs)\n2. Plumbing (pipes, fittings, taps)\n3. Paints (wall paint, primers, brushes)\n4. Flooring (tiles, marble, granite)\n5. Hardware (locks, hinges, tools)\n6. Construction Materials (cement, rods, sand)\n\nAdmin can add more categories anytime!",
    fallback: "I'm not sure about that. You can:\n• Call us: +91 9279509297\n• Email: Service@majdoors.com\n• WhatsApp us for instant help\n• Visit our store at Nala Road, Bihar Sharif\n\nOr try asking about our products, services, location, or delivery!"
};

function getChatbotReply(message) {
    const msg = message.toLowerCase().trim();
    for (const [key, keywords] of Object.entries(chatbotKB)) {
        if (keywords.some(kw => msg.includes(kw))) {
            return chatbotResponses[key];
        }
    }
    return chatbotResponses.fallback;
}

// ===== WEBSOCKETS =====
io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
});

// ===============================================
// AUTH ROUTES
// ===============================================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    if (!validateEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email format' });
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && user.password && (await bcrypt.compare(password, user.password))) {
            const token = generateToken(user._id);
            res.json({
                success: true, token,
                user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, token }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (!validateEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email format' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    try {
        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) return res.status(400).json({ success: false, message: 'User already exists with this email' });
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), phone: phone || '', password: hashed, role: 'user' });
        const token = generateToken(user._id);
        res.status(201).json({
            success: true, token,
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, token }
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/users/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) res.json({ id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role });
    else res.status(404).json({ message: 'User not found' });
});

// Admin change password
app.put('/api/admin/change-password', protect, admin, async (req, res) => {
    const { currentPassword, newPassword, newEmail } = req.body;
    if (!currentPassword) return res.status(400).json({ success: false, message: 'Current password required' });
    try {
        const user = await User.findById(req.user._id);
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        // Strong password validation
        if (newPassword) {
            if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
            if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter' });
            if (!/[a-z]/.test(newPassword)) return res.status(400).json({ success: false, message: 'Password must contain at least one lowercase letter' });
            if (!/[0-9]/.test(newPassword)) return res.status(400).json({ success: false, message: 'Password must contain at least one number' });
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) return res.status(400).json({ success: false, message: 'Password must contain at least one special character' });
            user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(12));
        }
        // Email change with 2-per-month limit
        if (newEmail && validateEmail(newEmail) && newEmail.toLowerCase() !== user.email) {
            const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const recentChanges = (user.emailChanges || []).filter(c => new Date(c.changedAt) > oneMonthAgo);
            if (recentChanges.length >= 2) {
                return res.status(400).json({ success: false, message: 'Email can only be changed 2 times per month. Try again later.' });
            }
            user.emailChanges = user.emailChanges || [];
            user.emailChanges.push({ changedAt: new Date(), oldEmail: user.email });
            user.email = newEmail.toLowerCase().trim();
        }
        await user.save();
        const token = generateToken(user._id);
        res.json({ success: true, message: 'Credentials updated!', user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, token } });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Image upload endpoint
app.post('/api/upload', protect, admin, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const imageUrl = '/uploads/' + req.file.filename;
    res.json({ success: true, imageUrl });
});

// ===============================================
// FILE UPLOAD ROUTES
// ===============================================
app.post('/api/upload', protect, admin, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const imageUrl = '/uploads/' + req.file.filename;
    res.json({ success: true, imageUrl });
});

app.post('/api/upload-multiple', protect, admin, upload.array('images', 5), (req, res) => {
    if (!req.files || !req.files.length) return res.status(400).json({ success: false, message: 'No images uploaded' });
    const imageUrls = req.files.map(f => '/uploads/' + f.filename);
    res.json({ success: true, imageUrls });
});

app.post('/api/review-upload', protect, upload.array('images', 3), (req, res) => {
    if (!req.files || !req.files.length) return res.status(400).json({ success: false, message: 'No images uploaded' });
    const imageUrls = req.files.map(f => '/uploads/' + f.filename);
    res.json({ success: true, imageUrls });
});

// ===============================================
// PUBLIC ROUTES
// ===============================================
app.get('/api/workers', async (req, res) => {
    try { res.json(await Worker.find({})); }
    catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/workers/:id', async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id);
        if (worker) res.json(worker);
        else res.status(404).json({ message: 'Worker not found' });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/products', async (req, res) => {
    try { res.json(await Product.find({})); }
    catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) res.json(product);
        else res.status(404).json({ message: 'Product not found' });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/categories', async (req, res) => {
    try { res.json(await Category.find({ isActive: true }).sort({ sortOrder: 1 })); }
    catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/interiors', async (req, res) => {
    try {
        await ensureDefaultInteriors();
        const interiors = await InteriorCategory.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
        res.json(interiors);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/reviews/public', async (req, res) => {
    try {
        const [orders, bookings] = await Promise.all([
            Order.find({ 'review.reviewedAt': { $exists: true }, 'review.isPublic': true })
                .populate('user', 'name email')
                .sort({ 'review.reviewedAt': -1 })
                .limit(12)
                .lean(),
            Booking.find({ 'review.reviewedAt': { $exists: true }, 'review.isPublic': true })
                .populate('user', 'name email')
                .sort({ 'review.reviewedAt': -1 })
                .limit(12)
                .lean()
        ]);
        const reviews = [
            ...orders.map(order => ({
                id: order._id,
                type: 'order',
                customerName: order.shippingAddress?.name || order.user?.name || 'Customer',
                title: (order.items || []).map(item => item.name).filter(Boolean).join(', ') || 'Material Order',
                rating: order.review.rating,
                text: order.review.text,
                images: order.review.images || [],
                reviewedAt: order.review.reviewedAt
            })),
            ...bookings.map(booking => ({
                id: booking._id,
                type: 'booking',
                customerName: booking.customerName || booking.user?.name || 'Customer',
                title: `${booking.workerRole || 'Service'}${booking.workerName ? ' by ' + booking.workerName : ''}`,
                rating: booking.review.rating,
                text: booking.review.text,
                images: booking.review.images || [],
                reviewedAt: booking.review.reviewedAt
            }))
        ].sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt)).slice(0, 12);
        res.json(reviews);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ===== GLOBAL SEARCH =====
app.get('/api/search', async (req, res) => {
    const q = req.query.q;
    if (!q || q.length < 2) return res.json({ products: [], workers: [] });
    const regex = new RegExp(q, 'i');
    try {
        const [prods, wkrs] = await Promise.all([
            Product.find({ $or: [{ name: regex }, { category: regex }, { description: regex }] }).limit(10),
            Worker.find({ $or: [{ name: regex }, { role: regex }, { city: regex }] }).limit(10)
        ]);
        res.json({ products: prods, workers: wkrs });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ===== CHATBOT ROUTE =====
app.post('/api/chatbot', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: 'Please send a message.' });
    const reply = getChatbotReply(message);
    res.json({ reply });
});

// ===== CONTACT FORM WITH EMAIL =====
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    if (!validateEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email address' });
    try {
        // Save to database
        const contactMessage = await ContactMessage.create({ name: name.trim(), email: email.trim(), phone: phone || '', subject: subject || 'General Inquiry', message });
        io.emit('newContactMessage', contactMessage);
        
        // Send email if configured
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your-app-password') {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: false,
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            await transporter.sendMail({
                from: `"Majdoors Website" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_TO || 'Service@majdoors.com',
                subject: `[Majdoors Contact] ${subject || 'General Inquiry'} from ${name}`,
                html: `<h3>New Contact Message</h3><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Phone:</b> ${phone || 'N/A'}</p><p><b>Subject:</b> ${subject || 'General'}</p><p><b>Message:</b></p><p>${message}</p>`
            });
        }
        res.status(201).json({ success: true, message: 'Message sent successfully! We will get back to you soon.' });
    } catch (err) {
        console.error('Contact error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
    }
});

// ===============================================
// ORDER ROUTES (Protected)
// ===============================================
app.post('/api/orders', protect, async (req, res) => {
    try {
        const { items, totalAmount, shippingAddress, paymentMethod } = req.body;
        const order = await Order.create({ user: req.user._id, items, totalAmount, shippingAddress, paymentMethod });
        io.emit('newOrder', order);
        res.status(201).json({ success: true, order });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.get('/api/orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/orders/:id/review', protect, async (req, res) => {
    try {
        const { rating, text, images } = req.body;
        const safeRating = Number(rating);
        if (!safeRating || safeRating < 1 || safeRating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Review is available after delivery' });
        }
        if (order.review && order.review.reviewedAt) {
            return res.status(400).json({ success: false, message: 'Review already submitted' });
        }
        order.review = {
            rating: safeRating,
            text: (text || '').trim(),
            images: Array.isArray(images) ? images.slice(0, 3) : [],
            reviewedAt: new Date()
        };
        await order.save();
        res.json({ success: true, order });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ===============================================
// BOOKING ROUTES (Protected)
// ===============================================
app.post('/api/bookings', protect, async (req, res) => {
    try {
        const { worker, workerName, workerRole, date, timeSlot, description } = req.body;
        const customerName = req.body.customerName || req.body.name;
        const customerPhone = req.body.customerPhone || req.body.phone;
        const customerLocation = req.body.customerLocation || req.body.location || req.body.address || req.body.workLocation;
        if (!customerName || !customerPhone || !customerLocation || !date || !timeSlot || !workerRole) {
            return res.status(400).json({ success: false, message: 'Name, phone, location, service, date and time slot are required' });
        }
        const booking = await Booking.create({
            user: req.user._id,
            worker,
            workerName,
            workerRole,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerLocation: customerLocation.trim(),
            date,
            timeSlot,
            description
        });
        io.emit('newBooking', booking);
        res.status(201).json({ success: true, booking });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.get('/api/bookings', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/bookings/:id/review', protect, async (req, res) => {
    try {
        const { rating, text, images } = req.body;
        const safeRating = Number(rating);
        if (!safeRating || safeRating < 1 || safeRating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }
        const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.status !== 'Completed') {
            return res.status(400).json({ success: false, message: 'Review is available after service completion' });
        }
        if (booking.review && booking.review.reviewedAt) {
            return res.status(400).json({ success: false, message: 'Review already submitted' });
        }
        booking.review = {
            rating: safeRating,
            text: (text || '').trim(),
            images: Array.isArray(images) ? images.slice(0, 3) : [],
            reviewedAt: new Date()
        };
        await booking.save();
        res.json({ success: true, booking });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ===============================================
// ADMIN ROUTES (Protected + Admin)
// ===============================================

// Products CRUD
app.post('/api/admin/products', protect, admin, async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({ success: true, product });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.put('/api/admin/products/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (product) res.json({ success: true, product });
        else res.status(404).json({ success: false, message: 'Product not found' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.delete('/api/admin/products/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        // Clean up uploaded images from disk
        const allImages = [product.img, ...(product.images || [])].filter(i => i && i.startsWith('/uploads/'));
        allImages.forEach(imgPath => {
            const fullPath = path.join(__dirname, '../frontend', imgPath);
            if (fs.existsSync(fullPath)) { try { fs.unlinkSync(fullPath); } catch(e) {} }
        });
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Product removed' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Workers CRUD
app.post('/api/admin/workers', protect, admin, async (req, res) => {
    try {
        const worker = await Worker.create(req.body);
        emitWorkerUpdate();
        res.status(201).json({ success: true, worker });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.delete('/api/admin/workers/:id', protect, admin, async (req, res) => {
    try {
        await Worker.findByIdAndDelete(req.params.id);
        emitWorkerUpdate();
        res.json({ success: true, message: 'Worker removed' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.patch('/api/admin/workers/:id/status', protect, admin, async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id);
        if (worker) {
            worker.status = req.body.status || worker.status;
            worker.verified = req.body.verified !== undefined ? req.body.verified : worker.verified;
            worker.price = req.body.price || worker.price;
            await worker.save();
            emitWorkerUpdate();
            res.json({ success: true, worker });
        } else { res.status(404).json({ success: false, message: 'Worker not found' }); }
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Categories CRUD
app.post('/api/admin/categories', protect, admin, async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({ success: true, category });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.put('/api/admin/categories/:id', protect, admin, async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (category) res.json({ success: true, category });
        else res.status(404).json({ success: false, message: 'Category not found' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.delete('/api/admin/categories/:id', protect, admin, async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Category removed' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Interior Design Categories CRUD
app.get('/api/admin/interiors', protect, admin, async (req, res) => {
    try {
        await ensureDefaultInteriors();
        const interiors = await InteriorCategory.find({}).sort({ sortOrder: 1, createdAt: -1 });
        res.json(interiors);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/admin/interiors', protect, admin, async (req, res) => {
    try {
        const interior = await InteriorCategory.create(req.body);
        res.status(201).json({ success: true, interior });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.put('/api/admin/interiors/:id', protect, admin, async (req, res) => {
    try {
        const payload = { ...req.body };
        if (payload.name && !payload.slug) {
            payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        const interior = await InteriorCategory.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
        if (!interior) return res.status(404).json({ success: false, message: 'Interior category not found' });
        res.json({ success: true, interior });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.delete('/api/admin/interiors/:id', protect, admin, async (req, res) => {
    try {
        await InteriorCategory.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Interior category removed' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Admin Stats
app.get('/api/admin/stats', protect, admin, async (req, res) => {
    try {
        const [products, workers, orders, bookings, categories, messages] = await Promise.all([
            Product.countDocuments(), Worker.countDocuments(),
            Order.countDocuments(), Booking.countDocuments(),
            Category.countDocuments(), ContactMessage.countDocuments({ isRead: false })
        ]);
        res.json({ products, workers, orders, bookings, categories, unreadMessages: messages });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/orders', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'name email phone').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.patch('/api/admin/orders/:id/status', protect, admin, async (req, res) => {
    try {
        const allowed = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
        if (!allowed.includes(req.body.status)) {
            return res.status(400).json({ success: false, message: 'Invalid order status' });
        }
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
            .populate('user', 'name email phone');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        io.emit('orderStatusUpdate', order);
        res.json({ success: true, order });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.get('/api/admin/reviews', protect, admin, async (req, res) => {
    try {
        const [orders, bookings] = await Promise.all([
            Order.find({ 'review.reviewedAt': { $exists: true } })
                .populate('user', 'name email phone')
                .sort({ 'review.reviewedAt': -1 })
                .lean(),
            Booking.find({ 'review.reviewedAt': { $exists: true } })
                .populate('user', 'name email phone')
                .sort({ 'review.reviewedAt': -1 })
                .lean()
        ]);
        const reviews = [
            ...orders.map(order => ({
                id: order._id,
                type: 'order',
                customerName: order.shippingAddress?.name || order.user?.name || 'Customer',
                customerEmail: order.user?.email || '',
                subject: (order.items || []).map(item => item.name).filter(Boolean).join(', ') || 'Material Order',
                rating: order.review.rating,
                text: order.review.text,
                images: order.review.images || [],
                isPublic: !!order.review.isPublic,
                reviewedAt: order.review.reviewedAt
            })),
            ...bookings.map(booking => ({
                id: booking._id,
                type: 'booking',
                customerName: booking.customerName || booking.user?.name || 'Customer',
                customerEmail: booking.user?.email || '',
                subject: `${booking.workerRole || 'Service'}${booking.workerName ? ' - ' + booking.workerName : ''}`,
                rating: booking.review.rating,
                text: booking.review.text,
                images: booking.review.images || [],
                isPublic: !!booking.review.isPublic,
                reviewedAt: booking.review.reviewedAt
            }))
        ].sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt));
        res.json(reviews);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.patch('/api/admin/reviews/:type/:id/public', protect, admin, async (req, res) => {
    try {
        const isPublic = !!req.body.isPublic;
        const Model = req.params.type === 'order' ? Order : req.params.type === 'booking' ? Booking : null;
        if (!Model) return res.status(400).json({ success: false, message: 'Invalid review type' });
        const item = await Model.findOneAndUpdate(
            { _id: req.params.id, 'review.reviewedAt': { $exists: true } },
            { $set: { 'review.isPublic': isPublic } },
            { new: true }
        );
        if (!item) return res.status(404).json({ success: false, message: 'Review not found' });
        res.json({ success: true, isPublic });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.get('/api/admin/bookings', protect, admin, async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate('user', 'name email phone')
            .populate('worker', 'name role phone')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.patch('/api/admin/bookings/:id/status', protect, admin, async (req, res) => {
    try {
        const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
        if (!allowed.includes(req.body.status)) {
            return res.status(400).json({ success: false, message: 'Invalid booking status' });
        }
        const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
            .populate('user', 'name email phone')
            .populate('worker', 'name role phone');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        io.emit('bookingStatusUpdate', booking);
        res.json({ success: true, booking });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.get('/api/admin/messages', protect, admin, async (req, res) => {
    try {
        const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.patch('/api/admin/messages/:id/read', protect, admin, async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: !!req.body.isRead }, { new: true });
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
        res.json({ success: true, message });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.delete('/api/admin/messages/:id', protect, admin, async (req, res) => {
    try {
        await ContactMessage.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Message deleted' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ===== SLIDES API =====
app.get('/api/slides', async (req, res) => {
    try {
        const slides = await Slide.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
        res.json(slides);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/slides', protect, admin, async (req, res) => {
    try {
        const slides = await Slide.find({}).sort({ sortOrder: 1, createdAt: -1 });
        res.json(slides);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/admin/slides', protect, admin, async (req, res) => {
    try {
        const slide = await Slide.create(req.body);
        res.status(201).json({ success: true, slide });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/admin/slides/:id', protect, admin, async (req, res) => {
    try {
        const slide = await Slide.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
        res.json({ success: true, slide });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/admin/slides/:id', protect, admin, async (req, res) => {
    try {
        await Slide.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Slide deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ===== SPA FALLBACK =====
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ===== START =====
const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Majdoors Backend running on http://localhost:${PORT}`);
            console.log(`Frontend served from: ${path.join(__dirname, '../frontend')}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
};

startServer();

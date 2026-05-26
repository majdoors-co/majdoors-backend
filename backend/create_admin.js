require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const email = (process.argv[2] || 'admin@majdoors.com').toLowerCase().trim();
const password = process.argv[3] || 'admin123';
const name = process.argv[4] || 'Ravi Kumar';
const phone = process.argv[5] || '+91 9279509297';

async function main() {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is missing in .env');
    }

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(12));
    const user = await User.findOneAndUpdate(
        { email },
        { name, email, phone, password: hashedPassword, role: 'admin', isActive: true },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`Admin ready: ${user.email}`);
}

main()
    .catch((err) => {
        console.error('Failed to create admin:', err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect().catch(() => {});
    });

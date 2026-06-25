require('dotenv').config();
const mongoose = require('mongoose');
const InteriorCategory = require('./models/InteriorCategory');

const defaults = [
    { name: 'Wardrobe Design', slug: 'wardrobe-design', icon: 'fas fa-door-closed', description: 'Sliding, hinged and premium storage ideas for bedrooms.', coverImage: 'img/interior_option_1.png', images: ['img/interior_option_1.png', 'img/interior_option_2.png', 'img/interior_option_3.png'], sortOrder: 1, isActive: true },
    { name: 'Modular Kitchen', slug: 'modular-kitchen', icon: 'fas fa-utensils', description: 'Smart kitchen layouts, cabinets and utility-focused finishes.', coverImage: 'img/slider_interior.png', images: ['img/slider_interior.png', 'img/interior_offer.png', 'img/interior_option_2.png'], sortOrder: 2, isActive: true },
    { name: 'False Ceiling', slug: 'false-ceiling', icon: 'fas fa-border-top-left', description: 'Modern ceiling concepts with lighting and clean detailing.', coverImage: 'img/interior_offer.png', images: ['img/interior_offer.png', 'img/interior_option_3.png', 'img/slider_interior.png'], sortOrder: 3, isActive: true },
    { name: 'Living Room Design', slug: 'living-room-design', icon: 'fas fa-couch', description: 'TV units, wall panels, storage and seating inspiration.', coverImage: 'img/interior_option_2.png', images: ['img/interior_option_2.png', 'img/interior_option_1.png', 'img/interior_offer.png'], sortOrder: 4, isActive: true },
    { name: 'Bedroom Interior', slug: 'bedroom-interior', icon: 'fas fa-bed', description: 'Calm bedroom layouts with wardrobes, panels and lighting.', coverImage: 'img/interior_option_3.png', images: ['img/interior_option_3.png', 'img/interior_option_1.png', 'img/slider_interior.png'], sortOrder: 5, isActive: true },
    { name: 'Bathroom Vanity', slug: 'bathroom-vanity', icon: 'fas fa-sink', description: 'Compact vanity, mirror and storage ideas for bathrooms.', coverImage: 'img/interior_offer.png', images: ['img/interior_offer.png', 'img/interior_option_2.png'], sortOrder: 6, isActive: true }
];

async function syncInteriors() {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    for (const category of defaults) {
        await InteriorCategory.updateOne(
            { slug: category.slug },
            { $set: category },
            { upsert: true, runValidators: true }
        );
    }
    const rows = await InteriorCategory.find({}).sort({ sortOrder: 1 }).lean();
    console.log(`Interior categories now in DB: ${rows.length}`);
    rows.forEach(row => console.log(`- ${row.name || 'MISSING'} (${row.slug}) ${row.isActive ? 'Active' : 'Hidden'}`));
    await mongoose.disconnect();
}

syncInteriors().catch(err => {
    console.error('Interior sync failed:', err.message);
    process.exit(1);
});

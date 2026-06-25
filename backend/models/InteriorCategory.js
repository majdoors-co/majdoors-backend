const mongoose = require('mongoose');

const interiorCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String, default: 'fas fa-couch' },
    description: { type: String, default: '' },
    coverImage: { type: String, required: true },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

interiorCategorySchema.pre('validate', function(next) {
    if (this.name && !this.slug) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    next();
});

module.exports = mongoose.model('InteriorCategory', interiorCategorySchema);

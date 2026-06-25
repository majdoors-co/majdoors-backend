const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Slide = require('./models/Slide');
const InteriorCategory = require('./models/InteriorCategory');

const seedMemoryDatabase = async () => {
    try {
        console.log('Seeding In-Memory Database...');
        await User.deleteMany();
        await Worker.deleteMany();
        await Product.deleteMany();
        await Category.deleteMany();
        await InteriorCategory.deleteMany();

        // Seed Admin
        const salt = await bcrypt.genSalt(12);
        const adminPassword = await bcrypt.hash('admin123', salt);
        await User.create({ name: 'Ravi Kumar', email: 'admin@majdoors.com', phone: '+91 9279509297', password: adminPassword, role: 'admin' });
        console.log('✅ Admin user seeded');

        // Seed Categories
        await Category.insertMany([
            { name: 'Electrical', slug: 'electrical', icon: 'fas fa-bolt', sortOrder: 1 },
            { name: 'Plumbing', slug: 'plumbing', icon: 'fas fa-faucet', sortOrder: 2 },
            { name: 'Paints', slug: 'paints', icon: 'fas fa-paint-roller', sortOrder: 3 },
            { name: 'Flooring', slug: 'flooring', icon: 'fas fa-th-large', sortOrder: 4 },
            { name: 'Hardware', slug: 'hardware', icon: 'fas fa-tools', sortOrder: 5 },
            { name: 'Construction', slug: 'construction', icon: 'fas fa-cubes', sortOrder: 6 }
        ]);
        console.log('✅ Categories seeded');

        // Seed Products (demo data matching user's exact categories)
        await Product.insertMany([
            // Electrical
            { name: 'Copper Wire 1.5mm', category: 'electrical', description: 'Premium grade copper wiring, 90m roll. ISI certified for home & commercial use.', price: 1100, oldPrice: 1350, discount: '20% off', stock: 35, rating: 4.6, img: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b6?auto=format&fit=crop&w=400&h=300' },
            { name: 'Modular Switches Pack', category: 'electrical', description: 'Set of 6 modular switches with elegant white finish. Fireproof material.', price: 899, oldPrice: 1299, discount: '30% off', stock: 45, rating: 4.5, img: 'https://images.unsplash.com/photo-1558442074-3c19857bc1dc?auto=format&fit=crop&w=400&h=300' },
            { name: 'LED Magnet Light 20W', category: 'electrical', description: 'Slim panel magnet light, cool white, easy magnetic installation.', price: 450, oldPrice: 650, discount: '30% off', stock: 60, rating: 4.4, img: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=400&h=300' },
            { name: 'PVC Wiring Pipe 25mm', category: 'electrical', description: 'Heavy duty PVC conduit pipe for concealed wiring, 3m length.', price: 120, oldPrice: 180, discount: '33% off', stock: 200, rating: 4.3, img: 'https://images.unsplash.com/photo-1585408453188-75e117b846e4?auto=format&fit=crop&w=400&h=300' },
            { name: 'Modular Fittings Set', category: 'electrical', description: 'Complete modular fittings kit - plates, sockets, USB charger points.', price: 1599, oldPrice: 2100, discount: '24% off', stock: 25, rating: 4.7, img: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&h=300' },

            // Plumbing / Hardware
            { name: 'Door Hardware Kit', category: 'hardware', description: 'Complete door hardware set - handle, lock, hinges, screws.', price: 1250, oldPrice: 1600, discount: '22% off', stock: 30, rating: 4.5, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&h=300' },
            { name: 'Premium Plywood 18mm', category: 'hardware', description: 'BWP grade marine plywood, 8x4 ft sheet. Termite resistant.', price: 2800, oldPrice: 3200, discount: '12% off', stock: 15, rating: 4.8, img: 'https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?auto=format&fit=crop&w=400&h=300' },
            { name: 'Laminate Mica Sheet', category: 'hardware', description: 'Sunmica decorative laminate, 8x4 ft, multiple finishes available.', price: 950, oldPrice: 1200, discount: '20% off', stock: 40, rating: 4.4, img: 'https://images.unsplash.com/photo-1558442074-3c19857bc1dc?auto=format&fit=crop&w=400&h=300' },
            { name: 'SS Hinges (4 Pack)', category: 'hardware', description: 'Stainless steel ball-bearing hinges, 4-inch, rust-proof.', price: 380, oldPrice: 500, discount: '24% off', stock: 100, rating: 4.3, img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&h=300' },
            { name: 'Fevicol SH 5Kg', category: 'hardware', description: 'Original Fevicol SH synthetic resin adhesive for wood working.', price: 750, oldPrice: 850, discount: '12% off', stock: 50, rating: 4.9, img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=400&h=300' },

            // Paints
            { name: 'Wall Putty 40Kg', category: 'paints', description: 'White cement-based wall putty for smooth finish on walls.', price: 850, oldPrice: 1050, discount: '19% off', stock: 30, rating: 4.5, img: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?auto=format&fit=crop&w=400&h=300' },
            { name: 'Emulsion Paint 10L', category: 'paints', description: 'Premium interior emulsion paint. Washable, anti-fungal, 200+ shades.', price: 2200, oldPrice: 2800, discount: '21% off', stock: 20, rating: 4.7, img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&h=300' },
            { name: 'Primer 20L', category: 'paints', description: 'Interior/exterior primer for wall preparation before painting.', price: 1800, oldPrice: 2200, discount: '18% off', stock: 25, rating: 4.4, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&h=300' },
            { name: 'Paint Brushes Set', category: 'paints', description: 'Professional brush set - 1", 2", 3", 4" sizes. Nylon bristles.', price: 350, oldPrice: 500, discount: '30% off', stock: 80, rating: 4.3, img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=400&h=300' },
            { name: 'Paint Roller 9"', category: 'paints', description: 'Heavy duty 9-inch paint roller with extension handle.', price: 280, oldPrice: 400, discount: '30% off', stock: 60, rating: 4.5, img: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?auto=format&fit=crop&w=400&h=300' },

            // Flooring
            { name: 'Floor Tiles 2x2 ft', category: 'flooring', description: 'Vitrified floor tiles, glossy finish, anti-skid. Pack of 4.', price: 750, oldPrice: 999, discount: '25% off', stock: 200, rating: 4.4, img: 'https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=400&h=300' },
            { name: 'Granite Slab', category: 'flooring', description: 'Natural black granite slab, polished, per sq ft pricing.', price: 180, oldPrice: 250, discount: '28% off', stock: 500, rating: 4.6, img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&h=300' },
            { name: 'Italian Marble', category: 'flooring', description: 'Premium Italian marble tile, white with grey veins, per sq ft.', price: 350, oldPrice: 450, discount: '22% off', stock: 300, rating: 4.8, img: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=400&h=300' },
            { name: 'Stone Finish Tiles', category: 'flooring', description: 'Natural stone finish ceramic tiles for outdoor & indoor use.', price: 120, oldPrice: 180, discount: '33% off', stock: 400, rating: 4.3, img: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?auto=format&fit=crop&w=400&h=300' },

            // Plumbing / Hardware (Pipes, Motors, etc.)
            { name: 'CPVC Pipes 1"', category: 'plumbing', description: 'Hot & cold water CPVC pipes, 3m length, ISI marked.', price: 349, oldPrice: 499, discount: '30% off', stock: 120, rating: 4.3, img: 'https://images.unsplash.com/photo-1585408453188-75e117b846e4?auto=format&fit=crop&w=400&h=300' },
            { name: 'Water Motor 1HP', category: 'plumbing', description: 'Self-priming water pump motor, 1HP, copper winding.', price: 3500, oldPrice: 4200, discount: '17% off', stock: 10, rating: 4.7, img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&h=300' },
            { name: 'Wash Basin', category: 'plumbing', description: 'Ceramic table-top wash basin, white glossy, 18x15 inch.', price: 1800, oldPrice: 2500, discount: '28% off', stock: 20, rating: 4.5, img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&h=300' },
            { name: 'Cistern & Commode', category: 'plumbing', description: 'Complete EWC set with cistern, seat cover, fittings included.', price: 4500, oldPrice: 5500, discount: '18% off', stock: 8, rating: 4.6, img: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=400&h=300' },
            { name: 'Water Tank 500L', category: 'plumbing', description: 'Triple-layer UV protected overhead water tank, 500 litre.', price: 3200, oldPrice: 3800, discount: '16% off', stock: 12, rating: 4.8, img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&h=300' },

            // Construction
            { name: 'OPC Cement 50Kg', category: 'construction', description: 'Ordinary Portland Cement, 53 grade, 50kg bag. Top brand.', price: 420, oldPrice: 480, discount: '12% off', stock: 100, rating: 4.6, img: 'https://images.unsplash.com/photo-1518709766631-90aace3d67f4?auto=format&fit=crop&w=400&h=300' },
            { name: 'River Sand (per ton)', category: 'construction', description: 'Clean washed river sand for plastering & construction work.', price: 2500, oldPrice: 3000, discount: '17% off', stock: 50, rating: 4.4, img: 'https://images.unsplash.com/photo-1518709766631-90aace3d67f4?auto=format&fit=crop&w=400&h=300' },
            { name: 'Red Bricks (per 1000)', category: 'construction', description: 'First-class red clay bricks, standard size, per 1000 pieces.', price: 6000, oldPrice: 7000, discount: '14% off', stock: 20, rating: 4.5, img: 'https://images.unsplash.com/photo-1518709766631-90aace3d67f4?auto=format&fit=crop&w=400&h=300' },
            { name: 'Steel Rods Fe500', category: 'construction', description: 'TMT steel reinforcement bars, Fe500 grade, 12mm x 12m.', price: 3500, oldPrice: 3800, discount: '8% off', stock: 30, rating: 4.8, img: 'https://images.unsplash.com/photo-1518709766631-90aace3d67f4?auto=format&fit=crop&w=400&h=300' }
        ]);
        console.log('✅ Products seeded (30 demo items)');

        // Seed Workers (Hire Professionals)
        await Worker.insertMany([
            { name: 'Ramesh Kumar', role: 'Electrician', exp: '8 yrs', rating: 4.8, price: '₹399/hr', img: 'https://randomuser.me/api/portraits/men/32.jpg', verified: true, city: 'Bihar Sharif', status: 'Available', phone: '+91 9876543210' },
            { name: 'Amit Verma', role: 'Plumber', exp: '10 yrs', rating: 4.9, price: '₹349/hr', img: 'https://randomuser.me/api/portraits/men/45.jpg', verified: true, city: 'Patna', status: 'Available', phone: '+91 9876543211' },
            { name: 'Suresh Mehta', role: 'Home Cleaning', exp: '5 yrs', rating: 4.5, price: '₹299/day', img: 'https://randomuser.me/api/portraits/men/22.jpg', verified: false, city: 'Bihar Sharif', status: 'Available', phone: '+91 9876543212' },
            { name: 'Kunal Das', role: 'Carpenter', exp: '12 yrs', rating: 4.9, price: '₹499/hr', img: 'https://randomuser.me/api/portraits/men/68.jpg', verified: true, city: 'Bihar Sharif', status: 'Available', phone: '+91 9876543213' },
            { name: 'Pooja Sharma', role: 'Painter', exp: '6 yrs', rating: 4.7, price: '₹249/sqft', img: 'https://randomuser.me/api/portraits/women/68.jpg', verified: true, city: 'Bihar Sharif', status: 'Busy', phone: '+91 9876543214' },
            { name: 'Vikram Singh', role: 'Home Installation', exp: '9 yrs', rating: 4.6, price: '₹599/day', img: 'https://randomuser.me/api/portraits/men/79.jpg', verified: true, city: 'Bihar Sharif', status: 'Available', phone: '+91 9876543215' },
            { name: 'Manoj Yadav', role: 'Mason', exp: '15 yrs', rating: 4.8, price: '₹449/hr', img: 'https://randomuser.me/api/portraits/men/85.jpg', verified: true, city: 'Patna', status: 'Available', phone: '+91 9876543216' },
            { name: 'Ravi Tiwari', role: 'AC Technician', exp: '7 yrs', rating: 4.6, price: '₹549/hr', img: 'https://randomuser.me/api/portraits/men/90.jpg', verified: true, city: 'Bihar Sharif', status: 'Available', phone: '+91 9876543217' },
            { name: 'Deepak Gupta', role: 'Tile Fitter', exp: '8 yrs', rating: 4.7, price: '₹399/hr', img: 'https://randomuser.me/api/portraits/men/55.jpg', verified: true, city: 'Bihar Sharif', status: 'Available', phone: '+91 9876543218' },
            { name: 'Sanjay Prasad', role: 'Civil Contractor', exp: '20 yrs', rating: 4.9, price: '₹2999/day', img: 'https://randomuser.me/api/portraits/men/41.jpg', verified: true, city: 'Bihar Sharif', status: 'Available', phone: '+91 9876543219' }
        ]);
        console.log('✅ Workers seeded (10 professionals)');

        // Seed Slides
        await Slide.deleteMany({});
        await Slide.insertMany([
            {
                title: 'Design Your Home<br>for Free',
                subtitle: 'Modern interior design solutions tailored specifically for you.',
                img: 'img/slider_interior.png',
                buttonText: 'Explore Gallery →',
                buttonLink: '#',
                galleryImages: ['img/slider_interior.png', 'img/interior_offer.png', 'img/interior_option_1.png', 'img/interior_option_2.png', 'img/interior_option_3.png'],
                sortOrder: 1
            },
            {
                title: 'Wedding Planner &<br>Decoration',
                subtitle: 'Make your special day unforgettable with premium decor.',
                img: 'img/wedding_decor_1.png',
                buttonText: 'Explore Wedding Decor →',
                buttonLink: '#',
                galleryImages: ['img/wedding_decor_1.png', 'img/wedding_decor_2.png', 'img/wedding_decor_3.png'],
                sortOrder: 2
            },
            {
                title: 'Premium Construction<br>Materials',
                subtitle: 'Quality products at wholesale prices for your projects.',
                img: 'img/slider_materials.png',
                buttonText: 'Shop Now →',
                buttonLink: 'mart.html',
                sortOrder: 3
            },
            {
                title: 'Hire Verified<br>Professionals',
                subtitle: 'Book trusted electricians, plumbers, carpenters & more.',
                img: 'img/slider_services.png',
                buttonText: 'Book Now →',
                buttonLink: 'services.html',
                sortOrder: 4
            }
        ]);
        console.log('✅ Slides seeded (5 default slides)');

        await InteriorCategory.insertMany([
            { name: 'Wardrobe Design', slug: 'wardrobe-design', icon: 'fas fa-door-closed', description: 'Sliding, hinged and premium storage ideas for bedrooms.', coverImage: 'img/interior_option_1.png', images: ['img/interior_option_1.png', 'img/interior_option_2.png', 'img/interior_option_3.png'], sortOrder: 1 },
            { name: 'Modular Kitchen', slug: 'modular-kitchen', icon: 'fas fa-utensils', description: 'Smart kitchen layouts, cabinets and utility-focused finishes.', coverImage: 'img/slider_interior.png', images: ['img/slider_interior.png', 'img/interior_offer.png', 'img/interior_option_2.png'], sortOrder: 2 },
            { name: 'False Ceiling', slug: 'false-ceiling', icon: 'fas fa-border-top-left', description: 'Modern ceiling concepts with lighting and clean detailing.', coverImage: 'img/interior_offer.png', images: ['img/interior_offer.png', 'img/interior_option_3.png', 'img/slider_interior.png'], sortOrder: 3 },
            { name: 'Living Room Design', slug: 'living-room-design', icon: 'fas fa-couch', description: 'TV units, wall panels, storage and seating inspiration.', coverImage: 'img/interior_option_2.png', images: ['img/interior_option_2.png', 'img/interior_option_1.png', 'img/interior_offer.png'], sortOrder: 4 },
            { name: 'Bedroom Interior', slug: 'bedroom-interior', icon: 'fas fa-bed', description: 'Calm bedroom layouts with wardrobes, panels and lighting.', coverImage: 'img/interior_option_3.png', images: ['img/interior_option_3.png', 'img/interior_option_1.png', 'img/slider_interior.png'], sortOrder: 5 },
            { name: 'Bathroom Vanity', slug: 'bathroom-vanity', icon: 'fas fa-sink', description: 'Compact vanity, mirror and storage ideas for bathrooms.', coverImage: 'img/interior_offer.png', images: ['img/interior_offer.png', 'img/interior_option_2.png'], sortOrder: 6 }
        ]);
        console.log('✅ Interior categories seeded');

        console.log('🎉 Memory Database Seeding Completed!');
    } catch (error) {
        console.error('Memory Seeding Error:', error.message);
    }
};

seedMemoryDatabase();

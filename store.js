// ============================================================
//  store.js — Product Data, Cart, Wishlist, Auth, Coupons
// ============================================================

// ── HOW TO ADD IMAGES ──
// Find the product below, then change image:"" to image:"yourfile.jpg"
// Put the image file in the same folder as your HTML files.
// Example: image:"laptop.jpg"  → you have laptop.jpg in your folder

const PRODUCTS = [
  // ── POKÉMON FIGURES ──
  { id:1,  name:"Charizard Figure",   category:"pokemon",    price:499,   originalPrice:900,   image:"charizard.png",  rating:4.9, sold:1204, badge:"HOT",
    desc:"Premium Charizard figure with flame base. Officially licensed Nintendo merchandise.",
    variations:["Standard Edition","Shiny Edition","Mega Charizard X","Mega Charizard Y","Gigantamax Edition"] },
  { id:2,  name:"Pikachu Figure",     category:"pokemon",    price:449,   originalPrice:800,   image:"pikachu.png",    rating:4.8, sold:3201, badge:"BESTSELLER",
    desc:"Iconic Pikachu in battle stance with lightning bolt effects on both sides.",
    variations:["Standard","Detective Pikachu","Ash's Pikachu","Gigantamax","Holiday Edition"] },
  { id:3,  name:"Bulbasaur Figure",   category:"pokemon",    price:399,   originalPrice:700,   image:"bulbasaur.png",  rating:4.7, sold:890,  badge:null,
    desc:"Lovable starter Pokémon with detailed vine bulb and grass base display.",
    variations:["Standard","Shiny","Mega Venusaur","Baby Bulbasaur","Gigantamax Venusaur"] },
  { id:4,  name:"Squirtle Figure",    category:"pokemon",    price:399,   originalPrice:700,   image:"squirtle.png",   rating:4.7, sold:970,  badge:null,
    desc:"Cheerful Tiny Turtle with translucent water wave base.",
    variations:["Standard","Shiny","Blastoise Evolution","Mega Blastoise","Gigantamax"] },
  { id:5,  name:"Meowth Figure",      category:"pokemon",    price:379,   originalPrice:650,   image:"meowth.png",     rating:4.6, sold:540,  badge:null,
    desc:"Team Rocket's Meowth sitting on a treasure chest full of coins and gems.",
    variations:["Standard","Alolan Meowth","Galarian Meowth","Persian Set","Gold Edition"] },
  { id:6,  name:"Mew Figure",         category:"pokemon",    price:599,   originalPrice:1100,  image:"mew.png",        rating:5.0, sold:2100, badge:"RARE",
    desc:"Mythical Mew floating on a psychic energy base. One of the rarest collectibles!",
    variations:["Standard","Shiny Mew","Mewtwo Set","Armored Mewtwo","Shadow Mew"] },
  { id:7,  name:"Dragonite Figure",   category:"pokemon",    price:549,   originalPrice:950,   image:"dragonite.png",  rating:4.8, sold:730,  badge:null,
    desc:"Gentle Dragon Pokémon with highly detailed scales and wings.",
    variations:["Standard","Shiny","Dragonair Set","Lance's Dragonite","Holiday Edition"] },
  { id:8,  name:"Rayquaza Figure",    category:"pokemon",    price:699,   originalPrice:1200,  image:"rayquaza.png",   rating:4.9, sold:1560, badge:"LEGENDARY",
    desc:"Sky High Pokémon fully articulated on a display stand. A showpiece for collectors.",
    variations:["Standard","Shiny","Mega Rayquaza","Black Rayquaza","Crystal Edition"] },

  // ── WATCHES ──
  // To add image: change image:"" to image:"smartwatch.jpg" (put smartwatch.jpg in folder)
  { id:9,  name:"NexGen Smart Watch Pro",  category:"watches", price:2499, originalPrice:4500, image:"smartwatch1.png" , rating:4.7, sold:892,  badge:"NEW",
    desc:"Feature-packed smartwatch with health monitoring, GPS, and 7-day battery life.",
    variations:["Black 42mm","Black 46mm","Silver 42mm","Silver 46mm","Rose Gold 42mm","Navy Blue 46mm","Space Grey 42mm","White 46mm","Red 42mm","Green 46mm"] },
  { id:10, name:"Classic Analog Watch",    category:"watches", price:1299, originalPrice:2200, image:"analogwatch.png", rating:4.5, sold:445,  badge:null,
    desc:"Elegant timepiece with genuine leather strap and sapphire crystal glass.",
    variations:["Brown Leather","Black Leather","Blue Dial","White Dial","Chronograph Silver","Chronograph Gold","Minimalist Black","Rose Gold","Gunmetal","Two-Tone"] },
  { id:11, name:"Sports Tracker Watch",   category:"watches", price:899,  originalPrice:1800, image:"sportstracker.png", rating:4.6, sold:1230, badge:"SALE",
    desc:"Waterproof sports watch with step counter, heart rate, and multi-sport modes.",
    variations:["Black","Blue","Red","Green","Orange","Yellow","Purple","White","Camo","Pink"] },

  // ── LAPTOPS ──
  // To add image: change image:"" to image:"laptop.jpg"
  { id:12, name:"NexBook Air 14\"",        category:"laptops", price:28999, originalPrice:45000, image:"inteli5.png", rating:4.8, sold:234, badge:"HOT",
    desc:"Ultra-thin laptop with Intel Core i5, 16GB RAM, 512GB SSD, all-day battery.",
    variations:["i5 8GB 256GB Silver","i5 8GB 256GB Space Grey","i5 16GB 512GB Silver","i5 16GB 512GB Space Grey","i7 16GB 512GB Silver","i7 16GB 1TB Silver","i7 32GB 1TB Space Grey","Ryzen 5 8GB 256GB","Ryzen 7 16GB 512GB","Ryzen 9 32GB 1TB"] },
  { id:13, name:"NexBook Gaming Pro 15\"", category:"laptops", price:49999, originalPrice:75000, image:"rtx4060.png", rating:4.9, sold:98,  badge:"BESTSELLER",
    desc:"Gaming powerhouse with RTX 4060, i7 processor, 144Hz display, RGB keyboard.",
    variations:["RTX 4060 16GB","RTX 4060 32GB","RTX 4070 16GB","RTX 4070 32GB","RTX 4080 32GB","RTX 4080 64GB","RTX 4090 32GB","RTX 4090 64GB","AMD RX 7600 16GB","AMD RX 7700 32GB"] },
  { id:14, name:"NexBook Chromebook 11\"", category:"laptops", price:8999,  originalPrice:15000, image:"chromebook.png", rating:4.4, sold:567, badge:null,
    desc:"Lightweight Chromebook for everyday use, school, and online work.",
    variations:["4GB 64GB White","4GB 64GB Black","4GB 128GB White","8GB 128GB Silver","8GB 256GB Black","Celeron 4GB 32GB","Pentium 4GB 64GB","Intel N100 8GB 128GB","Flip 360° 4GB 64GB","Touch Screen 8GB 128GB"] },

  // ── PHONES ──
  // To add image: change image:"" to image:"phone.jpg"
  { id:15, name:"NexPhone 15 Pro",  category:"phones", price:39999, originalPrice:55000, image:"snapgen3.png", rating:4.9, sold:3421, badge:"HOT",
    desc:"Flagship smartphone with 200MP camera, Snapdragon 8 Gen 3, 5G ready.",
    variations:["128GB Black","128GB White","128GB Blue","128GB Green","256GB Black","256GB White","256GB Titanium","512GB Black","512GB White","1TB Black"] },
  { id:16, name:"NexPhone Lite",    category:"phones", price:12999, originalPrice:18000, image:"nexphonelite.png", rating:4.6, sold:8900, badge:"BESTSELLER",
    desc:"Affordable powerhouse with 64MP camera, 5000mAh battery, fast charging.",
    variations:["64GB Black","64GB Blue","64GB Green","128GB Black","128GB White","128GB Purple","256GB Black","256GB Blue","Special Edition Gold","NFC Edition 128GB"] },
  { id:17, name:"NexPhone Fold",    category:"phones", price:69999, originalPrice:95000, image:"foldphone1.png", rating:4.8, sold:156,  badge:"NEW",
    desc:"Foldable smartphone with 7.6\" inner display and dual-screen multitasking.",
    variations:["256GB Black","256GB Beige","256GB Silver","512GB Black","512GB Phantom Green","1TB Black","Pen Edition 256GB","Pen Edition 512GB","Luxury Gold 512GB","Diamond Edition"] },

  // ── HEADPHONES ──
  // To add image: change image:"" to image:"headphones.jpg"
  { id:18, name:"NexSound Pro Wireless",   category:"headphones", price:2999, originalPrice:5500, image:"headphonewireless1.png", rating:4.8, sold:4230, badge:"BESTSELLER",
    desc:"40-hour battery ANC headphones with crystal-clear audio and foldable design.",
    variations:["Black","White","Navy Blue","Midnight Green","Rose Gold","Matte Silver","Transparent","Red","Copper Brown","Limited Purple"] },
  { id:19, name:"NexBuds True Wireless",   category:"headphones", price:1299, originalPrice:2500, image:"headphonewireless2.png", rating:4.7, sold:9870, badge:"HOT",
    desc:"True wireless earbuds with ANC, 8hr battery, IPX5 water resistant.",
    variations:["Black","White","Blue","Coral","Sage Green","Lavender","Yellow","Clear","Midnight","Rose"] },
  { id:20, name:"NexSound Gaming Headset", category:"headphones", price:1799, originalPrice:3200, image:"headphonewireless3.png", rating:4.6, sold:2100, badge:null,
    desc:"7.1 surround sound gaming headset with retractable mic and RGB lighting.",
    variations:["Black RGB","White RGB","Red Black","Blue Black","Camo","Pink","All Black","Silver","Rose Gold","Neon Green"] },

  // ── KEYBOARDS ──
  // To add image: change image:"" to image:"keyboard.jpg"
  { id:21, name:"NexKey Mechanical 75%",  category:"keyboards", price:2499, originalPrice:4000, image:"keyboard1.png", rating:4.9, sold:1870, badge:"HOT",
    desc:"Hot-swappable mechanical keyboard with RGB, gasket mount, premium feel.",
    variations:["Red Switch Black","Red Switch White","Blue Switch Black","Brown Switch Black","Brown Switch White","Silent Red White","Linear Black","Tactile Purple","Speed Silver","Clicky Green"] },
  { id:22, name:"NexKey Wireless Compact", category:"keyboards", price:1499, originalPrice:2800, image:"keyboard2.png", rating:4.7, sold:3400, badge:null,
    desc:"Compact 60% wireless keyboard, Bluetooth 5.0, 3-device pairing, 30-day battery.",
    variations:["White","Black","Pink","Blue","Grey","Cream","Sage","Lavender","Mint","Dark Mode"] },

  // ── SHOES ──
  // To add image: change image:"" to image:"shoes.jpg"
  { id:23, name:"NexRun Trainer Pro",       category:"shoes", price:3499, originalPrice:5500, image:"shoes1.png", rating:4.7, sold:2340, badge:"NEW",
    desc:"Responsive running shoes with carbon fiber plate and ultra-light foam.",
    variations:["White/Black US7","White/Black US8","White/Black US9","White/Black US10","White/Black US11","Black/Red US8","Black/Red US9","Black/Red US10","Navy/White US8","Grey/Lime US9"] },
  { id:24, name:"NexStep Lifestyle Sneaker", category:"shoes", price:2199, originalPrice:3800, image:"shoes2.png", rating:4.6, sold:5670, badge:"BESTSELLER",
    desc:"Premium everyday sneakers with cushioned insole and durable outsole.",
    variations:["White US7","White US8","White US9","White US10","Black US8","Black US9","Black US10","Grey US8","Beige US9","Navy US10"] },

  // ── FASHION ──
  // To add image: change image:"" to image:"shirt.jpg"
  { id:25, name:"NexWear Graphic Tee", category:"fashion", price:399, originalPrice:699, image:"whiteT1.png", rating:4.5, sold:12400, badge:"BESTSELLER",
    desc:"Premium 100% cotton graphic tee, pre-shrunk, double-stitched collar.",
    variations:["White XS","White S","White M","White L","White XL","Black S","Black M","Black L","Black XL","Black XXL","Grey M","Grey L","Navy M","Navy L","Red M"] },
  { id:26, name:"NexWear Polo Shirt",  category:"fashion", price:599, originalPrice:999, image:"poloshirt1.png", rating:4.6, sold:8900, badge:null,
    desc:"Breathable pique polo with embroidered logo, perfect for work or casual.",
    variations:["White S","White M","White L","White XL","Black M","Black L","Navy S","Navy M","Navy L","Grey M","Grey L","Maroon M","Green M","Blue XL","Beige L"] },
  { id:27, name:"NexWear Hoodie",      category:"fashion", price:999, originalPrice:1800, image:"hoodie1.png", rating:4.8, sold:4560, badge:"HOT",
    desc:"Fleece-lined hoodie with kangaroo pocket, adjustable drawstring.",
    variations:["Black S","Black M","Black L","Black XL","White S","White M","White L","Grey M","Grey L","Navy M","Navy L","Green M","Maroon L","Pink M","Cream S"] },

  // ── BAGS ──
  // To add image: change image:"" to image:"bag.jpg"
  { id:28, name:"NexBag Everyday Backpack", category:"bags", price:1299, originalPrice:2200, image:"backpack1.png", rating:4.7, sold:3210, badge:"NEW",
    desc:"30L waterproof backpack with laptop compartment, USB charging port, anti-theft.",
    variations:["Black","Navy","Grey","Olive","Camo","Brown","Burgundy","Sky Blue","Rose","Beige"] },
  { id:29, name:"NexBag Crossbody Slim",    category:"bags", price:799,  originalPrice:1400, image:"crossbodybag1.png", rating:4.6, sold:6780, badge:null,
    desc:"Compact crossbody bag with RFID-blocking pocket, adjustable strap.",
    variations:["Black","Brown","Navy","Tan","Grey","White","Red","Olive","Pink","Beige"] },

  // ── FOOD ──
  // To add image: change image:"" to image:"choco.jpg"
  { id:30, name:"Choco Premium Box",  category:"food", price:299, originalPrice:450, image:"food1.png", rating:4.8, sold:15600, badge:"BESTSELLER",
    desc:"Assorted premium chocolates imported from Belgium. Perfect for gifting.",
    variations:["Dark Chocolate 200g","Milk Chocolate 200g","White Chocolate 200g","Mixed 200g","Dark 500g","Milk 500g","Mixed 500g","Truffle Box 12pcs","Praline Box 24pcs","Gift Set 300g"] },
  { id:31, name:"NexSnack Chips Pack", category:"food", price:149, originalPrice:220, image:"food2.png", rating:4.5, sold:28900, badge:null,
    desc:"Crispy kettle-cooked potato chips in bold flavors, family pack size.",
    variations:["Classic Salt 200g","BBQ 200g","Cheese 200g","Sour Cream 200g","Spicy 200g","Salt & Vinegar 200g","Honey Butter 200g","Salsa 200g","Dill Pickle 200g","Truffle 200g"] },

  // ── TOYS ──
  // To add image: change image:"" to image:"toys.jpg"
  { id:32, name:"NexBrick Building Set", category:"toys", price:1499, originalPrice:2500, image:"toy1.png", rating:4.9, sold:4320, badge:"HOT",
    desc:"Compatible building blocks set with 1000+ pieces. Stimulates creativity.",
    variations:["City Set 1000pcs","Space Set 850pcs","Castle Set 1200pcs","Pirate Ship 900pcs","Race Car 650pcs","Robot 750pcs","Farm 800pcs","Fire Station 950pcs","Police Station 1100pcs","Custom Creator 1500pcs"] },
  { id:33, name:"RC Racing Car Pro",     category:"toys", price:1999, originalPrice:3500, image:"toy2.png", rating:4.7, sold:2100, badge:null,
    desc:"1:10 scale remote-control racing car, 40km/h top speed, rechargeable.",
    variations:["Red 2.4GHz","Blue 2.4GHz","Yellow 2.4GHz","Black 2.4GHz","Green 2.4GHz","Monster Truck Red","Monster Truck Blue","Off-Road Black","Drift Edition White","Pro Racing Red"] },

  // ── BOOKS ──
  // To add image: change image:"" to image:"books.jpg"
  { id:34, name:"Learn Web Dev Series",       category:"books", price:599, originalPrice:999, image:"book1.png", rating:4.8, sold:3400, badge:"NEW",
    desc:"Comprehensive guide to HTML, CSS, JavaScript for beginners to advanced.",
    variations:["HTML & CSS Basics","JavaScript Fundamentals","React for Beginners","Node.js Essentials","Python Crash Course","Full Stack Guide","PHP & MySQL","Vue.js Guide","TypeScript Deep Dive","Web Security 101"] },
  { id:35, name:"Filipino Fiction Bestsellers", category:"books", price:349, originalPrice:599, image:"book2.jpg", rating:4.7, sold:8900, badge:null,
    desc:"Award-winning Filipino novels and short stories. Pambansang literatura.",
    variations:["Noli Me Tangere","El Filibusterismo","Florante at Laura","Ibong Adarna","Dekada 70","Bata Bata Paano Ka Ginawa","Smaller and Smaller Circles","She's Dating the Gangster","Para Sa Hopeless Romantic","Diary ng Panget"] },

  // ── CAMERAS ──
  // To add image: change image:"" to image:"camera.jpg"
  { id:36, name:"NexCam ",  category:"cameras", price:29999, originalPrice:45000, image:"cam1.png", rating:4.9, sold:345,  badge:"PRO",
    desc:"Professional 24MP DSLR with 4K video, 51-point AF system, weather sealed.",
    variations:["Body Only","18-55mm Kit","18-135mm Kit","50mm Prime Kit","70-300mm Kit","Double Zoom Kit","Vlog Kit","Studio Kit","Travel Kit","Pro Bundle"] },
  { id:37, name:"NexCam Action 4K",  category:"cameras", price:8999,  originalPrice:15000, image:"cam2.png", rating:4.8, sold:2340, badge:"HOT",
    desc:"Waterproof 4K action camera with stabilization, voice control, 170° wide angle.",
    variations:["Standard Black","Adventure Bundle","Surf Bundle","Bike Mount Bundle","Drone Bundle","Vlog Bundle","360° Bundle","Accessories Kit","Carry Case Bundle","Pro Creator Bundle"] },

  // ── GAMING ──
  // To add image: change image:"" to image:"controller.jpg"
  { id:38, name:"NexPad Wireless Controller", category:"gaming", price:1299, originalPrice:2200, image:"game1.png", rating:4.8, sold:5670, badge:"BESTSELLER",
    desc:"Wireless gaming controller with haptic feedback, trigger stops, 20hr battery.",
    variations:["Black","White","Red","Blue","Camo","Cosmic Purple","Midnight Black","Arctic White","Neon Yellow","Limited Edition Gold"] },
  { id:39, name:"NexStation Gaming Chair",    category:"gaming", price:4999, originalPrice:8500, image:"game2.png", rating:4.7, sold:1230, badge:"NEW",
    desc:"Ergonomic gaming chair with lumbar support, 4D armrests, 165° recline.",
    variations:["Black/Red","Black/Blue","Black/White","Black/Green","All Black","All White","Grey/Black","Purple/Black","Pink/White","Racing Red"] },

  // ── SKINCARE ──
  // To add image: change image:"" to image:"skincare.jpg"
  { id:40, name:"NexGlow Serum Kit",      category:"skincare", price:899, originalPrice:1600, image:"skin1.png", rating:4.8, sold:9870, badge:"HOT",
    desc:"Complete brightening serum kit with Vitamin C, hyaluronic acid, and niacinamide.",
    variations:["Vitamin C Serum 30ml","Hyaluronic Acid 30ml","Niacinamide 10% 30ml","Retinol 0.5% 30ml","AHA/BHA 30ml","Starter Kit 3pcs","Brightening Set 4pcs","Anti-Aging Set 5pcs","Acne Kit 4pcs","Full Routine 6pcs"] },
  { id:41, name:"NexGlow Sunscreen SPF50", category:"skincare", price:349, originalPrice:620,  image:"skin2.png", rating:4.9, sold:21000, badge:"BESTSELLER",
    desc:"Lightweight SPF50 PA++++ sunscreen. Non-greasy, reef-safe formula.",
    variations:["50ml Tube","100ml Tube","Tinted 50ml","Matte Finish 50ml","Moisturizing 100ml","Kids Formula 100ml","Sport SPF60 100ml","Stick SPF50","Spray SPF50 150ml","Travel Set 3x30ml"] },
];

const CATEGORIES = [
  { id:"all",        label:"All Products",    icon:"🏪" },
  { id:"pokemon",    label:"Pokémon Figures", icon:"🎮" },
  { id:"watches",    label:"Watches",         icon:"⌚" },
  { id:"laptops",    label:"Laptops",         icon:"💻" },
  { id:"phones",     label:"Phones",          icon:"📱" },
  { id:"headphones", label:"Headphones",      icon:"🎧" },
  { id:"keyboards",  label:"Keyboards",       icon:"⌨️" },
  { id:"shoes",      label:"Shoes",           icon:"👟" },
  { id:"fashion",    label:"Fashion",         icon:"👕" },
  { id:"bags",       label:"Bags",            icon:"👜" },
  { id:"food",       label:"Food & Snacks",   icon:"🍫" },
  { id:"toys",       label:"Toys",            icon:"🧸" },
  { id:"books",      label:"Books",           icon:"📚" },
  { id:"cameras",    label:"Cameras",         icon:"📷" },
  { id:"gaming",     label:"Gaming",          icon:"🕹️" },
  { id:"skincare",   label:"Skincare",        icon:"✨" },
];

const COUPONS = {
  "NEXGEN10":  { discount:10,  type:"percent", desc:"10% off your order" },
  "NEXGEN20":  { discount:20,  type:"percent", desc:"20% off your order" },
  "SAVE100":   { discount:100, type:"fixed",   desc:"₱100 off your order" },
  "SAVE500":   { discount:500, type:"fixed",   desc:"₱500 off orders above ₱2000", minOrder:2000 },
  "POKEMON15": { discount:15,  type:"percent", desc:"15% off Pokémon items", category:"pokemon" },
  "FREESHIP":  { discount:0,   type:"freeship",desc:"Free shipping on any order" },
  "WELCOME50": { discount:50,  type:"fixed",   desc:"₱50 welcome discount" },
  "FLASH30":   { discount:30,  type:"percent", desc:"Flash sale — 30% off!" },
};

// ── STORAGE HELPERS ──
const Store = {
  getCart()       { return JSON.parse(localStorage.getItem("nexgen_cart")    || "[]"); },
  saveCart(c)     { localStorage.setItem("nexgen_cart", JSON.stringify(c)); },
  getWishlist()   { return JSON.parse(localStorage.getItem("nexgen_wishlist") || "[]"); },
  getOrders()     { return JSON.parse(localStorage.getItem("nexgen_orders")   || "[]"); },

  addToCart(productId, variation, qty=1) {
    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;
    const cart = this.getCart();
    const key  = productId + "_" + variation;
    const ex   = cart.find(i => i.key === key);
    if (ex) { ex.qty += qty; }
    else { cart.push({ key, productId, variation, qty, price:p.price, name:p.name, image:p.image, category:p.category }); }
    this.saveCart(cart);
    this.updateCartBadge();
  },
  removeFromCart(key) {
    this.saveCart(this.getCart().filter(i => i.key !== key));
    this.updateCartBadge();
  },
  updateQty(key, qty) {
    const cart = this.getCart();
    const item = cart.find(i => i.key === key);
    if (item) item.qty = Math.max(1, qty);
    this.saveCart(cart);
  },
  clearCart()     { localStorage.removeItem("nexgen_cart"); this.updateCartBadge(); },
  getCartTotal()  { return this.getCart().reduce((s,i) => s + i.price * i.qty, 0); },
  getCartCount()  { return this.getCart().reduce((s,i) => s + i.qty, 0); },
  updateCartBadge() {
    const b = document.getElementById("cart-badge");
    if (!b) return;
    const c = this.getCartCount();
    b.textContent    = c;
    b.style.display  = c > 0 ? "flex" : "none";
  },

  toggleWishlist(id) {
    let wl = this.getWishlist();
    if (wl.includes(id)) wl = wl.filter(x => x !== id);
    else wl.push(id);
    localStorage.setItem("nexgen_wishlist", JSON.stringify(wl));
    return wl.includes(id);
  },
  isWishlisted(id) { return this.getWishlist().includes(id); },

  saveOrder(order) {
    const orders = this.getOrders();
    orders.unshift(order);
    localStorage.setItem("nexgen_orders", JSON.stringify(orders));
  },

  applyCoupon(code, total) {
    const c = COUPONS[code.toUpperCase()];
    if (!c)                              return { valid:false, msg:"Invalid coupon code." };
    if (c.minOrder && total < c.minOrder) return { valid:false, msg:"Min order ₱"+c.minOrder+" required." };
    let discount = 0;
    if      (c.type==="percent")  discount = Math.round(total * c.discount / 100);
    else if (c.type==="fixed")    discount = c.discount;
    return { valid:true, discount, msg:c.desc, freeship: c.type==="freeship" };
  },

  search(q, cat="all") {
    const lq = (q||"").toLowerCase();
    return PRODUCTS.filter(p => {
      const matchCat = cat==="all" || p.category===cat;
      const matchQ   = !lq || p.name.toLowerCase().includes(lq) || p.desc.toLowerCase().includes(lq) || p.category.toLowerCase().includes(lq);
      return matchCat && matchQ;
    });
  },
  getProduct(id)    { return PRODUCTS.find(p => p.id === parseInt(id)); },
  getFeatured()     { return PRODUCTS.filter(p => p.badge).slice(0,8); },
  getByCategory(c)  { return c==="all" ? PRODUCTS : PRODUCTS.filter(p => p.category===c); },
};

// ── AUTH ──
const Auth = {
  getUser()   { return JSON.parse(localStorage.getItem("nexgen_user") || "null"); },
  saveUser(u) { localStorage.setItem("nexgen_user", JSON.stringify(u)); },
  isLoggedIn(){ return !!this.getUser(); },

  login(email, password) {
    const users = JSON.parse(localStorage.getItem("nexgen_users") || "[]");
    const user  = users.find(u => u.email===email && u.password===password);
    if (!user) return { ok:false, msg:"Invalid email or password." };
    this.saveUser(user);
    return { ok:true, user };
  },
  register(name, email, password) {
    const users = JSON.parse(localStorage.getItem("nexgen_users") || "[]");
    if (users.find(u => u.email===email)) return { ok:false, msg:"Email already registered." };
    const user = { id:Date.now(), name, email, password, avatar:name[0].toUpperCase(), joined:new Date().toLocaleDateString(), address:"", phone:"" };
    users.push(user);
    localStorage.setItem("nexgen_users", JSON.stringify(users));
    this.saveUser(user);
    return { ok:true, user };
  },
  logout()     { localStorage.removeItem("nexgen_user"); },
  updateProfile(data) {
    const user    = this.getUser(); if (!user) return;
    const updated = { ...user, ...data };
    this.saveUser(updated);
    const users   = JSON.parse(localStorage.getItem("nexgen_users") || "[]");
    const idx     = users.findIndex(u => u.id===user.id);
    if (idx !== -1) { users[idx] = updated; localStorage.setItem("nexgen_users", JSON.stringify(users)); }
    return updated;
  },
};

// ── HELPERS ──
function formatPrice(p) { return "₱" + Number(p).toLocaleString(); }
function stars(r) {
  let s="";
  for(let i=1;i<=5;i++) s += i<=Math.floor(r)?"★":(i-r<1?"½":"☆");
  return s;
}
function productEmoji(cat) {
  return {pokemon:"🎮",watches:"⌚",laptops:"💻",phones:"📱",headphones:"🎧",
          keyboards:"⌨️",shoes:"👟",fashion:"👕",bags:"👜",food:"🍫",
          toys:"🧸",books:"📚",cameras:"📷",gaming:"🕹️",skincare:"✨"}[cat] || "🛍️";
}

function buildProductCard(p) {
  const w   = Store.isWishlisted(p.id);
  const disc= p.originalPrice ? Math.round((1-p.price/p.originalPrice)*100) : 0;
  return `
<div class="product-card">
  <a href="product.html?id=${p.id}" class="card-img-link">
    <div class="card-img">
      ${p.image
        ? `<img src="${p.image}" alt="${p.name}" loading="lazy"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ""}
      <div class="card-img-placeholder" style="${p.image?"display:none":""}">
        <span>${productEmoji(p.category)}</span>
      </div>
      ${p.badge ? `<div class="card-badge">${p.badge}</div>` : ""}
      ${disc    ? `<div class="card-disc">-${disc}%</div>` : ""}
    </div>
  </a>
  <button class="wish-btn ${w?"active":""}" onclick="toggleWish(${p.id},this)">${w?"♥":"♡"}</button>
  <div class="card-body">
    <a href="product.html?id=${p.id}" class="card-name">${p.name}</a>
    <div class="card-rating">${stars(p.rating)} <span>${p.rating} (${p.sold.toLocaleString()} sold)</span></div>
    <div class="card-price">
      <span class="price-now">${formatPrice(p.price)}</span>
      ${p.originalPrice?`<span class="price-old">${formatPrice(p.originalPrice)}</span>`:""}
    </div>
    <button class="btn-addcart" onclick="quickAdd(${p.id})">🛒 Add to Cart</button>
  </div>
</div>`;
}

function quickAdd(id) {
  const p = Store.getProduct(id);
  if (!p) return;
  Store.addToCart(id, p.variations[0]);
  showToast(p.name + " added to cart!");
}
function toggleWish(id, btn) {
  const active = Store.toggleWishlist(id);
  btn.classList.toggle("active", active);
  btn.textContent = active ? "♥" : "♡";
  showToast(active ? "Added to wishlist!" : "Removed from wishlist");
}
function showToast(msg, type="success") {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id="toast"; document.body.appendChild(t); }
  t.textContent  = msg;
  t.className    = "toast toast-" + type + " show";
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), 2800);
}

// Init navbar
function initNav() {
  Store.updateCartBadge();
  const user  = Auth.getUser();
  const label = document.getElementById("nav-user-label");
  if (label) label.textContent = user ? user.name.split(" ")[0] : "Login";
  const catNav = document.getElementById("catNav");
  if (catNav) {
    catNav.innerHTML = CATEGORIES.map(c =>
      `<a class="cat-link" href="products.html?cat=${c.id}">${c.icon} ${c.label}</a>`
    ).join("");
  }
}
document.addEventListener("DOMContentLoaded", initNav);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Item = require("./models/Dish");

const mongoURI = "mongodb://127.0.0.1:27017/homechef";

const seedData = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB for maximum data seeding...");

    // 1. Clear existing chefs and their items
    const chefs = await User.find({ role: "chef" });
    const chefIds = chefs.map(c => c._id);
    await Item.deleteMany({ chefId: { $in: chefIds } });
    await User.deleteMany({ role: "chef" });
    
    console.log("Existing data cleared.");

    const password = await bcrypt.hash("password123", 10);

    // 2. Create 10 Premium Telugu Women Chefs
    const chefNames = [
      "Lakshmi Devi", "Surekha Garu", "Anitha Reddy", "Padmavathi Amma", "Saraswathi Aunty",
      "Rajeshwari Devi", "Bhagyalakshmi", "Satyavathi Garu", "Kanaka Durga", "Vijaya Lakshmi"
    ];

    const locations = [
      { loc: "Kukatpally, Hyderabad", coord: [17.4948, 78.3996] },
      { loc: "Gachibowli, Hyderabad", coord: [17.4401, 78.3489] },
      { loc: "Banjara Hills, Hyderabad", coord: [17.4126, 78.4483] },
      { loc: "Uppal, Hyderabad", coord: [17.3984, 78.5583] },
      { loc: "Miyapur, Hyderabad", coord: [17.4968, 78.3414] },
      { loc: "Manikonda, Hyderabad", coord: [17.3950, 78.3762] },
      { loc: "Jubilee Hills, Hyderabad", coord: [17.4284, 78.4115] },
      { loc: "Ameerpet, Hyderabad", coord: [17.4375, 78.4483] },
      { loc: "Dilsukhnagar, Hyderabad", coord: [17.3685, 78.5247] },
      { loc: "Secunderabad, Hyderabad", coord: [17.4399, 78.4983] }
    ];

    const chefsToInsert = chefNames.map((name, i) => ({
      name,
      email: `${name.toLowerCase().replace(/ /g, "")}@chef`,
      password,
      location: locations[i].loc,
      coordinates: locations[i].coord,
      phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
      address: `House No ${100 + i}, ${locations[i].loc}`,
      role: "chef",
      rating: 4.8,
      ratingCount: 150 + i * 20
    }));

    const createdChefs = await User.insertMany(chefsToInsert);
    console.log("10 Telugu women chefs added.");

    const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80";
    const dishes = [];

    // --- DAILY DISHES (120+ Mixed Veg/Non-Veg) ---
    const vegDaily = [
      "Gutti Vankaya Kura", "Bhendakaya Fry", "Aratikaya Vepudu", "Alu Gobi Masala", "Paneer Butter Masala", 
      "Mixed Veg Kurma", "Tomato Pappu", "Palakura Pappu", "Dosakaya Pappu", "Mullakkaya Pappu", 
      "Pappu Charu", "Miriyala Rasam", "Tomato Charu", "Gongura Paneer", "Mushroom Masala", 
      "Hyderabadi Veg Dum Biryani", "Paneer Pulav", "Methi Chaman", "Bagara Rice", "Coconut Rice", 
      "Lemon Rice", "Chintapandu Pulihora", "Nimmakaya Pulihora", "Curd Rice with Pomegranate", 
      "Idli with Sambar", "Masala Dosa", "Onion Rava Dosa", "Upma with Ginger Chutney", 
      "Pesarattu with Allam Pachadi", "Ven Pongal", "Vada with Chutney", "Poori with Alu Sabzi",
      "Kaju Paneer", "Capsicum Masala", "Chana Masala", "Bhendakaya Pulusu", "Aratikaya Fry",
      "Kakarakaya Vepudu", "Munakkaya Masala", "Dondakaya Fry", "Gorra Rice", "Jonna Rotte",
      "Mamidikaya Pappu", "Beerakaya Kura", "Anapakaya Pulusu", "Chintakaya Pachadi"
    ];

    const nonVegDaily = [
      "Hyderabadi Chicken Dum Biryani", "Mutton Keema Biryani", "Nellore Fish Pulusu", "Chicken Curry (Homestyle)", 
      "Mutton Fry", "Prawns Iguru", "Egg Masala", "Chicken 65 (Home-made)", "Natu Kodi Pulusu", 
      "Andhra Chicken Fry", "Fish Fry (Tawa)", "Egg Biryani", "Chicken Keema Curry", "Sorakaya Chicken",
      "Mutton Rogan Josh", "Butter Chicken (Andhra Style)", "Chicken Pulav", "Mutton Dalcha",
      "Chicken Keema Paratha", "Omelette with Pav", "Egg Fried Rice", "Chicken Fried Rice"
    ];

    for (let i = 0; i < 120; i++) {
      const isVeg = i % 3 !== 0; 
      const nameList = isVeg ? vegDaily : nonVegDaily;
      const name = nameList[i % nameList.length];
      const chef = createdChefs[i % createdChefs.length];
      
      dishes.push({
        name: `${name} (Traditional)`,
        description: `Fresh batch of ${name}. Prepared with secret homestyle spices.`,
        price: isVeg ? (160 + (i % 10) * 10) : (260 + (i % 10) * 15),
        type: "daily",
        isVeg: isVeg,
        imageUrl: defaultImage,
        serves: (i % 2) + 1,
        chefId: chef._id
      });
    }

    // --- READY DISHES (120+ Mixed Veg/Non-Veg) ---
    const vegReady = [
      "Andhra Avakaya Pickle", "Bellam Avakaya", "Maagaya", "Tomato Pachadi", "Gongura Nilava Pachadi", 
      "Allam Pachadi", "Pandu Mirapakaya Pachadi", "Usirikaya Pachadi", "Nimma Pachadi", "Kandi Podi", 
      "Karappodi", "Nuvvula Podi", "Janthikalu (Murukulu)", "Chekkalu", "Bellam Gavvalu", "Sakinalu", 
      "Ariselu", "Sunnundalu", "Bobbatlu", "Kobbari Lauzu", "Besan Laddu", "Badam Halwa"
    ];

    const nonVegReady = [
      "Special Chicken Pickle", "Boneless Mutton Pickle", "Prawns Pickle (Andhra Style)", "Fish Pickle", 
      "Egg Pickle", "Chicken Keema Podi"
    ];

    for (let i = 0; i < 120; i++) {
      const isVeg = i % 5 !== 0; 
      const nameList = isVeg ? vegReady : nonVegReady;
      const name = nameList[i % nameList.length];
      const chef = createdChefs[i % createdChefs.length];
      
      dishes.push({
        name: `${name} (Premium Export Quality)`,
        description: `Authentic ${name} with high shelf life and zero preservatives.`,
        price: isVeg ? (130 + (i % 15) * 20) : (460 + (i % 15) * 30),
        type: "ready",
        isVeg: isVeg,
        imageUrl: defaultImage,
        stock: 50 + (i % 50),
        chefId: chef._id
      });
    }

    // --- MAXIMUM SUBSCRIPTION PLANS (20 Plans with 4+ Categories) ---
    const subTemplates = [
      // VEG PLANS
      { 
        name: "Traditional Andhra Veg Bhojanam", price: 6500, duration: "30 Days", isVeg: true,
        desc: "A complete daily lunch spread with authentic Andhra flavors.",
        meals: [{
          categories: [
            { name: "Main Grains", options: ["Steamed Rice", "Brown Rice", "Bagara Rice"] },
            { name: "Pappu/Dal", options: ["Tomato Pappu", "Dosakaya Pappu", "Palakura Pappu"] },
            { name: "Daily Curry", options: ["Gutti Vankaya", "Alu Kurma", "Paneer Masala"] },
            { name: "Fry/Sides", options: ["Bhendakaya Fry", "Dondakaya Vepudu", "Aratikaya Fry"] },
            { name: "Accompaniments", options: ["Curd", "Miriyala Rasam", "Avakaya Pickle", "Papad"] }
          ]
        }]
      },
      { 
        name: "Healthy Breakfast Subscription", price: 1800, duration: "10 Days", isVeg: true,
        desc: "Start your day with high-protein traditional tiffins.",
        meals: [{
          categories: [
            { name: "Morning Special", options: ["Idli & Sambar", "Masala Dosa", "Pesarattu Upma", "Ven Pongal"] },
            { name: "Signature Chutney", options: ["Coconut Chutney", "Allam Pachadi", "Tomato Chutney"] },
            { name: "Drink", options: ["Filter Coffee", "Badam Milk", "Ragi Malt"] },
            { name: "Extra", options: ["Vada", "Mysore Bonda", "Punugulu"] }
          ]
        }]
      },
      // NON-VEG PLANS
      { 
        name: "Royal Non-Veg Monthly Thali", price: 8500, duration: "30 Days", isVeg: false,
        desc: "Premium daily lunch with a rotating Non-Veg special (Chicken/Mutton/Fish).",
        meals: [{
          categories: [
            { name: "Non-Veg Special", options: ["Chicken Curry", "Mutton Pulusu", "Fish Iguru", "Egg Masala"] },
            { name: "Grains", options: ["Sona Masuri Rice", "Jeera Rice", "Ragi Sankati"] },
            { name: "Veg Component", options: ["Tomato Pappu", "Mixed Veg Fry"] },
            { name: "Sides", options: ["Rasam", "Curd", "Andhra Pickle"] },
            { name: "Treat", options: ["Sweet of the Day", "Appadam"] }
          ]
        }]
      },
      { 
        name: "Sunday Biryani & Kebab Feast", price: 3200, duration: "4 Sundays", isVeg: false,
        desc: "The ultimate weekend treat delivered every Sunday afternoon.",
        meals: [{
          categories: [
            { name: "Biryani Variety", options: ["Hyderabadi Chicken Dum", "Special Mutton Biryani", "Egg Biryani"] },
            { name: "Starter", options: ["Chicken 65", "Chicken Roast", "Egg Bonda"] },
            { name: "Accompaniment", options: ["Mirchi Ka Salan", "Onion Raitha"] },
            { name: "Dessert", options: ["Double Ka Meetha", "Qubani Ka Meetha"] }
          ]
        }]
      },
      { 
        name: "Protein-Rich Non-Veg Breakfast", price: 2800, duration: "15 Days", isVeg: false,
        desc: "Daily breakfast featuring high-protein non-veg traditional items.",
        meals: [{
          categories: [
            { name: "Main Item", options: ["Chicken Keema Paratha", "Egg Dosa", "Omelette Sandwich"] },
            { name: "Protein Side", options: ["Boiled Eggs (2)", "Chicken Keema Bowl"] },
            { name: "Beverage", options: ["Fresh Fruit Juice", "Milk"] },
            { name: "Digestive", options: ["Green Tea", "Lemon Water"] }
          ]
        }]
      }
    ];

    createdChefs.forEach((chef, i) => {
      // Each chef gets 2 unique plans from the detailed templates
      const template1 = subTemplates[i % subTemplates.length];
      const template2 = subTemplates[(i + 1) % subTemplates.length];
      
      [template1, template2].forEach(template => {
        dishes.push({
          name: `${template.name} by ${chef.name}`,
          description: template.desc,
          price: template.price,
          duration: template.duration,
          type: "subscription",
          isVeg: template.isVeg,
          imageUrl: defaultImage,
          meals: template.meals,
          chefId: chef._id
        });
      });
    });

    console.log(`Inserting ${dishes.length} total menu items...`);
    await Item.insertMany(dishes);
    
    console.log("Database seeded successfully with maximum variety and detailed categories.");

    process.exit();
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
};

seedData();

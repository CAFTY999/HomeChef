const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Item = require("./models/Dish");

const mongoURI = "mongodb://127.0.0.1:27017/homechef";

const seedData = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB for high-quality seeding...");

    // 1. Clear existing chefs and their items
    const chefs = await User.find({ role: "chef" });
    const chefIds = chefs.map(c => c._id);
    await Item.deleteMany({ chefId: { $in: chefIds } });
    await User.deleteMany({ role: "chef" });
    
    console.log("Existing data cleared.");

    const password = await bcrypt.hash("password123", 10);

    // 2. Create 10 Premium Telugu Women Chefs with Bios and Specialities
    const chefProfiles = [
      { 
        name: "Lakshmi Devi", 
        speciality: "Godavari Pickle Expert", 
        bio: "Lakshmi has been making traditional Andhra pickles for over 25 years. Her secret lies in the hand-ground spices and sun-dried chillies from her family farm." 
      },
      { 
        name: "Surekha Garu", 
        speciality: "Hyderabadi Biryani Specialist", 
        bio: "Surekha is famous in Gachibowli for her slow-cooked Dum Biryani. She believes that the perfect biryani needs patience and the right 'Dum'." 
      },
      { 
        name: "Anitha Reddy", 
        speciality: "Traditional Tiffin Queen", 
        bio: "Anitha brings the taste of Rayalaseema to your doorstep. Her Pesarattu and Allam Pachadi are a morning favorite for many families." 
      },
      { 
        name: "Padmavathi Amma", 
        speciality: "Homestyle Curry Master", 
        bio: "Padmavathi's recipes have been passed down through generations. She specializes in 'Gutti Vankaya' and various traditional vegetable fries." 
      },
      { 
        name: "Saraswathi Aunty", 
        speciality: "Healthy Millet Expert", 
        bio: "Saraswathi focuses on ancient grains. She makes delicious and healthy meals using Jonna, Ragi, and Korra to keep you fit." 
      },
      { 
        name: "Rajeshwari Devi", 
        speciality: "Andhra Sweets Connoisseur", 
        bio: "Rajeshwari is a master of 'Putharekulu' and 'Ariselu'. Her sweets are made with pure cow ghee and the finest jaggery." 
      },
      { 
        name: "Bhagyalakshmi", 
        speciality: "Spicy Snack Maker", 
        bio: "Known for her 'Murukulu' and 'Chekkalu', Bhagyalakshmi ensures every snack is perfectly crunchy and authentically spiced." 
      },
      { 
        name: "Satyavathi Garu", 
        speciality: "Brahmin Style Satvik Cook", 
        bio: "Satyavathi prepares pure Satvik meals without onion and garlic, focusing on the natural flavors of vegetables and lentils." 
      },
      { 
        name: "Kanaka Durga", 
        speciality: "Spice Powder Alchemist", 
        bio: "Kanaka's 'Kandi Podi' and 'Karappodi' are staples in many homes. She roasts each spice individually to bring out the maximum aroma." 
      },
      { 
        name: "Vijaya Lakshmi", 
        speciality: "Full Meal Thali Specialist", 
        bio: "Vijaya specializes in providing a complete, balanced South Indian meal that feels exactly like what you would eat at home." 
      }
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

    const chefsToInsert = chefProfiles.map((profile, i) => ({
      ...profile,
      email: `${profile.name.toLowerCase().replace(/ /g, "")}@chef`,
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
    console.log("10 Telugu women chefs with stories added.");

    const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80";
    const dishes = [];

    // --- DAILY DISHES (120+ Mixed Veg/Non-Veg) ---
    const vegDaily = ["Gutti Vankaya Kura", "Bhendakaya Fry", "Aratikaya Vepudu", "Alu Gobi Masala", "Paneer Butter Masala", "Mixed Veg Kurma", "Tomato Pappu", "Palakura Pappu", "Dosakaya Pappu", "Pappu Charu", "Miriyala Rasam", "Tomato Charu", "Gongura Paneer", "Mushroom Masala", "Veg Dum Biryani", "Paneer Pulav", "Bagara Rice", "Lemon Rice", "Idli Sambar", "Dosa", "Upma", "Pesarattu"];
    const nonVegDaily = ["Chicken Dum Biryani", "Mutton Keema Biryani", "Fish Pulusu", "Chicken Curry", "Mutton Fry", "Prawns Iguru", "Egg Masala", "Chicken 65", "Natu Kodi Pulusu", "Andhra Chicken Fry"];

    for (let i = 0; i < 120; i++) {
      const isVeg = i % 3 !== 0; 
      const nameList = isVeg ? vegDaily : nonVegDaily;
      const name = nameList[i % nameList.length];
      const chef = createdChefs[i % createdChefs.length];
      dishes.push({
        name: `${name} (Traditional)`,
        description: `Authentic ${name} made with fresh ingredients.`,
        price: isVeg ? 180 : 280,
        type: "daily",
        isVeg,
        imageUrl: defaultImage,
        serves: 1,
        chefId: chef._id
      });
    }

    // --- READY DISHES (120+ Mixed Veg/Non-Veg) ---
    const vegReady = ["Andhra Avakaya Pickle", "Bellam Avakaya", "Tomato Pachadi", "Gongura Pachadi", "Allam Pachadi", "Usirikaya Pachadi", "Kandi Podi", "Karappodi", "Murukulu", "Chekkalu", "Ariselu", "Sunnundalu"];
    const nonVegReady = ["Chicken Pickle", "Mutton Pickle", "Prawns Pickle", "Fish Pickle"];

    for (let i = 0; i < 120; i++) {
      const isVeg = i % 5 !== 0; 
      const nameList = isVeg ? vegReady : nonVegReady;
      const name = nameList[i % nameList.length];
      const chef = createdChefs[i % createdChefs.length];
      dishes.push({
        name: `${name} (Premium)`,
        description: `High shelf life ${name} with authentic home-made taste.`,
        price: isVeg ? 150 : 500,
        type: "ready",
        isVeg,
        imageUrl: defaultImage,
        stock: 100,
        chefId: chef._id
      });
    }

    // --- SUBSCRIPTION PLANS ---
    const subTemplates = [
      { 
        name: "Traditional Andhra Veg Bhojanam", price: 6500, duration: "30 Days", isVeg: true,
        desc: "A complete daily lunch spread.",
        meals: [{
          categories: [
            { name: "Rice", options: ["Steamed", "Bagara"] },
            { name: "Pappu", options: ["Tomato", "Spinach"] },
            { name: "Curry", options: ["Vankaya", "Paneer"] },
            { name: "Sides", options: ["Pickle", "Rasam", "Papad"] }
          ]
        }]
      },
      { 
        name: "Healthy Breakfast Subscription", price: 1800, duration: "10 Days", isVeg: true,
        desc: "Fresh traditional tiffins.",
        meals: [{
          categories: [
            { name: "Tiffin", options: ["Idli", "Dosa", "Upma"] },
            { name: "Chutney", options: ["Coconut", "Ginger"] }
          ]
        }]
      },
      { 
        name: "Royal Non-Veg Monthly Thali", price: 8500, duration: "30 Days", isVeg: false,
        desc: "Premium daily lunch with Non-Veg specials.",
        meals: [{
          categories: [
            { name: "Special", options: ["Chicken", "Mutton", "Fish"] },
            { name: "Rice", options: ["Steamed", "Bagara"] },
            { name: "Veg", options: ["Dal", "Fry"] },
            { name: "Extra", options: ["Curd", "Sweet"] }
          ]
        }]
      }
    ];

    createdChefs.forEach((chef, i) => {
      const template = subTemplates[i % subTemplates.length];
      dishes.push({
        name: `${template.name} - ${chef.name}`,
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

    console.log(`Inserting ${dishes.length} items...`);
    await Item.insertMany(dishes);
    
    console.log("Database seeded successfully with chef stories.");

    process.exit();
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
};

seedData();

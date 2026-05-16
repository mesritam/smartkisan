const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const farmers = new Map([
  ["9999999999", {
    name: "Demo Farmer",
    phone: "9999999999",
    state: "Punjab",
    crop: "Wheat",
    password: "farmer123"
  }]
]);

const weatherByCity = {
  Ludhiana: {
    city: "Ludhiana",
    temperature: 28,
    humidity: 64,
    wind: 11,
    rainChance: 18,
    risk: "Low",
    summary: "Clear morning with mild afternoon heat. Good window for irrigation checks and field scouting.",
    forecast: [
      { day: "Today", temp: 28, note: "Good for fertilizer planning." },
      { day: "Tomorrow", temp: 30, note: "Irrigate early morning if needed." },
      { day: "Day 3", temp: 27, note: "Light cloud cover expected." }
    ]
  },
  Karnal: {
    city: "Karnal",
    temperature: 29,
    humidity: 58,
    wind: 13,
    rainChance: 12,
    risk: "Low",
    summary: "Dry and stable weather. Suitable for harvesting and transport.",
    forecast: [
      { day: "Today", temp: 29, note: "Harvest window is favorable." },
      { day: "Tomorrow", temp: 31, note: "Avoid spraying at peak heat." },
      { day: "Day 3", temp: 30, note: "Monitor soil moisture." }
    ]
  },
  Nashik: {
    city: "Nashik",
    temperature: 26,
    humidity: 70,
    wind: 9,
    rainChance: 38,
    risk: "Medium",
    summary: "Moist air may increase disease pressure in vegetables and grapes.",
    forecast: [
      { day: "Today", temp: 26, note: "Scout for fungal symptoms." },
      { day: "Tomorrow", temp: 25, note: "Delay pesticide spray if rain builds." },
      { day: "Day 3", temp: 27, note: "Plan drainage checks." }
    ]
  },
  Mysuru: {
    city: "Mysuru",
    temperature: 25,
    humidity: 76,
    wind: 8,
    rainChance: 48,
    risk: "Medium",
    summary: "Cloudy intervals and possible evening showers. Keep seedlings protected.",
    forecast: [
      { day: "Today", temp: 25, note: "Cover nursery beds if needed." },
      { day: "Tomorrow", temp: 26, note: "Watch for water logging." },
      { day: "Day 3", temp: 27, note: "Good for transplanting after rain." }
    ]
  },
  Lucknow: {
    city: "Lucknow",
    temperature: 31,
    humidity: 55,
    wind: 12,
    rainChance: 20,
    risk: "Moderate",
    summary: "Warm afternoon with manageable wind. Spray only during calmer hours.",
    forecast: [
      { day: "Today", temp: 31, note: "Spray before 10 AM." },
      { day: "Tomorrow", temp: 33, note: "Heat stress possible." },
      { day: "Day 3", temp: 32, note: "Mulching can reduce moisture loss." }
    ]
  }
};

const prices = [
  { crop: "Wheat", market: "Ludhiana Mandi", price: 2420, trend: "Up", demand: "High", category: "cereal" },
  { crop: "Rice", market: "Karnal Mandi", price: 2180, trend: "Flat", demand: "Medium", category: "cereal" },
  { crop: "Maize", market: "Lucknow Mandi", price: 2090, trend: "Up", demand: "High", category: "cereal" },
  { crop: "Cotton", market: "Nagpur Mandi", price: 7050, trend: "Down", demand: "Medium", category: "cash" },
  { crop: "Soybean", market: "Indore Mandi", price: 4625, trend: "Up", demand: "High", category: "cash" },
  { crop: "Gram", market: "Jaipur Mandi", price: 5750, trend: "Flat", demand: "Medium", category: "pulse" },
  { crop: "Tur Dal", market: "Gulbarga Mandi", price: 9200, trend: "Up", demand: "High", category: "pulse" },
  { crop: "Tomato", market: "Nashik Mandi", price: 1650, trend: "Down", demand: "Medium", category: "vegetable" },
  { crop: "Onion", market: "Lasalgaon Mandi", price: 1850, trend: "Up", demand: "High", category: "vegetable" }
].map((item) => ({
  ...item,
  trendClass: item.trend === "Up" ? "trend-up" : item.trend === "Down" ? "trend-down" : "trend-flat",
  demandClass: item.demand === "High" ? "demand-high" : "demand-medium"
}));

const schemes = [
  {
    name: "PM-KISAN",
    category: "Income support",
    description: "Direct income support for eligible farmer families through linked bank accounts.",
    link: "https://pmkisan.gov.in/"
  },
  {
    name: "Pradhan Mantri Fasal Bima Yojana",
    category: "Crop insurance",
    description: "Insurance support against notified crop losses due to natural risks and weather events.",
    link: "https://pmfby.gov.in/"
  },
  {
    name: "Soil Health Card",
    category: "Soil testing",
    description: "Soil nutrient status and recommendations for balanced fertilizer use.",
    link: "https://soilhealth.dac.gov.in/"
  },
  {
    name: "PM Krishi Sinchayee Yojana",
    category: "Irrigation",
    description: "Support for efficient irrigation, water conservation, and micro-irrigation systems.",
    link: "https://pmksy.gov.in/"
  },
  {
    name: "e-NAM",
    category: "Market access",
    description: "Online agriculture marketplace connecting mandis for better price discovery.",
    link: "https://www.enam.gov.in/"
  },
  {
    name: "Kisan Credit Card",
    category: "Farm credit",
    description: "Short-term credit support for crop cultivation, allied activities, and farm inputs.",
    link: "https://www.myscheme.gov.in/"
  }
];

function publicFarmer(farmer) {
  return {
    name: farmer.name,
    phone: farmer.phone,
    state: farmer.state,
    crop: farmer.crop
  };
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => !String(body[field] || "").trim());
  return missing;
}

function buildRecommendations({ season, soilType, irrigation, rainfall }) {
  const rain = Number(rainfall) || 0;
  const catalog = [
    {
      crop: "Wheat",
      seasons: ["rabi"],
      soils: ["alluvial", "loamy"],
      minRain: 250,
      maxRain: 900,
      water: ["medium", "good"],
      action: "Prepare seed treatment and keep one irrigation ready at crown root initiation."
    },
    {
      crop: "Rice",
      seasons: ["kharif"],
      soils: ["alluvial", "loamy"],
      minRain: 800,
      maxRain: 1800,
      water: ["good"],
      action: "Use nursery planning, puddling, and drainage checks before transplanting."
    },
    {
      crop: "Cotton",
      seasons: ["kharif"],
      soils: ["black", "loamy"],
      minRain: 500,
      maxRain: 1100,
      water: ["medium", "good"],
      action: "Maintain wider spacing and monitor early sucking pests."
    },
    {
      crop: "Soybean",
      seasons: ["kharif"],
      soils: ["black", "red", "loamy"],
      minRain: 600,
      maxRain: 1200,
      water: ["medium", "good"],
      action: "Use raised beds where drainage is weak and inoculate seed with rhizobium."
    },
    {
      crop: "Gram",
      seasons: ["rabi"],
      soils: ["black", "red", "sandy", "loamy"],
      minRain: 200,
      maxRain: 650,
      water: ["low", "medium"],
      action: "Avoid water logging and apply starter phosphorus after soil testing."
    },
    {
      crop: "Groundnut",
      seasons: ["kharif", "zaid"],
      soils: ["sandy", "red", "loamy"],
      minRain: 450,
      maxRain: 1000,
      water: ["medium", "good"],
      action: "Choose well-drained soil and apply gypsum near pegging stage."
    },
    {
      crop: "Moong",
      seasons: ["zaid", "kharif"],
      soils: ["sandy", "loamy", "alluvial"],
      minRain: 250,
      maxRain: 700,
      water: ["low", "medium"],
      action: "Use short-duration varieties and avoid heavy nitrogen application."
    },
    {
      crop: "Tomato",
      seasons: ["rabi", "zaid"],
      soils: ["loamy", "red", "alluvial"],
      minRain: 400,
      maxRain: 900,
      water: ["medium", "good"],
      action: "Install staking early and keep drip irrigation consistent."
    }
  ];

  return catalog
    .map((item) => {
      let score = 35;
      if (item.seasons.includes(season)) score += 24;
      if (item.soils.includes(soilType)) score += 18;
      if (item.water.includes(irrigation)) score += 12;
      if (rain >= item.minRain && rain <= item.maxRain) score += 11;
      if (rain < item.minRain) score -= 8;
      if (rain > item.maxRain) score -= 7;

      const fit = Math.max(42, Math.min(96, score));
      return {
        crop: item.crop,
        fit,
        reason: `${item.crop} fits ${season.toUpperCase()} planning with ${soilType} soil, ${irrigation} irrigation, and ${rain} mm expected rainfall.`,
        action: item.action
      };
    })
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 3);
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (req, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "SmartKisan" });
});

app.post("/api/auth/signup", (req, res) => {
  const missing = requireFields(req.body, ["name", "phone", "state", "crop", "password"]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
  }

  const phone = String(req.body.phone).trim();
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: "Phone number must be 10 digits." });
  }

  if (String(req.body.password).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  if (farmers.has(phone)) {
    return res.status(409).json({ message: "An account with this phone number already exists." });
  }

  const farmer = {
    name: String(req.body.name).trim(),
    phone,
    state: String(req.body.state).trim(),
    crop: String(req.body.crop).trim(),
    password: String(req.body.password)
  };

  farmers.set(phone, farmer);
  res.status(201).json({ message: "Signup successful.", user: publicFarmer(farmer) });
});

app.post("/api/auth/login", (req, res) => {
  const missing = requireFields(req.body, ["phone", "password"]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
  }

  const phone = String(req.body.phone).trim();
  const farmer = farmers.get(phone);

  if (!farmer || farmer.password !== String(req.body.password)) {
    return res.status(401).json({ message: "Invalid phone number or password." });
  }

  res.json({ message: "Login successful.", user: publicFarmer(farmer) });
});

app.get("/api/weather", (req, res) => {
  const city = String(req.query.city || "Ludhiana");
  const weather = weatherByCity[city] || weatherByCity.Ludhiana;
  res.json({ weather });
});

app.get("/api/prices", (req, res) => {
  res.json({ prices });
});

app.post("/api/crop-suggestions", (req, res) => {
  const missing = requireFields(req.body, ["state", "season", "soilType", "irrigation", "rainfall"]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
  }

  res.json({
    state: req.body.state,
    recommendations: buildRecommendations(req.body)
  });
});

app.get("/api/schemes", (req, res) => {
  res.json({ schemes });
});

app.post("/api/contact", (req, res) => {
  const missing = requireFields(req.body, ["name", "phone", "topic", "message"]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
  }

  res.status(201).json({
    message: "Thanks. Your message has been received by SmartKisan support."
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.listen(PORT, () => {
  console.log(`SmartKisan server running at http://localhost:${PORT}`);
});

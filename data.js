const movieDatabase = [
    {
        id: 1,
        title: "Dasani",
        year: 1999,
        rating: null,
        reviews: [],
        runtime: "24 years",
        genre: ["Pure", "Refreshing", "Accessible"],
        description: "Purified municipal source water that is filtered, purified, and mineralized; typically described as clean with a neutral taste and consistent quality across batches.",
        director: "The Coca-Cola Company",
        poster: "/dasani-water-quality-report-highlight.webp",
        cast: [
            { name: "Spring Water", role: "Lead", avatar: "/dasani-water-quality-report-highlight.webp" },
            { name: "Purification", role: "Supporting", avatar: "/dasani-water-quality-report-highlight.webp" }
        ],
        source: "Municipal sources (purified)",
        tagline: "Life Happens Between Sips"
    },
    {
        id: 2,
        title: "Fiji",
        year: 1996,
        rating: null,
        reviews: [],
        runtime: "28 years",
        genre: ["Artesian", "Premium", "Tropical"],
        description: "Artesian groundwater from a specific aquifer in Fiji; naturally occurring minerals give it a slightly soft mouthfeel and subtle mineral notes.",
        director: "Fiji Water Company",
        poster: "/Fiji_Water.jpg",
        cast: [
            { name: "Artesian Spring", role: "Lead", avatar: "/Fiji_Water.jpg" },
            { name: "Tropical Essence", role: "Supporting", avatar: "/Fiji_Water.jpg" }
        ],
        source: "Artesian aquifer in Viti Levu, Fiji",
        tagline: "Earth's Finest Water"
    },
    {
        id: 3,
        title: "Evian",
        year: 1829,
        rating: null,
        reviews: [],
        runtime: "132 years",
        genre: ["Alpine", "Pure", "Natural"],
        description: "Spring water collected from sources in the French Alps; naturally filtered through mineral-rich soils, offering a balanced mineral profile and soft texture.",
        director: "Danone",
        poster: "/evian-2310307_1280-1505317077217-1505317079619.webp",
        cast: [
            { name: "Glacial Water", role: "Lead", avatar: "/evian-2310307_1280-1505317077217-1505317079619.webp" },
            { name: "Alpine Minerals", role: "Supporting", avatar: "/evian-2310307_1280-1505317077217-1505317079619.webp" }
        ],
        source: "French Alps spring sources",
        tagline: "Live Young"
    },
    {
        id: 4,
        title: "Aquafina",
        year: 1994,
        rating: null,
        reviews: [],
        runtime: "30 years",
        genre: ["Purified", "Pure Taste", "Hydration"],
        description: "Purified municipal source water processed through a multi-step filtration and purification system (HydRO-7); characterized by a neutral flavor and low mineral content.",
        director: "PepsiCo",
        poster: "/Aquafina_bottle.png",
        cast: [
            { name: "Purified Essence", role: "Lead", avatar: "/Aquafina_bottle.png" },
            { name: "Filtration Process", role: "Supporting", avatar: "/Aquafina_bottle.png" }
        ],
        source: "Municipal sources (multi-step purification)",
        tagline: "Pure Water, Perfect Taste"
    },
    {
        id: 5,
        title: "Perrier",
        year: 1898,
        rating: null,
        reviews: [],
        runtime: "161 years",
        genre: ["Sparkling", "Mineral", "Iconic"],
        description: "Naturally carbonated mineral water from a spring in Vergèze, France; notable for pronounced carbonation and a mineral composition that contributes a lively, slightly tangy taste.",
        director: "Nestlé",
        poster: "/Top_banner_1_32_.png",
        cast: [
            { name: "Mineral Spring", role: "Lead", avatar: "/Top_banner_1_32_.png" },
            { name: "Natural Carbonation", role: "Supporting", avatar: "/Top_banner_1_32_.png" }
        ],
        source: "Vergèze spring, France (naturally carbonated)",
        tagline: "Feel the Flavor"
    },
    {
        id: 6,
        title: "San Pellegrino",
        year: 1899,
        rating: null,
        reviews: [],
        runtime: "125 years",
        genre: ["Sparkling", "Italian", "Premium"],
        description: "Sparkling mineral water sourced from Italian springs; fine natural carbonation and a mineral profile that provides a slightly saline, rounded mouthfeel.",
        director: "Nestlé",
        poster: "/BPP-0441.avif",
        cast: [
            { name: "Alpine Water", role: "Lead", avatar: "/BPP-0441.avif" },
            { name: "Italian Heritage", role: "Supporting", avatar: "/BPP-0441.avif" }
        ],
        source: "Italian spring sources (San Pellegrino Terme)",
        tagline: "Bring your best"
    },
    {
        id: 7,
        title: "Voss",
        year: 2001,
        rating: null,
        reviews: [],
        runtime: "25 years",
        genre: ["Scandinavian", "Pure", "Minimalist"],
        description: "Bottled water from a Norwegian aquifer; processed to be low in dissolved minerals and presented with a clean, neutral taste and minimal mineral aftertaste.",
        director: "VOSS Water",
        poster: "/Voss_water.JPG",
        cast: [
            { name: "Norwegian Spring", role: "Lead", avatar: "/Voss_water.JPG" },
            { name: "Glacial Purity", role: "Supporting", avatar: "/Voss_water.JPG" }
        ],
        source: "Norwegian aquifer (bottled for low mineral content)",
        tagline: "Live Every Drop."
    },
    {
        id: 8,
        title: "Glaceau Smartwater",
        year: 1996,
        rating: null,
        reviews: [],
        runtime: "22 years",
        genre: ["Purified", "Electrolytes", "Active"],
        description: "Vapor-distilled purified water with added electrolytes; produces a crisp, light mouthfeel with slightly enhanced taste from added minerals.",
        director: "The Coca-Cola Company",
        poster: "/IMG_1723.webp",
        cast: [
            { name: "Purified Water", role: "Lead", avatar: "/IMG_1723.webp" },
            { name: "Electrolyte Balance", role: "Supporting", avatar: "/IMG_1723.webp" }
        ],
        source: "Vapor-distilled municipal sources with added electrolytes",
        tagline: "Smart hydration for a smart you"
    },
    {
        id: 9,
        title: "Nestlé Pure Life",
        year: 1998,
        rating: null,
        reviews: [],
        runtime: "27 years",
        genre: ["Purified", "Accessible", "Global"],
        description: "Purified bottled water produced and distributed globally by Nestlé Waters and by BlueTriton Brands in North America; typically purified municipal sources that are filtered and mineralized for consistent taste.",
        director: "Produced by Nestlé Waters (Globally); BlueTriton Brands (North America)",
        poster: "/5e265173746363.5c13670cd735d-1200x970.jpg",
        cast: [
            { name: "Purified Source", role: "Lead", avatar: "/5e265173746363.5c13670cd735d-1200x970.jpg" }
        ],
        source: "Purified municipal sources (varies by region)",
        tagline: "Pure Life Begins Now™"
    },
    {
        id: 10,
        title: "Saratoga",
        year: 1872,
        rating: null,
        reviews: [],
        runtime: "153 years",
        genre: ["Spring", "Premium", "Heritage"],
        description: "Natural spring water historically sourced from Saratoga Springs (NY) and nearby northeastern spring sources; known for a classic premium bottled-water presentation and balanced mineral profile.",
        director: "BlueTriton Brands",
        poster: "/saratoga-hero-2025.jpg",
        cast: [
            { name: "Northeast Springs", role: "Lead", avatar: "/saratoga-hero-2025.jpg" }
        ],
        source: "Natural springs in the Northeast (Saratoga Springs, NY and northwestern Vermont depending on product)",
        tagline: "The Art of Water"
    },
    {
        id: 11,
        title: "Essentia",
        year: 1998,
        rating: null,
        reviews: [],
        runtime: "27 years",
        genre: ["Ionized", "Purified", "Alkaline"],
        description: "Ionized alkaline water processed to a higher pH with added electrolytes for a smooth mouthfeel; marketed as high-performance hydration.",
        director: "Nestlé USA",
        poster: "/images (2).jpg",
        cast: [
            { name: "Ionized Process", role: "Lead", avatar: "/images (2).jpg" },
            { name: "Electrolyte Balance", role: "Supporting", avatar: "/images (2).jpg" }
        ],
        source: "Purified/processed sources (bottling depends on region)",
        tagline: "Overachieving H2O"
    },
    {
        id: 12,
        title: "Poland Spring",
        year: 1870,
        rating: null,
        reviews: [],
        runtime: "155 years",
        genre: ["Spring", "Heritage", "Natural"],
        description: "Bottled spring water sourced from natural springs in Maine; known for a classic, clean taste and longstanding regional heritage.",
        director: "BlueTriton Brands",
        poster: "/I77EHALGRS2A2OKS4LXVD7F7.webp",
        cast: [
            { name: "Maine Spring", role: "Lead", avatar: "/I77EHALGRS2A2OKS4LXVD7F7.webp" }
        ],
        source: "Natural spring sources in Maine, USA",
        tagline: "Born Better"
    },
    {
        id: 13,
        title: "Deer Park Spring Water",
        year: 1873,
        rating: null,
        reviews: [],
        runtime: "152 years",
        genre: ["Spring", "Heritage", "Natural"],
        description: "Bottled spring water with a clean, classic taste; long-standing regional heritage and widely distributed in the U.S.",
        director: "BlueTriton Brands",
        poster: "/IMG_1733.jpeg",
        cast: [
            { name: "Maine Spring", role: "Lead", avatar: "/IMG_1733.jpeg" }
        ],
        source: "Natural spring sources (regional US springs)",
        tagline: "That's Good Water!"
    }
];
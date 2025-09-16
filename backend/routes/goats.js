const express = require("express");
const router = express.Router();
const Goat = require("../models/Goat");
const { body, validationResult } = require("express-validator");

// Get all available goat breeds
router.get('/breeds', async (req, res) => {
  try {
    console.log('Fetching goat breeds from schema...');
    
    // Get the enum values from the schema
    const breedPath = Goat.schema.path('breed');
    if (!breedPath || !breedPath.enumValues) {
      console.error('Breed enum values not found in schema');
      return res.status(500).json({ 
        success: false,
        message: 'Breed enum values not found in schema',
        schema: Goat.schema.obj.breed // Include the breed schema for debugging
      });
    }
    
    const breeds = breedPath.enumValues;
    console.log('Available breeds:', breeds);
    
    if (!breeds || breeds.length === 0) {
      console.warn('No breeds found in schema');
      // Return a default set of breeds if none found in schema
      const defaultBreeds = [
        'Boer', 'Nubian', 'Alpine', 'Saanen', 'Toggenburg', 'LaMancha',
        'Jamunapari', 'Sirohi', 'Barbari', 'Osmanabadi', 'Malabari', 'Surti',
        'Jakhrana', 'Marwari', 'Mixed', 'Other'
      ];
      return res.json(defaultBreeds);
    }
    
    res.json(breeds);
  } catch (error) {
    console.error('Error in /breeds endpoint:', {
      message: error.message,
      stack: error.stack,
      schema: Goat.schema.obj.breed
    });
    
    // Return a default set of breeds in case of error
    const defaultBreeds = [
      'Boer', 'Nubian', 'Alpine', 'Saanen', 'Toggenburg', 'LaMancha',
      'Jamunapari', 'Sirohi', 'Barbari', 'Osmanabadi', 'Malabari', 'Surti',
      'Jakhrana', 'Marwari', 'Mixed', 'Other'
    ];
    
    res.status(500).json({
      success: false,
      message: 'Error fetching goat breeds',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      defaultBreeds: defaultBreeds
    });
  }
});

// Get all goats with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      breed,
      gender,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (breed) filter.breed = breed;
    if (gender) filter.gender = gender;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { tagNumber: { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const goats = await Goat.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("breeding.sire", "name tagNumber breed")
      .populate("breeding.offspring", "name tagNumber breed");

    const total = await Goat.countDocuments(filter);

    res.json({
      goats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single goat by ID
router.get("/:id", async (req, res) => {
  try {
    const goat = await Goat.findById(req.params.id)
      .populate("breeding.sire", "name tagNumber breed")
      .populate("breeding.offspring", "name tagNumber breed");

    if (!goat) {
      return res.status(404).json({ message: "Goat not found" });
    }

    res.json(goat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new goat
router.post(
  "/",
  [
    body("tagNumber").notEmpty().withMessage("Tag number is required"),
    body("name").notEmpty().withMessage("Name is required"),
    body("breed")
      .isIn([
        "Boer",
        "Nubian",
        "Alpine",
        "Saanen",
        "Toggenburg",
        "LaMancha",
        "Jamunapari",
        "Sirohi",
        "Barbari",
        "Osmanabadi",
        "Malabari",
        "Surti",
        "Jakhrana",
        "Marwari",
        "Mixed",
        "Other",
      ])
      .withMessage("Invalid breed"),
    body("gender")
      .isIn(["Male", "Female", "female", "male"])
      .withMessage("Invalid gender"),
    body("dateOfBirth")
      .isISO8601()
      .withMessage("Valid date of birth is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if tag number already exists
      const existingGoat = await Goat.findOne({
        tagNumber: req.body.tagNumber,
      });
      if (existingGoat) {
        return res.status(400).json({ message: "Tag number already exists" });
      }

      const goat = new Goat(req.body);
      const savedGoat = await goat.save();
      res.status(201).json(savedGoat);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update goat
router.put("/:id", async (req, res) => {
  try {
    const goat = await Goat.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!goat) {
      return res.status(404).json({ message: "Goat not found" });
    }

    res.json(goat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete goat
router.delete("/:id", async (req, res) => {
  try {
    const goat = await Goat.findByIdAndDelete(req.params.id);

    if (!goat) {
      return res.status(404).json({ message: "Goat not found" });
    }

    res.json({ message: "Goat deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get goat statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const stats = await Goat.aggregate([
      {
        $group: {
          _id: null,
          totalGoats: { $sum: 1 },
          activeGoats: {
            $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
          },
          maleGoats: { $sum: { $cond: [{ $eq: ["$gender", "Male"] }, 1, 0] } },
          femaleGoats: {
            $sum: { $cond: [{ $eq: ["$gender", "Female"] }, 1, 0] },
          },
          pregnantGoats: { $sum: { $cond: ["$breeding.isPregnant", 1, 0] } },
        },
      },
    ]);

    const breedStats = await Goat.aggregate([
      { $group: { _id: "$breed", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      overview: stats[0] || {},
      breedDistribution: breedStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

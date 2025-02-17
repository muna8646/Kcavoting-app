require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const session = require("express-session"); // Import express-session
const multer = require("multer");
const path = require("path");

const app = express();

// Configure session middleware
app.use(
  session({
    secret: "your-secret-key", // Replace with a strong, random key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set to true if using https in production
  })
);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Muna21/06058#",
  database: "voting_app",
};

// Create a database connection pool
const pool = mysql.createPool(dbConfig);

// Test the database connection
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL Database");
    connection.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
}

testDbConnection();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// --- API Endpoints ---

// Register Voter
app.post("/register-voter", async (req, res) => {
  const { name, registrationNumber, nationalId } = req.body;

  // Validate input
  if (!name || !registrationNumber || !nationalId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const query =
      "INSERT INTO voters (name, registration_number, national_id) VALUES (?, ?, ?)";
    const [result] = await pool.execute(query, [
      name,
      registrationNumber,
      nationalId,
    ]);
    res
      .status(201)
      .json({
        message: "Voter registered successfully",
        voterId: result.insertId,
      });
  } catch (err) {
    console.error("Error inserting voter:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Register Candidate
app.post("/register-candidate", upload.single("image"), async (req, res) => {
  const { name, position, manifesto } = req.body;
  const filename = req.file ? req.file.filename : null;

  if (!name || !position || !manifesto || !filename) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Store the relative path in the database
  const imageUrl = `/uploads/${filename}`;

  try {
    const query =
      "INSERT INTO candidates (name, position, manifesto, image_url) VALUES (?, ?, ?, ?)";
    const [result] = await pool.execute(query, [
      name,
      position,
      manifesto,
      imageUrl,
    ]);
    res
      .status(201)
      .json({
        message: "Candidate registered successfully",
        candidateId: result.insertId,
      });
  } catch (err) {
    console.error("Error inserting candidate:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Create Vacancy
app.post("/create-vacancy", async (req, res) => {
  const { title, description, requirements } = req.body;

  // Validate input
  if (!title || !description || !requirements) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const query =
      "INSERT INTO vacancies (title, description, requirements) VALUES (?, ?, ?)";
    const [result] = await pool.execute(query, [title, description, requirements]);
    res
      .status(201)
      .json({
        message: "Vacancy created successfully",
        vacancyId: result.insertId,
      });
  } catch (err) {
    console.error("Error inserting vacancy:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Set Election Date
app.post("/set-election-date", async (req, res) => {
  const { start, end } = req.body;

  // Validate input
  if (!start || !end) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const query = "INSERT INTO election_dates (start_date, end_date) VALUES (?, ?)";
    const [result] = await pool.execute(query, [start, end]);
    res
      .status(201)
      .json({
        message: "Election date set successfully",
        electionId: result.insertId,
      });
  } catch (err) {
    console.error("Error setting election date:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Get Vacancies
app.get("/vacancies", async (req, res) => {
  try {
    const query = "SELECT * FROM vacancies"; // Select all vacancy data
    const [result] = await pool.execute(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching vacancies:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Get All Candidates
app.get("/candidates", async (req, res) => {
  try {
    const query = "SELECT * FROM candidates"; //Select all candidates data
    const [result] = await pool.execute(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching candidates:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// POST /logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid"); // Clear the session cookie
    res.status(200).json({ message: "Logged out successfully" });
  });
});
// POST /vote/:candidateId
// POST /vote/:candidateId - Allows voting for multiple positions but only once per position
app.post("/vote/:candidateId", async (req, res) => {
    const candidateId = parseInt(req.params.candidateId);
    const { position } = req.body;
    const voterId = req.session.user ? req.session.user.id : null;

    if (!voterId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Check if the voter has already voted for this position
        const [existingVote] = await pool.execute(
            "SELECT * FROM votes WHERE voter_id = ? AND position = ?",
            [voterId, position]
        );

        if (existingVote.length > 0) {
            return res.status(400).json({ message: `You have already voted for ${position}` });
        }

        // Insert vote for the candidate in the specified position
        await pool.execute(
            "INSERT INTO votes (voter_id, candidate_id, position) VALUES (?, ?, ?)",
            [voterId, candidateId, position]
        );

        // Update the vote count for the candidate
        await pool.execute(
            "UPDATE candidates SET voteCount = voteCount + 1 WHERE id = ?",
            [candidateId]
        );

        res.status(200).json({ message: `Vote cast successfully for ${position}` });
    } catch (error) {
        console.error("Error casting vote:", error);
        res.status(500).json({ message: "Failed to cast vote", error: error.message });
    }
});

// GET /candidates (Updated)
app.get("/candidates", async (req, res) => {
  try {
    const query =
      "SELECT *, (SELECT COUNT(*) FROM votes WHERE candidate_id = candidates.id) AS voteCount FROM candidates";
    const [result] = await pool.execute(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching candidates:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});
app.post("/login", async (req, res) => {
  const { registrationNumber, nationalId } = req.body;

  try {
    const [results] = await pool.execute(
      "SELECT * FROM voters WHERE registration_number = ? AND national_id = ?",
      [registrationNumber, nationalId]
    );

    if (results.length > 0) {
      const user = results[0]; // Access the first element of the array

      // Store user information in the session
      req.session.user = {
        id: user.id,
        role: user.role,
        name: user.name,
      };

      // Determine the role and send the appropriate response
      const role = user.role;
      res.json({ success: true, role: role, message: "Login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("❌ Login error:", error); // Log the detailed error
    res
      .status(500)
      .json({ message: "Login failed", error: "Internal server error" }); // Generic error message for the client
  }
});

// Get Election Dates
app.get("/election-dates", async (req, res) => {
    try {
        const query = "SELECT start_date, end_date FROM election_dates"; // Select start and end dates
        const [result] = await pool.execute(query);
        res.status(200).json(result);
    } catch (err) {
        console.error("Error fetching election dates:", err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const session = require("express-session");
const multer = require("multer");
const path = require("path");

const app = express();

// Configure session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },  // Make sure you're not using secure cookies in development
  })
);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection pool
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Muna21/06058#",
  database: "voting_app",
};

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

// Helper function to handle database query execution
async function executeQuery(query, params = []) {
  try {
    const [result] = await pool.execute(query, params);
    return result;
  } catch (err) {
    throw new Error("Database error: " + err.message);
  }
}

// Register Voter
app.post("/register-voter", async (req, res) => {
  const { name, registrationNumber, nationalId } = req.body;

  if (!name || !registrationNumber || !nationalId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const query = "INSERT INTO voters (name, registration_number, national_id) VALUES (?, ?, ?)";
  try {
    const result = await executeQuery(query, [name, registrationNumber, nationalId]);
    res.status(201).json({ message: "Voter registered successfully", voterId: result.insertId });
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

  const imageUrl = `/uploads/${filename}`;
  const query = "INSERT INTO candidates (name, position, manifesto, image_url) VALUES (?, ?, ?, ?)";
  try {
    const result = await executeQuery(query, [name, position, manifesto, imageUrl]);
    res.status(201).json({ message: "Candidate registered successfully", candidateId: result.insertId });
  } catch (err) {
    console.error("Error inserting candidate:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Create Vacancy
app.post("/create-vacancy", async (req, res) => {
  const { title, description, requirements } = req.body;

  if (!title || !description || !requirements) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const query = "INSERT INTO vacancies (title, description, requirements) VALUES (?, ?, ?)";
  try {
    const result = await executeQuery(query, [title, description, requirements]);
    res.status(201).json({ message: "Vacancy created successfully", vacancyId: result.insertId });
  } catch (err) {
    console.error("Error inserting vacancy:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Set Election Date
app.post("/set-election-date", async (req, res) => {
  const { start, end } = req.body;

  if (!start || !end) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const query = "INSERT INTO election_dates (start_date, end_date) VALUES (?, ?)";
  try {
    const result = await executeQuery(query, [start, end]);
    res.status(201).json({ message: "Election date set successfully", electionId: result.insertId });
  } catch (err) {
    console.error("Error setting election date:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Get Vacancies
app.get("/vacancies", async (req, res) => {
  try {
    const result = await executeQuery("SELECT * FROM vacancies");
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching vacancies:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Get All Candidates with vote count
app.get("/candidates", async (req, res) => {
  try {
    const query = "SELECT *, (SELECT COUNT(*) FROM votes WHERE candidate_id = candidates.id) AS voteCount FROM candidates";
    const result = await executeQuery(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching candidates:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// Get Results
app.get("/results", async (req, res) => {
  try {
    const query = `
      SELECT
        c.id,
        c.name,
        c.position,
        c.manifesto,
        c.image_url,
        (SELECT COUNT(*) FROM votes WHERE candidate_id = c.id) AS vote_count
      FROM
        candidates c;
    `;
    const results = await executeQuery(query);
    res.json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ message: "Failed to fetch election results" });
  }
});

// Vote Casting Endpoint
app.post('/vote/:candidateId', async (req, res) => {
  const { candidateId } = req.params;
  const registrationNumber = req.session.user?.registrationNumber;

  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [voterRows] = await pool.execute(
      "SELECT id FROM voters WHERE registration_number = ?",
      [registrationNumber]
    );

    if (voterRows.length === 0) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    const voterId = voterRows[0].id;

    const [candidateRows] = await pool.execute(
      "SELECT position FROM candidates WHERE id = ?",
      [candidateId]
    );

    if (candidateRows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const position = candidateRows[0].position;

    // Check if the voter has already voted for this position
    const [voteRows] = await pool.execute(
      "SELECT * FROM votes WHERE voter_id = ? AND position = ?",
      [      voterId, position]
    );

    if (voteRows.length > 0) {
      return res.status(400).json({ error: 'You have already voted for this position' });
    }

    // Insert the vote
    await pool.execute(
      "INSERT INTO votes (voter_id, candidate_id, position) VALUES (?, ?, ?)",
      [voterId, candidateId, position]
    );

    res.json({ success: true });

  } catch (err) {
    console.error('Error casting vote:', err);
    return res.status(500).json({ error: 'Failed to cast vote' });
  }
});

// Check if user has voted
app.post('/check-vote-status', async (req, res) => {
  try {
    const { registrationNumber } = req.body;
    if (!registrationNumber) {
      return res.status(400).json({ message: 'Missing registration number' });
    }

    // Fetch voter ID
    const [voterRows] = await pool.execute(
      "SELECT id FROM voters WHERE registration_number = ?",
      [registrationNumber]
    );

    if (voterRows.length === 0) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    const voterId = voterRows[0].id;

    // Fetch votes cast by this voter
    const [votes] = await pool.execute(
      "SELECT candidate_id, position FROM votes WHERE voter_id = ?",
      [voterId]
    );

    res.json({ votes });

  } catch (error) {
    console.error('Error checking vote status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login Endpoint
app.post("/login", async (req, res) => {
  const { registrationNumber, nationalId } = req.body;

  try {
    const [results] = await pool.execute(
      "SELECT * FROM voters WHERE registration_number = ? AND national_id = ?",
      [registrationNumber, nationalId]
    );

    if (results.length > 0) {
      const user = results[0];
      req.session.user = {
        id: user.id,
        role: user.role,
        name: user.name,
        registrationNumber: user.registration_number // Ensure this is included
      };
      console.log('User  session:', req.session.user);  // Log session
      res.json({ success: true, role: user.role, message: "Login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Login failed", error: "Internal server error" });
  }
});

// Get Election Dates
app.get("/election-dates", async (req, res) => {
  try {
    const result = await executeQuery("SELECT start_date, end_date FROM election_dates");
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching election dates:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

// Get User Session
app.get('/session', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "User  not logged in" });
  }

  res.json(req.session.user);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
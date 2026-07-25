const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'users.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profilePhoto TEXT NOT NULL,
      bio TEXT NOT NULL,
      fullName TEXT NOT NULL,
      website TEXT NOT NULL,
      usernameStyle TEXT NOT NULL,
      followers INTEGER NOT NULL,
      following INTEGER NOT NULL,
      posts INTEGER NOT NULL,
      likes INTEGER NOT NULL,
      comments INTEGER NOT NULL,
      verified TEXT NOT NULL,
      activity INTEGER NOT NULL,
      ageMonths INTEGER NOT NULL,
      privacy TEXT NOT NULL,
      score INTEGER NOT NULL,
      result TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )`
  );
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

function getScore(data) {
  let score = 0;

  if (data.profilePhoto === 'no') {
    score += 18;
  } else {
    score -= 4;
  }

  if (data.bio === 'no') {
    score += 10;
  } else {
    score -= 4;
  }

  if (data.fullName === 'no') {
    score += 10;
  } else {
    score -= 4;
  }

  if (data.website === 'no') {
    score += 8;
  } else {
    score -= 3;
  }

  if (data.usernameStyle === 'number-heavy' || data.usernameStyle === 'random') {
    score += 14;
  } else {
    score -= 5;
  }

  const followerRatio = data.followers / Math.max(1, data.following);
  if (followerRatio > 10) {
    score += 14;
  } else if (followerRatio < 0.8) {
    score += 12;
  } else {
    score -= 4;
  }

  if (data.posts < 8) {
    score += 10;
  } else if (data.posts > 40) {
    score -= 6;
  }

  const engagementRate = data.likes / Math.max(1, data.posts);
  const commentRate = data.comments / Math.max(1, data.posts);

  if (engagementRate < 20 && commentRate < 3) {
    score += 18;
  } else if (engagementRate > 80 && commentRate > 8) {
    score -= 6;
  } else if (engagementRate < 50) {
    score += 5;
  }

  if (data.verified === 'yes') {
    score -= 16;
  } else {
    score += 7;
  }

  if (data.activity > 30) {
    score += 14;
  } else if (data.activity <= 7) {
    score -= 6;
  }

  if (data.ageMonths < 6) {
    score += 8;
  } else if (data.ageMonths > 24) {
    score -= 4;
  }

  if (data.privacy === 'private') {
    score += 5;
  } else {
    score -= 2;
  }

  return Math.max(0, Math.min(100, score));
}

function getState(score) {
  if (score >= 75) {
    return 'Likely fake';
  }
  if (score >= 45) {
    return 'Needs review';
  }
  return 'Looks credible';
}

app.post('/api/users', (req, res) => {
  const data = req.body;
  const score = getScore(data);
  const result = getState(score);
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(
    `INSERT INTO users (
      profilePhoto, bio, fullName, website, usernameStyle,
      followers, following, posts, likes, comments,
      verified, activity, ageMonths, privacy, score, result, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  stmt.run(
    data.profilePhoto,
    data.bio,
    data.fullName,
    data.website,
    data.usernameStyle,
    data.followers,
    data.following,
    data.posts,
    data.likes,
    data.comments,
    data.verified,
    data.activity,
    data.ageMonths,
    data.privacy,
    score,
    result,
    createdAt,
    function (err) {
      if (err) {
        console.error('Error saving user:', err.message);
        return res.status(500).json({ error: 'Failed to save user data.' });
      }

      res.json({ id: this.lastID, score, result, createdAt });
    }
  );
  stmt.finalize();
});

app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error('Error retrieving users:', err.message);
      return res.status(500).json({ error: 'Failed to read users.' });
    }
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

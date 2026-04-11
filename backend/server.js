const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(session({
  secret: 'bjdhr-secret-key-2022',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Static files
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session.user) next();
  else res.status(401).json({ error: 'Unauthorized' });
};

// Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Simple auth - in production use bcrypt
  if (username === 'admin' && password === 'bjdhr2022') {
    req.session.user = { username };
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Content management APIs
app.get('/api/content/:type', (req, res) => {
  const filePath = path.join(__dirname, '../data', `${req.params.type}.json`);
  if (fs.existsSync(filePath)) {
    res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  } else {
    res.json([]);
  }
});

app.post('/api/content/:type', requireAuth, (req, res) => {
  const filePath = path.join(__dirname, '../data', `${req.params.type}.json`);
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Initialize data files with real BJDHR info
const initData = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  // Experts data with real president info
  const expertsData = {
    president: {
      name: '于德志',
      nameEn: 'Yu Dezhi',
      title: '会长 | President',
      born: '1962年5月',
      origin: '山东高密',
      education: '医学博士 | PhD in Medicine',
      career: [
        '2011-2013: 卫生部卫生发展研究中心主任',
        '2013-2015: 安徽省卫生厅厅长',
        '现任: 北京数字健康研究会会长'
      ]
    },
    members: []
  };
  
  fs.writeFileSync(path.join(dataDir, 'experts.json'), JSON.stringify(expertsData, null, 2));
  
  // Organization info
  const orgData = {
    name: '北京数字健康研究会',
    nameEn: 'Beijing Digital Health Research Institute',
    founded: '2022',
    creditCode: '51110000MJ0101505U',
    address: '北京市怀柔区永乐北二街9号院5号楼三层302室',
    president: '于德志'
  };
  
  fs.writeFileSync(path.join(dataDir, 'organization.json'), JSON.stringify(orgData, null, 2));
};

initData();

app.listen(PORT, () => {
  console.log(`BJDHR Backend Server running on port ${PORT}`);
});

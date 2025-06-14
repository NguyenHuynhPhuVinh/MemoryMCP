import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Firebase
const initFirebase = () => {
  if (admin.apps.length === 0) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  }
  return admin.database();
};

const db = initFirebase();

// Helper function to generate ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// ========== MEMORY ENDPOINTS ==========

// POST /api/memory - Lưu memory
app.post('/api/memory', async (req, res) => {
  try {
    const { key, value, type = 'text', description, tags } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Key và value là bắt buộc' 
      });
    }

    const id = generateId();
    const timestamp = new Date().toISOString();
    
    const entry = {
      id,
      key,
      value,
      type,
      description,
      tags: tags || [],
      createdAt: timestamp,
      updatedAt: timestamp,
      accessCount: 0,
      lastAccessed: timestamp
    };

    await db.ref(`tominetwork/memory/${id}`).set(entry);
    
    res.status(201).json({ 
      success: true, 
      data: entry 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// GET /api/memory - Lấy tất cả memory
app.get('/api/memory', async (req, res) => {
  try {
    const snapshot = await db.ref('tominetwork/memory').once('value');
    const data = snapshot.val() || {};
    const memories = Object.values(data);
    
    res.json({ 
      success: true, 
      data: memories,
      count: memories.length 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// GET /api/memory/:id - Lấy memory theo ID
app.get('/api/memory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref(`tominetwork/memory/${id}`).once('value');
    const data = snapshot.val();
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: 'Memory không tồn tại' 
      });
    }

    // Cập nhật access count
    await db.ref(`tominetwork/memory/${id}`).update({
      accessCount: (data.accessCount || 0) + 1,
      lastAccessed: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// PUT /api/memory/:id - Cập nhật memory
app.put('/api/memory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Không cho phép cập nhật các field này
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.accessCount;
    delete updateData.lastAccessed;
    
    updateData.updatedAt = new Date().toISOString();

    const snapshot = await db.ref(`tominetwork/memory/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        success: false, 
        message: 'Memory không tồn tại' 
      });
    }

    await db.ref(`tominetwork/memory/${id}`).update(updateData);
    
    const updatedSnapshot = await db.ref(`tominetwork/memory/${id}`).once('value');
    res.json({ 
      success: true, 
      data: updatedSnapshot.val() 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// DELETE /api/memory/:id - Xóa memory
app.delete('/api/memory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref(`tominetwork/memory/${id}`).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        success: false, 
        message: 'Memory không tồn tại' 
      });
    }

    await db.ref(`tominetwork/memory/${id}`).remove();
    res.json({ 
      success: true, 
      message: 'Memory đã được xóa' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ========== TOOLS ENDPOINTS ==========

// POST /api/tools - Lưu tool
app.post('/api/tools', async (req, res) => {
  try {
    const { name, description, type = 'processor', parameters = {}, handlerCode } = req.body;
    
    if (!name || !description || !handlerCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, description và handlerCode là bắt buộc' 
      });
    }

    const id = generateId();
    const timestamp = new Date().toISOString();
    
    const tool = {
      id,
      name,
      description,
      type,
      parameters,
      handlerCode,
      createdAt: timestamp,
      usageCount: 0
    };

    await db.ref(`tominetwork/tools/${id}`).set(tool);
    
    res.status(201).json({ 
      success: true, 
      data: tool 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// GET /api/tools - Lấy tất cả tools
app.get('/api/tools', async (req, res) => {
  try {
    const snapshot = await db.ref('tominetwork/tools').once('value');
    const data = snapshot.val() || {};
    const tools = Object.values(data);
    
    res.json({ 
      success: true, 
      data: tools,
      count: tools.length 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// GET /api/tools/:id - Lấy tool theo ID
app.get('/api/tools/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref(`tominetwork/tools/${id}`).once('value');
    const data = snapshot.val();
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tool không tồn tại' 
      });
    }

    res.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// PUT /api/tools/:id - Cập nhật tool
app.put('/api/tools/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Không cho phép cập nhật các field này
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.usageCount;

    const snapshot = await db.ref(`tominetwork/tools/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tool không tồn tại' 
      });
    }

    await db.ref(`tominetwork/tools/${id}`).update(updateData);
    
    const updatedSnapshot = await db.ref(`tominetwork/tools/${id}`).once('value');
    res.json({ 
      success: true, 
      data: updatedSnapshot.val() 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// DELETE /api/tools/:id - Xóa tool
app.delete('/api/tools/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref(`tominetwork/tools/${id}`).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tool không tồn tại' 
      });
    }

    await db.ref(`tominetwork/tools/${id}`).remove();
    res.json({ 
      success: true, 
      message: 'Tool đã được xóa' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 TomiNetwork Backend đang chạy trên port ${PORT}`);
});

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory storage
let celebrities = [];
let quizSessions = [];
let badmintonMatches = [];

// Load celebrity data
function loadCelebrities() {
  try {
    const dataPath = path.join(process.cwd(), 'simple_celebrities_256.json');
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      celebrities = JSON.parse(data);
      console.log(`✅ ${celebrities.length}명의 연예인 데이터 로드 완료`);
    } else {
      console.warn('⚠️ simple_celebrities_256.json 파일을 찾을 수 없습니다');
      // 기본 데이터
      celebrities = [
        {
          id: '1',
          name: '샘플 연예인',
          imageUrl: 'https://via.placeholder.com/400x500',
          category: 'entertainer'
        }
      ];
    }
  } catch (error) {
    console.error('❌ 연예인 데이터 로드 실패:', error);
    celebrities = [];
  }
}

// Initialize data
loadCelebrities();

// API Routes

app.get('/api/image-search', async (req, res) => {
  const query = String(req.query.q || '').trim().slice(0, 100);
  if (!query) return res.status(400).json({ message: '검색어를 입력해주세요.' });
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(503).json({
      message: '네이버 이미지 검색 API가 설정되지 않았습니다.',
      fallbackUrl: `https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(query)}`
    });
  }
  try {
    const url = new URL('https://openapi.naver.com/v1/search/image.json');
    url.searchParams.set('query', query);
    url.searchParams.set('display', '20');
    url.searchParams.set('sort', 'sim');
    url.searchParams.set('filter', 'large');
    const response = await fetch(url, {
      headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret }
    });
    const body = await response.json();
    if (!response.ok) return res.status(response.status).json({ message: body.errorMessage || '이미지 검색에 실패했습니다.' });
    res.json({ items: (body.items || []).map(item => ({
      title: String(item.title || '').replace(/<[^>]*>/g, ''),
      link: item.link,
      thumbnail: item.thumbnail,
      width: item.sizewidth,
      height: item.sizeheight
    })) });
  } catch (error) {
    res.status(500).json({ message: '이미지 검색 중 오류가 발생했습니다.' });
  }
});

// Get all celebrities
app.get('/api/celebrities', (req, res) => {
  res.json(celebrities);
});

// Get random celebrities
app.get('/api/celebrities/random', (req, res) => {
  const count = parseInt(req.query.count) || 10;
  const shuffled = [...celebrities].sort(() => Math.random() - 0.5);
  res.json(shuffled.slice(0, count));
});

// Get celebrities by category
app.get('/api/celebrities/category/:category', (req, res) => {
  const { category } = req.params;
  const count = parseInt(req.query.count) || 10;
  const filtered = celebrities.filter(c => c.category === category);
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  res.json(shuffled.slice(0, count));
});

// Quiz session routes
app.post('/api/quiz-sessions', (req, res) => {
  const session = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  quizSessions.push(session);
  res.json(session);
});

app.get('/api/quiz-sessions/:id', (req, res) => {
  const session = quizSessions.find(s => s.id === req.params.id);
  if (session) {
    res.json(session);
  } else {
    res.status(404).json({ message: 'Session not found' });
  }
});

app.patch('/api/quiz-sessions/:id', (req, res) => {
  const index = quizSessions.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    quizSessions[index] = { ...quizSessions[index], ...req.body };
    res.json(quizSessions[index]);
  } else {
    res.status(404).json({ message: 'Session not found' });
  }
});

// Badminton match routes
app.post('/api/badminton/matches', (req, res) => {
  const match = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  badmintonMatches.push(match);
  res.json(match);
});

app.get('/api/badminton/matches', (req, res) => {
  res.json(badmintonMatches);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    celebrities: celebrities.length,
    quizSessions: quizSessions.length,
    badmintonMatches: badmintonMatches.length
  });
});

// Serve static files from dist/public
const publicPath = path.join(process.cwd(), 'dist', 'public');
app.use(express.static(publicPath));

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('App not built. Run npm run build first.');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Loaded ${celebrities.length} celebrities`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

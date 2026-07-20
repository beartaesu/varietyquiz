import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";

// 이미지 프록시 엔드포인트 - CORS/Mixed Content 문제 해결
async function setupImageProxy(app: Express) {
  app.get('/api/image-proxy', async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ error: 'URL parameter required' });
      }
      
      console.log('🖼️ [PROXY] 이미지 프록시 요청:', imageUrl);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch image' });
      }
      
      // 이미지 헤더 설정
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=3600'); // 1시간 캐시
      
      // 이미지 스트림 전달 (Node.js 방식)
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
      
    } catch (error) {
      console.error('❌ [PROXY] 이미지 프록시 에러:', error);
      
      // Fallback: SVG placeholder 이미지 반환
      const fallbackSvg = `
        <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f0f0f0"/>
          <text x="50%" y="40%" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#666">
            연예인 사진
          </text>
          <text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#999">
            이미지 로딩 중...
          </text>
        </svg>
      `;
      
      res.set('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'public, max-age=300'); // 5분 캐시
      res.send(fallbackSvg);
    }
  });
}

import { insertQuizSessionSchema } from "@shared/schema";
import { z } from "zod";

// Object Storage 엔드포인트 설정
async function setupObjectStorage(app: Express) {
  const objectStorageService = new ObjectStorageService();

  // Public assets 서빙 엔드포인트
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // 이미지 마이그레이션 API
  app.post("/api/migrate-images", async (req, res) => {
    try {
      console.log("🚀 Starting image migration to Object Storage...");
      
      // PostgreSQL에서 모든 연예인 데이터 가져오기
      const celebrities = await storage.getAllCelebrities();
      console.log(`📊 Found ${celebrities.length} celebrities to migrate`);
      
      let migrated = 0;
      let failed = 0;
      
      for (const celebrity of celebrities) {
        try {
          if (!celebrity.imageUrl.startsWith('http')) {
            console.log(`⏭️ Skipping ${celebrity.name} - already migrated`);
            continue;
          }
          
          // 파일명 생성 (safe filename)
          const fileName = `${celebrity.id}.jpg`;
          
          // Object Storage로 업로드
          const newUrl = await objectStorageService.uploadImageFromUrl(
            celebrity.imageUrl,
            fileName
          );
          
          // PostgreSQL 업데이트
          await storage.updateCelebrity(celebrity.id, {
            ...celebrity,
            imageUrl: newUrl
          });
          
          migrated++;
          console.log(`✅ Migrated ${celebrity.name} (${migrated}/${celebrities.length})`);
          
        } catch (error) {
          failed++;
          console.error(`❌ Failed to migrate ${celebrity.name}:`, error);
        }
      }
      
      console.log(`🎉 Migration complete: ${migrated} migrated, ${failed} failed`);
      res.json({ 
        success: true, 
        migrated, 
        failed, 
        total: celebrities.length 
      });
      
    } catch (error) {
      console.error("❌ Migration failed:", error);
      res.status(500).json({ error: "Migration failed" });
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Object Storage 엔드포인트 등록
  await setupObjectStorage(app);
  // 이미지 프록시 등록
  await setupImageProxy(app);

  // Naver 이미지 검색 API: 비밀 키는 서버에만 보관하고 검색 결과만 클라이언트에 전달합니다.
  app.get("/api/image-search", async (req, res) => {
    const query = String(req.query.q || "").trim().slice(0, 100);
    if (!query) return res.status(400).json({ message: "검색어를 입력해주세요." });

    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(503).json({
        message: "네이버 이미지 검색 API가 설정되지 않았습니다.",
        fallbackUrl: `https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(query)}`,
      });
    }

    try {
      const url = new URL("https://openapi.naver.com/v1/search/image.json");
      url.searchParams.set("query", query);
      url.searchParams.set("display", "20");
      url.searchParams.set("sort", "sim");
      url.searchParams.set("filter", "large");
      const response = await fetch(url, {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      });
      const body = await response.json();
      if (!response.ok) return res.status(response.status).json({ message: body.errorMessage || "이미지 검색에 실패했습니다." });
      const items = (body.items || []).map((item: any) => ({
        title: String(item.title || "").replace(/<[^>]*>/g, ""),
        link: item.link,
        thumbnail: item.thumbnail,
        width: item.sizewidth,
        height: item.sizeheight,
      }));
      res.json({ items });
    } catch (error) {
      console.error("Naver image search failed:", error);
      res.status(500).json({ message: "이미지 검색 중 오류가 발생했습니다." });
    }
  });
  // Celebrity routes
  app.get("/api/celebrities", async (req, res) => {
    try {
      const celebrities = await storage.getAllCelebrities();
      res.json(celebrities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch celebrities" });
    }
  });

  app.get("/api/celebrities/random/:count", async (req, res) => {
    try {
      const count = parseInt(req.params.count);
      const category = req.query.category as string;
      
      if (isNaN(count) || count <= 0) {
        return res.status(400).json({ message: "Invalid count parameter" });
      }
      
      console.log(`🎯 [API] 랜덤 연예인 요청: ${count}명 (카테고리: ${category || '전체'})`);
      
      const celebrities = category && category !== 'all' 
        ? await storage.getRandomCelebritiesByCategory(count, category)
        : await storage.getRandomCelebrities(count);
        
      console.log(`✅ [API] 성공: ${celebrities.length}명 반환`);
      res.json(celebrities);
    } catch (error) {
      console.error('❌ [API] 연예인 데이터 조회 실패:', error);
      res.status(500).json({ 
        message: "Failed to fetch random celebrities",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/celebrities/:id", async (req, res) => {
    try {
      const celebrity = await storage.getCelebrity(req.params.id);
      if (!celebrity) {
        return res.status(404).json({ message: "Celebrity not found" });
      }
      res.json(celebrity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch celebrity" });
    }
  });

  // Quiz session routes
  app.post("/api/quiz/start", async (req, res) => {
    try {
      const sessionData = insertQuizSessionSchema.parse(req.body);
      const session = await storage.createQuizSession(sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quiz session" });
    }
  });

  app.get("/api/quiz/:id", async (req, res) => {
    try {
      const session = await storage.getQuizSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz session" });
    }
  });

  app.patch("/api/quiz/:id", async (req, res) => {
    try {
      const updates = req.body;
      const session = await storage.updateQuizSession(req.params.id, updates);
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update quiz session" });
    }
  });

  // Answer validation route
  app.post("/api/quiz/:id/answer", async (req, res) => {
    try {
      const { answer, celebrityId, timeRemaining } = req.body;
      const celebrity = await storage.getCelebrity(celebrityId);
      
      if (!celebrity) {
        return res.status(404).json({ message: "Celebrity not found" });
      }

      // Validate answer (case-insensitive, trim whitespace)
      const isCorrect = answer.toLowerCase().trim() === celebrity.name.toLowerCase().trim();
      
      // Calculate score based on correctness and time remaining
      const basePoints = isCorrect ? 200 : 0;
      const timeBonus = Math.max(0, timeRemaining * 10);
      const points = basePoints + timeBonus;

      res.json({
        isCorrect,
        correctAnswer: celebrity.name,
        points,
        timeBonus
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate answer" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { type User, type InsertUser, type Celebrity, type InsertCelebrity, type QuizSession, type InsertQuizSession, celebrities, quizSessions, users } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql, eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCelebrity(id: string): Promise<Celebrity | undefined>;
  getAllCelebrities(): Promise<Celebrity[]>;
  getRandomCelebrities(count: number): Promise<Celebrity[]>;
  getRandomCelebritiesByCategory(count: number, category: string): Promise<Celebrity[]>;
  createCelebrity(celebrity: InsertCelebrity): Promise<Celebrity>;
  updateCelebrity(id: string, celebrity: Partial<Celebrity>): Promise<Celebrity | undefined>;
  batchCreateCelebrities(celebrities: InsertCelebrity[]): Promise<Celebrity[]>;
  getCelebrityCount(): Promise<number>;
  
  getQuizSession(id: string): Promise<QuizSession | undefined>;
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  updateQuizSession(id: string, updates: Partial<QuizSession>): Promise<QuizSession | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private celebrities: Map<string, Celebrity>;
  private quizSessions: Map<string, QuizSession>;

  constructor() {
    this.users = new Map();
    this.celebrities = new Map();
    this.quizSessions = new Map();
    
    // Initialize with Korean celebrity data (async)
    this.initializeCelebrityData().catch(console.error);
    
    // 기본 데이터 초기화 비활성화 - 네이버 API 결과만 사용
    // this.initializeBasicData();
  }

  private initializeBasicData() {
    const basicCelebrityData: InsertCelebrity[] = [
      {
        name: "박서준",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face",
        debutYear: 2011,
        genre: "영화, 드라마",
        famousWorks: ["기생충", "이태원 클라쓰", "김비서가 왜 그럴까"],
        difficulty: 2
      },
      {
        name: "아이유",
        imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face",
        debutYear: 2008,
        genre: "가수, 드라마",
        famousWorks: ["호텔 델루나", "마이 아저씨", "좋은 날"],
        difficulty: 1
      }
    ];

    basicCelebrityData.forEach(celeb => {
      this.createCelebrity(celeb);
    });
  }

  private async searchNaverImage(query: string): Promise<string | null> {
    try {
      const clientId = process.env.NAVER_CLIENT_ID;
      const clientSecret = process.env.NAVER_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.warn('Naver API credentials not found, using placeholder image');
        return null;
      }

      const searchQuery = `${query} 연예인 공식사진`;
      const url = `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(searchQuery)}&display=5&sort=sim`;
      
      const response = await fetch(url, {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      });

      if (!response.ok) {
        console.error('Naver API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        // 첫 번째 이미지를 선택하되, .jpg나 .png 확장자가 있는 것을 우선
        const validImage = data.items.find((item: any) => 
          item.link && (item.link.includes('.jpg') || item.link.includes('.png') || item.link.includes('.jpeg'))
        ) || data.items[0];
        
        return validImage.link;
      }
      
      return null;
    } catch (error) {
      console.error('Error searching Naver image:', error);
      return null;
    }
  }

  private async initializeCelebrityData() {
    console.log('🔍 네이버 API를 사용해서 실제 연예인 이미지 수집 중...');
    
    // 기존 연예인 데이터 모두 삭제 (중복 방지)
    this.celebrities.clear();
    
    const celebrityData: InsertCelebrity[] = [
      {
        name: "박서준",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face",
        debutYear: 2011,
        genre: "영화, 드라마",
        famousWorks: ["기생충", "이태원 클라쓰", "김비서가 왜 그럴까"],
        difficulty: 2
      },
      {
        name: "송혜교",
        imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=400&h=500&fit=crop&crop=face",
        debutYear: 1996,
        genre: "드라마, 영화",
        famousWorks: ["태양의 후예", "풀하우스", "디어 마이 프렌즈"],
        difficulty: 1
      },
      {
        name: "현빈",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face",
        debutYear: 2003,
        genre: "드라마, 영화",
        famousWorks: ["사랑의 불시착", "시크릿 가든", "알함브라 궁전의 추억"],
        difficulty: 1
      },
      {
        name: "김고은",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face",
        debutYear: 2012,
        genre: "영화, 드라마",
        famousWorks: ["도깨비", "더 킹: 영원의 군주", "은교"],
        difficulty: 2
      },
      {
        name: "이민호",
        imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face",
        debutYear: 2006,
        genre: "드라마, 영화",
        famousWorks: ["상속자들", "더 킹: 영원의 군주", "꽃보다 남자"],
        difficulty: 1
      },
      {
        name: "박보영",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face",
        debutYear: 2006,
        genre: "영화, 드라마",
        famousWorks: ["힘쎈여자 도봉순", "늑대소년", "스캔들메이커"],
        difficulty: 2
      },
      {
        name: "차은우",
        imageUrl: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=500&fit=crop&crop=face",
        debutYear: 2016,
        genre: "드라마, 가수",
        famousWorks: ["내 아이디는 강남미인", "여신강림", "ASTRO"],
        difficulty: 3
      },
      {
        name: "아이유",
        imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face",
        debutYear: 2008,
        genre: "가수, 드라마",
        famousWorks: ["호텔 델루나", "마이 아저씨", "좋은 날"],
        difficulty: 1
      },
      {
        name: "정우성",
        imageUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=500&fit=crop&crop=face",
        debutYear: 1994,
        genre: "영화",
        famousWorks: ["더 킹", "강철비", "아수라"],
        difficulty: 2
      },
      {
        name: "전지현",
        imageUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=500&fit=crop&crop=face",
        debutYear: 1999,
        genre: "영화, 드라마",
        famousWorks: ["별에서 온 그대", "청설", "엽기적인 그녀"],
        difficulty: 1
      }
    ];

    // 네이버 API로 실제 연예인 이미지 검색 및 업데이트
    for (const celeb of celebrityData) {
      const realImageUrl = await this.searchNaverImage(celeb.name);
      
      if (realImageUrl) {
        console.log(`✅ ${celeb.name}: 실제 이미지 발견`);
        celeb.imageUrl = realImageUrl;
      } else {
        console.log(`⚠️ ${celeb.name}: 네이버 이미지 검색 실패, 기본 이미지 사용`);
      }
      
      await this.createCelebrity(celeb);
      
      // API 호출 제한을 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('🎉 연예인 데이터 초기화 완료!');
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCelebrity(id: string): Promise<Celebrity | undefined> {
    return this.celebrities.get(id);
  }

  async getAllCelebrities(): Promise<Celebrity[]> {
    return Array.from(this.celebrities.values());
  }

  async getRandomCelebrities(count: number): Promise<Celebrity[]> {
    const allCelebrities = Array.from(this.celebrities.values());
    const shuffled = allCelebrities.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async getRandomCelebritiesByCategory(count: number, category: string): Promise<Celebrity[]> {
    const allCelebrities = Array.from(this.celebrities.values());
    const filtered = allCelebrities.filter(celeb => celeb.category === category);
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async createCelebrity(insertCelebrity: InsertCelebrity): Promise<Celebrity> {
    const id = randomUUID();
    const celebrity: Celebrity = { 
      id,
      name: insertCelebrity.name,
      imageUrl: insertCelebrity.imageUrl,
      category: insertCelebrity.category
    };
    this.celebrities.set(id, celebrity);
    return celebrity;
  }

  async updateCelebrity(id: string, updates: Partial<Celebrity>): Promise<Celebrity | undefined> {
    const existing = this.celebrities.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.celebrities.set(id, updated);
    return updated;
  }

  async batchCreateCelebrities(celebrities: InsertCelebrity[]): Promise<Celebrity[]> {
    const result: Celebrity[] = [];
    for (const celeb of celebrities) {
      const created = await this.createCelebrity(celeb);
      result.push(created);
    }
    return result;
  }

  async getCelebrityCount(): Promise<number> {
    return this.celebrities.size;
  }

  async getQuizSession(id: string): Promise<QuizSession | undefined> {
    return this.quizSessions.get(id);
  }

  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
    const id = randomUUID();
    const session: QuizSession = { 
      id,
      totalQuestions: insertSession.totalQuestions ?? 20,
      currentQuestion: insertSession.currentQuestion ?? 0,
      score: insertSession.score ?? 0,
      correctAnswers: insertSession.correctAnswers ?? 0,
      wrongAnswers: insertSession.wrongAnswers ?? 0,
      isCompleted: insertSession.isCompleted ?? 0
    };
    this.quizSessions.set(id, session);
    return session;
  }

  async updateQuizSession(id: string, updates: Partial<QuizSession>): Promise<QuizSession | undefined> {
    const existing = this.quizSessions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.quizSessions.set(id, updated);
    return updated;
  }
}

// PostgreSQL Database Storage
export class DbStorage implements IStorage {
  private db;
  private initializationPromise: Promise<void>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const sqlClient = neon(connectionString);
    this.db = drizzle(sqlClient);
    
    // Initialize celebrities data once
    this.initializationPromise = this.initializeCelebrityData();
  }

  private async initializeCelebrityData() {
    try {
      console.log('🔍 데이터베이스에서 연예인 데이터 확인 중...');
      
      // Check if celebrities already exist
      const existingCount = await this.getCelebrityCount();
      
      if (existingCount >= 256) {
        console.log(`✅ 이미 ${existingCount}명의 연예인 데이터가 있습니다. 수집 완료!`);
        return;
      }
      
      console.log(`📊 현재 ${existingCount}명, 사용자 제공 256명 리스트로 교체 중...`);
      
      // Always clear and reload with user's 256 list
      console.log('🔄 사용자 제공 256명 연예인 데이터로 초기화 시작');
      await this.db.delete(celebrities);
      
      const userCelebrities = await this.getUserProvidedCelebrityList();
      
      console.log('🚀 사용자 제공 256명 연예인 데이터 로드 시작...');
      
      // Process in batches to avoid overwhelming the database
      const batchSize = 20;
      for (let i = 0; i < userCelebrities.length; i += batchSize) {
        const batch = userCelebrities.slice(i, i + batchSize);
        
        // Save batch to database
        await this.batchCreateCelebrities(batch);
        
        console.log(`✅ 배치 ${Math.floor(i/batchSize) + 1}/${Math.ceil(userCelebrities.length/batchSize)} 완료 (${i + batch.length}/${userCelebrities.length})`);
      }
      
      const finalCount = await this.getCelebrityCount();
      console.log(`🎉 사용자 제공 256명 연예인 데이터베이스 구축 완료! 총 ${finalCount}명`);
    } catch (error) {
      console.error('❌ 연예인 데이터 초기화 실패:', error);
    }
  }

  private async searchNaverImage(query: string): Promise<string | null> {
    try {
      const clientId = process.env.NAVER_CLIENT_ID;
      const clientSecret = process.env.NAVER_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return null;
      }

      const searchQuery = `${query} 연예인 공식사진`;
      const url = `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(searchQuery)}&display=5&sort=sim`;
      
      const response = await fetch(url, {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const validImage = data.items.find((item: any) => 
          item.link && (item.link.includes('.jpg') || item.link.includes('.png') || item.link.includes('.jpeg'))
        ) || data.items[0];
        
        return validImage.link;
      }
      
      return null;
    } catch (error) {
      console.error(`Error searching image for ${query}:`, error);
      return null;
    }
  }

  private async getUserProvidedCelebrityList(): Promise<InsertCelebrity[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const filePath = path.resolve(process.cwd(), 'simple_celebrities_256.json');
      const data = await fs.readFile(filePath, 'utf-8');
      const celebrities = JSON.parse(data);
      
      return celebrities.map((celeb: any) => ({
        name: celeb.name,
        imageUrl: celeb.imageUrl,
        category: celeb.category as 'male_singer' | 'female_singer' | 'male_actor' | 'female_actress' | 'entertainer'
      }));
    } catch (error) {
      console.error('❌ 사용자 256명 리스트 로드 실패, 기본 리스트 사용:', error);
      return this.getFallbackCelebrityList();
    }
  }

  private getFallbackCelebrityList(): InsertCelebrity[] {
    return [
      // 드라마 배우 (남성)
      { name: "박서준", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2011, genre: "영화, 드라마", famousWorks: ["기생충", "이태원 클라쓰", "김비서가 왜 그럴까"], difficulty: 2 },
      { name: "현빈", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2003, genre: "드라마, 영화", famousWorks: ["사랑의 불시착", "시크릿 가든", "알함브라 궁전의 추억"], difficulty: 1 },
      { name: "이민호", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2006, genre: "드라마, 영화", famousWorks: ["상속자들", "더 킹: 영원의 군주", "꽃보다 남자"], difficulty: 1 },
      { name: "정우성", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1994, genre: "영화", famousWorks: ["더 킹", "강철비", "아수라"], difficulty: 2 },
      { name: "공유", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2001, genre: "영화, 드라마", famousWorks: ["도깨비", "부산행", "커피프린스 1호점"], difficulty: 1 },
      { name: "이종석", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2010, genre: "드라마, 영화", famousWorks: ["당신이 잠든 사이에", "피노키오", "닥터 스트레인저"], difficulty: 2 },
      { name: "박보검", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2011, genre: "드라마, 영화", famousWorks: ["구르미 그린 달빛", "청춘기록", "남자친구"], difficulty: 2 },
      { name: "송중기", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2008, genre: "드라마, 영화", famousWorks: ["태양의 후예", "승리호", "늑대소년"], difficulty: 1 },
      { name: "김우빈", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2008, genre: "드라마, 영화", famousWorks: ["상속자들", "학교 2013", "언니는 살아있다"], difficulty: 2 },
      { name: "지창욱", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2006, genre: "드라마, 영화", famousWorks: ["힐러", "K2", "유령을 잡아라"], difficulty: 3 },
      
      // 드라마 배우 (여성)
      { name: "송혜교", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1996, genre: "드라마, 영화", famousWorks: ["태양의 후예", "풀하우스", "디어 마이 프렌즈"], difficulty: 1 },
      { name: "김고은", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2012, genre: "영화, 드라마", famousWorks: ["도깨비", "더 킹: 영원의 군주", "은교"], difficulty: 2 },
      { name: "박보영", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2006, genre: "영화, 드라마", famousWorks: ["힘쎈여자 도봉순", "늑대소년", "스캔들메이커"], difficulty: 2 },
      { name: "전지현", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1999, genre: "영화, 드라마", famousWorks: ["별에서 온 그대", "청설", "엽기적인 그녀"], difficulty: 1 },
      { name: "수지", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2010, genre: "가수, 드라마", famousWorks: ["건축학개론", "당신이 잠든 사이에", "miss A"], difficulty: 1 },
      { name: "박신혜", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2003, genre: "드라마, 영화", famousWorks: ["상속자들", "닥터스", "피노키오"], difficulty: 2 },
      { name: "한지민", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2003, genre: "드라마, 영화", famousWorks: ["봄밤", "한번 다녀왔습니다", "미스 백"], difficulty: 3 },
      { name: "김태희", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2001, genre: "드라마, 영화", famousWorks: ["아이리스", "용팔이", "하이킥"], difficulty: 2 },
      { name: "한효주", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2003, genre: "드라마, 영화", famousWorks: ["동이", "W", "해피엔드"], difficulty: 3 },
      { name: "윤아", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "가수, 드라마", famousWorks: ["유 퀴즈 온 더 블럭", "소녀시대", "엑시트"], difficulty: 1 },
      
      // K-POP 남성 아이돌
      { name: "차은우", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "드라마, 가수", famousWorks: ["내 아이디는 강남미인", "여신강림", "ASTRO"], difficulty: 3 },
      { name: "지드래곤", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2006, genre: "가수", famousWorks: ["빅뱅", "쿠데타", "크레용"], difficulty: 1 },
      { name: "태양", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2006, genre: "가수", famousWorks: ["빅뱅", "웨딩드레스", "링가링가"], difficulty: 2 },
      { name: "탑", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2006, genre: "가수, 드라마", famousWorks: ["빅뱅", "시크릿 메시지", "아이리스"], difficulty: 2 },
      { name: "승리", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2006, genre: "가수", famousWorks: ["빅뱅", "셀렉트 샵", "스트롱 베이비"], difficulty: 3 },
      { name: "대성", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2006, genre: "가수", famousWorks: ["빅뱅", "룩 애프터 유", "코튼 캔디"], difficulty: 3 },
      { name: "김종현", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2008, genre: "가수", famousWorks: ["샤이니", "종현", "좋아"], difficulty: 4 },
      { name: "온유", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2008, genre: "가수", famousWorks: ["샤이니", "목소리", "블루"], difficulty: 4 },
      { name: "키", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2008, genre: "가수", famousWorks: ["샤이니", "홀록", "키"], difficulty: 4 },
      { name: "민호", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2008, genre: "가수, 드라마", famousWorks: ["샤이니", "화랑", "로맨스 타운"], difficulty: 4 },
      { name: "태민", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2008, genre: "가수", famousWorks: ["샤이니", "무브", "크리미널"], difficulty: 3 },
      
      // K-POP 여성 아이돌
      { name: "아이유", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2008, genre: "가수, 드라마", famousWorks: ["호텔 델루나", "마이 아저씨", "좋은 날"], difficulty: 1 },
      { name: "태연", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "가수", famousWorks: ["소녀시대", "I", "11:11"], difficulty: 2 },
      { name: "써니", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "가수", famousWorks: ["소녀시대", "써니", "잡아줄게"], difficulty: 4 },
      { name: "티파니", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "가수", famousWorks: ["소녀시대", "I Just Wanna Dance", "Heartbreak Hotel"], difficulty: 4 },
      { name: "효연", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "가수", famousWorks: ["소녀시대", "Mystery", "Sober"], difficulty: 4 },
      { name: "유리", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "가수, 드라마", famousWorks: ["소녀시대", "Fashion King", "Defendant"], difficulty: 4 },
      { name: "수영", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "가수, 드라마", famousWorks: ["소녀시대", "Dating Agency: Cyrano", "38 Task Force"], difficulty: 4 },
      { name: "서현", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "가수, 드라마", famousWorks: ["소녀시대", "Moon Lovers", "Time"], difficulty: 4 },
      { name: "제시카", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "가수", famousWorks: ["소녀시대", "Fly", "Wonderland"], difficulty: 3 },
      { name: "크리스탈", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2009, genre: "가수, 드라마", famousWorks: ["f(x)", "Prison Playbook", "My Jessica"], difficulty: 4 },
      
      // 베테랑 배우들
      { name: "최민식", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1989, genre: "영화", famousWorks: ["올드보이", "신세계", "명량"], difficulty: 2 },
      { name: "송강호", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1996, genre: "영화", famousWorks: ["기생충", "옥자", "살인의 추억"], difficulty: 1 },
      { name: "황정민", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1990, genre: "영화", famousWorks: ["베테랑", "신세계", "국제시장"], difficulty: 3 },
      { name: "이병헌", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1991, genre: "영화, 드라마", famousWorks: ["미스터 션샤인", "내부자들", "달콤한 인생"], difficulty: 2 },
      { name: "조인성", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1999, genre: "영화, 드라마", famousWorks: ["더 킹", "그 겨울, 바람이 분다", "왕좌의 게임"], difficulty: 2 },
      { name: "원빈", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1997, genre: "영화, 드라마", famousWorks: ["아저씨", "가을동화", "태극기 휘날리며"], difficulty: 2 },
      { name: "하정우", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2003, genre: "영화", famousWorks: ["더 킹", "암살", "황해"], difficulty: 3 },
      { name: "이정재", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1993, genre: "영화, 드라마", famousWorks: ["오징어 게임", "신세계", "도둑들"], difficulty: 2 },
      { name: "설경구", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1999, genre: "영화", famousWorks: ["박열", "살인자의 기억법", "오아시스"], difficulty: 4 },
      { name: "김윤석", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1994, genre: "영화", famousWorks: ["추격자", "황해", "차이나타운"], difficulty: 4 },
      
      // 여성 베테랑 배우들
      { name: "김혜수", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1986, genre: "영화, 드라마", famousWorks: ["도둑들", "타짜", "신호등"], difficulty: 2 },
      { name: "전도연", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1991, genre: "영화", famousWorks: ["밀양", "하녀", "카운트다운"], difficulty: 3 },
      { name: "손예진", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1999, genre: "영화, 드라마", famousWorks: ["사랑의 불시착", "밥 잘 사주는 예쁜 누나", "건축학개론"], difficulty: 1 },
      { name: "김태리", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "영화, 드라마", famousWorks: ["아가씨", "미스터 션샤인", "리틀 포레스트"], difficulty: 3 },
      { name: "문소리", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1995, genre: "영화", famousWorks: ["오아시스", "페퍼민트 캔디", "밀양"], difficulty: 4 },
      { name: "염정아", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1998, genre: "영화, 드라마", famousWorks: ["SKY 캐슬", "더 킹", "미스티"], difficulty: 3 },
      { name: "김선아", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1999, genre: "드라마, 영화", famousWorks: ["내 이름은 김삼순", "도시의 법칙", "품위있는 그녀"], difficulty: 3 },
      { name: "고현정", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1995, genre: "드라마, 영화", famousWorks: ["봄날", "퀸 세종대왕", "대물"], difficulty: 3 },
      { name: "김희애", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1983, genre: "드라마", famousWorks: ["부부의 세계", "시크릿", "아름다운 날들"], difficulty: 3 },
      { name: "이영애", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1993, genre: "드라마, 영화", famousWorks: ["대장금", "친절한 금자씨", "봄날은 간다"], difficulty: 2 },
      
      // 코미디언/예능인
      { name: "유재석", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1991, genre: "예능", famousWorks: ["무한도전", "런닝맨", "놀면 뭐하니"], difficulty: 1 },
      { name: "박명수", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1993, genre: "예능", famousWorks: ["무한도전", "박명수의 라디오쇼", "세계 여행"], difficulty: 2 },
      { name: "정준하", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1994, genre: "예능", famousWorks: ["무한도전", "정준하의 수요음악회", "컬투쇼"], difficulty: 3 },
      { name: "하하", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2001, genre: "예능", famousWorks: ["무한도전", "런닝맨", "하하랜드"], difficulty: 2 },
      { name: "노홍철", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1993, genre: "예능", famousWorks: ["무한도전", "놀면 뭐하니", "노홍철의 시선집중"], difficulty: 3 },
      { name: "정형돈", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1994, genre: "예능", famousWorks: ["무한도전", "주간아이돌", "디페콘"], difficulty: 3 },
      { name: "김종국", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1995, genre: "가수, 예능", famousWorks: ["런닝맨", "터보", "김종국쇼"], difficulty: 2 },
      { name: "송지효", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2001, genre: "드라마, 예능", famousWorks: ["런닝맨", "궁", "응급남녀"], difficulty: 2 },
      { name: "이광수", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2001, genre: "드라마, 예능", famousWorks: ["런닝맨", "하트시그널", "소나기"], difficulty: 2 },
      { name: "지석진", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1992, genre: "예능", famousWorks: ["런닝맨", "X맨", "스타 골든벨"], difficulty: 3 },
      
      // 신인/젊은 배우들 (남성)
      { name: "남주혁", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "드라마, 영화", famousWorks: ["스타트업", "두 번째 스무 살", "역도요정 김복주"], difficulty: 2 },
      { name: "박형식", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2010, genre: "가수, 드라마", famousWorks: ["두근두근 내 인생", "힘쎈여자 도봉순", "ZE:A"], difficulty: 3 },
      { name: "여진구", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2005, genre: "드라마, 영화", famousWorks: ["호텔 델루나", "더 킹", "왕의 얼굴"], difficulty: 3 },
      { name: "이동욱", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2005, genre: "드라마", famousWorks: ["도깨비", "호텔킹", "라이프"], difficulty: 3 },
      { name: "옥택연", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2008, genre: "가수, 드라마", famousWorks: ["빈센조", "김비서가 왜 그럴까", "2PM"], difficulty: 3 },
      { name: "서강준", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "드라마", famousWorks: ["치즈인더트랩", "써클", "제3의 매력"], difficulty: 4 },
      { name: "박해진", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2006, genre: "드라마", famousWorks: ["치즈인더트랩", "닥터 스트레인저", "포레스트"], difficulty: 3 },
      { name: "이제훈", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "영화, 드라마", famousWorks: ["시그널", "모범택시", "사도"], difficulty: 4 },
      { name: "고경표", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2010, genre: "드라마", famousWorks: ["응답하라 1988", "질투의 화신", "청춘시대"], difficulty: 4 },
      { name: "박성훈", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2020, genre: "가수, 드라마", famousWorks: ["ENHYPEN", "웹드라마", "케이팝 스타"], difficulty: 5 },
      
      // 신인/젊은 배우들 (여성)
      { name: "김유정", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2003, genre: "드라마", famousWorks: ["구르미 그린 달빛", "일단 뜨겁게 청소하라", "20세기 소녀"], difficulty: 3 },
      { name: "김소현", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2006, genre: "드라마", famousWorks: ["어쩌다 발견한 하루", "러브 알람", "학교 2015"], difficulty: 4 },
      { name: "박은빈", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2011, genre: "드라마, 영화", famousWorks: ["이상한 변호사 우영우", "연모", "스토브리그"], difficulty: 3 },
      { name: "김고은", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2012, genre: "영화, 드라마", famousWorks: ["도깨비", "더 킹: 영원의 군주", "은교"], difficulty: 2 },
      { name: "박소담", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "영화, 드라마", famousWorks: ["기생충", "청춘시대", "기록의 여왕"], difficulty: 3 },
      { name: "천우희", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "영화, 드라마", famousWorks: ["완벽한 타인", "써니", "마녀"], difficulty: 4 },
      { name: "한지민", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2003, genre: "드라마, 영화", famousWorks: ["봄밤", "한번 다녀왔습니다", "미스 백"], difficulty: 3 },
      { name: "정소민", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2004, genre: "드라마", famousWorks: ["런닝맨", "내 아이디는 강남미인", "플레이어"], difficulty: 3 },
      { name: "김세정", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "가수, 드라마", famousWorks: ["학교 2017", "I.O.I", "경이로운 소문"], difficulty: 4 },
      { name: "조이", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2014, genre: "가수, 드라마", famousWorks: ["Red Velvet", "더 패키지", "템페스트"], difficulty: 4 },
      
      // 4세대 K-POP (남성)
      { name: "방탄소년단 RM", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "가수", famousWorks: ["BTS", "Dynamite", "Butter"], difficulty: 1 },
      { name: "방탄소년단 진", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "가수", famousWorks: ["BTS", "Moon", "The Astronaut"], difficulty: 2 },
      { name: "방탄소년단 슈가", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "가수", famousWorks: ["BTS", "Daechwita", "D-2"], difficulty: 2 },
      { name: "방탄소년단 제이홉", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "가수", famousWorks: ["BTS", "Chicken Noodle Soup", "Jack In The Box"], difficulty: 2 },
      { name: "방탄소년단 지민", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "가수", famousWorks: ["BTS", "Filter", "Like Crazy"], difficulty: 1 },
      { name: "방탄소년단 뷔", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "가수, 드라마", famousWorks: ["BTS", "Singularity", "화랑"], difficulty: 1 },
      { name: "방탄소년단 정국", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "가수", famousWorks: ["BTS", "Euphoria", "Seven"], difficulty: 1 },
      { name: "스트레이 키즈 방찬", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2018, genre: "가수", famousWorks: ["Stray Kids", "God's Menu", "S-Class"], difficulty: 3 },
      { name: "스트레이 키즈 현진", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2018, genre: "가수", famousWorks: ["Stray Kids", "Maniac", "소리꾼"], difficulty: 4 },
      { name: "엔하이픈 희승", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2020, genre: "가수", famousWorks: ["ENHYPEN", "Given-Taken", "Bite Me"], difficulty: 5 },
      
      // 4세대 K-POP (여성)
      { name: "블랙핑크 지수", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "가수, 드라마", famousWorks: ["BLACKPINK", "Snowdrop", "FLOWER"], difficulty: 1 },
      { name: "블랙핑크 제니", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "가수", famousWorks: ["BLACKPINK", "SOLO", "You & Me"], difficulty: 1 },
      { name: "블랙핑크 로제", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "가수", famousWorks: ["BLACKPINK", "On The Ground", "APT"], difficulty: 1 },
      { name: "블랙핑크 리사", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "가수", famousWorks: ["BLACKPINK", "LALISA", "Money"], difficulty: 1 },
      { name: "에스파 카리나", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2020, genre: "가수", famousWorks: ["aespa", "Next Level", "Savage"], difficulty: 4 },
      { name: "에스파 윈터", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2020, genre: "가수", famousWorks: ["aespa", "Black Mamba", "Girls"], difficulty: 4 },
      { name: "뉴진스 민지", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2022, genre: "가수", famousWorks: ["NewJeans", "Attention", "Super Shy"], difficulty: 5 },
      { name: "뉴진스 하니", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2022, genre: "가수", famousWorks: ["NewJeans", "Cookie", "Get Up"], difficulty: 5 },
      { name: "르세라핌 김채원", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2022, genre: "가수", famousWorks: ["LE SSERAFIM", "FEARLESS", "UNFORGIVEN"], difficulty: 5 },
      { name: "아이브 안유진", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2021, genre: "가수", famousWorks: ["IVE", "ELEVEN", "LOVE DIVE"], difficulty: 4 },
      
      // 독립 영화/인디 배우들
      { name: "유아인", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2003, genre: "영화, 드라마", famousWorks: ["버닝", "이태원 클라쓰", "사도"], difficulty: 3 },
      { name: "스티븐 연", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2005, genre: "영화", famousWorks: ["미나리", "버닝", "오키자"], difficulty: 4 },
      { name: "전종서", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "영화", famousWorks: ["버닝", "콜", "목소리의 형태"], difficulty: 4 },
      { name: "김민희", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2005, genre: "영화", famousWorks: ["아가씨", "밤의 해변에서 혼자", "헤어질 결심"], difficulty: 4 },
      { name: "조여정", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2004, genre: "영화, 드라마", famousWorks: ["기생충", "마담 뺑덕", "아가씨"], difficulty: 3 },
      { name: "박정민", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2011, genre: "영화", famousWorks: ["사바하", "블라인드", "타짜: 원 아이드 잭"], difficulty: 4 },
      { name: "최우식", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2011, genre: "영화", famousWorks: ["기생충", "기묘한 가족", "인랑"], difficulty: 4 },
      { name: "박소담", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "영화, 드라마", famousWorks: ["기생충", "청춘시대", "기록의 여왕"], difficulty: 3 },
      { name: "이주영", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2011, genre: "영화, 드라마", famousWorks: ["이태원 클라쓰", "기묘한 가족", "랑종"], difficulty: 4 },
      { name: "이재인", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2014, genre: "영화", famousWorks: ["소공녀", "미쓰백", "어서 와, 한국은 처음이지?"], difficulty: 5 },
      
      // 디지털 콘텐츠 스타들
      { name: "이혜리", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2010, genre: "가수, 드라마", famousWorks: ["Girl's Day", "응답하라 1988", "유령을 잡아라"], difficulty: 3 },
      { name: "혜리", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2010, genre: "가수, 드라마", famousWorks: ["Girl's Day", "응답하라 1988", "유령을 잡아라"], difficulty: 3 },
      { name: "ITZY 예지", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2019, genre: "가수", famousWorks: ["ITZY", "DALLA DALLA", "WANNABE"], difficulty: 4 },
      { name: "ITZY 리아", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2019, genre: "가수", famousWorks: ["ITZY", "ICY", "Not Shy"], difficulty: 5 },
      { name: "(여자)아이들 소연", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2018, genre: "가수", famousWorks: ["(G)I-DLE", "LATATA", "Tomboy"], difficulty: 4 },
      { name: "세븐틴 에스쿱스", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2015, genre: "가수", famousWorks: ["SEVENTEEN", "God of Music", "Very Nice"], difficulty: 4 },
      { name: "세븐틴 정한", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2015, genre: "가수", famousWorks: ["SEVENTEEN", "Left & Right", "Hot"], difficulty: 4 },
      { name: "트와이스 나연", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2015, genre: "가수", famousWorks: ["TWICE", "TT", "What Is Love?"], difficulty: 3 },
      { name: "트와이스 사나", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2015, genre: "가수", famousWorks: ["TWICE", "Cheer Up", "Yes or Yes"], difficulty: 3 },
      { name: "레드벨벳 아이린", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2014, genre: "가수", famousWorks: ["Red Velvet", "Red Flavor", "Psycho"], difficulty: 3 },
      
      // 웹툰/웹드라마 출신 배우들
      { name: "김혜윤", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2013, genre: "드라마", famousWorks: ["SKY 캐슬", "어쩌다 발견한 하루", "설강화"], difficulty: 4 },
      { name: "로운", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "가수, 드라마", famousWorks: ["SF9", "어쩌다 발견한 하루", "내일도 칸타빌레"], difficulty: 4 },
      { name: "황인엽", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2018, genre: "드라마", famousWorks: ["여신강림", "18 어게인", "연인"], difficulty: 4 },
      { name: "문가영", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "드라마", famousWorks: ["여신강림", "링크", "멋진 신세계"], difficulty: 5 },
      { name: "송원석", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2020, genre: "드라마", famousWorks: ["좋아하면 울리는", "사이코지만 괜찮아", "멘탈코치 제갈길"], difficulty: 5 },
      { name: "기은세", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2015, genre: "드라마", famousWorks: ["욕망의 불꽃", "쌈 마이웨이", "화유기"], difficulty: 5 },
      { name: "서예화", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "드라마", famousWorks: ["막돼먹은 영애씨", "원 더 우먼", "마녀의 법정"], difficulty: 5 },
      { name: "박규영", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "드라마", famousWorks: ["달의 연인", "로맨스는 별책부록", "청춘기록"], difficulty: 4 },
      { name: "정채연", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "가수, 드라마", famousWorks: ["I.O.I", "DIA", "절약의 여왕"], difficulty: 4 },
      { name: "우도환", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2011, genre: "드라마", famousWorks: ["더 킹", "마이 컨트리", "구르미 그린 달빛"], difficulty: 4 },
      
      // 더 많은 베테랑 배우들
      { name: "박인환", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1962, genre: "영화", famousWorks: ["청춘", "마지막 잎새", "사랑방 손님과 어머니"], difficulty: 5 },
      { name: "신구", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1965, genre: "영화, 드라마", famousWorks: ["내 마음의 풍금", "여명의 눈동자", "대장금"], difficulty: 4 },
      { name: "백일섭", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1968, genre: "영화, 드라마", famousWorks: ["분노의 왕국", "어둠의 자식들", "대왕세종"], difficulty: 4 },
      { name: "이순재", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1956, genre: "영화, 드라마", famousWorks: ["순재씨 시리즈", "고향의 봄", "전원일기"], difficulty: 3 },
      { name: "김영옥", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1957, genre: "드라마", famousWorks: ["대장금", "전원일기", "허준"], difficulty: 4 },
      { name: "고두심", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1972, genre: "드라마", famousWorks: ["엄마를 부탁해", "남자의 자격", "결혼이야기"], difficulty: 3 },
      { name: "김수미", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1970, genre: "드라마, 예능", famousWorks: ["전원일기", "패밀리가 떴다", "나 혼자 산다"], difficulty: 2 },
      { name: "나문희", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1961, genre: "영화, 드라마", famousWorks: ["어머니", "기생충", "들꽃"], difficulty: 3 },
      { name: "윤여정", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1967, genre: "영화, 드라마", famousWorks: ["미나리", "하녀", "포에트리"], difficulty: 2 },
      { name: "문소리", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1995, genre: "영화", famousWorks: ["오아시스", "페퍼민트 캔디", "밀양"], difficulty: 4 },
      
      // 예능계 스타들
      { name: "강호동", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1993, genre: "예능", famousWorks: ["X맨", "1박 2일", "신서유기"], difficulty: 1 },
      { name: "이수근", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1996, genre: "예능", famousWorks: ["1박 2일", "신서유기", "아는 형님"], difficulty: 2 },
      { name: "김희철", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2005, genre: "가수, 예능", famousWorks: ["Super Junior", "아는 형님", "라디오스타"], difficulty: 3 },
      { name: "서장훈", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2015, genre: "예능", famousWorks: ["아는 형님", "미운 우리 새끼", "동상이몽"], difficulty: 3 },
      { name: "민경훈", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1990, genre: "가수, 예능", famousWorks: ["버즈", "아는 형님", "복면가왕"], difficulty: 3 },
      { name: "김영철", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1989, genre: "예능", famousWorks: ["아는 형님", "개그콘서트", "코미디빅리그"], difficulty: 3 },
      { name: "조세호", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2001, genre: "예능", famousWorks: ["1박 2일", "런닝맨", "라디오스타"], difficulty: 3 },
      { name: "양세찬", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2004, genre: "예능", famousWorks: ["런닝맨", "동상이몽", "식신로드"], difficulty: 3 },
      { name: "전소민", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2004, genre: "드라마, 예능", famousWorks: ["런닝맨", "내 아이디는 강남미인", "플레이어"], difficulty: 3 },
      { name: "양세형", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "예능", famousWorks: ["무한도전", "놀면 뭐하니", "서울메이트"], difficulty: 3 },
      
      // 39명 추가 연예인들
      // 2020년대 신인 배우들
      { name: "김민규", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2019, genre: "드라마", famousWorks: ["소년심판", "학교 2021", "사업제안서"], difficulty: 5 },
      { name: "장다아", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2018, genre: "드라마, 영화", famousWorks: ["이태원 클라쓰", "스타트업", "마이네임"], difficulty: 4 },
      { name: "한소희", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2017, genre: "드라마", famousWorks: ["부부의 세계", "마이네임", "경이로운 소문"], difficulty: 3 },
      { name: "신예은", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2019, genre: "드라마", famousWorks: ["펜트하우스", "더 글로리", "악의 꽃"], difficulty: 4 },
      { name: "송강", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2017, genre: "드라마", famousWorks: ["스위트홈", "지금 우리 학교는", "좋아하면 울리는"], difficulty: 3 },
      
      // 4세대 K-POP 추가 아이돌들
      { name: "뉴진스 다니엘", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2022, genre: "가수", famousWorks: ["NewJeans", "Ditto", "OMG"], difficulty: 5 },
      { name: "뉴진스 혜인", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2022, genre: "가수", famousWorks: ["NewJeans", "Hurt", "Cookie"], difficulty: 5 },
      { name: "르세라핌 사쿠라", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2022, genre: "가수", famousWorks: ["LE SSERAFIM", "ANTIFRAGILE", "HKT48"], difficulty: 4 },
      { name: "르세라핌 윤진", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2022, genre: "가수", famousWorks: ["LE SSERAFIM", "FEARLESS", "프로듀스 48"], difficulty: 5 },
      { name: "아이브 가을", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2021, genre: "가수", famousWorks: ["IVE", "After LIKE", "KITSCH"], difficulty: 5 },
      
      // 트로트 가수들
      { name: "임영웅", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2016, genre: "트로트", famousWorks: ["미스터 트롯", "사랑은 늘 도망가", "다시 만날 수 있을까"], difficulty: 1 },
      { name: "영탁", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2007, genre: "트로트", famousWorks: ["미스터 트롯", "막걸리 한잔", "찐이야"], difficulty: 2 },
      { name: "이찬원", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2018, genre: "트로트", famousWorks: ["미스터 트롯", "노래방에서", "울려고"], difficulty: 3 },
      { name: "홍진영", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2009, genre: "트로트", famousWorks: ["사랑의 배터리", "산다는 것은", "너무 너무 너무"], difficulty: 2 },
      { name: "송가인", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2018, genre: "트로트", famousWorks: ["미스트롯", "고향역", "무명배우"], difficulty: 3 },
      
      // 웹드라마/웹툰 출신 배우들 추가
      { name: "안효섭", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2015, genre: "드라마", famousWorks: ["아는 와이프", "사업제안서", "30대 밤"], difficulty: 4 },
      { name: "김동욱", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2003, genre: "드라마, 영화", famousWorks: ["제빵왕 김탁구", "커피프린스 1호점", "미스터리"], difficulty: 4 },
      { name: "공명", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2010, genre: "드라마", famousWorks: ["경이로운 소문", "홍천기", "관상"], difficulty: 4 },
      { name: "박지훈", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2017, genre: "가수, 드라마", famousWorks: ["Wanna One", "화랑", "런온"], difficulty: 4 },
      { name: "강민아", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2012, genre: "가수, 드라마", famousWorks: ["AOA", "동네의 영웅", "그녀의 버킷리스트"], difficulty: 4 },
      
      // 모델 출신 배우들
      { name: "정호연", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2018, genre: "드라마, 영화", famousWorks: ["오징어 게임", "마이네임", "연예인"], difficulty: 3 },
      { name: "이성경", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2009, genre: "드라마, 영화", famousWorks: ["치즈인더트랩", "약간 김치", "어바웃 타임"], difficulty: 3 },
      { name: "김고은", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2012, genre: "영화, 드라마", famousWorks: ["도깨비", "더 킹: 영원의 군주", "은교"], difficulty: 2 },
      { name: "고준희", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2005, genre: "드라마, 영화", famousWorks: ["궁", "미녀는 괴로워", "멀티셀러"], difficulty: 4 },
      { name: "남규리", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2001, genre: "드라마, 영화", famousWorks: ["SES", "49일", "개인의 취향"], difficulty: 4 },
      
      // 뮤지컬 배우들
      { name: "옥주현", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1998, genre: "가수, 뮤지컬", famousWorks: ["핀클", "위키드", "엘리자벳"], difficulty: 3 },
      { name: "이지혜", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1995, genre: "뮤지컬, 드라마", famousWorks: ["대장금", "베르사유의 장미", "엘리자벳"], difficulty: 4 },
      { name: "민영기", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1990, genre: "뮤지컬", famousWorks: ["팬텀", "맨 오브 라만차", "잭 더 리퍼"], difficulty: 5 },
      { name: "카이", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2012, genre: "가수, 뮤지컬", famousWorks: ["EXO", "Andante", "아베니큐"], difficulty: 3 },
      { name: "도경수", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2012, genre: "가수, 드라마", famousWorks: ["EXO", "괜찮아 사랑이야", "백일의 낭군님"], difficulty: 3 },
      
      // 스타들의 자녀/2세들
      { name: "하니", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2014, genre: "가수", famousWorks: ["EXID", "위아래", "덤디덤디"], difficulty: 3 },
      { name: "솔지", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2012, genre: "가수", famousWorks: ["EXID", "내일해", "복면가왕"], difficulty: 4 },
      { name: "LE", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2012, genre: "가수", famousWorks: ["EXID", "매일밤", "덜덜덜"], difficulty: 5 },
      { name: "혜린", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2012, genre: "가수", famousWorks: ["EXID", "Are You Hungry?", "I LOVE YOU"], difficulty: 5 },
      { name: "정화", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2012, genre: "가수", famousWorks: ["EXID", "Do It Tomorrow", "How Why"], difficulty: 5 },
      
      // 추가 예능인들
      { name: "전현무", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2002, genre: "예능", famousWorks: ["라디오스타", "아는 형님", "동상이몽"], difficulty: 3 },
      { name: "붐", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1995, genre: "예능", famousWorks: ["엑스맨", "1박 2일", "해피선데이"], difficulty: 3 },
      { name: "김구라", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1993, genre: "예능", famousWorks: ["라디오스타", "안녕하세요", "황금어장"], difficulty: 3 },
      { name: "신동엽", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1991, genre: "예능", famousWorks: ["일요일은 즐거워", "신의 한 수", "힐링캠프"], difficulty: 2 },
      { name: "이경규", imageUrl: "https://via.placeholder.com/400x500", debutYear: 1982, genre: "예능", famousWorks: ["해피선데이", "개그콘서트", "1박 2일"], difficulty: 2 },
      
      // 4명 추가 (200명 완성)
      { name: "박재범", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2008, genre: "래퍼", famousWorks: ["AOMG", "Solo", "New Breed"], difficulty: 3 },
      { name: "크러쉬", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2012, genre: "R&B", famousWorks: ["Sometimes", "Beautiful", "Hug Me"], difficulty: 4 },
      { name: "딘", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2015, genre: "R&B", famousWorks: ["Instagram", "D (Half Moon)", "What 2 Do"], difficulty: 4 },
      { name: "지코", imageUrl: "https://via.placeholder.com/400x500", debutYear: 2011, genre: "래퍼", famousWorks: ["Block B", "Any Song", "Artist"], difficulty: 3 }
    ];
  }

  async batchCreateCelebrities(celebs: InsertCelebrity[]): Promise<Celebrity[]> {
    // Get existing celebrity names to avoid duplicates
    const existingNames = await this.db.select({ name: celebrities.name }).from(celebrities);
    const existingNamesSet = new Set(existingNames.map(c => c.name));
    
    // Filter out celebrities that already exist
    const newCelebrities = celebs.filter(celeb => !existingNamesSet.has(celeb.name));
    
    console.log(`📊 ${celebs.length}명 중 ${newCelebrities.length}명 신규, ${celebs.length - newCelebrities.length}명 이미 존재`);
    
    if (newCelebrities.length === 0) {
      console.log('✅ 모든 연예인이 이미 데이터베이스에 존재합니다.');
      return [];
    }
    
    // Insert only new celebrities using upsert (onConflictDoNothing)
    const results: Celebrity[] = [];
    for (const celeb of newCelebrities) {
      try {
        const result = await this.db.insert(celebrities)
          .values(celeb)
          .returning();
        if (result[0]) {
          results.push(result[0]);
        }
      } catch (error) {
        console.error(`❌ Failed to insert celebrity ${celeb.name}:`, error);
      }
    }
    return results;
  }

  async getCelebrityCount(): Promise<number> {
    const result = await this.db.select({ count: sql`count(*)` }).from(celebrities);
    return Number(result[0].count);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getCelebrity(id: string): Promise<Celebrity | undefined> {
    const result = await this.db.select().from(celebrities).where(eq(celebrities.id, id)).limit(1);
    return result[0];
  }

  async getAllCelebrities(): Promise<Celebrity[]> {
    return await this.db.select().from(celebrities);
  }

  async getRandomCelebrities(count: number): Promise<Celebrity[]> {
    return await this.db.select().from(celebrities).orderBy(sql`RANDOM()`).limit(count);
  }

  async getRandomCelebritiesByCategory(count: number, category: string): Promise<Celebrity[]> {
    return await this.db.select().from(celebrities)
      .where(eq(celebrities.category, category))
      .orderBy(sql`RANDOM()`)
      .limit(count);
  }

  async createCelebrity(insertCelebrity: InsertCelebrity): Promise<Celebrity> {
    const result = await this.db.insert(celebrities).values(insertCelebrity).returning();
    return result[0];
  }

  async updateCelebrity(id: string, updates: Partial<Celebrity>): Promise<Celebrity | undefined> {
    const result = await this.db.update(celebrities)
      .set(updates)
      .where(eq(celebrities.id, id))
      .returning();
    return result[0];
  }

  async getQuizSession(id: string): Promise<QuizSession | undefined> {
    const result = await this.db.select().from(quizSessions).where(eq(quizSessions.id, id)).limit(1);
    return result[0];
  }

  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
    const result = await this.db.insert(quizSessions).values(insertSession).returning();
    return result[0];
  }

  async updateQuizSession(id: string, updates: Partial<QuizSession>): Promise<QuizSession | undefined> {
    const result = await this.db.update(quizSessions)
      .set(updates)
      .where(eq(quizSessions.id, id))
      .returning();
    return result[0];
  }
}

// Use Memory storage for deployment reliability
export const storage = (() => {
  // 배포 환경에서 안정성을 위해 MemStorage 우선 사용
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 [PRODUCTION] MemStorage 사용으로 즉시 시작');
    const memStorage = new MemStorage();
    console.log('✅ [STORAGE] MemStorage 초기화 완료');
    return memStorage;
  }
  
  // 개발환경에서는 DB 사용
  try {
    const dbStorage = new DbStorage();
    console.log('✅ [STORAGE] DbStorage 초기화 성공');
    return dbStorage;
  } catch (error) {
    console.warn('⚠️ [STORAGE] DbStorage 초기화 실패, MemStorage로 fallback:', error);
    const memStorage = new MemStorage();
    console.log('✅ [STORAGE] MemStorage 초기화 완료');
    return memStorage;
  }
})();

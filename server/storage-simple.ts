import { type User, type InsertUser, type Celebrity, type InsertCelebrity, type QuizSession, type InsertQuizSession } from "@shared/schema";
import { randomUUID } from "crypto";

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
    
    // Initialize with user-provided celebrity data
    this.initializeCelebrityData().catch(console.error);
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
      console.error('❌ Error loading celebrity data:', error);
      return [];
    }
  }

  private async initializeCelebrityData() {
    console.log('🚀 연예인 데이터 로딩 중...');
    
    // Load from simple_celebrities_256.json file
    const userCelebrities = await this.getUserProvidedCelebrityList();
    
    if (userCelebrities.length > 0) {
      console.log(`✅ ${userCelebrities.length}명의 연예인 데이터 로드 완료`);
      for (const celeb of userCelebrities) {
        await this.createCelebrity(celeb);
      }
    } else {
      console.warn('⚠️ 연예인 데이터 파일을 찾을 수 없습니다');
    }
    
    console.log('✅ [STORAGE] MemStorage 초기화 완료');
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
    const filtered = allCelebrities.filter(c => c.category === category);
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async createCelebrity(insertCelebrity: InsertCelebrity): Promise<Celebrity> {
    const id = randomUUID();
    const celebrity: Celebrity = { ...insertCelebrity, id };
    this.celebrities.set(id, celebrity);
    return celebrity;
  }

  async updateCelebrity(id: string, updates: Partial<Celebrity>): Promise<Celebrity | undefined> {
    const celebrity = this.celebrities.get(id);
    if (!celebrity) return undefined;
    
    const updated = { ...celebrity, ...updates };
    this.celebrities.set(id, updated);
    return updated;
  }

  async batchCreateCelebrities(celebrities: InsertCelebrity[]): Promise<Celebrity[]> {
    const created: Celebrity[] = [];
    for (const celeb of celebrities) {
      created.push(await this.createCelebrity(celeb));
    }
    return created;
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
      ...insertSession,
      id,
      createdAt: new Date(),
    };
    this.quizSessions.set(id, session);
    return session;
  }

  async updateQuizSession(id: string, updates: Partial<QuizSession>): Promise<QuizSession | undefined> {
    const session = this.quizSessions.get(id);
    if (!session) return undefined;
    
    const updated = { ...session, ...updates };
    this.quizSessions.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();

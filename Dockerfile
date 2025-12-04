# Node.js 18 베이스 이미지
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (devDependencies 포함 - 빌드에 필요)
RUN npm ci

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# 프로덕션 의존성만 재설치
RUN npm ci --only=production

# 포트 노출
EXPOSE 5000

# 환경 변수
ENV NODE_ENV=production
ENV PORT=5000

# 애플리케이션 실행
CMD ["npm", "start"]

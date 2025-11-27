# Frontier CTF & HSPACE

Frontier CTF와 HSPACE를 위한 통합 웹 애플리케이션입니다.

## 🚀 시작하기

### 1. Docker로 실행

```bash
docker build -t frontier-ctf:latest .
docker run -d --name frontier-ctf-app -p 5000:5000 frontier-ctf:latest
```

> ℹ️ 루트 디렉터리에 `.env` 파일을 둔 상태에서 빌드하면 이미지에 자동으로 포함됩니다.  
> 파일이 없다면 `MONGODB_URI`와 `JWT_SECRET`은 안전한 기본값으로 채워지고, `OPENAI_API_KEY`가 비어 있을 경우 챗봇 기능만 비활성화됩니다.
> 환경 변수 설정 `MONGODB_URI=mongodb://localhost:27017/frontier-ctf`

### 2. 웹사이트 접속

http://localhost:5000 에서 시작하세요.

### 3. 첫 번째 사용자 등록

- **회원가입** 페이지에서 계정을 만드세요.
- 첫 번째 사용자는 자동으로 관리자 권한을 받습니다.

## 🎯 주요 기능

- 게시판 (공지사항, 자유게시판, 익명게시판, CTF/워게임)
- 팀원 모집 (CTF, 프로젝트, 스터디)
- 좌석 예약 시스템
- AI 챗봇
- Discord 연동
- 관리자 기능

## 📄 라이선스

MIT License

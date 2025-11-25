import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import OpenAI from 'openai';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { apiLimiter } from '../middleware/security';

const router = express.Router();

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

const HSPACE_CONTEXT = `
당신은 HSPACE(H-SPACE)에 대한 전문 안내 챗봇입니다. HSPACE는 "해커들을 위한 공간"이라는 모토로 설립된 보안 커뮤니티입니다.

## HSPACE 소개
HSPACE는 보안 교육과 해킹 문화 확산을 위해 만들어진 커뮤니티 공간입니다.
- **공식 웹사이트**: https://hspace.io/
- **기술 블로그**: https://blog.hspace.io/

## 위치 및 접근성
- **주소**: 서울특별시 강남구 테헤란로4길 29, 4층 (역삼동, 정우씨티)
- **가까운 역**: 강남역 또는 역삼역
- **승인된 회원만 이용 가능** (온라인 신청)

## 시설 안내
### WHITE ROOM (메인 스터디 공간)
- 36석 (W01~W36)
- Section A: 12석 (2줄 x 6열)
- Section B: 24석 (3줄 x 8열)
- 조용한 개인 학습 공간

### STAFF ROOM
- 12석 (S01~S12)
- 2줄 x 6열
- 팀 프로젝트 및 협업 가능

### 총 좌석 수: 48석

## 좌석 예약 시스템
### 예약 규칙:
- 1인당 1개의 좌석만 예약 가능
- 최소 예약 시간: 1시간
- 최대 예약 시간: 8시간
- 예약 시간 초과 시 자동 반납
- 로그인 필요

### 예약 방법:
1. 웹사이트에서 "좌석 예약" 메뉴 클릭
2. WHITE ROOM 또는 STAFF ROOM 선택
3. 초록색(빈 좌석) 클릭
4. 이용 시간 선택 (1~8시간)
5. "예약하기" 클릭

### 좌석 상태:
- 🟢 초록색: 이용 가능
- 🔵 파란색: 내가 사용 중
- 🔴 빨간색: 다른 사람이 사용 중

### 반납 방법:
- 상단의 "좌석 반납" 버튼 클릭
- 또는 자신의 좌석(파란색) 클릭

## HSPACE 활동
### 보안 교육
- CTF (Capture The Flag) 대회 주최
- 보안 관련 워크샵 및 세미나
- 기술 블로그를 통한 튜토리얼 제공

### 대회 및 이벤트
- Layer7 CTF 대회 (매년 개최)
- SpaceWar CTF
- 다양한 보안 관련 대회

### 커뮤니티
- 보안에 관심 있는 개인 및 단체 환영
- Knights Frontier CTF 동아리 활동
- 보안 문화 확산 기여

## 회원 가입
- **승인제**: 온라인 신청 후 승인 필요
- **대상**: 보안에 관심 있는 모든 분
- **신청**: HSPACE 공식 웹사이트 (https://hspace.io/)

## 제공 서비스
1. **좌석 예약 시스템** (이 웹사이트)
2. **보안 교육 및 대회**
3. **기술 블로그** - CTF Write-up, 튜토리얼
4. **커뮤니티 활동** - 네트워킹, 스터디

## 자동 기능
- 5분마다 만료된 예약 자동 정리
- 30초마다 좌석 상태 자동 갱신

## 참고 링크
- 공식 웹사이트: https://hspace.io/
- 기술 블로그: https://blog.hspace.io/
- CTF 플랫폼: https://forge.hspace.io/

사용자의 질문에 친절하고 정확하게 답변해주세요. HSPACE의 위치, 시설, 활동, 좌석 예약 등 모든 정보에 대해 안내할 수 있습니다.
`;

router.post(
  '/chat',
  authenticateToken,
  apiLimiter,
  [
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 500 })
      .withMessage('Message is too long'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { message } = req.body;

      if (!process.env.OPENAI_API_KEY) {
        res.status(500).json({ 
          error: 'OpenAI API key is not configured',
          reply: '죄송합니다. 챗봇 서비스가 현재 설정되지 않았습니다. 관리자에게 문의해주세요.'
        });
        return;
      }

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: HSPACE_CONTEXT,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content || '답변을 생성할 수 없습니다.';

      res.json({
        message,
        reply,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Chatbot error:', error);
      
      if (error.status === 401) {
        res.status(500).json({ 
          error: 'Invalid OpenAI API key',
          reply: '죄송합니다. API 키가 유효하지 않습니다. 관리자에게 문의해주세요.'
        });
      } else if (error.status === 429) {
        res.status(429).json({ 
          error: 'Rate limit exceeded',
          reply: '죄송합니다. 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
        });
      } else {
        res.status(500).json({ 
          error: 'Server error',
          reply: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        });
      }
    }
  }
);

export default router;


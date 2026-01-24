# Vercel 배포 가이드

## 1. Vercel CLI 설치

### Mac (Homebrew 사용)
```bash
brew install vercel-cli
```

### npm 사용 (권한 문제 없을 경우)
```bash
npm install -g vercel
```

---

## 2. 로그인

```bash
vercel login
```
브라우저가 열리면 인증 완료

---

## 3. 프로젝트 연결

```bash
# 프로젝트 폴더에서 실행
vercel link --yes
```

---

## 4. 배포

### 프로덕션 배포
```bash
vercel --prod --yes
```

### 미리보기 배포
```bash
vercel --yes
```

---

## 5. vercel.json 설정

정적 HTML 사이트의 경우 루트에 `vercel.json` 생성:

```json
{
  "version": 2,
  "buildCommand": null,
  "outputDirectory": ".",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

---

## 6. GitHub 자동 배포 연결

### CLI 방식
```bash
vercel git connect https://github.com/[username]/[repo]
```

### 웹 대시보드 방식
1. https://vercel.com 접속
2. 프로젝트 선택 → Settings → Git
3. "Connect Git Repository" 클릭
4. GitHub 계정 연결 및 레포지토리 선택

---

## 7. 유용한 명령어

```bash
# 현재 로그인 확인
vercel whoami

# 배포 목록 확인
vercel ls

# 특정 배포 로그 확인
vercel logs [deployment-url]

# 배포 삭제
vercel rm [deployment-url]

# 환경 변수 설정
vercel env add [name]

# 도메인 추가
vercel domains add [domain]
```

---

## 8. 문제 해결

### 404 에러 발생 시
- `vercel.json`에서 `outputDirectory`를 `"."`로 설정

### npm 권한 오류 시
- Homebrew로 설치: `brew install vercel-cli`

### GitHub 연결 오류 시
- Vercel 웹 대시보드에서 GitHub 계정 연결 먼저 필요

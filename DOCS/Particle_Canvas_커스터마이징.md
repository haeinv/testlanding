# Particle Canvas 커스터마이징 가이드

## 개요
파티클 효과로 텍스트를 표시하는 인터랙티브 캔버스 컴포넌트

---

## 1. 캔버스 사이즈 조절

### 위치
`index.html` - `resizeCanvas()` 함수

### 코드
```javascript
function resizeCanvas() {
    const container = document.getElementById('particle-hero');
    canvas.width = Math.min(1400, window.innerWidth - 32);  // 최대 너비
    canvas.height = Math.min(700, window.innerHeight * 0.75);  // 최대 높이
}
```

### 조절 값
| 항목 | 설명 | 예시 |
|------|------|------|
| `1400` | 캔버스 최대 너비 (px) | 1000, 1200, 1400, 1600 |
| `700` | 캔버스 최대 높이 (px) | 400, 500, 600, 700 |
| `0.75` | 화면 높이 비율 | 0.5, 0.6, 0.7, 0.8 |
| `32` | 좌우 여백 (px) | 16, 32, 48 |

---

## 2. 폰트 사이즈 조절

### 위치
`index.html` - `createParticlesFromText()` 함수 내부

### 코드
```javascript
const fontSize = Math.min(160, canvas.width / 6);

offscreenCtx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
```

### 조절 값
| 항목 | 설명 | 예시 |
|------|------|------|
| `160` | 최대 폰트 크기 (px) | 80, 100, 120, 160, 200 |
| `6` | 캔버스 너비 비율 (작을수록 큼) | 4, 5, 6, 7, 8 |

---

## 3. 표시 텍스트 변경

### 위치
`index.html` - `words` 배열

### 코드
```javascript
const words = ["FitChat", "성장하세요", "성공하세요", "관리하세요", "핏챗으로"];
```

### 예시
```javascript
// 영어만
const words = ["FitChat", "Grow", "Success", "Manage"];

// 한글만
const words = ["핏챗", "성장", "성공", "관리"];

// 혼합
const words = ["FitChat", "성장하세요", "SUCCESS", "관리하세요"];
```

---

## 4. 파티클 밀도 조절

### 위치
`index.html` - `pixelSteps` 변수

### 코드
```javascript
const pixelSteps = 6;  // 픽셀 샘플링 간격
```

### 조절 값
| 값 | 효과 |
|----|------|
| `4` | 고밀도 (파티클 많음, 성능 저하 가능) |
| `6` | 중간 (기본값) |
| `8` | 저밀도 (파티클 적음, 성능 좋음) |
| `10` | 최저밀도 |

---

## 5. 파티클 색상 변경

### 위치
`index.html` - `Particle` 클래스 또는 `draw()` 함수

### 현재 코드
```javascript
// 흰색 파티클
ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
```

### 색상 변경 예시
```javascript
// 파란색
ctx.fillStyle = `rgba(66, 133, 244, ${this.alpha})`;

// 그라데이션 효과 (위치 기반)
const hue = (this.x / canvas.width) * 360;
ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${this.alpha})`;

// 랜덤 색상
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
```

---

## 6. 애니메이션 속도 조절

### 텍스트 전환 속도
```javascript
// 더 빠르게 (120프레임마다 전환)
if (frameCount % 120 === 0) {
    wordIndex = (wordIndex + 1) % words.length;
    createParticlesFromText(words[wordIndex]);
}

// 더 느리게 (300프레임마다 전환)
if (frameCount % 300 === 0) {
    wordIndex = (wordIndex + 1) % words.length;
    createParticlesFromText(words[wordIndex]);
}
```

### 파티클 이동 속도
```javascript
// Particle 클래스의 update() 메서드에서
this.x += (this.targetX - this.x) * 0.1;  // 0.1 → 0.05 (느리게), 0.2 (빠르게)
this.y += (this.targetY - this.y) * 0.1;
```

---

## 7. CSS 스타일

### 위치
`index.html` - `<style>` 태그

### 코드
```css
.particle-canvas {
    border-radius: 1rem;    /* 모서리 둥글기 */
    max-width: 100%;
    height: auto;
}

.particle-hero {
    position: relative;
    width: 100%;
    background: #000;       /* 배경색 */
    overflow: hidden;
}
```

---

## 전체 커스터마이징 체크리스트

- [ ] 캔버스 사이즈 (`resizeCanvas()`)
- [ ] 폰트 사이즈 (`fontSize`)
- [ ] 표시 텍스트 (`words` 배열)
- [ ] 파티클 밀도 (`pixelSteps`)
- [ ] 파티클 색상 (`ctx.fillStyle`)
- [ ] 애니메이션 속도 (`frameCount % N`)
- [ ] 배경색 (`.particle-hero` CSS)

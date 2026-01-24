# Firebase 설정 가이드

## 1. Firebase 프로젝트 설정

### Firebase Console
https://console.firebase.google.com

---

## 2. 인증 (Authentication) 설정

### Google 로그인 활성화
1. Authentication → Sign-in method
2. Google 선택 → Enable
3. 프로젝트 지원 이메일 설정
4. Save

### 승인된 도메인 추가 (중요!)
1. Authentication → Settings → Authorized domains
2. Add domain 클릭
3. 배포 도메인 추가:
   - `localhost`
   - `your-app.vercel.app`
   - 커스텀 도메인

---

## 3. Firestore 데이터베이스

### 보안 규칙 예시
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 컬렉션
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 리뷰 컬렉션 (로그인한 사용자만 작성 가능)
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 4. Storage 설정

### 보안 규칙 예시
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 리뷰 이미지 (로그인한 사용자만 업로드 가능)
    match /reviews/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 5. Firebase SDK (HTML에서 사용)

```html
<!-- Firebase SDK (compat 버전) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics-compat.js"></script>

<!-- Firebase 설정 파일 -->
<script src="firebase-config.js"></script>
```

---

## 6. firebase-config.js 예시

```javascript
// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// 서비스 인스턴스
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// 인증 지속성 설정 (브라우저 닫아도 로그인 유지)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
```

**주의:** `firebase-config.js`는 `.gitignore`에 추가하여 API 키 노출 방지

---

## 7. 로그인 상태 확인

```javascript
// 인증 상태 변경 리스너
auth.onAuthStateChanged((user) => {
    if (user) {
        // 로그인됨
        console.log('로그인:', user.email);
    } else {
        // 로그아웃됨
        console.log('로그아웃');
    }
});
```

---

## 8. Google 로그인 구현

```javascript
async function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Firestore에 사용자 정보 저장
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                name: user.displayName || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        window.location.href = 'index.html';
    } catch (error) {
        console.error('Google login error:', error);
    }
}
```

---

## 9. Storage 이미지 업로드

```javascript
async function uploadImageToStorage(file, userId) {
    const timestamp = Date.now();
    const fileName = `reviews/${userId}/${timestamp}_${file.name}`;
    const storageRef = storage.ref(fileName);

    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();

    return downloadURL;
}

// 이미지 압축 후 업로드
async function uploadCompressedImage(file, userId, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const ratio = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * ratio;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(async (blob) => {
                    try {
                        const url = await uploadImageToStorage(blob, userId);
                        resolve(url);
                    } catch (error) {
                        reject(error);
                    }
                }, 'image/jpeg', quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}
```

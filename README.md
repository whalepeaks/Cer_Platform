# 고래봉 플랫폼
## 기본 설치 셋팅
Git 설치
```
[공식 사이트](https://git-scm.com/) → Download → Windows/macOS 선택
모든 옵션 기본값으로 설치
```
Node.js 설치
```
[LTS 버전 다운로드](https://nodejs.org/ko) → Windows Installer(.msi) 선택
"Tools for Native Modules" 반드시 체크
```
VS Code 설치
```
[다운로드 페이지](https://code.visualstudio.com/) → 시스템 맞는 버전 선택
```
SQL Cloud 인증
```
https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases 설치
https://cloud.google.com/sdk/docs/install?hl=ko
gcloud auth application-default login
gcloud config set project whalepeaks-platform
.\cloud-sql-proxy.x64.exe optimum-courier-460304-i0:asia-northeast3:whalepeaks-sql-server --port 3306 -- 경로를 C:\로 이동 후 작업
Start-Process -FilePath ".\cloud-sql-proxy.x64.exe" -ArgumentList "optimum-courier-460304-i0:asia-northeast3:whalepeaks-sql-server --port 3306" -WindowStyle Hidden -- 백그라운드 실행 설정
```
DBeaver 설치
```
https://dbeaver.io/download/
```
## GitHub 저장소
저장소 복제
```
git clone https://github.com/whalepeaks/Cer_Platform.git
cd Cer_Platform
npm install
```
개인 설정
```
# 개인별 사용자 정보 설정 (반드시 본인 정보로)
git config --local user.name "홍길동"
git config --local user.email "gildong@team.com"
```
운영 프로세스
```
# 새로운 기능 개발 시작
git checkout -b feature/login
# 시작 전 체크리스트
git fetch origin
git merge origin/main
npm install
# 작업 완료 후
git add .
git commit -m "feat:로그인 기능 구현 완료"
git push origin feature/login
# 변경사항 확인
git status
# 커밋 전 변경사항 확인
git diff
# 최근 커밋 취소
git reset HEAD~1 --soft
# 최신 버전 가져오기
git fetch origin main
# 병합 시도
git merge origin/main
# <<<<<<< HEAD ~ ======= 사이 코드 수정 후
git add .
git commit -m "충돌 해결 완료"
```

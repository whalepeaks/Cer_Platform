# 자격증 모의고사 플랫폼
Git 설치
공식 사이트 → Download → Windows/macOS 선택
![Git 설치 화면](https://git-scm.com/images
모든 옵션 기본값으로 설치

Node.js 설치
LTS 버전 다운로드 → Windows Installer(.msi) 선택
![Node.js 설치 화면](https://nodejs.org/static
"Tools for Native Modules" 반드시 체크

VS Code 설치
다운로드 페이지 → 시스템 맞는 버전 선택
![VS Code 설치](https://code.visualstudio.com/assets/images/code-stable미널 기본 설정 (Windows 전용)

## 관리자 권한 power shell 실행
```
Set-ExecutionPolicy RemoteSigned -Force
choco install git -y
```

## GitHub 저장소
1. 저장소 복제
```
git clone https://github.com/whalepeaks/Cer_Platform.git
cd Cer_Platform
npm install
```
2. 개인 설정
```
# 개인별 사용자 정보 설정 (반드시 본인 정보로)
git config --local user.name "홍길동"
git config --local user.email "gildong@team.com"

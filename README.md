# Whalepeaks_Cer_Platform
Git 설치
Node.JS 설치
VS code 설치

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

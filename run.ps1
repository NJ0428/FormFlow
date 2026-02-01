# FormFlow 프로젝트 실행 스크립트

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       FormFlow 설문조사 플랫폼" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 의존성 체크
if (-not (Test-Path "node_modules")) {
    Write-Host "의존성 설치 중..." -ForegroundColor Yellow
    npm install
    Write-Host "의존성 설치 완료!" -ForegroundColor Green
    Write-Host ""
}

# 개발 서버 시작
Write-Host "개발 서버 시작 중..." -ForegroundColor Green
Write-Host "서버 주소: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "종료하려면 Ctrl+C를 누르세요" -ForegroundColor Gray
Write-Host ""

npm run dev

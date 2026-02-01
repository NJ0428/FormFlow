import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ message: '로그아웃되었습니다.' });
  response.cookies.delete('auth-token');
  return response;
}

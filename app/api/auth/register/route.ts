import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호는 필수입니다.' },
        { status: 400 }
      );
    }

    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 400 }
      );
    }

    const userId = createUser(email, password, name);
    
    return NextResponse.json({
      message: '회원가입이 완료되었습니다.',
      userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '회원가입에 실패했습니다.' },
      { status: 500 }
    );
  }
}

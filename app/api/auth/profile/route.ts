import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById, updateUserProfile } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: '인증되지 않았습니다.' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: '이름은 필수입니다.' },
        { status: 400 }
      );
    }

    const success = updateUserProfile(decoded.id, name.trim());

    if (success) {
      const user = getUserById(decoded.id);
      return NextResponse.json({ user });
    } else {
      return NextResponse.json(
        { error: '프로필 수정에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: '프로필 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

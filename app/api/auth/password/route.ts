import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserByEmail, verifyPassword, updateUserPassword } from '@/lib/auth';
import db from '@/lib/db';

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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호는 필수입니다.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '새 비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 현재 비밀번호 확인
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: '현재 비밀번호가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    const success = await updateUserPassword(decoded.id, newPassword);

    if (success) {
      return NextResponse.json({ message: '비밀번호가 변경되었습니다.' });
    } else {
      return NextResponse.json(
        { error: '비밀번호 변경에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: '비밀번호 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}

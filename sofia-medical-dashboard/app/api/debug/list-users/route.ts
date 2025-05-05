import { NextResponse } from 'next/server';
import { getUsers } from '../../../../lib/db';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users for debug:', error);
    return NextResponse.json(
      { error: 'Error fetching users' },
      { status: 500 }
    );
  }
}

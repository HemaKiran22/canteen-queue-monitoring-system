// app/api/queue/route.ts
import { NextResponse } from 'next/server';

// Store latest queue data in memory (replace with a database later)
let latestData = {
  students: 0,
  minWait: 0,
  maxWait: 0,
  timestamp: new Date().toISOString(),
};

export async function POST(request: Request) {
  const data = await request.json();
  latestData = {
    students: data.students,
    minWait: data.minWait,
    maxWait: data.maxWait,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json({ status: "success" });
}

export async function GET() {
  return NextResponse.json(latestData);
}
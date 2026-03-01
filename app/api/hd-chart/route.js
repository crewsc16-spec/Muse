import { NextResponse } from 'next/server';
import { calculateHDChartServer } from '@/app/lib/hd-chart-server';

export async function POST(req) {
  try {
    const { birthDate, birthTime, utcOffset, lat, lon } = await req.json();
    if (!birthDate || !birthTime) {
      return NextResponse.json({ error: 'birthDate and birthTime required' }, { status: 400 });
    }
    const result = calculateHDChartServer(birthDate, birthTime, utcOffset ?? 0, lat, lon);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[hd-chart API]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

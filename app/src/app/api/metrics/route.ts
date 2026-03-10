import { NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/metrics';

/**
 * GET /api/metrics
 * Returns collected frontend metrics in Prometheus format
 */
export async function GET() {
  try {
    const prometheusFormat = metricsCollector.exportAsPrometheus();
    return new NextResponse(prometheusFormat, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating frontend metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/metrics/summary
 * Returns a JSON summary of frontend metrics
 */
export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === 'clear') {
      metricsCollector.clear();
      return NextResponse.json({
        message: 'Metrics cleared',
        success: true,
      });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing metrics request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

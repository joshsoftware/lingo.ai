import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const PROTECTED_ROUTES = ['/analysis', '/analyse', '/transcriptions', '/record']

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname
    const headers = new Headers(request.headers);
    headers.set('x-current-path', path);

    const isProtectedRoute = PROTECTED_ROUTES.includes(path)
    const user = (await cookies()).get('auth_session')?.value
    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/signin', request.nextUrl))
    }
    
    return NextResponse.next({ headers });
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
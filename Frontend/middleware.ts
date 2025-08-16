import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require wallet connection
const protectedRoutes = ['/dashboard', '/loan', '/repay', '/swap', '/treasury', '/wallet'];
// Define public routes that should redirect to dashboard if wallet is connected
const publicRoutes = ['/', '/landingPage'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is protected or public
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  
  // Get wallet connection status from cookie (set by client-side)
  const walletConnected = request.cookies.get('wallet-connected')?.value === 'true';
  
  // Handle public routes (redirect to dashboard if wallet is connected)
  if (isPublicRoute && walletConnected) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Handle protected routes (redirect to home if wallet is not connected)
  if (isProtectedRoute && !walletConnected) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

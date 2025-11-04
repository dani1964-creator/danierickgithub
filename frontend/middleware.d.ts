import { NextRequest, NextResponse } from 'next/server';
export declare function middleware(request: NextRequest): Promise<NextResponse<unknown>>;
export declare const config: {
    matcher: string[];
};

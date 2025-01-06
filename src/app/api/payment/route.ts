import '@/lib/bigint'  
import { NextResponse, NextRequest } from 'next/server';
import { paymentRequestsContract } from '@/data/paymentRequestsContract'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams

        // Read specific query parameters
        const tokenId = searchParams.get('tokenId')


        if (!tokenId || isNaN(Number(tokenId))) {
            return NextResponse.json(
                { error: 'Invalid token ID' },
                { status: 400 }
            )
        }
        const paymentDetails = await paymentRequestsContract.read.getPaymentDetails([BigInt(tokenId)])
        return NextResponse.json({ paymentDetails }, { status: 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
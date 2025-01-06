import '@/lib/bigint'  
import { NextResponse, NextRequest } from 'next/server';
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { PaymentRequests } from '@/data/abi/paymentRequests'



if (!process.env.NEXT_PUBLIC_PAYMENT_REQUESTS_ADDRESS) {
    throw new Error('Missing NEXT_PUBLIC_PAYMENT_REQUESTS_ADDRESS environment variable')
}

export const PAYMENT_REQUESTS_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_REQUESTS_ADDRESS as `0x${string}`

const client = createPublicClient({
    chain: base,
    transport: http()
})

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

        const paymentDetails = await client.readContract({
            address: PAYMENT_REQUESTS_ADDRESS,
            abi: PaymentRequests,
            functionName: 'getPaymentDetails',
            args: [BigInt(tokenId)]
        })

        return NextResponse.json({ paymentDetails }, { status: 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
import '@/lib/bigint'
import { NextRequest, NextResponse } from 'next/server'
import { getCreatorPaymentRequests } from '@/data/paymentRequestsContract'
import { isAddress, type Address } from 'viem'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      )
    }

    if (!isAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      )
    }

    const paymentRequests = await getCreatorPaymentRequests(address as Address)

    return NextResponse.json(paymentRequests, { status: 200 })

  } catch (error) {
    console.error('Error fetching creator payment requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment requests' },
      { status: 500 }
    )
  }
}
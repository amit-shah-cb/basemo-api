import '@/lib/bigint'
import { NextRequest, NextResponse } from 'next/server'
import { getUserPaymentRequests } from '@/data/paymentRequestsContract'
import { isAddress, type Address } from 'viem'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')
    const status = searchParams.get('status') // 'paid' | 'unpaid' | undefined

    // Validate address
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

    // Validate status if provided
    if (status && !['paid', 'unpaid'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status (must be paid or unpaid)' },
        { status: 400 }
      )
    }

    const paymentRequests = await getUserPaymentRequests(address as Address)

    // Filter by status if specified
    if (status) {
      paymentRequests.requests = paymentRequests.requests.filter(
        request => request.paid === (status === 'paid')
      )
      paymentRequests.total = paymentRequests.requests.length
    }

    return NextResponse.json(paymentRequests, { status: 200 })

  } catch (error) {
    console.error('Error fetching owner payment requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment requests' },
      { status: 500 }
    )
  }
}
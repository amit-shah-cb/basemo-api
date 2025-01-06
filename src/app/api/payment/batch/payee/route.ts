import '@/lib/bigint'
import { NextRequest, NextResponse } from 'next/server'
import { getUserPaymentRequests } from '@/data/paymentRequestsContract'
import { isAddress, type Address } from 'viem'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '10')
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

    // Validate pagination params
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      )
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit (must be between 1 and 100)' },
        { status: 400 }
      )
    }

    // Validate status
    if (status && !['paid', 'unpaid'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status (must be paid or unpaid)' },
        { status: 400 }
      )
    }

    const paymentRequests = await getUserPaymentRequests(address as Address)

    // Filter by status if specified
    let filteredRequests = paymentRequests.requests
    if (status) {
      filteredRequests = filteredRequests.filter(
        request => request.paid === (status === 'paid')
      )
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const paginatedRequests = filteredRequests.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      total: filteredRequests.length,
      page,
      limit,
      totalPages: Math.ceil(filteredRequests.length / limit),
      requests: paginatedRequests
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching owner payment requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment requests' },
      { status: 500 }
    )
  }
}
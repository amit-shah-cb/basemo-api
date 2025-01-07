import { NextRequest, NextResponse } from 'next/server'
import { getUserOperationReceipt } from '@/lib/alchemy'
import { decodeLogs, getPaymentDetails, PaymentRequestCreatedEvent } from '@/data/paymentRequestsContract'
import { Hex } from 'viem'

type ReceiptRequestBody = {
  userOpHash: `0x${string}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReceiptRequestBody
    const { userOpHash } = body

    // Validate userOpHash
    if (!userOpHash) {
      return NextResponse.json(
        { error: 'Missing userOpHash parameter' },
        { status: 400 }
      )
    }

    if (!userOpHash.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Invalid userOpHash format. Must start with 0x' },
        { status: 400 }
      )
    }

    // Length should be 66 characters (0x + 64 hex characters)
    if (userOpHash.length !== 66) {
      return NextResponse.json(
        { error: 'Invalid userOpHash length' },
        { status: 400 }
      )
    }

    // Get receipt
    const receipt = await getUserOperationReceipt(userOpHash)

    // Check for RPC errors
    if (!receipt) {
      return NextResponse.json(
        { error: 'Failed to fetch UserOperation receipt' },
        { status: 400 }
      )
    }

    const decodedLogs = receipt.result?.receipt.logs 
    ? await decodeLogs(receipt.result.receipt.logs as {data: `0x${string}`, topics: [signature: Hex, ...args: Hex[]] | [] }[])
    : []


    const paymentRequestCreated = decodedLogs.find(log => log.eventName === 'PaymentRequestCreated') as PaymentRequestCreatedEvent
    if (!paymentRequestCreated) {
        return NextResponse.json(
            { error: 'No PaymentRequestCreated event found in logs' },
            { status: 400 }
        )
    }
    const paymentDetails = await getPaymentDetails(paymentRequestCreated.args.tokenId)
    if (!paymentDetails) {
        return NextResponse.json(
            { error: 'Failed to fetch payment details' },
            { status: 400 }
        )
    }

    return NextResponse.json(
        paymentDetails)

  } catch (error) {
    console.error('Error fetching UserOperation receipt:', error)
    return NextResponse.json(
      { error: 'Failed to fetch UserOperation receipt' },
      { status: 500 }
    )
  }
}
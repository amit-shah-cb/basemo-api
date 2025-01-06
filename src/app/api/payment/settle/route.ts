import '@/lib/bigint'
import { NextRequest, NextResponse } from 'next/server'
import { getSettleTransactions, checkAllowance } from '@/data/paymentRequestsContract'
import { type Address, isAddress } from 'viem'

type SettlePaymentRequestBody = {
  tokenId: string
  tokenAddress: string
  amount: string
  owner: string  // wallet address that will be settling
}

function validateTokenId(tokenId: string): bigint {
  if (!/^\d+$/.test(tokenId)) {
    throw new Error('Invalid token ID format')
  }

  try {
    return BigInt(tokenId)
  } catch {
    throw new Error('Invalid token ID')
  }
}

function validateAddress(address: string, field: string): Address {
  if (!isAddress(address)) {
    throw new Error(`Invalid ${field} address`)
  }
  return address as Address
}

function validateAmount(amount: string): bigint {
  if (!/^\d+$/.test(amount)) {
    throw new Error('Invalid amount format')
  }

  try {
    return BigInt(amount)
  } catch {
    throw new Error('Invalid amount')
  }
}

export async function POST(request: NextRequest) {
    try {
      const body = await request.json() as SettlePaymentRequestBody
      const { tokenId, tokenAddress, amount, owner } = body
  
      if (!tokenId || !tokenAddress || !amount || !owner) {
        return NextResponse.json(
          { error: 'Missing required parameters' },
          { status: 400 }
        )
      }
  
      try {
        const validatedTokenId = validateTokenId(tokenId)
        const validatedTokenAddress = validateAddress(tokenAddress, 'token')
        const validatedAmount = validateAmount(amount)
        const validatedOwner = validateAddress(owner, 'owner')
  
        const result = await getSettleTransactions({
          tokenId: validatedTokenId,
          tokenAddress: validatedTokenAddress,
          amount: validatedAmount,
          owner: validatedOwner
        })
  
        return NextResponse.json({ 
          ...result,
          request: {
            tokenId: validatedTokenId.toString(),
            tokenAddress: validatedTokenAddress,
            amount: validatedAmount.toString(),
            owner: validatedOwner
          }
        }, { status: 200 })
  
      } catch (validationError) {
        return NextResponse.json(
          { error: (validationError as Error).message },
          { status: 400 }
        )
      }
  
    } catch (error) {
      console.error('Error preparing settle request:', error)
      return NextResponse.json(
        { error: 'Failed to prepare settle request' },
        { status: 500 }
      )
    }
  }
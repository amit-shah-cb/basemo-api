import '@/lib/bigint'
import { NextRequest, NextResponse } from 'next/server'
import { getCreatePaymentRequestData } from '@/data/paymentRequestsContract'
import { type Address, isAddress } from 'viem'

type CreatePaymentRequestBody = {
  token: string
  payee: string
  amount: string
  description: string
}

// Validation helper functions
function validateAddress(address: string, field: string): Address {
  if (!isAddress(address)) {
    throw new Error(`Invalid ${field} address`)
  }
  return address as Address
}

function validateAmount(amount: string): string {
  // Check if amount is a valid number
  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new Error('Amount must be a positive number')
  }

  // Check if amount has reasonable decimal places (max 18)
  if (amount.includes('.')) {
    const decimals = amount.split('.')[1]
    if (decimals.length > 18) {
      throw new Error('Amount has too many decimal places')
    }
  }

  return amount
}

function sanitizeDescription(description: string): string {
  return description
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Escape special characters
    .replace(/[&<>"']/g, (char) => {
      const escapes: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      }
      return escapes[char]
    })
    // Trim whitespace
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreatePaymentRequestBody
    const { token, payee, amount, description } = body

    // Check if all required fields are present
    if (!token || !payee || !amount || !description) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate and transform inputs
    try {
      const validatedToken = validateAddress(token, 'token')
      const validatedPayee = validateAddress(payee, 'payee')
      const validatedAmount = validateAmount(amount)
      const sanitizedDescription = sanitizeDescription(description)

      // Check description length after sanitization
      if (sanitizedDescription.length === 0) {
        throw new Error('Description cannot be empty')
      }
      if (sanitizedDescription.length > 500) { // adjust max length as needed
        throw new Error('Description is too long')
      }

      // Get transaction data
      const txData = getCreatePaymentRequestData({
        token: validatedToken,
        payee: validatedPayee,
        amount: BigInt(validatedAmount),
        description: sanitizedDescription
      })

      return NextResponse.json({ 
        txData,
        request: {
          token: validatedToken,
          payee: validatedPayee,
          amount: validatedAmount,
          description: sanitizedDescription
        }
      }, { status: 200 })

    } catch (validationError) {
      return NextResponse.json(
        { error: (validationError as Error).message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error preparing payment request:', error)
    return NextResponse.json(
      { error: 'Failed to prepare payment request' },
      { status: 500 }
    )
  }
}
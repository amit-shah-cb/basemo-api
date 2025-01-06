import { createPublicClient, http, getContract, Address, encodeFunctionData } from 'viem'
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

// Create the public client
export const publicClient = createPublicClient({
  chain: base,
  transport: http()
})

// Create reusable contract instance
export const paymentRequestsContract = getContract({
  address: PAYMENT_REQUESTS_ADDRESS,
  abi: PaymentRequests,
  client: publicClient,
})

export function getCreatePaymentRequestData({
    token,
    payee,
    amount,
    description
  }: {
    token: Address,
    payee: Address,
    amount: bigint,
    description: string
  }) {
    return {
      address: PAYMENT_REQUESTS_ADDRESS,
      data: encodeFunctionData({
        abi: PaymentRequests,
        functionName: 'createPaymentRequest',
        args: [token, payee, amount, description]
      })
    }
  }
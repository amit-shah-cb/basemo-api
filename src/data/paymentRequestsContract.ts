import { createPublicClient, http, getContract, Address, encodeFunctionData } from 'viem'
import { base } from 'viem/chains'
import { PaymentRequests } from '@/data/abi/paymentRequests'
import { Erc20 } from '@/data/abi/erc20'
import { decodeEventLog } from 'viem'
import { Hex } from 'viem'


if (!process.env.NEXT_PUBLIC_PAYMENT_REQUESTS_ADDRESS) {
    throw new Error('Missing NEXT_PUBLIC_PAYMENT_REQUESTS_ADDRESS environment variable')
}

export const PAYMENT_REQUESTS_ADDRESS = process.env.NEXT_PUBLIC_PAYMENT_REQUESTS_ADDRESS as `0x${string}`

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

  export function getSettlePaymentRequestData(tokenId: bigint) {
    return {
      address: PAYMENT_REQUESTS_ADDRESS,
      data: encodeFunctionData({
        abi: PaymentRequests,
        functionName: 'settlePaymentRequest',
        args: [tokenId]
      })
    }
  }
  
  // Optional: Create a route handler for this
  export function getCancelPaymentRequestData(tokenId: bigint) {
    return {
      address: PAYMENT_REQUESTS_ADDRESS,
      data: encodeFunctionData({
        abi: PaymentRequests,
        functionName: 'cancelPaymentRequest',
        args: [tokenId]
      })
    }
  }



// Function to create ERC20 contract instance
export function getERC20Contract(tokenAddress: Address) {
  return getContract({
    address: tokenAddress,
    abi: Erc20,
    client:publicClient
  })
}

// Function to check allowance
export async function checkAllowance({
  tokenAddress,
  owner,
  amount
}: {
  tokenAddress: Address,
  owner: Address,
  amount: bigint
}) {
  const erc20Contract = getERC20Contract(tokenAddress)
  
  const currentAllowance = await erc20Contract.read.allowance([
    owner,
    PAYMENT_REQUESTS_ADDRESS
  ])

  return {
    currentAllowance,
    needsApproval: currentAllowance < amount
  }
}

  export function getERC20ApproveData({
    tokenAddress,
    amount
  }: {
    tokenAddress: Address,
    amount: bigint
  }) {
    return {
      address: tokenAddress,
      data: encodeFunctionData({
        abi: Erc20,
        functionName: 'approve',
        args: [PAYMENT_REQUESTS_ADDRESS, amount]
      })
    }
  }

  export async function getSettleTransactions({
    tokenId,
    tokenAddress,
    amount,
    owner
  }: {
    tokenId: bigint,
    tokenAddress: Address,
    amount: bigint,
    owner: Address
  }) {
    // Check allowance first
    const erc20Contract = getERC20Contract(tokenAddress)
    const currentAllowance = await erc20Contract.read.allowance([
      owner,
      PAYMENT_REQUESTS_ADDRESS
    ])
  
    // If allowance is sufficient, only return settle tx
    if (currentAllowance >= amount) {
      return {
        transactions: {
          settle: getSettlePaymentRequestData(tokenId)
        }
      }
    }
  
    // If allowance is insufficient, return both transactions and allowance info
    return {
      transactions: {
        approve: getERC20ApproveData({ tokenAddress, amount }),
        settle: getSettlePaymentRequestData(tokenId)
      },
      allowance: {
        current: currentAllowance,
        required: amount
      }
    }
  }

  type PaymentDetails = {
    receiver: Address
    payee: Address
    token: Address
    amount: bigint
    paid: boolean
    publicMemo: string
  }
  
  export async function getCreatorPaymentRequests(creator: Address) {
    try {
      // Get total balance of created requests
      const createdBalance = await paymentRequestsContract.read.createdBalanceOf([
        creator
      ])
  
      // If no requests, return early
      if (createdBalance === 0n) {
        return {
          total: 0,
          requests: []
        }
      }
  
      // Get all payment requests for creator
      const requests: Array<PaymentDetails & { tokenId: bigint }> = []
      
      for (let i = 0n; i < createdBalance; i++) {
        // Get tokenId for this index
        const tokenId = await paymentRequestsContract.read.tokenOfCreatorByIndex([
          creator,
          i
        ])
  
        // Get payment details for this tokenId
        const details = await paymentRequestsContract.read.getPaymentDetails([
          tokenId
        ])
  
        // Add tokenId to the details
        requests.push({
          ...details,
          tokenId
        })
      }
  
      return {
        total: Number(createdBalance),
        requests: requests.map(request => ({
          ...request,
          amount: request.amount.toString(),
          tokenId: request.tokenId.toString()
        }))
      }
  
    } catch (error) {
      console.error('Error fetching payment requests:', error)
      throw error
    }
  }

  export async function getUserPaymentRequests(owner: Address) {
    try {
      // Get total balance of owned NFTs
      const balance = await paymentRequestsContract.read.balanceOf([owner])
  
      // If no NFTs, return early
      if (balance === BigInt(0)) {
        return {
          total: 0,
          requests: []
        }
      }
  
      // Get all payment requests for owner
      const requests: Array<PaymentDetails & { tokenId: bigint }> = []
      
      for (let i = BigInt(0); i < balance; i = i + BigInt(1)) {
        // Get tokenId for this index
        const tokenId = await paymentRequestsContract.read.tokenOfOwnerByIndex([
          owner,
          i
        ])
  
        // Get payment details for this tokenId
        const details = await paymentRequestsContract.read.getPaymentDetails([
          tokenId
        ])
  
        requests.push({
          ...details,
          tokenId
        })
      }
  
      return {
        total: Number(balance),
        requests: requests.map(request => ({
          ...request,
          amount: request.amount.toString(),
          tokenId: request.tokenId.toString()
        }))
      }
  
    } catch (error) {
      console.error('Error fetching user payment requests:', error)
      throw error
    }
  }

export async function getPaymentDetails(tokenId: bigint | string) {
    try {
      // Convert string tokenId to bigint if needed
      const validatedTokenId = typeof tokenId === 'string' ? BigInt(tokenId) : tokenId
  
      // Get payment details
      const details = await paymentRequestsContract.read.getPaymentDetails([
        validatedTokenId
      ])
  
      return {
        ...details,
        amount: details.amount.toString(), // Convert BigInt to string for JSON
        tokenId: validatedTokenId.toString() // Include tokenId in response
      }
  
    } catch (error) {
      console.error('Error fetching payment details:', error)
      throw error
    }
  }
  

  export type DecodedLog = {
    eventName: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: Record<string, any>
  }

  export type PaymentRequestCreatedEvent = {
    eventName: 'PaymentRequestCreated'
    args: {
      tokenId: bigint
      receiver: `0x${string}`
      payee: `0x${string}`
      amount: bigint
      publicMemo: string
    }
  }
  
  export async function decodeLogs(logs: {data: `0x${string}`, topics: [signature: Hex, ...args: Hex[]] | [] }[]): Promise<DecodedLog[]> {
    return logs.map(log => {
      try {
        const decoded = decodeEventLog({
          abi: PaymentRequests,
          data: log.data,
          topics: log.topics
        })
  
        return {
          eventName: decoded.eventName,
          args: decoded.args
        }
      } catch (error) {
        console.warn('Failed to decode log:', error)
        return {
          eventName: 'UnknownEvent',
          args: {
            data: log.data,
            topics: log.topics
          }
        }
      }
    })
  }
if (!process.env.ALCHEMY_API_KEY) {
    throw new Error('ALCHEMY_API_KEY is not defined in environment variables')
}

const ALCHEMY_URL = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`

export type Log = {
    address: `0x${string}`
    topics: `0x${string}`[]
    data: `0x${string}`
    blockHash: `0x${string}`
    blockNumber: `0x${string}`
    blockTimestamp: `0x${string}`
    transactionHash: `0x${string}`
    transactionIndex: `0x${string}`
    logIndex: `0x${string}`
    removed: boolean
  }
  
  export type TransactionReceipt = {
    type: `0x${string}`
    status: `0x${string}`
    cumulativeGasUsed: `0x${string}`
    logs: Log[]
    logsBloom: `0x${string}`
    transactionHash: `0x${string}`
    transactionIndex: `0x${string}`
    blockHash: `0x${string}`
    blockNumber: `0x${string}`
    gasUsed: `0x${string}`
    effectiveGasPrice: `0x${string}`
    from: `0x${string}`
    to: `0x${string}`
    contractAddress: `0x${string}` | null
  }
  
  export type UserOperationReceipt = {
    jsonrpc: "2.0"
    id: number
    result: {
      userOpHash: `0x${string}`
      entryPoint: `0x${string}`
      sender: `0x${string}`
      nonce: `0x${string}`
      paymaster: `0x${string}`
      actualGasCost: `0x${string}`
      actualGasUsed: `0x${string}`
      success: boolean
      reason: string
      logs: Log[]
      receipt: TransactionReceipt
    }
  }
export async function getUserOperationReceipt(hash: string): Promise<UserOperationReceipt> {
    try {
        const response = await fetch(ALCHEMY_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                id: 1,
                jsonrpc: '2.0',
                method: 'eth_getUserOperationReceipt',
                params: [hash]
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data as UserOperationReceipt

    } catch (error) {
        console.error('Error fetching UserOperation:', error)
        throw error
    }
}
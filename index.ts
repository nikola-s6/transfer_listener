import { Alchemy, Network, AlchemySubscription, TransactionReceipt, Log } from "alchemy-sdk"
import { ethers } from "ethers"
import * as dotenv from "dotenv"

dotenv.config()

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
})
const transferHash: string = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
const coder: ethers.AbiCoder = new ethers.AbiCoder()
const walletAddress: string = "0x11048698268aBF043F7A4617E8E72A55e74281CA"

alchemy.ws.on(
  {
    method: AlchemySubscription.MINED_TRANSACTIONS,
    addresses: [
      {
        from: walletAddress,
      },
    ],
  },
  (tx) => {
    alchemy.core
      .getTransactionReceipt(tx.transaction.hash)
      .then((txReceipt: TransactionReceipt | null) => {
        const transfers: Array<Log> = txReceipt!.logs.filter(
          (t) => t.topics[0] === transferHash
        ) as Array<Log>
        if (transfers.length < 2) return
        if (
          !(
            transfers[0].topics[1] !== walletAddress &&
            transfers[transfers.length - 1].topics[2] !== walletAddress
          )
        ) {
          return
        }
        const swapData: SwapData = {
          trader: txReceipt!.from,
          txHash: txReceipt!.transactionHash,
          tokenOut: transfers[0].address,
          tokenIn: transfers[transfers.length - 1].address,
          tokenOutAmount: coder.decode(["uint256"], transfers[0].data).toString(),
          tokenInAmount: coder.decode(["uint256"], transfers[transfers.length - 1].data).toString(),
        }
        console.log(swapData)
      })
      .catch((error: Error) => {
        console.log(error.message)
      })
  }
)

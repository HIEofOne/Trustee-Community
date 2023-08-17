import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ConnectWallet } from './connectWallet'
import SignMessage from './signMessage'

export function Profile() {
  const { isConnected } = useAccount()
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div>
        <ConnectWallet />
        <SignMessage></SignMessage>
      </div>
    )
  }

  return <ConnectWallet />
}
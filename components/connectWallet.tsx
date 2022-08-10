import {
  useAccount,
  useConnect,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
} from "wagmi";

export function ConnectWallet() {
  const { address, connector, isConnected } = useAccount();
  const { data: ensAvatar } = useEnsAvatar({ addressOrName: address });
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="ethereumAccount">
        {/* @ts-ignore */}
        {/* <img src={ensAvatar} alt="ENS Avatar" /> */}
        {/* @ts-ignore */}
        {connector && 
          <div>Connected to {connector.name}</div>
        }

        <div>Address: {ensName ? `${ensName} (${address})` : address}</div>
        
        {/* @ts-ignore */}
        <button onClick={disconnect} className="btn">Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          disabled={!connector.ready}
          key={connector.id}
          onClick={() => connect({ connector })}
        >
          {connector.name}
          {!connector.ready && " (unsupported)"}
          {isLoading &&
            connector.id === pendingConnector?.id &&
            " (connecting)"}
        </button>
      ))}

      {error && <div>{error.message}</div>}
    </div>
  );
}

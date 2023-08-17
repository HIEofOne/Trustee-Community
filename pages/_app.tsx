import Layout from "../components/layout";
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from "@mui/material";
import { appTheme } from "../styles/theme";
import { WagmiConfig, createConfig, configureChains, mainnet } from 'wagmi';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
// import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
// import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
// import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

import '@fontsource/nunito/300.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/700.css';

// Configure chains & providers with the Alchemy provider.
// Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
const { chains, publicClient, webSocketPublicClient } = configureChains([mainnet], [publicProvider()]);

// Set up client
const config = createConfig({
  autoConnect: true,
  connectors: [
    //@ts-ignore
    new MetaMaskConnector({ chains }),
    //@ts-ignore
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'wagmi',
      }
    }),
    //@ts-ignore
    // new WalletConnectConnector({
    //   chains,
    //   options: {
    //     projectId: 'trustee',
    //     showQrModal: true,
    //   },
    // }),
    // new InjectedConnector({
    //   chains,
    //   options: {
    //     name: 'Injected',
    //     shimDisconnect: true,
    //   },
    // }),
  ],
  publicClient,
  webSocketPublicClient
})
//@ts-ignore
const MyApp = ({ Component, pageProps, auth }) => {
  return (
    <WagmiConfig config={config}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <Layout {...pageProps}>
            <Component {...pageProps} />
          </Layout>
        </LocalizationProvider>
      </ThemeProvider>
    </WagmiConfig>
  );
};
export default MyApp;

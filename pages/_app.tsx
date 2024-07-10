import Layout from "../components/layout";
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from "@mui/material";
import { appTheme } from "../styles/theme";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import '@fontsource/nunito/300.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/700.css';

const MyApp = ({ Component, pageProps }: { Component:any, pageProps:any}) => {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <Layout {...pageProps}>
          <Component {...pageProps} />
        </Layout>
      </LocalizationProvider>
    </ThemeProvider>
  );
};
export default MyApp;

import React, { Component } from 'react';
import router from 'next/router';

import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import PolicyIcon from '@mui/icons-material/Policy';
import SupportIcon from '@mui/icons-material/Support';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));
const drawerWidth = 240;
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));
interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));
const LayoutDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));
export interface DialogTitleProps {
  id: string;
  children?: React.ReactNode;
  onClose: () => void;
}
function LayoutDialogTitle(props: DialogTitleProps) {
  const { children, onClose, ...other } = props;
  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            // color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
}

const Layout = (props: any) => {
  const theme = useTheme();
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [content, setContent] = React.useState<any[]>([]);
  const [title, setTitle] = React.useState('');

  const handleDialogOpen = (type: string) => {
    if (type == 'privacy_policy') {
      setTitle('Privacy Policy');
      setContent([
        'We collect emails to contact and identify you but we do not share them with anyone.',
        'We do not read or use your information except as directed by policies you can customize.',
        'We do not disclose your information except as directed by policies you can customize.',
        "Trustee Community issues access credentials based on a specific email invitation or a patient’s policy linked to  active Doximity accounts.",
        'Patient data in the cloud is secured through encryption in transit and at rest. Access and policy enforcement are based on the IETF RFC 9635 protocol. Access authorization is secured with Passkeys to prevent password phishing and sharing.',
        'Data retention is entirely patient-controlled. Patients can easily delete their health record data at any time, leaving only their contact email in our files. We do not review, share or use invitation email addresses or other access authorization policies except for the specific purpose of access authorization.',
        'Trustee clinical data and authorization services are managed through typical hosting accounts at Digital Ocean, Inc. or Netlify, Inc. Neither HIE of One or our hosting providers share data with third-parties.',
        'As a free and non-commercial demonstration, Trustee accounts may be closed and data deleted at any time. Users are encouraged to make and keep local copies on their computer or mobile device.',
        'Trustee protects against unintended or overly broad data sharing in multiple ways:',
        'Patients have fine-grained control over health record segments they capture from hospital records via SMART on FHIR.',
        'As a free service, patients concerned about family access demands can easily create alternate health records by simply using a different email address.',
        'The use of passkeys instead of passwords discourages requests for password sharing.',
        'Patients also have fine-grained control over data shared through invited access via email or via policy.',
        'Patients have access to synthetic data files as a “sandbox” to help them better understand health record and sharing functionality before using Trustee with real patient data.',
        'Restriction or withdrawal of an invited email address and changes in policy-based access are done on-line and effective immediately.'
      ]);
    }
    if (type == 'support') {
      setTitle('Support');
      setContent([

      ]);
    }
    setOpenDialog(true);
  };
  const handleDialogClose = () => {
    setOpenDialog(false);
  };
  const handleDrawerOpen = () => {
    setOpenDrawer(true);
  };
  const handleDrawerClose = () => {
    setOpenDrawer(false);
  };
  const home = () => {
    window.location.href = '/'
  }
  const logout = async() => {
    await fetch(`/api/auth/logout`, { method: "POST" });
    router.push("/");
  };
  return (
    (<Box sx={{ display: 'flex' }}>
      {/* <CssBaseline /> */}
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleDrawerOpen}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" onClick={home}>
            HIE of One
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={openDrawer}
      >
        <DrawerHeader>
          <Typography>HIE of One Trustee Community</Typography>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItem disablePadding key="1">
            <ListItemButton onClick={(e) => handleDialogOpen('privacy_policy')}>
              <ListItemIcon>
                <PolicyIcon />
              </ListItemIcon>
              <ListItemText primary="Privacy Policy" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding key="2">
            <ListItemButton component="a" href="https://github.com/HIEofOne/Trustee-Community" target="_blank">
              <ListItemIcon>
                <SupportIcon />
              </ListItemIcon>
              <ListItemText primary="Support" />
            </ListItemButton>
          </ListItem>
          {props.userId ? (
            <ListItem disablePadding key="3">
              <ListItemButton component="a" onClick={() => logout()}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          ) : (<></>)}
        </List>
      </Drawer>
      <LayoutDialog
        onClose={handleDialogClose}
        aria-labelledby="customized-dialog-title"
        open={openDialog}
      >
        <LayoutDialogTitle id="customized-dialog-title" onClose={handleDialogClose}>
          {title}
        </LayoutDialogTitle>
        <DialogContent dividers>
          <ul>
            {content.map((text: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined, index: any) => (
              <li key={index}>
                <Typography gutterBottom>
                  {text}
                </Typography>
              </li>
            ))}
          </ul>
        </DialogContent>
      </LayoutDialog>
      <Main open={openDrawer}>
        <DrawerHeader/>
        {props.children}
      </Main>
    </Box>)
  );
}

export default Layout;

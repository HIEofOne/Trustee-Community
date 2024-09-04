import { MouseEvent, useState } from 'react';
import { useRouter } from 'next/router';
import moment, { Moment } from 'moment';
import { isLoggedIn } from '../../lib/auth';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionOptions } from '../../lib/session';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import { FormControl } from "@mui/material";
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

//Landing Page
const NewPatient = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [DOB, setDOB] = useState(moment());
  const [gender, setGender] = useState("male");
  const [accountCreated, setAccountCreated] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [url, setURL] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [progress, setProgress] = useState(1);
  const router = useRouter();
  const { email } = router.query;

  const handleChange = (newValue: Moment | null) => {
    if (newValue !== null) {
      setDOB(newValue);
    }
  };
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleConfirm = (e: { target: { value: string; }; }) => {
    if (e.target.value !== pin) {
      setError("PINs do not match");
    } else {
      setError("");
    }
  };
  const handleMouseDownPassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const handlePIN = (e: { target: { value: string; }; }) => {
    setPin(e.target.value.slice(0,4));
  };
  const createAccount = async (e:any) => {
    e.preventDefault();
    //user must accept privacy
    if (!privacy) {
      setError("You must accept privacy policy to continue");
      return;
    }
    const body = { email: email };
    let birthGender = 'UNK';
    if (gender == 'male') {
      birthGender = 'M';
    }
    if (gender == 'female') {
      birthGender = 'F';
    }
    if (gender == 'other') {
      birthGender = 'OTH';
    }
    const body1 = {
      email: email,
      first_name: firstName,
      last_name: lastName,
      dob: DOB.format('YYYY-MM-DD'),
      gender: gender,
      birthGender: birthGender,
      pin: pin
    };
    let proceed = false;
    const isRegistered = await fetch("/api/couchdb/patients/" + email,
      { method: "GET", headers: {"Content-Type": "application/json"} })
      .then((res) => res.json()).then((json) => json._id);
    if (isRegistered === undefined) {
      const data = await fetch(`/api/couchdb/patients/new`, 
        { method: "POST", headers : {"Content-Type": "application/json"}, body: JSON.stringify(body) })
        .then((res) => res.json());
      if (data.success) {
        proceed = true;
      }
      if (data.error) {
        if (data.reason == "Document update conflict.") {
          setError("An account attached to this email already exists.");
        } else {
          setError(data.reason);
        }
      }
    } else {
      proceed = true;
    }
    if (proceed) {
      setAccountCreated(true);
      setShowProgressBar(true);
      const timer = setInterval(() => {
        setProgress((prevProgress) => (prevProgress >= 100 ? 1 : prevProgress + 1));
        if (progress === 100) {
          clearInterval(timer);
          setShowProgressBar(false);
        }
      }, 500);
      const data1 = await fetch('/api/deploy', 
        { method: "POST", headers : {"Content-Type": "application/json"}, body: JSON.stringify(body1) })
        .then((res) => res.json());
      console.log(data1)
      if (data1.url) {
        setProgress(100);
        setShowProgressBar(false);
      }
      setURL(data1.url);
      setLinkTitle(data1.url);
      setError(data1.error);
      await fetch(`/api/auth/logout`, { method: "POST" });
    }
  };

  if (!email) {
    return (
      <p>Error: No Email Detected</p>
    )
  }

  return (
    <div>
      <h2>New Patient - Create Personal Health Record</h2>
      {!accountCreated ? (
        <div>
          <h4>Validated Email: {email}</h4>
          <p>
            Your email address is used to manage your Trustee and recieve
            notification of activity. We will not share this email address
            beyond our community support and billing activity and you can cancel
            anytime.
          </p>
          <p>
            Your name, date of birth, and gender and 4-digit PIN are only used to create your personal 
            health record. The 4-digit PIN is to encrypt/decrypt your database.
            We will not save or share this information.
          </p>
          <Box
            component="form"
            sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
            noValidate
            autoComplete="off"
            onSubmit={createAccount}
          >
            <FormGroup>
              <FormControlLabel control={
                <Checkbox id="privacy"
                  name="privacy"
                  checked={privacy}
                  onChange={() => setPrivacy(!privacy)}
                />} label="I have read the Privacy Policy and agree." 
              />
            </FormGroup>
            <Grid container spacing={2}>
              <Grid item>
                <TextField variant="standard" 
                  type="text"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  label="First Name"
                  required
                />
              </Grid>
              <Grid item>
                <TextField variant="standard" 
                  type="text"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  label="Last Name"
                  required
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item>
                <DatePicker
                  label="Date of Birth"
                  value={DOB}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item>
                <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="gender">Gender</InputLabel>
                  <Select
                    labelId="gender"
                    name="gender"
                    value={gender}
                    onChange={(e) =>setGender(e.target.value)}
                    required
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                    <MenuItem value="unknown">Unknown</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item>
                <FormControl sx={{ m: 1, width: '25ch' }} variant="standard">
                  <InputLabel htmlFor="standard-adornment-pin">4-digit PIN</InputLabel>
                  <Input
                    id="standard-adornment-pin"
                    name="pin"
                    type={showPassword ? 'text' : 'password'}
                    required
                    inputProps={{ maxLength: 4 }}
                    onChange={handlePIN}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>
              </Grid>
              <Grid item>
                <FormControl sx={{ m: 1, width: '25ch' }} variant="standard">
                  <InputLabel htmlFor="standard-adornment-pin">Confirm 4-digit PIN</InputLabel>
                  <Input
                    id="standard-adornment-pin"
                    name="pin"
                    type={showPassword ? 'text' : 'password'}
                    required
                    inputProps={{ maxLength: 4 }}
                    onChange={handleConfirm}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>
              </Grid>
            </Grid>
            <Stack spacing={1}>
              <Button variant="contained" type="submit" className="btn btn-submit">
                Submit
              </Button>
            </Stack>
          </Box>
          {error != "" && (
            <div>
              <p style={{ color: "red" }}>Error: {error}</p>
              <Button variant="contained" component="a" href="/myTrustee">Sign-in to manage your records access policies</Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {showProgressBar ? (
            <div>
              <p>Your personal health record is being built...</p>
              <Box sx={{ width: '100%' }}>
                <LinearProgressWithLabel value={progress} />
              </Box>
            </div>
          ) : (
            <div>
              <p>Your Trustee Account is now Active!</p>
              <p>After 30 days, an email will ask you to provide payment information for your subscription.</p>
              <p>Your personal health record is <Link href={url} target="_blank">{linkTitle}</Link></p>
              <Button variant="contained" component="a" href="/myTrustee">Continue to review and modify the policies that control your Trustee.</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const getServerSideProps = withIronSessionSsr(async function ({
  req,
  res,
  resolvedUrl
}) {
    if (!isLoggedIn(req)) {
      return {
        redirect: {
          destination: `/?from=${encodeURIComponent(resolvedUrl)}`,
          permanent: false
        }
      };
    }
    return {
      props: {
        userId: req.session.userId ?? null
      }
    };
  },
  sessionOptions
);

export default NewPatient;

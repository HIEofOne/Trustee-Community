import * as React from "react";
import Login from "../components/magicLink/login";
import { withIronSessionSsr } from "iron-session/next";
import { generateChallenge } from "../lib/auth";
import { sessionOptions } from "../lib/session";

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

//Landing Page
const Home = ({ challenge }: { challenge: string }) => {
  const [expanded, setExpanded] = React.useState<string | false>('panel1');
  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };
  const getStarted = React.useCallback(async() => {
    const resources = await fetch("/api/start",
      { method: "GET", headers: {"Content-Type": "application/json"} })
      .then((res) => res.json());
    console.log(resources);
  }, []);
  
  React.useEffect(() => {
    getStarted().catch(console.error);
  },[getStarted]);
  
  return (
    <div>
      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0, fontWeight: 'bold' }}>
            Patients
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Login challenge={challenge} authonly={false}/>
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0, fontWeight: 'bold' }}>
            Clinicians and Care Team
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Button variant="contained" component="a" href="/getCredentials">
              Get standard access credentials for patients in this community
            </Button>
            <Button variant="contained" component="a" href="/requestAccess">
              Request access to patient records
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0, fontWeight: 'bold' }}>
          Patient Community Organizers
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Trustee Community software is Free and Open Source. Please visit our <Link href="https://github.com/OliverMoscow/HIEofOne-demo" target="_blank" rel="noreferrer">GitHub wiki</Link> to start your own patient community. You will be able to set your own privacy policy and sponsor or charge for services.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export const getServerSideProps = withIronSessionSsr(async function ({
  req,
  res,
}) {
  const challenge = generateChallenge();
  req.session.challenge = challenge;
  await req.session.save();
  return { props: { challenge } };
},
sessionOptions);

export default Home;

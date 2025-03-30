import * as React from 'react';
import Login from '../components/magicLink/login';
import { getIronSession } from "iron-session";
import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { SessionData, sessionOptions } from '../lib/session';
import { generateChallenge } from '../lib/auth';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

//Landing Page
const Home = ({
  session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
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
          <Login challenge={session.challenge} clinical={false} authonly={false}/>
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
          <Login challenge={session.challenge} clinical={true} authonly={false}/>
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

export const getServerSideProps = (async (context) => {
  const session = await getIronSession<SessionData>(
    context.req,
    context.res,
    sessionOptions,
  );
  const challenge = generateChallenge();
  session.challenge = challenge;
  await session.save();
  return { props: { session } };
}) satisfies GetServerSideProps<{
  session: SessionData;
}>;

export default Home;

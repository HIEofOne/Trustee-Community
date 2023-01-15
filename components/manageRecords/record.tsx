import { useEffect } from "react";
import records from "../../pages/api/couchdb/records/[email]";

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

//Component for rendering records in manage record page
export default function Record(props:any) {
  const { data, action } = props;
  if (data.scope) {
    return (
      <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
            {data.id}
          </Typography>
          <Typography variant="h5" component="div">
            {data.name} - {data.date}
          </Typography>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            {data.scope.join(", ")}
          </Typography>
          <Typography variant="body2">
            {data.url}
          </Typography>
        </CardContent>
        <CardActions>
        <Button onClick={() => action("editRecord", data)}>Edit</Button>
        </CardActions>
      </Card>
    );
  } else {
    return <div></div>
  }
  
}

import { Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      <Typography variant="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" paragraph>
        The page you are looking for does not exist.
      </Typography>
      <Button component={Link} to="/" variant="contained" color="primary">
        Go to Home
      </Button>
    </Box>
  );
}

export default NotFoundPage;

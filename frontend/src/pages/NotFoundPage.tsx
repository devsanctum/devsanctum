import { Box, Heading, Text, Button } from '@primer/react';
import { useNavigate } from 'react-router-dom';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 3,
        textAlign: 'center',
      }}
    >
      <Heading as="h1" sx={{ fontSize: 8, color: 'fg.muted' }}>
        404
      </Heading>
      <Heading as="h2" sx={{ fontSize: 4 }}>
        Page Not Found
      </Heading>
      <Text as="p" sx={{ color: 'fg.muted' }}>
        The page you are looking for does not exist.
      </Text>
      <Button variant="primary" onClick={() => navigate('/')}>
        Go to Home
      </Button>
    </Box>
  );
}

export default NotFoundPage;

import { Box, Heading, Text, Flash, Spinner } from '@primer/react';
import { useEffect, useState } from 'react';

interface HealthStatus {
  status: string;
  timestamp: string;
  environment: string;
  database: string;
}

function HomePage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Box>
      <Heading as="h1" sx={{ mb: 2 }}>
        Welcome to DevSanctum
      </Heading>
      <Text as="p" sx={{ color: 'fg.muted', mb: 4 }}>
        A simplified self-hosted developer platform for provisioning and accessing containerized
        development environments.
      </Text>

      <Box
        sx={{
          p: 3,
          mt: 3,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'border.default',
          borderRadius: 2,
          bg: 'canvas.subtle',
        }}
      >
        <Heading as="h2" sx={{ fontSize: 3, mb: 3 }}>
          Backend Status
        </Heading>
        {error && (
          <Flash variant="danger">Error connecting to backend: {error}</Flash>
        )}
        {health && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Text><Text sx={{ fontWeight: 'bold' }}>Status:</Text> {health.status}</Text>
            <Text><Text sx={{ fontWeight: 'bold' }}>Environment:</Text> {health.environment}</Text>
            <Text><Text sx={{ fontWeight: 'bold' }}>Database:</Text> {health.database}</Text>
            <Text sx={{ color: 'fg.muted', fontSize: 0 }}>Last check: {health.timestamp}</Text>
          </Box>
        )}
        {!health && !error && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Spinner size="small" />
            <Text>Loading...</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default HomePage;

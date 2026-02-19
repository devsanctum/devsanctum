import { Typography, Box, Paper } from '@mui/material';
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
      <Typography variant="h3" gutterBottom>
        Welcome to DevSanctum
      </Typography>
      <Typography variant="body1" paragraph>
        A simplified self-hosted developer platform for provisioning and accessing containerized
        development environments.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Backend Status
        </Typography>
        {error && (
          <Typography color="error">Error connecting to backend: {error}</Typography>
        )}
        {health && (
          <Box>
            <Typography>Status: {health.status}</Typography>
            <Typography>Environment: {health.environment}</Typography>
            <Typography>Database: {health.database}</Typography>
            <Typography variant="caption">Last check: {health.timestamp}</Typography>
          </Box>
        )}
        {!health && !error && <Typography>Loading...</Typography>}
      </Paper>
    </Box>
  );
}

export default HomePage;

import { Outlet } from 'react-router-dom';
import { Box, Header, Text, PageLayout } from '@primer/react';
import { MarkGithubIcon } from '@primer/octicons-react';

function MainLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header>
        <Header.Item>
          <Header.Link href="/" sx={{ fontSize: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
            <MarkGithubIcon size={32} />
            DevSanctum
          </Header.Link>
        </Header.Item>
        <Header.Item full />
      </Header>
      <PageLayout containerWidth="xlarge" sx={{ flex: 1 }}>
        <PageLayout.Content>
          <Outlet />
        </PageLayout.Content>
      </PageLayout>
      <Box
        as="footer"
        sx={{
          py: 3,
          px: 4,
          mt: 'auto',
          borderTopWidth: 1,
          borderTopStyle: 'solid',
          borderTopColor: 'border.default',
          textAlign: 'center',
        }}
      >
        <Text sx={{ color: 'fg.muted', fontSize: 1 }}>
          DevSanctum © {new Date().getFullYear()}
        </Text>
      </Box>
    </Box>
  );
}

export default MainLayout;

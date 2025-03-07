// src/components/layout/NavigationItems.tsx
import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationItem {
  icon: string;
  title: string;
  route: string;
}

const navigationItems: NavigationItem[] = [
  { icon: "/img/menu-icon-catalog2.png", title: "Agent Catalog", route: "/agents" },
  { icon: "/img/menu-icon-builder.png", title: "Agent Builder", route: "/builder" },
  { icon: "/img/menu-icon-operator.png", title: "Agent Operator", route: "/operator" },
  { icon: "/img/menu-icon-accountant.png", title: "Accountant", route: "/accountant" },
  { icon: "/img/menu-icon-self-service.png", title: "Self-Service", route: "/self-service" }
];

export const NavigationItems = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#f7f0dd',
        py: 2,
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Stack
        direction="row"
        spacing={4}
        justifyContent="center"
        alignItems="center"
      >
        {navigationItems.map((item, index) => (
          <Box
            key={index}
            onClick={() => navigate(item.route)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
              // Highlight active route
              ...(location.pathname === item.route && {
                '& .MuiTypography-root': {
                  fontWeight: 700,
                  color: 'primary.main',
                },
              }),
            }}
          >
            <img
              src={`${item.icon}`}
              alt={item.title}
              style={{
                width: '58px',
                marginBottom: '0px',
              }}
            />
            <Typography
              variant="caption"
              align="center"
              sx={{
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {item.title}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
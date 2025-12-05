/**
 * Sidebar Layout Component
 * Main layout with collapsible sidebar navigation
 */

'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BoltIcon from '@mui/icons-material/Bolt';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import KitchenIcon from '@mui/icons-material/Kitchen';
import BathtubIcon from '@mui/icons-material/Bathtub';
import ComputerIcon from '@mui/icons-material/Computer';
import HotelIcon from '@mui/icons-material/Hotel';
import PropaneTankIcon from '@mui/icons-material/PropaneTank';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Image from 'next/image';

const DRAWER_WIDTH = 240;

interface NavigationItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  {
    text: 'Klima inHouse',
    icon: <ThermostatIcon />,
    path: '/climate',
    children: [
      { text: 'Küche', icon: <KitchenIcon />, path: '/climate/kueche' },
      { text: 'Bad', icon: <BathtubIcon />, path: '/climate/bad' },
      { text: 'Büro', icon: <ComputerIcon />, path: '/climate/buero' },
      { text: 'Schlafen', icon: <HotelIcon />, path: '/climate/schlafen' },
      { text: 'Aussen', icon: <WbSunnyIcon />, path: '/climate/aussen' },
    ],
  },
  { text: 'Heizung', icon: <LocalFireDepartmentIcon />, path: '/heating' },
  { text: 'Strom', icon: <BoltIcon />, path: '/solar' },
  { text: 'Wasser', icon: <WaterDropIcon />, path: '/wasser' },
  { text: 'Gas', icon: <PropaneTankIcon />, path: '/gas' },
  { text: 'Wetter', icon: <WbSunnyIcon />, path: '/weather' },
];

interface SidebarLayoutProps {
  children: React.ReactNode;
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}

export function SidebarLayout({ children, mode, onToggleMode }: SidebarLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [climateOpen, setClimateOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Auto-expand climate menu if on a climate subpage
  React.useEffect(() => {
    if (pathname.startsWith('/climate')) {
      setClimateOpen(true);
    }
  }, [pathname]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setOpen(false);
    }
  };

  const handleClimateToggle = () => {
    setClimateOpen(!climateOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ marginRight: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1.5 }}>
            <Image
              src="/favicon.png"
              alt="CMI Logo"
              width={40}
              height={40}
              style={{ objectFit: 'contain' }}
            />
            <Typography variant="h6" noWrap component="div">
              Dashboard
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={onToggleMode}>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            overflow: 'auto',
            flexGrow: 1,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              aspectRatio: '1 / 1',
              backgroundImage: 'url(/favicon.png)',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.08,
              pointerEvents: 'none',
              zIndex: 0,
            },
          }}
        >
          <List sx={{ position: 'relative', zIndex: 1 }}>
            {navigationItems.map((item) => (
              <React.Fragment key={item.text}>
                {item.children ? (
                  // Item with submenu (Klima inHouse)
                  <>
                    <ListItem disablePadding>
                      <ListItemButton
                        selected={pathname === item.path}
                        onClick={() => handleNavigation(item.path)}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItemButton>
                      <IconButton
                        size="small"
                        onClick={handleClimateToggle}
                        sx={{ mr: 1 }}
                      >
                        {climateOpen ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </ListItem>
                    <Collapse in={climateOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.children.map((child) => (
                          <ListItemButton
                            key={child.text}
                            selected={pathname === child.path}
                            onClick={() => handleNavigation(child.path)}
                            sx={{ pl: 4 }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>{child.icon}</ListItemIcon>
                            <ListItemText primary={child.text} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  </>
                ) : (
                  // Regular item
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={pathname === item.path}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : open ? 0 : `-${DRAWER_WIDTH}px`,
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

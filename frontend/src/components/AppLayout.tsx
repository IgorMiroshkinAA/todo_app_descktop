import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Box,
    Switch,
    Tooltip,
    Button,
} from '@mui/material';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NoteIcon from '@mui/icons-material/Note';
import NotebookIcon from '@mui/icons-material/Book';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

const drawerWidth = 240;

const menuItems = [
    { text: 'Дашборд', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Задачи', icon: <AssignmentIcon />, path: '/' },
    { text: 'Записные книжки', icon: <NotebookIcon />, path: '/notebooks' },
    { text: 'Заметки', icon: <NoteIcon />, path: '/notes' },
    { text: 'Календарь', icon: <CalendarTodayIcon />, path: '/calendar' },
];

const AppLayout: React.FC = () => {
    const { mode, toggleTheme } = useTheme();
    const isDarkMode = mode === 'dark';

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" noWrap component="div">
                        Tempo
                    </Typography>
                    <NotificationBell />
                </Toolbar>

                <List>
                    {menuItems.map((item) => (
                        <ListItem
                            key={item.text}
                            component={NavLink}
                            to={item.path}
                            sx={{
                                '&.active': {
                                    backgroundColor: isDarkMode
                                        ? 'rgba(255, 255, 255, 0.12)'
                                        : 'rgba(0, 0, 0, 0.08)',
                                },
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ flexGrow: 1 }} />

                {user && (
                    <Box sx={{ px: 2, pb: 1 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: isDarkMode
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'rgba(0,0,0,0.04)',
                            }}
                        >
                            <PersonIcon fontSize="small" />
                            <Box sx={{ overflow: 'hidden', flex: 1 }}>
                                <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                                    {user.name || user.email}
                                </Typography>
                                {user.name && (
                                    <Typography
                                        variant="caption"
                                        color="textSecondary"
                                        noWrap
                                        component="div"
                                    >
                                        {user.email}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                )}

                <Box sx={{ px: 2, pb: 1 }}>
                    <Tooltip title="Выйти из аккаунта">
                        <Button
                            fullWidth
                            startIcon={<LogoutIcon />}
                            onClick={handleLogout}
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ textTransform: 'none' }}
                        >
                            Выйти
                        </Button>
                    </Tooltip>
                </Box>

                <Box
                    sx={{
                        px: 2,
                        pb: 2,
                        pt: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid',
                        borderColor: isDarkMode ? '#333' : '#e0e0e0',
                    }}
                >
                    <Tooltip title={isDarkMode ? 'Светлая тема' : 'Тёмная тема'}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Brightness7Icon fontSize="small" />
                            <Switch
                                checked={isDarkMode}
                                onChange={toggleTheme}
                                size="small"
                            />
                            <Brightness4Icon fontSize="small" />
                        </Box>
                    </Tooltip>
                </Box>
            </Drawer>

            {/* Основной контент — используем Outlet */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default AppLayout;
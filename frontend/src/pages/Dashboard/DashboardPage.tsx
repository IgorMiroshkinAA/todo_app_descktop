import React, { useEffect, useState } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    LinearProgress,
    Card,
    CardContent,
    Divider,
    IconButton,
    Tooltip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
} from '@mui/material';
import {
    Assignment as TaskIcon,
    CheckCircle as DoneIcon,
    Pending as PendingIcon,
    Note as NoteIcon,
    Description as NotebookIcon,
    Event as EventIcon,
    Refresh as RefreshIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { taskService } from '../../services/taskService';
import { noteService } from '../../services/noteService';
import { notebookService } from '../../services/notebookService';
import { eventService } from '../../services/eventService';
import type { Task } from '../../types/task';
import type { Event } from '../../types/event';
import useSnackbar from '../../hooks/useSnackbar';

const DashboardPage: React.FC = () => {
    const { showError } = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        totalNotes: 0,
        totalNotebooks: 0,
        totalEvents: 0,
    });
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

    useEffect(() => {
        loadStats();

        const handleFocus = () => loadStats();
        window.addEventListener('focus', handleFocus);

        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const [tasks, notes, notebooks, events] = await Promise.all([
                taskService.getAll(),
                noteService.getAll(),
                notebookService.getAll(),
                eventService.getAll(),
            ]);

            const now = new Date();

            // Считаем по status
            const completedTasks = tasks.filter((t) => t.status === 'done');
            const pendingTasks = tasks.filter((t) => t.status !== 'done');
            const overdue = tasks.filter(
                (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
            );

            // Ближайшие встречи (только будущие)
            const upcoming = events
                .filter((e) => new Date(e.startTime) >= now)
                .sort(
                    (a, b) =>
                        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                )
                .slice(0, 5);

            setStats({
                totalTasks: tasks.length,
                completedTasks: completedTasks.length,
                pendingTasks: pendingTasks.length,
                overdueTasks: overdue.length,
                totalNotes: notes.length,
                totalNotebooks: notebooks.length,
                totalEvents: events.length,
            });

            setUpcomingEvents(upcoming);
        } catch (error) {
            console.error('Failed to load stats:', error);
            showError('Не удалось загрузить статистику');
        } finally {
            setLoading(false);
        }
    };

    const completionRate =
        stats.totalTasks > 0
            ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
            : 0;

    // Форматирование даты встречи
    const formatEventDate = (isoString: string): string => {
        const date = new Date(isoString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const eventDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

        const timeStr = date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
        });

        if (eventDate.getTime() === today.getTime()) {
            return `Сегодня, ${timeStr}`;
        }
        if (eventDate.getTime() === tomorrow.getTime()) {
            return `Завтра, ${timeStr}`;
        }

        return `${date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
        })}, ${timeStr}`;
    };

    // Цвет типа встречи
    const getEventColor = (type: string): string => {
        switch (type) {
            case 'meeting':
                return '#9c27b0';
            case 'call':
                return '#2196f3';
            case 'appointment':
                return '#ff9800';
            default:
                return '#9e9e9e';
        }
    };

    // Название типа встречи
    const getEventTypeLabel = (type: string): string => {
        switch (type) {
            case 'meeting':
                return 'Встреча';
            case 'call':
                return 'Звонок';
            case 'appointment':
                return 'Приём';
            default:
                return 'Другое';
        }
    };

    const StatCard: React.FC<{
        title: string;
        value: number;
        icon: React.ReactNode;
        color: string;
    }> = ({ title, value, icon, color }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            bgcolor: `${color}20`,
                            borderRadius: 2,
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {icon}
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            {value}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {title}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                }}
            >
                <Box>
                    <Typography variant="h4" gutterBottom>
                        📊 Панель управления
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Общая статистика ваших задач, заметок и встреч
                    </Typography>
                </Box>
                <Tooltip title="Обновить">
                    <IconButton onClick={loadStats} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Grid container spacing={3}>
                {/* Карточки статистики */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Всего задач"
                        value={stats.totalTasks}
                        icon={<TaskIcon sx={{ color: '#1976d2' }} />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Выполнено"
                        value={stats.completedTasks}
                        icon={<DoneIcon sx={{ color: '#4caf50' }} />}
                        color="#4caf50"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="В работе"
                        value={stats.pendingTasks}
                        icon={<PendingIcon sx={{ color: '#ff9800' }} />}
                        color="#ff9800"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Просрочено"
                        value={stats.overdueTasks}
                        icon={<PendingIcon sx={{ color: '#f44336' }} />}
                        color="#f44336"
                    />
                </Grid>

                {/* Прогресс выполнения */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Прогресс выполнения
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                mt: 2,
                            }}
                        >
                            <Box sx={{ flex: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={completionRate}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                            </Box>
                            <Typography variant="h6" fontWeight="bold">
                                {completionRate}%
                            </Typography>
                        </Box>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mt: 1 }}
                        >
                            {stats.completedTasks} из {stats.totalTasks} задач выполнено
                        </Typography>
                    </Paper>
                </Grid>

                {/* Заметки и книжки */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Заметки и книжки
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
                            <Box>
                                <Typography variant="h4" fontWeight="bold">
                                    {stats.totalNotes}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    <NoteIcon
                                        sx={{
                                            fontSize: 16,
                                            verticalAlign: 'middle',
                                            mr: 0.5,
                                        }}
                                    />
                                    Всего заметок
                                </Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Box>
                                <Typography variant="h4" fontWeight="bold">
                                    {stats.totalNotebooks}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    <NotebookIcon
                                        sx={{
                                            fontSize: 16,
                                            verticalAlign: 'middle',
                                            mr: 0.5,
                                        }}
                                    />
                                    Записных книжек
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Ближайшие встречи */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2,
                            }}
                        >
                            <Typography variant="h6">
                                📅 Ближайшие встречи
                            </Typography>
                            {stats.totalEvents > 0 && (
                                <Chip
                                    label={`Всего: ${stats.totalEvents}`}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Box>

                        {upcomingEvents.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <CalendarIcon
                                    sx={{
                                        fontSize: 48,
                                        color: 'text.disabled',
                                        mb: 1,
                                    }}
                                />
                                <Typography color="textSecondary">
                                    Нет предстоящих встреч
                                </Typography>
                            </Box>
                        ) : (
                            <List>
                                {upcomingEvents.map((event) => (
                                    <ListItem
                                        key={event.id}
                                        sx={{
                                            borderLeft: `4px solid ${getEventColor(event.type)}`,
                                            mb: 1,
                                            borderRadius: 1,
                                            bgcolor: 'background.default',
                                        }}
                                    >
                                        <ListItemIcon>
                                            <EventIcon
                                                sx={{ color: getEventColor(event.type) }}
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={event.title}
                                            secondary={
                                                <>
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: getEventColor(event.type),
                                                        }}
                                                    >
                                                        {formatEventDate(event.startTime)}
                                                    </Typography>
                                                    {event.location && (
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color="textSecondary"
                                                        >
                                                            {' • '}
                                                            {event.location}
                                                        </Typography>
                                                    )}
                                                </>
                                            }
                                        />
                                        <Chip
                                            label={getEventTypeLabel(event.type)}
                                            size="small"
                                            sx={{
                                                bgcolor: `${getEventColor(event.type)}20`,
                                                color: getEventColor(event.type),
                                                fontWeight: 500,
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default DashboardPage;
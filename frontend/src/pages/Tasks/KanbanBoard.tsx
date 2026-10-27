import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
    DndContext,
    closestCorners,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { taskService } from '../../services/taskService';
import type { Task, TaskStatus } from '../../types/task';
import KanbanColumn from './KanbanColumn';
import ConfirmDialog from '../../components/ConfirmDialog';
import useSnackbar from '../../hooks/useSnackbar';
import ExportImportMenu from '../../components/ExportImportMenu';
import {isoToLocalInput} from "../../utils/dateUtils.ts";

const KanbanBoard: React.FC = () => {
    const { showSuccess, showError } = useSnackbar();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Фильтры
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [priorityFilter, setPriorityFilter] = useState<string>('');
    const [dateFilter, setDateFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Диалог создания задачи
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');

    // Диалог редактирования задачи
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // ConfirmDialog
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        id?: number;
        title: string;
        message: string;
    }>({
        open: false,
        title: '',
        message: '',
    });

    // Настройка сенсоров для DnD
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const loadTasks = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (statusFilter) params.status = statusFilter;
            if (priorityFilter) params.priority = priorityFilter;
            if (dateFilter) params.dateFilter = dateFilter;
            if (searchQuery) params.search = searchQuery;

            const data = await taskService.getAll(params);
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            showError('Не удалось загрузить задачи');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [statusFilter, priorityFilter, dateFilter, searchQuery]);

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim()) {
            showError('Введите название задачи');
            return;
        }
        try {
            await taskService.create({
                title: newTaskTitle,
                description: newTaskDescription,
                priority: newTaskPriority,
                dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
                status: 'todo',
            });
            setOpenCreateDialog(false);
            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskPriority('medium');
            setNewTaskDueDate('');
            showSuccess('Задача создана');
            loadTasks();
        } catch (error) {
            console.error('Failed to create task:', error);
            showError('Не удалось создать задачу');
        }
    };

    const handleUpdateTaskStatus = async (taskId: number, newStatus: TaskStatus) => {
        try {
            await taskService.update(taskId, { status: newStatus });
            loadTasks();
        } catch (error) {
            console.error('Failed to update task status:', error);
            showError('Не удалось обновить статус задачи');
        }
    };

    const handleToggleComplete = async (task: Task) => {
        try {
            const newStatus = task.status === 'done' ? 'todo' : 'done';
            await taskService.update(task.id, {
                completed: !task.completed,
                status: newStatus,
            });
            loadTasks();
        } catch (error) {
            console.error('Failed to toggle complete:', error);
            showError('Не удалось изменить статус задачи');
        }
    };

    const handleDeleteClick = (id: number, title: string) => {
        setConfirmDialog({
            open: true,
            id,
            title: 'Удалить задачу?',
            message: `Вы уверены, что хотите удалить задачу "${title}"? Это действие нельзя отменить.`,
        });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDialog.id) return;
        setDeleteLoading(true);
        try {
            await taskService.delete(confirmDialog.id);
            showSuccess('Задача удалена');
            loadTasks();
        } catch (error) {
            console.error('Failed to delete task:', error);
            showError('Не удалось удалить задачу');
        } finally {
            setDeleteLoading(false);
            setConfirmDialog({ open: false, title: '', message: '' });
        }
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ open: false, title: '', message: '' });
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setOpenEditDialog(true);
    };

    const handleSaveTask = async () => {
        if (!editingTask) return;
        try {
            await taskService.update(editingTask.id, {
                title: editingTask.title,
                description: editingTask.description,
                dueDate: editingTask.dueDate,
                priority: editingTask.priority,
            });
            setOpenEditDialog(false);
            setEditingTask(null);
            showSuccess('Задача обновлена');
            loadTasks();
        } catch (error) {
            console.error('Failed to save task:', error);
            showError('Не удалось обновить задачу');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const taskId = active.id as number;
        const overId = String(over.id);

        if (!overId.startsWith('column-')) {
            console.log('Not a column drop, ignoring');
            return;
        }

        const newStatus = overId.replace('column-', '') as TaskStatus;

        const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'done'];
        if (!validStatuses.includes(newStatus)) {
            console.error('Invalid status:', newStatus);
            return;
        }

        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        if (task.status === newStatus) return;

        await handleUpdateTaskStatus(taskId, newStatus);
    };

    const getTasksByStatus = (status: TaskStatus) => {
        return tasks.filter((task) => task.status === status);
    };

    const handleExportTasksJson = async () => {
        try {
            const tasks = await taskService.exportTasks();
            const jsonStr = JSON.stringify(tasks, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tasks_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showSuccess('Задачи экспортированы');
        } catch (error) {
            console.error('Failed to export tasks:', error);
            showError('Не удалось экспортировать задачи');
        }
    };

    const handleExportTasksExcel = async () => {
        try {
            const blob = await taskService.exportTasksExcel();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tasks_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showSuccess('Excel-файл скачан');
        } catch (error) {
            console.error('Failed to export Excel:', error);
            showError('Не удалось экспортировать в Excel');
        }
    };

    const handleImportTasks = async (data: any[]) => {
        try {
            const response = await taskService.importTasks(data);
            showSuccess(`Импортировано: ${response.imported}, пропущено: ${response.skipped}`);
            loadTasks();
        } catch (error) {
            console.error('Failed to import tasks:', error);
            showError('Не удалось импортировать задачи');
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4">Канбан-доска</Typography>
                    <Box>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenCreateDialog(true)}
                            sx={{ mr: 1 }}
                        >
                            Создать задачу
                        </Button>
                        <ExportImportMenu
                            onExportJson={handleExportTasksJson}
                            onExportExcel={handleExportTasksExcel}
                            onImport={handleImportTasks}
                        />
                        <Tooltip title="Обновить">
                            <IconButton onClick={loadTasks} disabled={loading}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        placeholder="Поиск по названию..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 200 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Статус</InputLabel>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            label="Статус"
                        >
                            <MenuItem value="">Все</MenuItem>
                            <MenuItem value="todo">К выполнению</MenuItem>
                            <MenuItem value="in_progress">В процессе</MenuItem>
                            <MenuItem value="done">Завершённые</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Приоритет</InputLabel>
                        <Select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            label="Приоритет"
                        >
                            <MenuItem value="">Все</MenuItem>
                            <MenuItem value="low">Низкий</MenuItem>
                            <MenuItem value="medium">Средний</MenuItem>
                            <MenuItem value="high">Высокий</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Дата</InputLabel>
                        <Select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            label="Дата"
                        >
                            <MenuItem value="">Все</MenuItem>
                            <MenuItem value="today">Сегодня</MenuItem>
                            <MenuItem value="tomorrow">Завтра</MenuItem>
                            <MenuItem value="overdue">Просроченные</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <DndContext
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
                sensors={sensors}
            >
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                    <KanbanColumn
                        title="К выполнению"
                        status="todo"
                        tasks={getTasksByStatus('todo')}
                        onUpdateStatus={handleUpdateTaskStatus}
                        onToggleComplete={handleToggleComplete}
                        onDeleteTask={handleDeleteClick}
                        onEditTask={handleEditTask}
                    />
                    <KanbanColumn
                        title="В процессе"
                        status="in_progress"
                        tasks={getTasksByStatus('in_progress')}
                        onUpdateStatus={handleUpdateTaskStatus}
                        onToggleComplete={handleToggleComplete}
                        onDeleteTask={handleDeleteClick}
                        onEditTask={handleEditTask}
                    />
                    <KanbanColumn
                        title="Завершённые"
                        status="done"
                        tasks={getTasksByStatus('done')}
                        onUpdateStatus={handleUpdateTaskStatus}
                        onToggleComplete={handleToggleComplete}
                        onDeleteTask={handleDeleteClick}
                        onEditTask={handleEditTask}
                    />
                </Box>
            </DndContext>

            {/* Диалоги */}
            <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Создать задачу</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Название"
                        fullWidth
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Описание"
                        fullWidth
                        multiline
                        rows={3}
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                    />
                    {/* 👇 ДОБАВИТЬ ЭТО ПОЛЕ */}
                    <TextField
                        margin="dense"
                        label="Срок выполнения"
                        type="datetime-local"
                        fullWidth
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    {/* 👆 КОНЕЦ ДОБАВЛЕНИЯ */}
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Приоритет</InputLabel>
                        <Select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                            label="Приоритет"
                        >
                            <MenuItem value="low">Низкий</MenuItem>
                            <MenuItem value="medium">Средний</MenuItem>
                            <MenuItem value="high">Высокий</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreateDialog(false)}>Отмена</Button>
                    <Button onClick={handleCreateTask} variant="contained">
                        Создать
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Редактировать задачу</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Название"
                        fullWidth
                        value={editingTask?.title || ''}
                        onChange={(e) => setEditingTask((prev) =>
                            prev ? { ...prev, title: e.target.value } : null
                        )}
                    />
                    <TextField
                        margin="dense"
                        label="Описание"
                        fullWidth
                        multiline
                        rows={3}
                        value={editingTask?.description || ''}
                        onChange={(e) => setEditingTask((prev) =>
                            prev ? { ...prev, description: e.target.value } : null
                        )}
                    />
                    <TextField
                        margin="dense"
                        label="Срок выполнения"
                        type="datetime-local"
                        fullWidth
                        value={isoToLocalInput(editingTask?.dueDate)}
                        onChange={(e) => setEditingTask((prev) =>
                            prev ? { ...prev, dueDate: e.target.value } : null
                        )}
                        InputLabelProps={{ shrink: true }}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Приоритет</InputLabel>
                        <Select
                            value={editingTask?.priority || 'medium'}
                            onChange={(e) => setEditingTask((prev) =>
                                prev ? { ...prev, priority: e.target.value as 'low' | 'medium' | 'high' } : null
                            )}
                            label="Приоритет"
                        >
                            <MenuItem value="low">Низкий</MenuItem>
                            <MenuItem value="medium">Средний</MenuItem>
                            <MenuItem value="high">Высокий</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditDialog(false)}>Отмена</Button>
                    <Button onClick={handleSaveTask} variant="contained">
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ConfirmDialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                severity="error"
                loading={deleteLoading}
            />
        </Container>
    );
};

export default KanbanBoard;
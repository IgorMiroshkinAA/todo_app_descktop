import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { notebookService } from '../../services/notebookService';
import type { Notebook, CreateNotebookDto, UpdateNotebookDto } from '../../types/notebook';
import ConfirmDialog from '../../components/ConfirmDialog';
import useSnackbar from '../../hooks/useSnackbar';

const NotebooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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

  const loadNotebooks = async () => {
    try {
      const data = await notebookService.getAll();
      setNotebooks(data);
    } catch (error) {
      console.error('Failed to load notebooks:', error);
      showError('Не удалось загрузить записные книжки');
    }
  };

  useEffect(() => {
    loadNotebooks();
  }, []);

  const handleCreate = () => {
    setEditingNotebook(null);
    setName('');
    setDescription('');
    setOpenDialog(true);
  };

  const handleEdit = (notebook: Notebook) => {
    setEditingNotebook(notebook);
    setName(notebook.name);
    setDescription(notebook.description || '');
    setOpenDialog(true);
  };

  const handleSave = async () => {
    const data: CreateNotebookDto = { name, description };
    try {
      if (editingNotebook) {
        await notebookService.update(editingNotebook.id, data);
        showSuccess('Записная книжка обновлена');
      } else {
        await notebookService.create(data);
        showSuccess('Записная книжка создана');
      }
      setOpenDialog(false);
      loadNotebooks();
    } catch (error) {
      console.error('Failed to save notebook:', error);
      showError('Не удалось сохранить записную книжку');
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    setConfirmDialog({
      open: true,
      id,
      title: 'Удалить записную книжку?',
      message: `Вы уверены, что хотите удалить книжку "${name}"? Все заметки внутри также будут удалены. Это действие нельзя отменить.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return;
    setDeleteLoading(true);
    try {
      await notebookService.delete(confirmDialog.id);
      showSuccess('Записная книжка удалена');
      loadNotebooks();
    } catch (error) {
      console.error('Failed to delete notebook:', error);
      showError('Не удалось удалить записную книжку');
    } finally {
      setDeleteLoading(false);
      setConfirmDialog({ open: false, title: '', message: '' });
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, title: '', message: '' });
  };

  const openNotebook = (id: number) => {
    navigate(`/notebooks/${id}/notes`);
  };

  return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Записные книжки</Typography>
          <Button variant="contained" onClick={handleCreate}>
            Создать книжку
          </Button>
        </Box>

        <Grid container spacing={3}>
          {notebooks.map((notebook) => (
              <Grid item xs={12} sm={6} md={4} key={notebook.id}>
                <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: '0.3s',
                      '&:hover': { boxShadow: 6 },
                    }}
                    onClick={() => openNotebook(notebook.id)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                      {notebook.name}
                    </Typography>
                    {notebook.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {notebook.description}
                        </Typography>
                    )}
                  </CardContent>
                  <CardActions onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Редактировать">
                      <IconButton size="small" onClick={() => handleEdit(notebook)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(notebook.id, notebook.name)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
          ))}
        </Grid>

        {/* Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingNotebook ? 'Редактировать книжку' : 'Создать книжку'}</DialogTitle>
          <DialogContent>
            <TextField
                autoFocus
                margin="dense"
                label="Название"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <TextField
                margin="dense"
                label="Описание"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
            <Button onClick={handleSave} variant="contained">
              {editingNotebook ? 'Сохранить' : 'Создать'}
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

export default NotebooksPage;
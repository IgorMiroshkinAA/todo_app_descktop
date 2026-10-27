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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Chip,
  Tabs,
  Tab,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useParams, useNavigate } from 'react-router-dom';
import { noteService } from '../../services/noteService';
import { notebookService } from '../../services/notebookService';
import { attachmentService } from '../../services/attachmentService';
import type { Note, CreateNoteDto, UpdateNoteDto } from '../../types/note';
import type { Attachment } from '../../types/attachment';
import RichTextEditor from '../../components/RichTextEditor';
import RichTextRenderer from '../../components/RichTextRenderer';
import FileUpload from '../../components/FileUpload';
import ConfirmDialog from '../../components/ConfirmDialog';
import useSnackbar from '../../hooks/useSnackbar';
import DownloadIcon from '@mui/icons-material/Download';

type SortOption = 'createdAt_desc' | 'createdAt_asc' | 'title_asc' | 'title_desc';

const NotesPage: React.FC = () => {
  const { notebookId } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebookName, setNotebookName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Диалог
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

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

  const loadNotes = async () => {
    if (!notebookId) return;
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;

      const [sortBy, sortOrder] = sortOption.split('_');
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;

      const data = await noteService.getAllByNotebook(parseInt(notebookId), params);
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
      showError('Не удалось загрузить заметки');
    } finally {
      setLoading(false);
    }
  };

  const loadNotebookName = async () => {
    if (!notebookId) return;
    try {
      const notebook = await notebookService.getById(parseInt(notebookId));
      setNotebookName(notebook.name);
    } catch (error) {
      console.error('Notebook not found');
      navigate('/notebooks');
    }
  };

  const loadAttachments = async (noteId: number) => {
    try {
      const data = await attachmentService.getAllByNote(noteId);
      setAttachments(data);
    } catch (error) {
      console.error('Failed to load attachments:', error);
    }
  };

  useEffect(() => {
    loadNotebookName();
  }, [notebookId]);

  useEffect(() => {
    loadNotes();
  }, [notebookId, searchQuery, sortOption]);

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotes();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreate = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setAttachments([]);
    setPreviewMode('edit');
    setOpenDialog(true);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content || '');
    setPreviewMode('edit');
    setOpenDialog(true);
    loadAttachments(note.id);
  };

  const handleSave = async () => {
    if (!notebookId) return;
    const data: CreateNoteDto = { title, content };
    try {
      if (editingNote) {
        await noteService.update(editingNote.id, data);
        showSuccess('Заметка обновлена');
      } else {
        await noteService.create(parseInt(notebookId), data);
        showSuccess('Заметка создана');
      }
      setOpenDialog(false);
      setAttachments([]);
      loadNotes();
    } catch (error) {
      console.error('Failed to save note:', error);
      showError('Не удалось сохранить заметку');
    }
  };

  const handleDeleteClick = (id: number, title: string) => {
    setConfirmDialog({
      open: true,
      id,
      title: 'Удалить заметку?',
      message: `Вы уверены, что хотите удалить заметку "${title}"? Это действие нельзя отменить.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return;
    setDeleteLoading(true);
    try {
      await noteService.delete(confirmDialog.id);
      showSuccess('Заметка удалена');
      loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
      showError('Не удалось удалить заметку');
    } finally {
      setDeleteLoading(false);
      setConfirmDialog({ open: false, title: '', message: '' });
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, title: '', message: '' });
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setAttachments([]);
  };

  const handleExportDocx = async (note: Note) => {
    try {
      const blob = await noteService.exportDocx(note.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${note.title}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess('Файл .docx скачан');
    } catch (error) {
      console.error('Failed to export docx:', error);
      showError('Не удалось экспортировать заметку');
    }
  };

  return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate('/notebooks')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {notebookName ? `Заметки: ${notebookName}` : 'Заметки'}
          </Typography>
          <Button variant="contained" onClick={handleCreate}>
            Создать заметку
          </Button>
        </Box>

        {/* Поиск и сортировка */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <TextField
              size="small"
              placeholder="Поиск по заметкам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                ),
                endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={clearSearch}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                ),
              }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Сортировка</InputLabel>
            <Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                label="Сортировка"
            >
              <MenuItem value="createdAt_desc">По дате (сначала новые)</MenuItem>
              <MenuItem value="createdAt_asc">По дате (сначала старые)</MenuItem>
              <MenuItem value="title_asc">По названию (А–Я)</MenuItem>
              <MenuItem value="title_desc">По названию (Я–А)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Список заметок */}
        <Grid container spacing={3}>
          {notes.map((note) => (
              <Grid item xs={12} sm={6} md={4} key={note.id}>
                <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: '0.3s',
                      '&:hover': { boxShadow: 6 },
                    }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {note.title}
                    </Typography>

                    <Box sx={{ maxHeight: 150, overflow: 'hidden' }}>
                      <RichTextRenderer content={note.content || ''} />
                    </Box>

                    <Chip
                        label={`📎 ${note.attachments?.length || 0}`}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 2 }}
                        icon={<span>📎</span>}
                    />
                  </CardContent>
                  <CardActions>
                    <Tooltip title="Редактировать">
                      <IconButton size="small" onClick={() => handleEdit(note)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Скачать .docx">
                      <IconButton size="small" onClick={() => handleExportDocx(note)}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(note.id, note.title)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
          ))}
        </Grid>

        {/* Диалог */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{editingNote ? 'Редактировать заметку' : 'Создать заметку'}</DialogTitle>
          <DialogContent>
            <TextField
                autoFocus
                margin="dense"
                label="Заголовок"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <Tabs
                value={previewMode}
                onChange={(_, v) => setPreviewMode(v)}
                sx={{ mt: 2 }}
            >
              <Tab label="Редактирование" value="edit" />
              <Tab label="Предпросмотр" value="preview" />
            </Tabs>

            {previewMode === 'edit' ? (
                <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Начните писать..."
                    minHeight={300}
                />
            ) : (
                <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      minHeight: 200,
                      mt: 1,
                      bgcolor: 'background.default',
                    }}
                >
                  <RichTextRenderer content={content} />
                </Box>
            )}

            {/* Вложения */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  📎 Вложения ({attachments.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {editingNote ? (
                    <FileUpload
                        noteId={editingNote.id}
                        attachments={attachments}
                        onUpload={(attachment) => setAttachments(prev => [...prev, attachment])}
                        onDelete={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
                    />
                ) : (
                    <Typography variant="body2" color="textSecondary">
                      Сохраните заметку, чтобы загружать файлы
                    </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Отмена</Button>
            <Button onClick={handleSave} variant="contained">
              {editingNote ? 'Сохранить' : 'Создать'}
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

export default NotesPage;
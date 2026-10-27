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
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { noteService } from '../../services/noteService';
import { notebookService } from '../../services/notebookService';
import { attachmentService } from '../../services/attachmentService';
import type { Note, CreateNoteDto, UpdateNoteDto } from '../../types/note';
import type { Notebook } from '../../types/notebook';
import type { Attachment } from '../../types/attachment';
import RichTextEditor from '../../components/RichTextEditor';
import RichTextRenderer from '../../components/RichTextRenderer';
import FileUpload from '../../components/FileUpload';
import ConfirmDialog from '../../components/ConfirmDialog';
import useSnackbar from '../../hooks/useSnackbar';
import ExportImportMenu from '../../components/ExportImportMenu';
import DownloadIcon from '@mui/icons-material/Download';

type SortOption = 'createdAt_desc' | 'createdAt_asc' | 'title_asc' | 'title_desc';

const AllNotesPage: React.FC = () => {
  const { showSuccess, showError } = useSnackbar();
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notebookId, setNotebookId] = useState<number>('' as any);
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
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      const [sortBy, sortOrder] = sortOption.split('_');
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;

      const data = await noteService.getAll(params);
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
      showError('Не удалось загрузить заметки');
    } finally {
      setLoading(false);
    }
  };

  const loadNotebooks = async () => {
    try {
      const data = await notebookService.getAll();
      setNotebooks(data);
      if (data.length > 0 && !notebookId) {
        setNotebookId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load notebooks:', error);
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
    loadNotebooks();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadNotes, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, sortOption]);

  const handleCreate = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setAttachments([]);
    if (notebooks.length > 0) setNotebookId(notebooks[0].id);
    setPreviewMode('edit');
    setOpenDialog(true);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content || '');
    setNotebookId(note.notebookId);
    setPreviewMode('edit');
    setOpenDialog(true);
    loadAttachments(note.id);
  };

  const handleSave = async () => {
    if (!notebookId) {
      showError('Выберите записную книжку');
      return;
    }
    const data: CreateNoteDto = { title, content };
    try {
      if (editingNote) {
        const updateData: UpdateNoteDto = { ...data, notebookId };
        await noteService.update(editingNote.id, updateData);
        showSuccess('Заметка обновлена');
      } else {
        await noteService.create(notebookId, data);
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

  const getNotebookName = (id: number) => {
    const nb = notebooks.find((n) => n.id === id);
    return nb ? nb.name : 'Неизвестная книжка';
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setAttachments([]);
  };

  const handleExportNotesJson = async () => {
    try {
      const notes = await noteService.exportNotes();
      const jsonStr = JSON.stringify(notes, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notes_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess('Заметки экспортированы');
    } catch (error) {
      console.error('Failed to export notes:', error);
      showError('Не удалось экспортировать заметки');
    }
  };

  const handleImportNotes = async (data: any[]) => {
    try {
      const response = await noteService.importNotes(data);
      showSuccess(`Импортировано: ${response.imported}, пропущено: ${response.skipped}`);
      loadNotes();
    } catch (error) {
      console.error('Failed to import notes:', error);
      showError('Не удалось импортировать заметки');
    }
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Все заметки</Typography>
          <Button variant="contained" onClick={handleCreate}>
            Создать заметку
          </Button>
          <ExportImportMenu
              onExportJson={handleExportNotesJson}
              onImport={handleImportNotes}
          />
        </Box>

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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                      <Chip
                          label={getNotebookName(note.notebookId)}
                          size="small"
                      />
                      <Chip
                          label={`📎 ${note.attachments?.length || 0}`}
                          size="small"
                          variant="outlined"
                          icon={<span>📎</span>}
                      />
                    </Box>
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

            <FormControl fullWidth margin="dense">
              <InputLabel>Записная книжка</InputLabel>
              <Select
                  value={notebookId}
                  onChange={(e) => setNotebookId(e.target.value as number)}
                  label="Записная книжка"
              >
                {notebooks.map((nb) => (
                    <MenuItem key={nb.id} value={nb.id}>
                      {nb.name}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>

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

export default AllNotesPage;
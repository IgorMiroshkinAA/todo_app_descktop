import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { NotebooksService } from './notebooks.service';
import { CreateNotebookDto } from './dto/create-notebook.dto';
import { UpdateNotebookDto } from './dto/update-notebook.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notebooks')
export class NotebooksController {
  constructor(private readonly notebooksService: NotebooksService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.notebooksService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notebooksService.findOne(user.id, +id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createNotebookDto: CreateNotebookDto) {
    return this.notebooksService.create(user.id, createNotebookDto);
  }

  @Put(':id')
  update(
      @CurrentUser() user: any,
      @Param('id') id: string,
      @Body() updateNotebookDto: UpdateNotebookDto,
  ) {
    return this.notebooksService.update(user.id, +id, updateNotebookDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notebooksService.remove(user.id, +id);
  }
}
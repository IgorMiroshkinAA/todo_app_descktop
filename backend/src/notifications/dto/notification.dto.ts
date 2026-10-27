export class NotificationDto {
    id: number;
    message: string;
    type: 'overdue' | 'upcoming';
    read: boolean;
    taskId: number;
    createdAt: Date;
    task?: {
        id: number;
        title: string;
    };
}
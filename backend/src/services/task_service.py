from typing import List, Optional
from sqlmodel import Session, select
from ..models.task import Task, TaskCreate, TaskUpdate
from uuid import UUID


class TaskService:
    @staticmethod
    def create_task(session: Session, user_id: UUID, task_data: TaskCreate) -> Task:
        """
        Creates a new task for the specified user.

        Args:
            session: Database session
            user_id: UUID of the user
            task_data: Task creation data

        Returns:
            Created Task object
        """
        task = Task.from_orm(task_data)
        task.user_id = user_id
        session.add(task)
        session.commit()
        session.refresh(task)
        return task

    @staticmethod
    def get_tasks(session: Session, user_id: UUID, completed: Optional[bool] = None) -> List[Task]:
        """
        Lists tasks for the specified user.

        Args:
            session: Database session
            user_id: UUID of the user
            completed: Optional status filter (None=all, True=completed, False=pending)

        Returns:
            List of Task objects
        """
        query = select(Task).where(Task.user_id == user_id)

        if completed is not None:
            query = query.where(Task.completed == completed)

        tasks = session.exec(query).all()
        return tasks

    @staticmethod
    def get_task(session: Session, task_id: UUID, user_id: UUID) -> Optional[Task]:
        """
        Gets a specific task by ID for the specified user.

        Args:
            session: Database session
            task_id: UUID of the task
            user_id: UUID of the user

        Returns:
            Task object if found, None otherwise
        """
        task = session.get(Task, task_id)
        if task and task.user_id == user_id:
            return task
        return None

    @staticmethod
    def update_task(session: Session, task_id: UUID, user_id: UUID, task_update: TaskUpdate) -> Optional[Task]:
        """
        Updates a task.

        Args:
            session: Database session
            task_id: UUID of the task to update
            user_id: UUID of the user
            task_update: Task update data

        Returns:
            Updated Task object if successful, None otherwise
        """
        task = session.get(Task, task_id)
        if not task or task.user_id != user_id:
            return None

        update_data = task_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        session.add(task)
        session.commit()
        session.refresh(task)
        return task

    @staticmethod
    def delete_task(session: Session, task_id: UUID, user_id: UUID) -> bool:
        """
        Deletes a task.

        Args:
            session: Database session
            task_id: UUID of the task to delete
            user_id: UUID of the user

        Returns:
            True if deletion was successful, False otherwise
        """
        task = session.get(Task, task_id)
        if not task or task.user_id != user_id:
            return False

        session.delete(task)
        session.commit()
        return True

    @staticmethod
    def complete_task(session: Session, task_id: UUID, user_id: UUID) -> Optional[Task]:
        """
        Marks a task as completed.

        Args:
            session: Database session
            task_id: UUID of the task to complete
            user_id: UUID of the user

        Returns:
            Updated Task object if successful, None otherwise
        """
        return TaskService.update_task(
            session,
            task_id,
            user_id,
            TaskUpdate(completed=True)
        )
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { Pencil, Trash2 } from 'lucide-react';
import api from '../services/api';
import { getErrorMessage } from '../utils/apiError';
import useAuthStore from '../store/useAuthStore';
import { formatDate } from '../utils/dateFormatters';

/** Mirror of backend can_edit_task — HOD in same dept only; President/VP are read-only. */
function canEditTask(user, task) {
  if (!user || user.status !== 'active') return false;
  if (user.is_president || user.is_vice_president) return false;
  if (user.role === 'hod' && user.department_id && user.department_id === task.department_id) return true;
  return false;
}

const SortableTaskItem = ({ id, task, currentUser, onDelete, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const canEdit = canEditTask(currentUser, task);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="glass-panel p-4 mb-3 hover:border-neonBlue transition-colors"
    >
      {/* Drag handle — separate from the action buttons */}
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <Link
          to={`/tasks/${task.id}`}
          onClick={e => e.stopPropagation()}
          className="block no-underline"
        >
          <h4 className="font-semibold text-white">{task.title}</h4>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
          {(task.assigned_to_username || task.assigned_by_username) && (
            <div className="mt-2 text-xs text-gray-400 space-y-0.5">
              {task.assigned_to_username && (
                <div>
                  Assigned to: <span className="text-gray-300 font-medium">{task.assigned_to_username}</span>
                </div>
              )}
              {task.assigned_by_username && (
                <div>
                  Assigned by: <span className="text-gray-300 font-medium">{task.assigned_by_username}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between items-center mt-3 text-xs">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full ${
                task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {task.priority}
              </span>
              {task.deadline ? (
                <span className="text-gray-400">
                  Due: {formatDate(task.deadline)}
                </span>
              ) : (
                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                  No due date
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {canEdit && (
        <div className="flex gap-2 mt-3 pt-2 border-t border-white/10">
          <button
            id={`edit-task-${task.id}`}
            type="button"
            onClick={e => { e.stopPropagation(); onEdit(task); }}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-neonBlue/10 text-neonBlue hover:bg-neonBlue/25 transition-colors"
            title="Edit task"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            id={`delete-task-${task.id}`}
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-colors"
            title="Delete task"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

const TaskColumn = ({ id, title, tasks, currentUser, onDelete, onEdit }) => {
  return (
    <div className="bg-white/5 rounded-2xl p-4 min-w-[300px] border border-white/5">
      <h3 className="font-bold text-lg mb-4 text-gray-200 border-b border-white/10 pb-2">{title}</h3>
      <SortableContext
        id={id}
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-[200px]">
          {tasks.map(task => (
            <SortableTaskItem
              key={task.id}
              id={task.id}
              task={task}
              currentUser={currentUser}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default function TaskBoard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState({
    pending: [],
    in_progress: [],
    in_review: [],
    completed: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/tasks/', { params: { assigned_to_me: true } });
      const allTasks = res.data;
      setTasks({
        pending: allTasks.filter(t => t.status === 'pending'),
        in_progress: allTasks.filter(t => t.status === 'in_progress'),
        in_review: allTasks.filter(t => t.status === 'in_review'),
        completed: allTasks.filter(t => t.status === 'completed'),
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load tasks'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = active.data.current?.sortable?.containerId;
    const overContainer = over.data.current?.sortable?.containerId || over.id;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    const activeItem = tasks[activeContainer].find(t => t.id === active.id);

    // Optimistic UI update
    setTasks(prev => {
      const activeItems = prev[activeContainer].filter(t => t.id !== active.id);
      const overItems = [...prev[overContainer], { ...activeItem, status: overContainer }];

      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });

    setIsUpdating(true);
    try {
      await api.put(`/tasks/${active.id}`, { status: overContainer });
      toast.success('Task status updated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update task status'));
      fetchTasks();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This will also remove all its submissions.')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => {
        const next = {};
        for (const col of Object.keys(prev)) {
          next[col] = prev[col].filter(t => t.id !== taskId);
        }
        return next;
      });
      toast.success('Task deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete task'));
    }
  };

  const handleEdit = (task) => {
    navigate('/admin', { state: { editTask: task } });
  };

  if (isLoading) {
    return <p className="text-gray-400 py-8 text-center">Loading tasks...</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className={`flex gap-6 overflow-x-auto pb-4 ${isUpdating ? 'opacity-60 pointer-events-none' : ''}`}>
        <TaskColumn id="pending" title="To Do" tasks={tasks.pending} currentUser={user} onDelete={handleDelete} onEdit={handleEdit} />
        <TaskColumn id="in_progress" title="In Progress" tasks={tasks.in_progress} currentUser={user} onDelete={handleDelete} onEdit={handleEdit} />
        <TaskColumn id="in_review" title="In Review" tasks={tasks.in_review} currentUser={user} onDelete={handleDelete} onEdit={handleEdit} />
        <TaskColumn id="completed" title="Done" tasks={tasks.completed} currentUser={user} onDelete={handleDelete} onEdit={handleEdit} />
      </div>
    </DndContext>
  );
}

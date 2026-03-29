import { useState, useEffect } from 'react';
import { Plus, Calendar, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface TasksTabProps {
  productId: string;
}

const taskCategories = ['Research', 'Formula', 'Packaging', 'Production', 'Marketing', 'Other'];
const priorities = ['high', 'medium', 'low'];
const statuses = ['todo', 'in_progress', 'completed', 'blocked'];

export default function TasksTab({ productId }: TasksTabProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Research',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
    status: 'todo',
  });

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        supabase
          .from('product_tasks')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('*')
          .order('name'),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (usersRes.error) throw usersRes.error;

      setTasks(tasksRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('product_tasks')
        .insert([{
          product_id: productId,
          ...formData,
          created_by: user?.id,
        }]);

      if (error) throw error;

      setFormData({
        title: '',
        description: '',
        category: 'Research',
        assigned_to: '',
        due_date: '',
        priority: 'medium',
        status: 'todo',
      });
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('product_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      todo: { color: 'bg-dark-brown/20 text-dark-brown', text: 'To Do' },
      in_progress: { color: 'bg-accent text-white', text: 'In Progress' },
      completed: { color: 'bg-sage text-white', text: 'Completed' },
      blocked: { color: 'bg-soft-red text-white', text: 'Blocked' },
    };
    return badges[status as keyof typeof badges] || badges.todo;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'border-l-soft-red',
      medium: 'border-l-accent',
      low: 'border-l-sage',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unassigned';
  };

  const groupedTasks = taskCategories.reduce((acc, category) => {
    acc[category] = tasks.filter(t => t.category === category);
    return acc;
  }, {} as Record<string, any[]>);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-2xl font-bold text-primary">Tasks & Checklist</h3>
          <p className="text-dark-brown/60 text-sm mt-1">
            {stats.completed}/{stats.total} tasks completed
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-sage text-white rounded-xl font-semibold hover:shadow-soft transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border-2 border-primary/20">
          <p className="text-sm font-semibold text-dark-brown/70 mb-1">Total Tasks</p>
          <p className="text-3xl font-bold text-primary">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-4 border-2 border-accent/20">
          <p className="text-sm font-semibold text-dark-brown/70 mb-1">In Progress</p>
          <p className="text-3xl font-bold text-accent">{stats.inProgress}</p>
        </div>
        <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-xl p-4 border-2 border-sage/20">
          <p className="text-sm font-semibold text-dark-brown/70 mb-1">Completed</p>
          <p className="text-3xl font-bold text-sage">{stats.completed}</p>
        </div>
        <div className="bg-gradient-to-br from-soft-red/10 to-soft-red/5 rounded-xl p-4 border-2 border-soft-red/20">
          <p className="text-sm font-semibold text-dark-brown/70 mb-1">Overdue</p>
          <p className="text-3xl font-bold text-soft-red">{stats.overdue}</p>
        </div>
      </div>

      <div className="space-y-6">
        {taskCategories.map(category => {
          const categoryTasks = groupedTasks[category] || [];
          if (categoryTasks.length === 0) return null;

          return (
            <div key={category} className="bg-gradient-to-br from-cream/50 to-white rounded-xl p-6 border-2 border-dark-brown/5">
              <h4 className="font-heading text-lg font-bold text-primary mb-4 flex items-center gap-2">
                {category} Tasks
                <span className="px-2 py-1 bg-primary/10 rounded-full text-sm">
                  {categoryTasks.length}
                </span>
              </h4>

              <div className="space-y-3">
                {categoryTasks.map(task => {
                  const badge = getStatusBadge(task.status);
                  const priorityColor = getPriorityColor(task.priority);
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

                  return (
                    <div
                      key={task.id}
                      className={`bg-white p-4 rounded-xl border-l-4 ${priorityColor} shadow-sm hover:shadow-soft transition-all`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={() => handleStatusChange(
                              task.id,
                              task.status === 'completed' ? 'todo' : 'completed'
                            )}
                            className="w-5 h-5 mt-0.5 rounded border-2 border-dark-brown/20 cursor-pointer"
                          />
                          <div className="flex-1">
                            <h5 className={`font-semibold text-dark-brown mb-1 ${
                              task.status === 'completed' ? 'line-through opacity-60' : ''
                            }`}>
                              {task.title}
                            </h5>
                            {task.description && (
                              <p className="text-sm text-dark-brown/70 mb-2">{task.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-dark-brown/60">
                              {task.assigned_to && (
                                <span className="flex items-center gap-1">
                                  <UserIcon className="w-3 h-3" />
                                  {getUserName(task.assigned_to)}
                                </span>
                              )}
                              {task.due_date && (
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-soft-red font-semibold' : ''}`}>
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(task.due_date), 'MMM dd')}
                                  {isOverdue && ' (Overdue)'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color} cursor-pointer`}
                        >
                          {statuses.map(status => (
                            <option key={status} value={status}>
                              {getStatusBadge(status).text}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-16 bg-cream/30 rounded-xl">
          <span className="text-6xl mb-4 block">✅</span>
          <p className="text-dark-brown/60 mb-4">No tasks created yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-sage text-white font-semibold rounded-xl hover:shadow-soft transition-all"
          >
            Create First Task
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-soft-lg max-w-2xl w-full">
            <div className="bg-gradient-to-r from-primary to-sage p-6 rounded-t-2xl">
              <h3 className="font-heading text-2xl font-bold text-white">Add New Task</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Task Title <span className="text-soft-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Complete pH testing"
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-brown mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task description..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  >
                    {taskCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  >
                    {priorities.map(pri => (
                      <option key={pri} value={pri}>{pri.charAt(0).toUpperCase() + pri.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Assign To
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-brown mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-brown/10 rounded-xl focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-dark-brown/5 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-sage text-white font-semibold rounded-xl hover:shadow-soft-lg transition-all"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

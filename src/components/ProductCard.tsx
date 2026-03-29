import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, ArrowRight, Archive, MessageSquare, Paperclip, CheckSquare, Clock } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    category: string;
    product_type?: string;
    description?: string;
    image_url?: string;
    current_stage: string;
    priority: string;
    progress: number;
    stage_entered_at: string;
    assigned_partners: string[];
    target_launch_date?: string;
  };
  users: any[];
  onDragStart: (product: any) => void;
  onEdit: (product: any) => void;
  onMoveNext: (product: any) => void;
}

export default function ProductCard({ product, users, onDragStart, onEdit, onMoveNext }: ProductCardProps) {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  const daysInStage = differenceInDays(new Date(), new Date(product.stage_entered_at));

  const getPriorityBadge = () => {
    const badges = {
      high: { color: 'bg-soft-red', dot: '🔴' },
      medium: { color: 'bg-accent', dot: '🟡' },
      low: { color: 'bg-sage', dot: '🟢' },
    };
    return badges[product.priority as keyof typeof badges] || badges.medium;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Skincare': '✨',
      'Hair Care': '💆',
      'Wellness & Supplements': '🌿',
      'Oral Care': '🦷',
      'Personal Care': '🧴',
      'Home Care': '🏠',
      'Other': '📦',
    };
    return icons[category] || '📦';
  };

  const assignedUsers = users.filter(u => product.assigned_partners.includes(u.id));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const badge = getPriorityBadge();

  return (
    <div
      draggable
      onDragStart={() => onDragStart(product)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="bg-white rounded-xl shadow-soft p-4 mb-3 cursor-move hover:shadow-soft-lg transition-all duration-300 border-2 border-transparent hover:border-accent/30 relative group"
    >
      <div className="absolute top-2 right-2 z-10">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.color} text-white`}>
          {badge.dot} {product.priority.toUpperCase()}
        </span>
      </div>

      {product.image_url ? (
        <div className="w-full h-32 bg-cream/50 rounded-lg mb-3 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-sage/20 to-accent/20 rounded-lg mb-3 flex items-center justify-center">
          <span className="text-5xl">{getCategoryIcon(product.category)}</span>
        </div>
      )}

      <h4 className="font-heading text-lg font-bold text-primary mb-2 pr-16">
        {product.name}
      </h4>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-semibold">
          {product.category}
        </span>
        {product.product_type && (
          <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full">
            {product.product_type}
          </span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-dark-brown/60 font-semibold">Stage Progress</span>
          <span className="text-xs font-bold text-accent">{product.progress}%</span>
        </div>
        <div className="w-full h-2 bg-dark-brown/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sage to-accent transition-all duration-300"
            style={{ width: `${product.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-dark-brown/60 mb-3">
        <Clock className="w-3 h-3" />
        <span className={daysInStage > 30 ? 'text-soft-red font-semibold' : ''}>
          {daysInStage} days in stage
          {daysInStage > 30 && ' ⚠️'}
        </span>
      </div>

      {assignedUsers.length > 0 && (
        <div className="flex items-center gap-1 mb-3">
          {assignedUsers.slice(0, 3).map((user, index) => (
            <div
              key={user.id}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm"
              style={{ marginLeft: index > 0 ? '-8px' : '0', zIndex: 3 - index }}
              title={user.name}
            >
              {getInitials(user.name)}
            </div>
          ))}
          {assignedUsers.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-dark-brown/20 flex items-center justify-center text-xs font-bold text-dark-brown ml-1">
              +{assignedUsers.length - 3}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-dark-brown/60">
        <span className="flex items-center gap-1">
          <CheckSquare className="w-3 h-3" />
          0/0
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          0
        </span>
        <span className="flex items-center gap-1">
          <Paperclip className="w-3 h-3" />
          0
        </span>
      </div>

      {showActions && (
        <div className="absolute inset-0 bg-primary/95 rounded-xl flex items-center justify-center gap-2 p-4">
          <button
            onClick={() => navigate(`/products/${product.id}`)}
            className="flex flex-col items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
          >
            <Eye className="w-5 h-5" />
            <span className="text-xs font-semibold">View</span>
          </button>
          <button
            onClick={() => onEdit(product)}
            className="flex flex-col items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
          >
            <Edit className="w-5 h-5" />
            <span className="text-xs font-semibold">Edit</span>
          </button>
          <button
            onClick={() => onMoveNext(product)}
            className="flex flex-col items-center gap-1 px-3 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-colors text-white"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-xs font-semibold">Next</span>
          </button>
        </div>
      )}
    </div>
  );
}

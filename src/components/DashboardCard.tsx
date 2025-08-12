import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Eye, EyeOff, X, Settings } from 'lucide-react';

interface DashboardCardProps {
  id: string;
  title: string;
  children: React.ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  isDragging: boolean;
  isCustomizing: boolean;
  onPositionChange: (newPosition: { x: number; y: number }) => void;
  onSizeChange: (newSize: { width: number; height: number }) => void;
  onVisibilityToggle: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export default function DashboardCard({
  id,
  title,
  children,
  position,
  size,
  visible,
  isDragging,
  isCustomizing,
  onPositionChange,
  onSizeChange,
  onVisibilityToggle,
  onDragStart,
  onDragEnd
}: DashboardCardProps) {
  const [isBeingDragged, setIsBeingDragged] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  if (!visible && !isCustomizing) {
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCustomizing) return;
    
    e.preventDefault();
    setIsBeingDragged(true);
    onDragStart();
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isBeingDragged || !isCustomizing) return;
    
    e.preventDefault();
    
    // Calculate new position based on grid
    const gridSize = 20;
    const newX = Math.round((e.clientX - dragOffset.x) / gridSize) * gridSize;
    const newY = Math.round((e.clientY - dragOffset.y) / gridSize) * gridSize;
    
    onPositionChange({ x: Math.max(0, newX), y: Math.max(0, newY) });
  };

  const handleMouseUp = () => {
    if (isBeingDragged) {
      setIsBeingDragged(false);
      onDragEnd();
    }
  };

  useEffect(() => {
    if (isBeingDragged) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isBeingDragged, dragOffset]);

  const cardStyle: React.CSSProperties = isCustomizing ? {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: size.width * 100,
    height: size.height * 200,
    zIndex: isBeingDragged ? 1000 : 1,
    opacity: visible ? 1 : 0.5,
    transform: isBeingDragged ? 'scale(1.05)' : 'scale(1)',
    transition: isBeingDragged ? 'none' : 'all 0.2s ease'
  } : {};

  return (
    <div
      ref={cardRef}
      style={cardStyle}
      className={`${isCustomizing ? 'border-2 border-dashed border-blue-500' : ''} ${
        !visible && isCustomizing ? 'opacity-50' : ''
      } ${isBeingDragged ? 'shadow-2xl' : ''} transition-all duration-200`}
    >
      {isCustomizing && (
        <div className="absolute -top-8 left-0 right-0 flex items-center justify-between bg-slate-700 px-2 py-1 rounded-t text-xs">
          <div className="flex items-center space-x-2">
            <button
              onMouseDown={handleMouseDown}
              className="cursor-move text-gray-400 hover:text-white"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <span className="text-white font-medium">{title}</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onVisibilityToggle}
              className="text-gray-400 hover:text-white"
            >
              {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
      
      <div className={`${isCustomizing ? 'pointer-events-none' : ''}`}>
        {children}
      </div>
    </div>
  );
}
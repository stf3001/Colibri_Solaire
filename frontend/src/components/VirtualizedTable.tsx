import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedTableProps {
  items: any[];
  itemHeight: number;
  height: number;
  renderItem: (index: number, item: any) => React.ReactNode;
  className?: string;
}

/**
 * Composant de table virtualisée pour optimiser le rendu de grandes listes
 * Réduit drastiquement l'utilisation mémoire en ne rendant que les éléments visibles
 */
export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  items,
  itemHeight,
  height,
  renderItem,
  className = ""
}) => {
  // Mémoriser les éléments pour éviter les re-renders inutiles
  const memoizedItems = useMemo(() => items, [items]);

  // Composant d'item pour react-window
  const ListItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = memoizedItems[index];
    return (
      <div style={style} className="border-b border-gray-200">
        {renderItem(index, item)}
      </div>
    );
  };

  // Si peu d'éléments, affichage normal (pas besoin de virtualisation)
  if (items.length <= 20) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={index} className="border-b border-gray-200">
            {renderItem(index, item)}
          </div>
        ))}
      </div>
    );
  }

  // Virtualisation pour les grandes listes
  return (
    <div className={className}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={5} // Pré-charger 5 éléments en dehors de la vue
      >
        {ListItem}
      </List>
    </div>
  );
};

/**
 * Hook pour déterminer si la virtualisation est nécessaire
 */
export function useVirtualization(itemCount: number, threshold: number = 50) {
  return useMemo(() => ({
    shouldVirtualize: itemCount > threshold,
    itemCount
  }), [itemCount, threshold]);
}

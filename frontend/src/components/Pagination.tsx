import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo } from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Composant de pagination réutilisable optimisé pour réduire l'utilisation mémoire
 * en limitant le nombre d'éléments affichés par page
 */
export const Pagination = memo<PaginationProps>(({ 
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  className = ""
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Options de taille de page pour optimiser la mémoire
  const pageSizeOptions = [10, 20, 50, 100];

  const handlePrevious = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize);
    if (size !== pageSize) {
      onPageSizeChange(size);
      // Retourner à la page 1 quand on change la taille
      onPageChange(1);
    }
  };

  if (totalItems === 0) {
    return (
      <div className={`flex items-center justify-between text-sm text-muted-foreground ${className}`}>
        <span>Aucun élément trouvé</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 ${className}`}>
      {/* Informations sur les éléments affichés */}
      <div className="text-sm text-muted-foreground">
        Affichage de {startItem} à {endItem} sur {totalItems} éléments
      </div>

      <div className="flex items-center space-x-4">
        {/* Sélecteur de taille de page */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Éléments par page:</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navigation de pagination */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage <= 1 || isLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-sm font-medium min-w-[80px] text-center">
            Page {currentPage} sur {totalPages}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage >= totalPages || isLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export default Pagination;

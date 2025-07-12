import { useState, useMemo, useCallback } from 'react';
import { useSearchDebounce } from './useDebounce';

export interface PaginationState {
  page: number;
  limit: number;
  search?: string;
  filter?: string;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  initialFilter?: string;
  enableDebouncing?: boolean; // Option pour activer le debouncing
  searchDelay?: number;
}

export interface UsePaginationReturn {
  paginationState: PaginationState;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setFilter: (filter: string) => void;
  setTotal: (total: number) => void;
  resetPagination: () => void;
  queryParams: Record<string, any>;
  total: number;
}

/**
 * Hook personnalisé pour gérer l'état de pagination avec debouncing optionnel
 * Optimise les performances en évitant les requêtes trop fréquentes
 */
export const usePagination = ({
  initialPage = 1,
  initialLimit = 20,
  initialSearch = '',
  initialFilter = '',
  enableDebouncing = true,
  searchDelay = 300
}: UsePaginationOptions = {}): UsePaginationReturn => {
  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [search, setSearchState] = useState(initialSearch);
  const [filter, setFilterState] = useState(initialFilter);
  const [total, setTotal] = useState(0);

  // Debouncing conditionnel de la recherche
  const debouncedSearch = useSearchDebounce(search, enableDebouncing ? searchDelay : 0);

  const paginationState = useMemo(() => ({
    page,
    limit,
    search,
    filter
  }), [page, limit, search, filter]);

  // Retourner à la page 1 quand on change la recherche ou le filtre
  const setSearch = useCallback((newSearch: string) => {
    setSearchState(newSearch);
    setPageState(1);
  }, []);

  const setFilter = useCallback((newFilter: string) => {
    setFilterState(newFilter);
    setPageState(1);
  }, []);

  // Retourner à la page 1 quand on change la limite
  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPageState(1);
  }, []);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const resetPagination = useCallback(() => {
    setPageState(initialPage);
    setLimitState(initialLimit);
    setSearchState(initialSearch);
    setFilterState(initialFilter);
  }, [initialPage, initialLimit, initialSearch, initialFilter]);

  // Paramètres pour les requêtes API avec debouncing
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit
    };

    // Utiliser la recherche debouncée si activée, sinon la recherche normale
    const searchTerm = enableDebouncing ? debouncedSearch : search;
    if (searchTerm && searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    if (filter && filter.trim()) {
      params.status = filter.trim(); // Pour payment-requests
      params.user_type = filter.trim(); // Pour users-with-stats
      params.signed_only = filter === 'signed'; // Pour contracts
    }

    return params;
  }, [page, limit, enableDebouncing ? debouncedSearch : search, filter, enableDebouncing]);

  return {
    paginationState,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    setTotal,
    resetPagination,
    queryParams,
    total
  };
};

export type ResolvedSelection = {
  element: Element;
};

export type GetStyleInfo = (
  resolved: ResolvedSelection
) => {
  className: string;
  styles: Record<string, string> | null;
};

export function initDesignMode(getStyleInfo: GetStyleInfo): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const reselect = () => {
    const selected = document.querySelector('[data-design-selected="true"]');
    if (!selected) return;
    getStyleInfo({ element: selected });
  };

  return reselect;
}

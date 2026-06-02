export function initDesignMode(getStyleInfo) {
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

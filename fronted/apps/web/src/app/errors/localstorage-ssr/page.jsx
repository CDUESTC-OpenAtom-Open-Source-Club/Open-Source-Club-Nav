export default function Page() {
  const value = localStorage.getItem('theme');
  return <div>Theme: {value}</div>;
}

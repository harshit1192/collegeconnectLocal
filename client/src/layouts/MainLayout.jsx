import Navbar from '../components/Navbar';

// Shared shell for all logged-in pages. More structure (sidebar, right
// panel) is added as the feed and other modules come online in later phases.
export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

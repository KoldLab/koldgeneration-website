import { Outlet } from 'react-router';
import { NavBar } from './NavBar';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col mx-auto">
      <header className="w-full mx-auto flex flex-row gap-3 px-2 sm:px-4 pt-1 place-content-center">
        <NavBar />
      </header>

      <main className="w-full sm:min-w-[80vw] sm:w-[80vw] mx-auto flex flex-col gap-3 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}

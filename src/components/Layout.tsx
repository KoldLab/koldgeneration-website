import { Outlet } from 'react-router';
import { NavBar } from './NavBar';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col mx-auto">
      <header className="w-full mx-auto flex flex-row gap-3 px-4 pt-1 place-content-center ">
        <NavBar />
      </header>

      <main className="w-full mx-auto flex flex-col gap-3 px-8 py-8 place-content-center place-items-center">
        <Outlet />
      </main>
    </div>
  );
}

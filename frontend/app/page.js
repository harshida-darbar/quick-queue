
// quick-queue/frontend/app/page.js

import ProtectedRoute from "./components/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
    <div className="">
      <h1>home</h1>
    </div>
    </ProtectedRoute>
  );
}

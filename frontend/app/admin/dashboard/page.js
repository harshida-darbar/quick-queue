// quick-queue/frontend/app/admin/dashboard/page.js
import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function page() {
  return (
       <ProtectedRoute allowedRoles={[1]}>
    <div>
      <h1 className="text-2xl font-bold text-[#7132CA] mb-4">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-gradient-to-r from-[#7F55B1] to-[#B153D7] text-white shadow">
          Total Users
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-r from-[#725CAD] to-[#C47BE4] text-white shadow">
          Organizers
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-r from-[#85409D] to-[#8C00FF] text-white shadow">
          Active Queues
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}

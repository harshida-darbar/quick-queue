// quick-queue/frontend/app/organizer/components/OrganizerQueues.jsx.

"use client";
import { useEffect, useState } from "react";
import api from "@/app/utils/api";
import { toast } from "react-toastify";

export default function OrganizerQueues() {
  const [queues, setQueues] = useState([]);
  const [queueName, setQueueName] = useState("");

  const loadQueues = async () => {
    const res = await api.get("/queue/my");
    setQueues(res.data);
  };

  useEffect(() => {
    loadQueues();
  }, []);

  const createQueue = async () => {
    if (!queueName) {
      toast.error("Queue name required");
      return;
    }

    try {
      const res = await api.post("/queue/create", { name: queueName });
      toast.success(res.data.message || "Queue created");

      setQueueName("");
      loadQueues();
    } catch (err) {
      toast.error(err.response?.data?.message || "Create failed");
    }
  };

  const action = async (id, type) => {
    try {
      const res = await api.patch(`/queue/${id}/${type}`);

      toast.success(res.data.message || "Queue updated");
      loadQueues();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <h2 className="text-xl font-semibold text-[#7132CA] mb-4">
        Manage Queues
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          className="border border-purple-500 p-2 rounded w-full"
          placeholder="Queue Name"
          value={queueName}
          onChange={(e) => setQueueName(e.target.value)}
        />
        <button
          onClick={createQueue}
          className="bg-[#7132CA] text-white px-4 rounded"
        >
          Create
        </button>
      </div>

      <div className="space-y-3">
        {queues.map((q) => (
          <div
            key={q._id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{q.name}</p>
              <p className="text-sm text-gray-600">
                Status: {q.status} | Token: {q.currentToken || 0}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                disabled={q.status !== "inactive"}
                onClick={() => action(q._id, "start")}
              >
                ▶
              </button>

              <button
                disabled={q.status !== "active"}
                onClick={() => action(q._id, "pause")}
              >
                ⏸
              </button>

              <button
                disabled={q.status !== "active"}
                onClick={() => action(q._id, "next")}
              >
                ⏭
              </button>

              <button
                disabled={q.status === "closed"}
                onClick={() => action(q._id, "close")}
              >
                ⛔
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Admin_Announcement.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../components/AdminLayout";
import { API_URL } from "../config/api";

const Admin_Announcement = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [editId, setEditId] = useState(null);

  // ✅ Fetch all
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/announcement/get/announcements`
      );
      setAnnouncements(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // ✅ CREATE / UPDATE
  const handleSubmit = async () => {
  try {
    if (editId) {
      // ✏️ UPDATE
      await axios({
        method: "PUT",
        url: `${API_URL}/announcement/update/${editId}`,
        data: { title, description },
      });

      alert("Updated successfully!");
      setEditId(null);
    } else {
      // 🆕 CREATE (THIS WAS MISSING ❗)
      await axios.post(`${API_URL}/announcement/create`, {
        title,
        description,
      });

      alert("Announcement Sent!");
    }

    setTitle("");
    setDescription("");
    fetchAnnouncements();

  } catch (error) {
    alert(`Something went wrong : ${error.message}`);
  }
};

  // ✅ DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;

    try {
      await axios({
  method: "DELETE",
  url: `${API_URL}/announcement/delete/${id}`,
});
      fetchAnnouncements();
    } catch (err) {
      alert(`Delete failed : ${err.message}`);
    }
  };

  // ✅ EDIT
  const handleEdit = (item) => {
    setTitle(item.title);
    setDescription(item.description);
    setEditId(item._id);
  };

  return (
    <AdminLayout
      title="Announcement Management"
      subtitle="Create, edit and delete announcements"
    >
      <div className="grid md:grid-cols-2 gap-6">

        {/* 🔥 LEFT: FORM */}
        <div className="bg-white shadow-xl rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">
            {editId ? "✏️ Edit Announcement" : "📢 Create Announcement"}
          </h2>

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 border px-3 py-2 rounded"
          />

          <textarea
            rows="4"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mb-3 border px-3 py-2 rounded"
          />

          <button
            onClick={handleSubmit}
            className={`w-full py-2 rounded text-white ${
              editId ? "bg-yellow-500" : "bg-blue-600"
            }`}
          >
            {editId ? "Update" : "Send"}
          </button>
        </div>

        {/* 📜 RIGHT: LIST */}
        <div className="bg-white shadow-xl rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">📜 All Announcements</h2>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {announcements.length === 0 ? (
              <p>No announcements</p>
            ) : (
              announcements.map((item) => (
                <div
                  key={item._id}
                  className="border p-3 rounded-lg"
                >
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 text-sm"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 text-sm"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

export default Admin_Announcement;
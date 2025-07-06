import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROOM_SERVICE_URL } from "../config";

export default function useRooms() {
  const { token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchRooms = async () => {
      try {
        const res = await fetch(`${ROOM_SERVICE_URL}/getRooms`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) setRooms(data.rooms || []);
        else console.error(data);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [token]);

  return { rooms, setRooms, loading }; // ✅ added setRooms
}

import { ROOM_SERVICE_URL } from "../config";

export async function createRoomAndJoin({
  name,
  token,
  username,
  setRooms,
  onSelectRoom,
}) {
  try {
    if (!name || !token) throw new Error("Missing name or token");

    const res = await fetch(`${ROOM_SERVICE_URL}/create_room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roomname: name }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message = errData?.error || "Room creation failed";
      throw new Error(message);
    }

    const data = await res.json();
    const newRoom = { rid: data.rid, name: data.roomname };

    setRooms((prev) => [...prev, newRoom]);
    onSelectRoom(newRoom.rid); // must use .rid (not .id)

    return newRoom;
  } catch (err) {
    console.error("Failed to create room:", err.message);
    return null;
  }
}

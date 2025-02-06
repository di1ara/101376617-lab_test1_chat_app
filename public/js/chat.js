const socket = io();

// Get elements
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("message");
const chatBox = document.getElementById("chatBox");
const room = document.getElementById("room");
const typingIndicator = document.getElementById("typingIndicator");

// Ensure elements exist before using them
if (!messageInput) console.error("❌ messageInput element not found!");
if (!typingIndicator) console.error("❌ typingIndicator element not found!");

// Get username from local storage
const username = localStorage.getItem("username") || "Guest";
let currentRoom = room ? room.value : "";

// Function to add a message to the chat box
function addMessage(user, text) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    if (user === username) {
        messageElement.classList.add("user");
    } else {
        messageElement.classList.add("other");
    }

    messageElement.innerHTML = `<strong>${user}:</strong> ${text}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Hide typing indicator when a message is received
    typingIndicator.innerText = "";
}

// Emit event when joining a room
function joinRoom() {
    chatBox.innerHTML = ""; // Clear messages before loading history
    socket.emit("joinRoom", { username, room: currentRoom });
}

// Send message
document.getElementById("send-btn").addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message === "") return;

    socket.emit("chatMessage", { username, room: currentRoom, message });
    messageInput.value = "";
});

// 🔍 Debug typing event emission
if (messageInput) {
    messageInput.addEventListener("input", () => {
        console.log("[DEBUG] Sending typing event:", username, currentRoom);
        socket.emit("typing", { username, room: currentRoom });
    });
}

// Receive typing event and show indicator
socket.on("typing", (data) => {
    console.log("[DEBUG] Received typing event:", data); // 🔍 Debug

    if (data.from_user) {
        typingIndicator.innerText = `${data.from_user} is typing...`;
        typingIndicator.style.display = "block";

        clearTimeout(typingIndicator.timeout);
        typingIndicator.timeout = setTimeout(() => {
            typingIndicator.innerText = "";
            typingIndicator.style.display = "none";
        }, 3000);
    }
});

// Handle room change
if (room) {
    room.addEventListener("change", () => {
        currentRoom = room.value;
        joinRoom();
    });
}

// Load previous messages when joining a room
socket.on("chatHistory", (messages) => {
    chatBox.innerHTML = "";
    messages.forEach((msg) => addMessage(msg.from_user, msg.message));
});

// Leave room
document.getElementById("leaveRoom").addEventListener("click", () => {
    socket.emit("leaveRoom", { username, room: currentRoom });
    setTimeout(() => window.location.href = "/", 300);
});

// Join the initial room
window.onload = () => {
    joinRoom();
};

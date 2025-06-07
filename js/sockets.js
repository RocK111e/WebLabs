// WebLabs/js/sockets.js
// Socket.IO client functionality for chat application

class ChatSocket {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.messageHandlers = new Set();
        this.statusHandlers = new Set();
        this.onlineUsers = new Set();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // Start with 2 seconds
    }

    connectUser(userId, username) {
        try {
            // Initialize socket connection
            this.socket = io('http://webnode.local', {
                reconnection: true,
                reconnectionDelay: this.reconnectDelay,
                reconnectionDelayMax: 10000,
                reconnectionAttempts: this.maxReconnectAttempts
            });

            // Set up connection event handlers
            this.socket.on('connect', () => {
                console.log('Connected to chat server');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Emit user connection event
                this.socket.emit('user_connect', { userId, username });
            });

            // Handle reconnection
            this.socket.on('reconnect', (attemptNumber) => {
                console.log(`Reconnected after ${attemptNumber} attempts`);
                this.isConnected = true;
                this.socket.emit('user_connect', { userId, username });
            });

            this.socket.on('reconnect_attempt', (attemptNumber) => {
                console.log(`Reconnection attempt ${attemptNumber}`);
                if (attemptNumber > this.maxReconnectAttempts) {
                    this.socket.disconnect();
                    console.error('Max reconnection attempts reached');
                }
            });

            // Handle disconnection
            this.socket.on('disconnect', () => {
                console.log('Disconnected from chat server');
                this.isConnected = false;
            });

            // Set up message handling
            this.socket.on('new_message', (data) => {
                console.log('New message received:', data);
                this.messageHandlers.forEach(handler => handler(data));
            });

            // Set up user status handling
            this.socket.on('user_status', (data) => {
                console.log('User status update:', data);
                if (data.status === 'online') {
                    this.onlineUsers.add(data.userId);
                } else {
                    this.onlineUsers.delete(data.userId);
                }
                this.statusHandlers.forEach(handler => handler(data));
            });

            // Handle errors
            this.socket.on('error', (error) => {
                console.error('Socket error:', error);
                this.handleError(error);
            });

        } catch (error) {
            console.error('Error initializing socket:', error);
            this.handleError(error);
        }
    }

    // Send a message to the server
    sendMessage(chatId, message, username, userId) {
        if (!this.isConnected) {
            console.error('Cannot send message: Not connected to server');
            return false;
        }

        try {
            // Format according to required Socket.IO event format
            this.socket.emit('send_message', {
                chatId: chatId,
                message: message,
                username: username,
                userId: userId
            });
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            this.handleError(error);
            return false;
        }
    }

    // Add message handler
    onNewMessage(handler) {
        this.messageHandlers.add(handler);
        // Remove any existing listeners to prevent duplicates
        if (this.socket) {
            this.socket.off('new_message');
            this.socket.on('new_message', (data) => {
                console.log('Received message:', data);
                this.messageHandlers.forEach(h => h(data));
            });
        }
    }

    // Add status handler
    onUserStatus(handler) {
        this.statusHandlers.add(handler);
    }

    // Remove message handler
    removeMessageHandler(handler) {
        this.messageHandlers.delete(handler);
    }

    // Remove status handler
    removeStatusHandler(handler) {
        this.statusHandlers.delete(handler);
    }

    // Check if user is online
    isUserOnline(userId) {
        return this.onlineUsers.has(userId);
    }

    // Handle errors
    handleError(error) {
        // Implement custom error handling here
        console.error('Socket error occurred:', error);
        // You could trigger UI updates or show notifications here
    }

    // Clean disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
            this.messageHandlers.clear();
            this.statusHandlers.clear();
            this.onlineUsers.clear();
        }
    }
}

export default ChatSocket; 
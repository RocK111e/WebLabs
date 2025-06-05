// WebLabs/js/sockets.js
// Socket.IO client functionality for chat application

class ChatSocket {
    constructor(serverUrl = 'http://webnode.local') {
        // Initialize socket with server configuration
        this.socket = io(serverUrl, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        this.setupEventListeners();
    }

    // Initialize connection for a user
    connectUser(userId, username) {
        if (!userId || !username) {
            console.error('User ID and username are required for connection');
            return;
        }
        this.socket.emit('user_connect', { userId, username });
    }

    // Send a new message
    sendMessage(chatId, message, username, userId) {
        if (!chatId || !message || !username || !userId) {
            console.error('Missing required parameters for sending message');
            return;
        }
        this.socket.emit('send_message', {
            chatId,
            message,
            username,
            userId
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to chat server');
            // Re-establish user connection if needed
            const userId = sessionStorage.getItem('userExternalId');
            const username = sessionStorage.getItem('userDisplayName');
            if (userId && username) {
                this.connectUser(userId, username);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from chat server:', reason);
            if (reason === 'io server disconnect') {
                // Server disconnected us, try to reconnect
                this.socket.connect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error.message);
            // If WebSocket fails, try polling
            if (this.socket.io.engine.transport.name === 'websocket') {
                console.log('WebSocket connection failed, falling back to polling');
                this.socket.io.engine.transport.name = 'polling';
            }
        });

        // General error handler
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    // Add message listener
    onNewMessage(callback) {
        this.socket.on('new_message', (data) => {
            try {
                // Validate received data
                if (!data.chatId || !data.message || !data.username || !data.userId) {
                    console.error('Received invalid message data:', data);
                    return;
                }
                callback(data);
            } catch (error) {
                console.error('Error processing new message:', error);
            }
        });
    }

    // Add user status listener
    onUserStatus(callback) {
        this.socket.on('user_status', (data) => {
            try {
                // Validate received data
                if (!data.userId || !data.status) {
                    console.error('Received invalid user status data:', data);
                    return;
                }
                callback(data);
            } catch (error) {
                console.error('Error processing user status:', error);
            }
        });
    }

    // Check connection status
    isConnected() {
        return this.socket && this.socket.connected;
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

export default ChatSocket; 
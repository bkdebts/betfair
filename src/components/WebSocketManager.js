// New file for WebSocket management
export class WebSocketManager {
    constructor(url, onMessage) {
        this.url = url;
        this.onMessage = onMessage;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.onMessage(data);
        };

        this.ws.onclose = () => {
            this.handleDisconnect();
        };
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ action: "heartbeat" }));
            }
        }, 15000);
    }

    handleDisconnect() {
        clearInterval(this.heartbeatInterval);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
        }
    }

    close() {
        clearInterval(this.heartbeatInterval);
        this.ws.close();
    }
} 
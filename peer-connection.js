// PeerJS Connection Manager voor Real-time Multiplayer

class PeerConnection {
    constructor() {
        this.peer = null;
        this.connections = new Map(); // Voor host: alle verbindingen met spelers
        this.hostConnection = null;   // Voor speler: verbinding met host
        this.isHost = false;
        this.gameCode = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onMessage = null;
        this.onConnectionReady = null;
        this.onError = null;
        this.playerName = null;
    }

    // Genereer een unieke 6-karakter spelcode
    generateGameCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Host: Start een nieuw spel
    async hostGame() {
        return new Promise((resolve, reject) => {
            this.gameCode = this.generateGameCode();
            this.isHost = true;

            // Maak peer met spelcode als ID
            this.peer = new Peer('lean-quiz-' + this.gameCode, {
                debug: 1
            });

            this.peer.on('open', (id) => {
                console.log('Host gestart met code:', this.gameCode);
                resolve(this.gameCode);
            });

            this.peer.on('connection', (conn) => {
                this.handleNewConnection(conn);
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                if (err.type === 'unavailable-id') {
                    // Code bestaat al, genereer nieuwe
                    this.peer.destroy();
                    this.gameCode = this.generateGameCode();
                    this.peer = new Peer('lean-quiz-' + this.gameCode, { debug: 1 });
                    this.peer.on('open', () => resolve(this.gameCode));
                } else if (this.onError) {
                    this.onError(err);
                }
                reject(err);
            });

            this.peer.on('disconnected', () => {
                console.log('Peer disconnected, attempting reconnect...');
                this.peer.reconnect();
            });
        });
    }

    // Speler: Verbind met een spel
    async joinGame(gameCode, playerName) {
        return new Promise((resolve, reject) => {
            this.gameCode = gameCode.toUpperCase();
            this.playerName = playerName;
            this.isHost = false;

            // Maak peer met unieke ID
            const playerId = 'player-' + Math.random().toString(36).substr(2, 9);
            this.peer = new Peer(playerId, { debug: 1 });

            this.peer.on('open', () => {
                // Verbind met host
                const conn = this.peer.connect('lean-quiz-' + this.gameCode, {
                    metadata: { name: playerName }
                });

                conn.on('open', () => {
                    this.hostConnection = conn;
                    console.log('Verbonden met host');

                    // Stuur join bericht
                    conn.send({
                        type: 'player-join',
                        name: playerName
                    });

                    resolve();
                });

                conn.on('data', (data) => {
                    if (this.onMessage) {
                        this.onMessage(data);
                    }
                });

                conn.on('close', () => {
                    console.log('Verbinding met host verbroken');
                    if (this.onPlayerLeft) {
                        this.onPlayerLeft('host');
                    }
                });

                conn.on('error', (err) => {
                    console.error('Connection error:', err);
                    reject(err);
                });
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                if (err.type === 'peer-unavailable') {
                    reject(new Error('Spelcode niet gevonden'));
                } else {
                    reject(err);
                }
            });

            // Timeout voor verbinding
            setTimeout(() => {
                if (!this.hostConnection) {
                    reject(new Error('Verbinding timeout - controleer de spelcode'));
                }
            }, 10000);
        });
    }

    // Host: Verwerk nieuwe speler verbinding
    handleNewConnection(conn) {
        const playerId = conn.peer;

        conn.on('open', () => {
            console.log('Nieuwe speler verbonden:', playerId);
        });

        conn.on('data', (data) => {
            if (data.type === 'player-join') {
                // Sla verbinding op met spelernaam
                this.connections.set(playerId, {
                    connection: conn,
                    name: data.name,
                    score: 0
                });

                if (this.onPlayerJoined) {
                    this.onPlayerJoined({
                        id: playerId,
                        name: data.name
                    });
                }

                // Bevestig verbinding naar speler
                conn.send({
                    type: 'join-confirmed',
                    playerCount: this.connections.size
                });

                // Broadcast nieuwe spelerslijst naar alle spelers
                this.broadcastPlayerList();
            } else if (this.onMessage) {
                // Voeg speler ID toe aan bericht
                data.playerId = playerId;
                data.playerName = this.connections.get(playerId)?.name;
                this.onMessage(data);
            }
        });

        conn.on('close', () => {
            const playerData = this.connections.get(playerId);
            this.connections.delete(playerId);
            console.log('Speler disconnected:', playerId);

            if (this.onPlayerLeft && playerData) {
                this.onPlayerLeft({
                    id: playerId,
                    name: playerData.name
                });
            }

            this.broadcastPlayerList();
        });
    }

    // Host: Broadcast spelerslijst naar alle spelers
    broadcastPlayerList() {
        const players = Array.from(this.connections.entries()).map(([id, data]) => ({
            id: id,
            name: data.name,
            score: data.score
        }));

        this.broadcast({
            type: 'player-list',
            players: players
        });
    }

    // Host: Broadcast bericht naar alle spelers
    broadcast(data) {
        this.connections.forEach((playerData, playerId) => {
            try {
                playerData.connection.send(data);
            } catch (e) {
                console.error('Fout bij verzenden naar', playerId, e);
            }
        });
    }

    // Speler: Stuur bericht naar host
    sendToHost(data) {
        if (this.hostConnection && this.hostConnection.open) {
            this.hostConnection.send(data);
        }
    }

    // Generieke send functie
    send(data) {
        if (this.isHost) {
            this.broadcast(data);
        } else {
            this.sendToHost(data);
        }
    }

    // Haal alle spelers op (alleen voor host)
    getPlayers() {
        return Array.from(this.connections.entries()).map(([id, data]) => ({
            id: id,
            name: data.name,
            score: data.score
        }));
    }

    // Update speler score (alleen voor host)
    updatePlayerScore(playerId, score) {
        const player = this.connections.get(playerId);
        if (player) {
            player.score = score;
        }
    }

    // Aantal verbonden spelers
    getPlayerCount() {
        return this.connections.size;
    }

    // Sluit verbinding
    disconnect() {
        if (this.peer) {
            this.peer.destroy();
        }
        this.connections.clear();
        this.hostConnection = null;
    }
}

// Globale instantie
const peerConnection = new PeerConnection();

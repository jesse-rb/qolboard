package handlers

import (
	"sync"
	"fmt"
	"net/http"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"qolboard/errhandler"
	"log"
)

// RoomsManager : All rooms
type RoomsManager struct {
	Rooms	map[uuid.UUID]*Room
}

// Room : Room template
type Room struct {
	Code		uuid.UUID
	Canvas		*Canvas
	Clients		[]*Client
	Owner		*Client
	JoinReqs	[]*Client
}

// Client Client template
type Client struct {
	Conn	*websocket.Conn
	Room	*Room
	mu		sync.Mutex
	Name	string
}

// Message : Message template
type Message struct {
	Desc	string		`json:"desc"`
	Code	string		`json:"code"`
	Index	int			`json:"index"`
	Piece	*Piece		`json:"piece"`
	Canvas	*Canvas		`json:"canvas"`
	Member	string		`json:"member"`
	Members	[]string	`json:"members"`
}

// Canvas : Canvas template
type Canvas struct {
	Code			string		`json:"code"`
	Width			int			`json:"width"`
	Height			int			`json:"height"`
	BackgroundColor	string 		`json:"backgroundColor"`
	Pieces			[]*Piece	`json:"pieces"`
}

// Piece : Piece template
type Piece struct {
	XPath		[]float64	`json:"xPath"`
	YPath		[]float64	`json:"yPath"`
	Color		string		`json:"color"`
	Size		int			`json:"size"`
	ShadowColor	string		`json:"shadowColor"`
	ShadowBlur	int			`json:"shadowBlur"`
}

func (client *Client) writeJSON(json *Message) error {
	client.mu.Lock()
	err := client.Conn.WriteJSON(&json)
	client.mu.Unlock()
	return err
}

// NewRoomsManager : Get new rooms manager
func NewRoomsManager() *RoomsManager {
	roomsManager := &RoomsManager{Rooms: make(map[uuid.UUID]*Room)}
	return roomsManager
}

// NewRoom : Get new room
func (roomsManager *RoomsManager) NewRoom(client *Client, canvas *Canvas) *Room {
	// Generate uuid
	code, err := uuid.NewRandom()
	errhandler.HandleGenErr("NewRoom(): Generate new random UUID", err);
	// Create room
	room := &Room{Code: code, Canvas: canvas, Owner: client}
	client.Room = room
	room.Clients = append(room.Clients, client)
	canvas.Code = code.String()
	roomsManager.Rooms[room.Code] = room
	
	return room
}

func (room *Room) isOwner(client *Client) bool {
	if (room.Owner == client) {
		return true
	}
	return false
}

func (roomsManager *RoomsManager) getRoom(code uuid.UUID) *Room {
	return roomsManager.Rooms[code];
}

// Websocket upgrader
var upgrader = websocket.Upgrader {
	ReadBufferSize: 1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool { return true },
}

// WsConnect : Connect client to web socket
func WsConnect(w http.ResponseWriter, r *http.Request) *websocket.Conn {
    // Start websocket connection
	conn, err := upgrader.Upgrade(w, r, nil);
	errhandler.HandleGenErr("Upgrade connection", err)
    return conn
}

func (roomsManager *RoomsManager) removeInactiveClientAndRoom(client *Client) {
	room := client.Room
	if room != nil {
		room.removeClient(client) // Remove client
		if room.isOwner(client) && len(room.Clients) > 0 { // Set new room owner if client was room owner
			room.Owner = room.Clients[0]
		}
		if (len(client.Room.Clients) == 0) {
			delete(roomsManager.Rooms, client.Room.Code)
		}
	}
}

func (room *Room) getMembersAndClientIndex(client *Client) ([]string, int) {
	members := make([]string, 0)
	clientIndex := 0;
	for i := 0; i < len(room.Clients); i++ {
		c := room.Clients[i]
		if c == client {
			clientIndex = i
		}
		members = append(members, c.Name)
	}
	return members, clientIndex
}

func (room *Room) clientQueued(client *Client) bool {
	// Check if client is already queued to join
	for _, c := range room.JoinReqs {
		if (c == client) {
			return true
		}
	}
	return false
}

func (room *Room) removeClientFromJoinQueue(client *Client) int {
	removeIndex := 0
	for i := 0; i < len(room.JoinReqs); i++ {
		c := room.JoinReqs[i]
		if (c == client) {
			removeIndex = i
			break
		}
	}

	if len(room.JoinReqs) > 1 {
		room.JoinReqs = append(room.JoinReqs[:removeIndex], room.JoinReqs[removeIndex+1:]...)
	} else { room.JoinReqs = make([]*Client, 0) }
	return removeIndex
}

func (roomsManager *RoomsManager) wsResponder(client *Client) {
	for {
		fmt.Printf("-----------------------------WEBSOCKET RESPONDER-----------------------------\nWaiting for message from client\n")
		// Read data from client
		message := &Message{}
		err := client.Conn.ReadJSON(&message)
		if !errhandler.HandleGenErr("Reading message from client", err) {
			fmt.Printf("Client disconnecting: %+v", client)
			log.Println("------CLOSE ERROR------")
			roomsManager.removeInactiveClientAndRoom(client)
			return
		}
		fmt.Printf("Recieved message: %+v\nfrom client: %+v\n", message, client)
		if (message.Desc == "keep-alive") {
			continue;
		}

		sendClient := client
		code, err := uuid.Parse(message.Code)
		errhandler.HandleGenErr("convert code string into code UUID", err)

		// Perform actions on data
		room := &Room{}
		response := &Message{Desc: message.Desc}

		if (message.Desc == "request-join-room") {
			// Find existing room
			log.Println("Finding existing room")
			room = roomsManager.getRoom(code)
			if room != nil {
				log.Println("Existing room found")
				if room.clientQueued(client) {
					continue
				}
				room.JoinReqs = append(room.JoinReqs, client)
				response.Index = len(room.JoinReqs)-1
				response.Member = message.Member
				response.Code = code.String()
			} else {
				log.Println("Creating new room")
				canvas := message.Canvas
				room = roomsManager.NewRoom(client, canvas)
				room.Canvas = message.Canvas
				client.Name = message.Member

				response.Code = room.Code.String()
				response.Member = message.Member
				response.Canvas = room.Canvas
				response.Desc = "create-room"
				message.Desc = "create-room"
			}
		} else if message.Desc == "cancel-join-room" {
			log.Println("Cancel join room")
			room = roomsManager.getRoom(code)
			
			if room != nil {
				index := room.removeClientFromJoinQueue(client)
				response.Code = code.String()
				response.Index = index
			}
		} else if message.Desc == "accepted-join" {
			log.Println("Accepted to room")
			room = roomsManager.getRoom(code)
			// Remove client from current room and delete old room if applicable
			sendClient = room.JoinReqs[message.Index]
			if len(room.JoinReqs) > 1 {
				room.JoinReqs = append(room.JoinReqs[:message.Index], room.JoinReqs[message.Index+1:]...)
			} else { room.JoinReqs = make([]*Client, 0) }

			roomsManager.removeInactiveClientAndRoom(sendClient)

			room.Clients = append(room.Clients, sendClient)
			sendClient.Room = room

			response.Code = code.String()
			response.Canvas = room.Canvas
			response.Member = sendClient.Name
			response.Index = message.Index
		} else if message.Desc == "declined-join" {
			log.Println("Declined to room")
			room = roomsManager.getRoom(code)
			if len(room.JoinReqs) > 1 {
				room.JoinReqs = append(room.JoinReqs[:message.Index], room.JoinReqs[message.Index+1:]...)
			} else { room.JoinReqs = make([]*Client, 0) }
		} else if (message.Desc == "add-piece") {
			log.Println("Add piece")
			room = roomsManager.getRoom(code)
			room.Canvas = message.Canvas;

			response.Code = code.String()
			response.Piece = message.Piece
		} else if (message.Desc == "remove-piece") {
			log.Println("Remove piece")
			room = roomsManager.getRoom(code)
			room.Canvas = message.Canvas;

			response.Code = code.String()
			response.Index = message.Index
		} else if (message.Desc == "update-piece") {
			log.Println("Update piece")
			room = roomsManager.getRoom(code)
			room.Canvas = message.Canvas;

			response.Code = code.String()
			response.Index = message.Index
			response.Piece = message.Piece
		} else if (message.Desc == "repaint-canvas") {
			log.Println("Repaint canvas")
			room = roomsManager.getRoom(code)
			room.Canvas = message.Canvas;

			response.Code = code.String()
			response.Canvas = message.Canvas
		} else if (message.Desc == "set-member-name") {
			log.Println("Set member name")
			room = roomsManager.getRoom(code)

			client.Name = message.Member
			// Set client name for response
			response.Member = client.Name
			response.Code = code.String()
		}

		if room != nil {
			members, clientIndex := room.getMembersAndClientIndex(sendClient)		
		
			fmt.Printf("synced with %v clients\n", len(room.Clients))

			if message.Desc == "declined-join" {
				
			} else if (message.Desc == "accepted-join" || message.Desc == "create-room") {
				// Send only to client who sent join request
				response.Members = make([]string, len(members))
				copy(response.Members, members)
				if len(response.Members) > 1 {
					response.Members = append(response.Members[:clientIndex], response.Members[clientIndex+1:]...)
				} else { response.Members = make([]string, 0) }
				fmt.Printf("sending to client: %+v\n", response)
				err = sendClient.writeJSON(response)
				if !errhandler.HandleGenErr("Write response to client who sent message", err) { return }

				response.Desc = "someone-joined-room"
				room.sendToAllClientBut(sendClient, members, response)
			} else {
				room.sendToAllClientBut(sendClient, members, response)
			}
		}
    }
}

func (room *Room) sendToAllClientBut(focusClient *Client, members []string, response *Message) {
	for i := 0; i < len(room.Clients); i++ {
		c := room.Clients[i]
		if c != focusClient {
			response.Members = make([]string, len(members))
			copy(response.Members, members)
			if len(response.Members) > 1 {
				response.Members = append(response.Members[:i], response.Members[i+1:]...)
			} else { response.Members = make([]string, 0) }
			fmt.Printf("sending to client: %+v\n", response)
			err := c.writeJSON(response)
			errhandler.HandleGenErr("Write response to clients who did not send message", err)
		}
	}
}

func (room *Room) removeClient(client *Client) {
	removeIndex := 0
	response := &Message {Desc: "member-disconnected", Code: room.Code.String()}
	members := make([]string, 0)
	for i := 0; i < len(room.Clients); i++ {
		c := room.Clients[i]
		if (c == client) {
			removeIndex = i
		} else {
			members = append(members, c.Name)
		}
	}

	if len(room.Clients) > 1 {
		room.Clients = append(room.Clients[:removeIndex], room.Clients[removeIndex+1:]...)
	} else { room.Clients = make([]*Client, 0) }
	
	for i, c := range room.Clients {
		response.Members = make([]string, len(members))
		copy(response.Members, members)
		if len(response.Members) > 1 {
			response.Members = append(response.Members[:i], response.Members[i+1:]...)
		} else { response.Members = make([]string, 0) }
		c.writeJSON(response)
	}
}

// ServeWebsocket : Serve websocket
func (roomsManager *RoomsManager) ServeWebsocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade connection to websocket
	conn := WsConnect(w, r)
	client := &Client{Conn: conn}
	// Read and respond
	roomsManager.wsResponder(client)
}
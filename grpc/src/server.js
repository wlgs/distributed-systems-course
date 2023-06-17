var PROTO_PATH = __dirname + "/../protos/chat.proto";

var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
var chat_proto = grpc.loadPackageDefinition(packageDefinition).chat;

var freeId = 1;
function generateNumericId() {
    return freeId++;
}

// function to generate random string
function generateRandomString() {
    return Math.random().toString(36).substring(2, 15);
}

// function to generate random username human readable
function generateRandomUsername() {
    const adjectives = [
        "autumn",
        "hidden",
        "bitter",
        "misty",
        "silent",
        "empty",
        "dry",
        "dark",
        "summer",
        "icy",
        "delicate",
        "quiet",
        "white",
        "cool",
        "spring",
        "winter",
        "patient",
        "twilight",
        "dawn",
        "crimson",
        "wispy",
        "weathered",]
    const nouns = [
        "waterfall",
        "river",
        "breeze",
        "moon",
        "rain",
        "wind",
        "sea",
        "morning",
        "snow",
        "lake",
        "sunset",
        "pine",
        "shadow",
        "leaf",
        "dawn",
        "glitter",]
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdjective}_${randomNoun}`;
}

class Channel {
    constructor(name, speed, log=true) {
        this.userList = [];
        this.chatMessages = [];
        this.subscribers = new Map();
        this.subscribers["userList"] = [];
        this.subscribers["userCount"] = [];
        this.subscribers["chatMessages"] = [];
        this.name = name;
        this.log = log;

        setInterval(() => {
            this.peformRandomAction();
        }, speed);
    }

    subscribe(call, condition) {
        this.subscribers[condition].push(call);
    }

    unsubscribe(call) {
        call.end();
        this.subscribers["userList"] = this.subscribers["userList"].filter((subscriber) => subscriber !== call);
        this.subscribers["userCount"] = this.subscribers["userCount"].filter((subscriber) => subscriber !== call);
        this.subscribers["chatMessages"] = this.subscribers["chatMessages"].filter((subscriber) => subscriber !== call);
    }
    getTotalSubscribers() {
        return this.subscribers["userList"].length + this.subscribers["userCount"].length + this.subscribers["chatMessages"].length;
    }
    peformRandomAction() {
        const randomNumber = Math.floor(Math.random() * 3) + 1;
        if (randomNumber === 1) {
            this.addUser();
            if (this.log)
                console.log(`[CH=${this.name}]: user joined \t| users=${this.userList.length} \t | all_subscribers=${this.getTotalSubscribers()}`)
        }
        if (randomNumber === 2) {
            if (this.userList.length === 0) return;
            this.addMessage();
            if (this.log)
                console.log(`[CH=${this.name}]: new message \t| users=${this.userList.length} \t | all_subscribers=${this.getTotalSubscribers()}`)

        }
        if (randomNumber === 3) {
            if (this.userList.length === 0) return;
            this.removeUser();
            if (this.log)
                console.log(`[CH=${this.name}]: user left \t| users=${this.userList.length} \t | all_subscribers=${this.getTotalSubscribers()}`)
        }
    }

    addUser() {
        const newUser = { name: generateRandomUsername(), id: generateNumericId(), status: "AWAY" };
        this.userList.push(newUser);
        this.subscribers["userList"].forEach((subscriber) =>{
            const res = subscriber.write({ users: this.userList })
            // if (!res) subscriber.once('drain', () => { console.log('failed to write');subscriber.write({ users: this.userList }) });
        }
        );
        this.subscribers["userCount"].forEach((subscriber) =>{
            const res = subscriber.write({ count: this.userList.length })
            // if (!res) subscriber.once('drain', () => { console.log('failed to write');subscriber.write({ count: this.userList.length }) });
        }
        );
    }

    addMessage() {
        const randomIndex = Math.floor(Math.random() * this.userList.length);
        const newMessage = { message: generateRandomString(), user: this.userList[randomIndex] }
        this.chatMessages.push(newMessage);
        this.subscribers["chatMessages"].forEach((subscriber) =>{
            const res = subscriber.write(newMessage)
            // if (!res) subscriber.once('drain', () => { console.log('failed to write');subscriber.write(newMessage) });
        }
        );
    }

    removeUser() {
        const removedUser = this.userList.pop();
        this.subscribers["userList"].forEach((subscriber) => {
            const res = subscriber.write({ users: this.userList })
            // if (!res) subscriber.once('drain', () => { console.log('failed to write');subscriber.write({ users: this.userList }) });
        }
        );
        this.subscribers["userCount"].forEach((subscriber) => {
            const res = subscriber.write({ count: this.userList.length })
            // if (!res) subscriber.once('drain', () => { console.log('failed to write');subscriber.write({ count: this.userList.length }) });
        }
        );
    }
}

const channels = new Map();
const channel1 = new Channel('1', 1000, false);
const channel2 = new Channel('2', 25, true);
channels.set("1", channel1);
channels.set("2", channel2);


// https://github.com/grpc/grpc-node/issues/419#issuecomment-1211074687
function attachListeners(call) {
    call.on("cancelled", () => {
        console.log(`[CH=${call.request.channelName}]: client cancelled`);
        channels.get(call.request.channelName).unsubscribe(call);
    });
}
function getUserCount(call) {
    attachListeners(call);
    console.log(`[CH=${call.request.channelName}]: user count subscription`);
    channels.get(call.request.channelName).subscribe(call, "userCount");
}

function getUserList(call) {
    attachListeners(call);
    console.log(`[CH=${call.request.channelName}]: user list subscription`);
    channels.get(call.request.channelName).subscribe(call, "userList");
}

function getChatMessages(call) {
    attachListeners(call);
    console.log(`[CH=${call.request.channelName}]: chat message subscription`);
    channels.get(call.request.channelName).subscribe(call, "chatMessages");
}

function main() {
    var server = new grpc.Server();
    server.addService(chat_proto.Chat.service, {
        getUserCount: getUserCount,
        getUserList: getUserList,
        getChatMessages: getChatMessages,
    });
    server.bindAsync(
        "0.0.0.0:50051",
        grpc.ServerCredentials.createInsecure(),
        () => {
            server.start();
        }
    );
}

main();

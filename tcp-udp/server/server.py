import asyncio
import websockets
import json

WEBSOCKET_HOST = "localhost"
WEBSOCKET_PORT = 9000

users = []
connections = []


async def sendMessageToOthersThan(user, message, msgtype="MESSAGE"):
    for otherUser in users:
        if otherUser is user:
            continue
        await otherUser[1].send(json.dumps({
            "type": msgtype,
            "username": user[0],
            "content": message
        }))
    await user[1].send(json.dumps({
        "type": "CONFIRMATION" + "_" + msgtype,
        "username": user[0],
        "content": message
    }))


async def sendMessageToUser(toUserNickname: str, message, msgtype="MESSAGE", fromUserTuple=None):
    for otherUser in users:
        if otherUser[0] == toUserNickname:
            await otherUser[1].send(json.dumps({
                "type": msgtype,
                "username": fromUserTuple[0],
                "content": message
            }))
            await fromUserTuple[1].send(json.dumps({
                "type": "CONFIRMATION" + "_" + msgtype,
                "username": toUserNickname,
                "content": message
            }))


async def handler(websocket, path):
    global users
    global connections
    connections += [websocket]
    await websocket.send(json.dumps({
        "type": "INFORMATION",
        "username": '',
        "content": 'Enter your username'
    }))
    while True:
        msg = await websocket.recv()
        username = json.loads(msg)['content']
        if username not in [u[0] for u in users]:
            break
        await websocket.send(json.dumps({
            "type": "ERROR",
            "username": username,
            "content": "Nickname is taken"
        }))
    currentUser = (username, websocket)
    users += [currentUser]

    await websocket.send(json.dumps({
        "type": "GREETING",
        "username": username,
        "content": f"Hello, {username}"
    }))

    while True:
        try:
            message = await websocket.recv()
            message = json.loads(message)
        except websockets.ConnectionClosedOK:
            users.remove((username, websocket))
            connections.remove(websocket)
            break
        except websockets.ConnectionClosedError:
            users.remove((username, websocket))
            connections.remove(websocket)
            break
        print(
            f"MESSAGE from {message['username']}: [{message['type']}]{message['content']}")
        if message['type'] == 'OFFER' or message['type'] == 'ANSWER' or message['type'] == 'CANDIDATE':
            await sendMessageToUser(message['receiver'], message['content'], message['type'], currentUser)
            continue
        await sendMessageToOthersThan(currentUser, message['content'], message['type'])


async def countUsers():
    while True:
        print(f"Users: {len(users)}")
        for connection in connections:
            try:
                await connection.send(json.dumps({
                    "type": "USERS_COUNT",
                    "username": '',
                    "content": len(users)
                }))
            except websockets.ConnectionClosedOK:
                pass
            except websockets.ConnectionClosedError:
                pass
        await asyncio.sleep(1)


# async def scheduleTaskForConnection(websocket, path):
#     asyncio.create_task(await handler(websocket, path))


# async def handleConnections():
#     async with websockets.serve(scheduleTaskForConnection, "", WEBSOCKET_PORT):
#         await asyncio.Future()  # run forever


async def handleConnections():
    async with websockets.serve(handler, "", WEBSOCKET_PORT):
        await asyncio.Future()  # run forever


async def main():
    asyncio.create_task(countUsers())
    asyncio.create_task(await handleConnections())

if __name__ == "__main__":
    asyncio.run(main())

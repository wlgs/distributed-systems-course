import grpc
import chat_pb2
import chat_pb2_grpc
import time
import signal

def signal_handler(sig, frame):
    global interrupt
    print("\nCtrl+C detected. Program interrupted =>" + str(not(interrupt)))
    interrupt = not(interrupt)


# handle sigint
signal.signal(signal.SIGINT, signal_handler)
interrupt = False

statuses = [
    chat_pb2.ONLINE,
    chat_pb2.OFFLINE,
    chat_pb2.AWAY
]


def subscribe(channelName, condition):
    global interrupt
    channel = grpc.insecure_channel('localhost:50051')

    stub = chat_pb2_grpc.ChatStub(channel)

    request = chat_pb2.ChatInformationRequest(channelName=channelName)

    if (condition == 'userCount'):
        response_iterator = stub.GetUserCount(request)
        
        for response in response_iterator:
            print(response.count)
            while interrupt:
                time.sleep(1)
    elif (condition == 'userList'):
        response_iterator = stub.GetUserList(request)
        for response in response_iterator:
            print(response.users)
            while interrupt:
                time.sleep(1)
    elif (condition == 'chatMessages'):
        response_iterator = stub.GetChatMessages(request)
        for response in response_iterator:
            print(f'{response.user.name} [{statuses[response.user.status]}][{response.user.id}]: {response.message}')
            while interrupt:
                time.sleep(1)
    else:
        print("Invalid condition")

if __name__ == '__main__':
    # parse args from command line
    channelName = input("Enter channel name: ")
    condition = input("Enter condition: ")
    while True:
        try:
            subscribe(channelName, condition)
        except grpc.RpcError as e:
            print(f"[{e.code()}] attempting to reconnect...")
            time.sleep(2)
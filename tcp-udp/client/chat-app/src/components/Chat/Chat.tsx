import { ChangeEvent, useContext, useEffect, useRef, useState } from "react";
import useWebSocket from "react-use-websocket";
import { CSSTransitionGroup } from "react-transition-group"; // ES6
import "./Chat.scss";

const socketUrl = "ws://192.168.100.2:9000";
const RTCPeerConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};
interface ServerResponse {
    type: string;
    username: string;
    content: string | RTCIceCandidate;
}

// @ts-ignore
// const wt = new WebTransport("https://localhost:9000");

type ChatMessage = Pick<ServerResponse, "username" | "content">;
type ServerStatus = "online" | "offline";

export let pc = new RTCPeerConnection(RTCPeerConfiguration);

export const Chat = () => {
    const {
        sendMessage,
        sendJsonMessage,
        lastMessage,
        lastJsonMessage,
        readyState,
        getWebSocket
    } = useWebSocket(socketUrl, {
        onOpen: () => handleConnection("online"),
        onClose: () => handleConnection("offline"),
        onMessage: (event) => handleMessage(event),
        shouldReconnect: (closeEvent) => true
    });

    const [inputValue, setInputValue] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const scrollElement = useRef<null | HTMLDivElement>(null);
    const [serverStatus, setServerStatus] = useState<ServerStatus>("offline");
    const [activeusers, setActiveUsers] = useState<number>(0);
    const [inputPlaceholder, setInputPlaceholder] =
        useState<string>("Your username...");
    const [buttonLabel, setButtonLabel] = useState<string>("Log in");
    const [messages, setMessages] = useState<Array<ChatMessage>>([]);
    const [offers, setOffers] = useState<Array<ChatMessage>>([]);
    const [currentReceiver, setCurrentReceiver] = useState<string>("");
    const [p2pActive, setP2pActive] = useState<boolean>(false);
    const [specificP2pActive, setSpecificP2pActive] = useState<string>("");
    const localVideoElement = useRef<HTMLVideoElement>(null);
    const remoteVideoElement = useRef<HTMLVideoElement>(null);

    const handleSendButton = (inputValue: string) => {
        const isLoggedIn = username !== "";
        sendMessage(
            isLoggedIn
                ? JSON.stringify({
                      type: "MESSAGE",
                      username,
                      content: inputValue
                  })
                : JSON.stringify({
                      type: "GREETING",
                      username: "",
                      content: inputValue
                  })
        );
        setInputValue("");
    };

    useEffect(() => {
        addLocalStreamToPeerConnection();
    }, []);

    const handleInitiateVoiceChat = async (receiver: string) => {
        if (pc.signalingState === "closed") {
            pc = new RTCPeerConnection(RTCPeerConfiguration);
            addLocalStreamToPeerConnection();
        }
        const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        sendMessage(
            JSON.stringify({
                type: "OFFER",
                username: username,
                content: offer.sdp,
                receiver: receiver
            })
        );
        await pc.setLocalDescription(offer);
        console.log("offer sent............");
    };

    const handleAnswerVoiceChat = async (caller: string, offerSDP: string) => {
        if (pc.signalingState === "closed") {
            pc = new RTCPeerConnection(RTCPeerConfiguration);
            addLocalStreamToPeerConnection();
        }
        await pc.setRemoteDescription(
            new RTCSessionDescription({
                type: "offer",
                sdp: offerSDP
            })
        );
        const answer = await pc.createAnswer();
        sendMessage(
            JSON.stringify({
                type: "ANSWER",
                username: username,
                content: answer.sdp,
                receiver: caller
            })
        );
        setCurrentReceiver(caller);
        await pc.setLocalDescription(answer);
        console.log("answer sent............");
    };

    const handleConnection = (status: ServerStatus) => {
        setActiveUsers(0);
        setMessages([]);
        setUsername("");
        setServerStatus(status);
        setButtonLabel("Log in");
        setInputPlaceholder("Your username...");
    };
    const handleMessage = (event: MessageEvent) => {
        const response: ServerResponse = JSON.parse(event.data);
        console.log(response);
        switch (response.type) {
            case "MESSAGE":
            case "CONFIRMATION_MESSAGE":
                setMessages([
                    ...messages,
                    { username: response.username, content: response.content }
                ]);
                if (scrollElement.current) {
                    scrollElement.current.scrollTop =
                        scrollElement.current.scrollHeight;
                }
                break;
            case "GREETING":
                setButtonLabel("Send");
                setInputPlaceholder("Type message...");
                setUsername(response.username ?? "Unknown");
                break;
            case "USERS_COUNT":
                setActiveUsers(parseInt(response.content as string));
                break;
            case "CONFIRMATION_OFFER":
                // console.log("your own offer back!");
                break;
            case "CONFIRMATION_ANSWER":
                // console.log("your own answer back!" + response.content);
                break;
            case "ANSWER":
                pc.setRemoteDescription(
                    new RTCSessionDescription({
                        type: "answer",
                        sdp: response.content as string
                    })
                );
                console.log("answer received............");
                setCurrentReceiver(response.username);
                break;
            case "OFFER":
                setOffers([
                    ...offers,
                    { username: response.username, content: response.content }
                ]);
                break;
            case "CANDIDATE":
                console.log(response.content);
                pc.addIceCandidate(response.content as RTCIceCandidate);
                break;
        }
    };

    const addLocalStreamToPeerConnection = async () => {
        const videoStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        videoStream.getTracks().forEach((track) => {
            pc.addTrack(track, videoStream);
        });
        localVideoElement.current!.srcObject = videoStream;
        localVideoElement.current!.muted = true;
    };
    pc.onconnectionstatechange = (event) => {
        setSpecificP2pActive(pc.connectionState);
        if (pc.connectionState === "disconnected") {
            closeP2pConnection();
            localVideoElement.current!.srcObject = null;
            remoteVideoElement.current!.srcObject = null;
            setCurrentReceiver("");
        } else if (pc.connectionState === "connected") {
            setP2pActive(true);
        }
    };
    pc.ontrack = (event) => {
        remoteVideoElement.current!.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
        if (currentReceiver === "") return;
        if (event.candidate) {
            sendMessage(
                JSON.stringify({
                    type: "CANDIDATE",
                    username: username,
                    content: event.candidate,
                    receiver: currentReceiver
                })
            );
        }
    };

    pc.oniceconnectionstatechange = (event) => {
        console.log("ICE CONNECTION STATE CHANGE -> ", pc.iceConnectionState);
    };

    const closeP2pConnection = () => {
        pc.close();
        localVideoElement.current!.srcObject = null;
        remoteVideoElement.current!.srcObject = null;
        setCurrentReceiver("");
        setP2pActive(false);
    };

    return (
        <div className="b-chat flex max-h-screen w-full flex-row overflow-hidden">
            <div
                className={`flex h-full flex-col border-r-2 border-b-white ${
                    p2pActive ? "flex w-[500px]" : "w-0 border-none"
                } transition-all duration-500`}>
                <h3 className="text-center">You</h3>
                <video
                    ref={localVideoElement}
                    autoPlay={true}
                    className="aspect-square w-[300px]"></video>
                <video
                    ref={remoteVideoElement}
                    autoPlay={true}
                    className="aspect-square w-[300px]"></video>
                <h3 className="text-center">{currentReceiver}</h3>
                <div
                    className={`mt-auto w-full flex-col rounded-lg bg-yellow-500 text-white ${
                        p2pActive ? "flex" : "hidden"
                    }`}>
                    <h4 className="mt-2 text-center font-bold">Active call</h4>
                    <div className="m-4 flex flex-row items-center">
                        <div className="flex w-full flex-row items-center">
                            <div
                                className={`chat-image relative cursor-default`}>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300">
                                    <span className="uppercase text-black">
                                        {currentReceiver.slice(0, 2)}
                                    </span>
                                </div>
                            </div>
                            <span className="ml-2 font-bold">
                                {currentReceiver}
                            </span>
                        </div>
                        <button
                            className=" btn-square btn ml-auto  bg-red-500 font-bold text-white hover:bg-red-800"
                            onClick={() => {
                                closeP2pConnection();
                            }}>
                            Hang up
                        </button>
                    </div>
                </div>
            </div>
            <div
                className={`flex-col items-center border-r-2 border-r-white bg-slate-800 ${
                    p2pActive ? "w-0 border-none " : "flex w-[500px]"
                }`}>
                <h2 className="m-0 mx-auto mb-4">Voice</h2>
                <span className="h-[2px] w-full bg-slate-200"></span>
                <h4 className="m-4 font-bold">Incoming calls</h4>
                {offers.map((offer, i) => {
                    return (
                        <div
                            key={i}
                            className="my-4 flex flex-row items-center rounded-xl bg-slate-600">
                            <div className="m-4 flex flex-row items-center justify-center">
                                <div
                                    className={`chat-image relative h-full cursor-default items-center justify-center`}>
                                    <div className="flex aspect-square w-12 items-center justify-center rounded-full bg-slate-300">
                                        <span className="uppercase text-black">
                                            {offer.username.slice(0, 2)}
                                        </span>
                                    </div>
                                </div>
                                <span className="m-4 text-white">
                                    {offer.username}
                                </span>
                            </div>
                            <button
                                className="m-1 rounded-full bg-slate-200 p-1 transition-all hover:cursor-pointer hover:bg-green-400"
                                onClick={() => {
                                    handleAnswerVoiceChat(
                                        offer.username,
                                        offer.content as string
                                    );
                                    offers.splice(i, 1);
                                }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </button>
                            <button
                                className="m-1 rounded-full bg-slate-200 p-1 transition-all hover:cursor-pointer hover:bg-red-400"
                                onClick={() => {
                                    offers.splice(i, 1);
                                }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    );
                })}
                <div className="mt-auto flex w-full flex-col">
                    <span
                        className={`mx-auto p-4 text-center font-bold
                        ${
                            pc.connectionState === "connected"
                                ? "text-green-500"
                                : "text-red-500"
                        }
                    `}>
                        P2P: {p2pActive ? "Active" : "Inactive"} (
                        {specificP2pActive})
                    </span>
                </div>
            </div>
            <div className="flex h-screen max-h-screen w-full flex-col overflow-hidden bg-slate-800">
                <div
                    className="relative grow overflow-x-hidden overflow-y-scroll bg-slate-600 px-4 pb-14 pt-14"
                    ref={scrollElement}>
                    <h2 className="absolute -top-14 left-0 mx-auto w-full p-8 text-center text-slate-50 opacity-50">
                        Text
                    </h2>
                    <CSSTransitionGroup
                        transitionName="bubble"
                        transitionEnterTimeout={500}
                        transitionLeaveTimeout={300}>
                        {messages.map((val, i) => {
                            return (
                                <div
                                    className={`chat ${
                                        val.username === username
                                            ? "chat-end"
                                            : "chat-start"
                                    }`}
                                    key={i}>
                                    <div
                                        className={`chat-image relative cursor-default ${
                                            val.username === username ? "" : ""
                                        }`}>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300">
                                            <span className="uppercase text-black">
                                                {val.username.slice(0, 2)}
                                            </span>
                                        </div>
                                        <div
                                            className={`chat-telephone-icon absolute -top-12 z-10 -translate-y-8 opacity-0 transition-all duration-300  ${
                                                val.username === username
                                                    ? "h"
                                                    : ""
                                            }`}>
                                            <button
                                                className="flex cursor-pointer flex-nowrap break-keep rounded-md bg-green-600 p-2 text-xl font-bold text-slate-200 transition-all duration-150 hover:bg-green-400 hover:text-slate-50 active:translate-y-2"
                                                onClick={() => {
                                                    if (
                                                        val.username ===
                                                        username
                                                    ) {
                                                        return;
                                                    }
                                                    handleInitiateVoiceChat(
                                                        val.username
                                                    );
                                                }}>
                                                <span className="mr-1">
                                                    Call{" "}
                                                </span>
                                                <span>{val.username}</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        className={`chat-bubble  ${
                                            val.username === username
                                                ? "chat-bubble-secondary"
                                                : "chat-bubble-primary"
                                        }`}>
                                        {(val.content as string).trim()}
                                    </div>
                                </div>
                            );
                        })}
                    </CSSTransitionGroup>
                </div>
                <div className="flex flex-row">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setInputValue(e.target.value)
                        }
                        placeholder={inputPlaceholder}
                        onKeyDown={(e) =>
                            e.key === "Enter"
                                ? handleSendButton(inputValue)
                                : null
                        }
                        className="input-ghost input input-md my-auto lg:input-lg"></input>
                    <button
                        onClick={() => handleSendButton(inputValue)}
                        className="btn h-full"
                        disabled={serverStatus === "offline"}>
                        {buttonLabel}
                    </button>
                    <span
                        className={`text-center font-bold text-yellow-500 ${
                            username === "" ? "hidden" : "block"
                        } m-4 my-auto mr-auto`}>
                        Hello, {username}
                    </span>
                    <span
                        className={`m-4 my-auto ml-auto text-center font-bold
                        ${
                            serverStatus === "online"
                                ? "text-green-500"
                                : "text-red-500"
                        }
                    `}>
                        Server: {serverStatus} ({activeusers})
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Chat;

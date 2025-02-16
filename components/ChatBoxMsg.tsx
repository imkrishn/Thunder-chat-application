'use client'

import React, { useEffect, useRef, useState } from 'react';
import MsgBox from './MsgBox';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { setCurrentMsg } from '@/redux/slices/currentMsg';
import { account, client, databases, storage } from '@/app/(root)/appwrite';
import { Query } from 'appwrite';
import useLoggedInUser from '@/hooks/useLoggedInUser';
import { AnimatePresence, motion } from 'framer-motion';




interface Msg {
  fileHref?: string;
  $id?: string;
  bucketId?: string;
  $createdAt?: string;
  $updatedAt?: string;
  name?: string;
  signature?: string;
  mimeType?: string;
  sizeOriginal?: number;
  chunksTotal?: number;
  chunksUploaded?: number;
  chatroomId?: string;
  content?: string;
  messageType?: string;
  senderId?: string;
  message?: string;
  timestamp?: string;
  type?: string;
  size?: number;
  lastModified?: number;
  senderName?: string;
  chatType?: 'single' | 'group';
}


const ChatBoxMsg = () => {
  const messageRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const { loggedInUserId } = useLoggedInUser()
  const [loading, setLoading] = useState<boolean>(false);

  const currentMsg = useSelector((state: RootState) => state.currentMsg);
  const chatroom = useSelector((state: RootState) => state.chatRoom);
  const notification = useSelector((state: RootState) => state.msgNotification)
  const chatroomId = chatroom.$id

  const dispatch = useDispatch<AppDispatch>()

  //clear chats

  useEffect(() => {
    if (notification.message === 'You had deleted the messages of this chat') {
      setMessages([])
    }
  }, [notification])

  // fetch all messages

  useEffect(() => {
    async function getAllMessages() {

      if (!chatroomId) {
        return
      }

      const result = await account.get();

      const loggedInUser = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
        [Query.equal("mobile", result.phone.slice(1))]
      );


      setMessages([])

      const isDeletedIdsEntry = chatroom.deleteChatIds?.find((user) => user.endsWith(loggedInUser.documents[0].$id));
      const isDeleted = isDeletedIdsEntry ? isDeletedIdsEntry.split('-') : [];
      const deletedChatTime = isDeleted.length > 0 ? isDeleted[0] : '1126041600000';
      const deleteTimeObj = new Date(Number(deletedChatTime)).toISOString();

      const isBlockedIdsEntry = chatroom.blockedIds?.find((user) => user.endsWith(loggedInUserId));
      const isBlocked = isBlockedIdsEntry ? isBlockedIdsEntry.split('-') : null;
      const blocktime = isBlocked ? isBlocked[0] : Date.now().toString();
      const blockTimeObj = new Date(Number(blocktime)).toISOString();



      try {
        setLoading(true)
        const messages = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_MESSAGES!,
          [
            Query.equal('chatroomId', chatroomId),
            Query.between('$createdAt', deleteTimeObj, blockTimeObj)
          ]
        );

        console.log(messages);

        // Filter text messages and file messages
        const storedTextMessages = messages.documents.filter((msg) => (msg.messageType === 'text' || msg.messageType === 'status'));
        const storedFiles = messages.documents.filter((msg) => msg.messageType === 'file');

        // Use Promise.all to handle async operations for fetching files
        const files = await Promise.all(storedFiles.map(async (file) => {
          const fileData = await storage.getFile(
            process.env.NEXT_PUBLIC_APPWRITE_BUCKET!,
            file.content
          );
          const fileHref = await storage.getFileView(
            process.env.NEXT_PUBLIC_APPWRITE_BUCKET!,
            file.content
          ).href;

          return { ...fileData, fileHref, senderId: file.senderId, chatType: file.chatType, senderName: file.senderName };
        }));

        const combinedMessages = [
          ...storedTextMessages,
          ...files
        ];


        const sortedMessages = combinedMessages.sort((a, b) => {
          return new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime();
        });

        // Update the state with sorted messages

        setMessages(sortedMessages)


      } catch (err: any) {
        console.error(err.message);

      } finally {
        setLoading(false)
      }


    }
    getAllMessages()


    scroll()
  }, [chatroomId])

  // live incoming messages

  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE!}.collections.${process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_MESSAGES!}.documents`,
      async (response: any) => {

        // Ensure the update is for the currently open chatRoomId

        const chatRoom = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
          chatroomId
        );

        const isBlocked = chatRoom.blocked_ids?.some((user: any) => user.endsWith(loggedInUserId));



        if (
          response.events.includes("databases.*.collections.*.documents.*.create") &&
          response.payload.chatroomId === chatroomId && !isBlocked
        ) {
          if (response.payload.messageType === 'text' || response.payload.messageType === 'status') {
            setMessages((prevMessages) => [...prevMessages, response.payload]);
          } else {
            const fileData = await storage.getFile(
              process.env.NEXT_PUBLIC_APPWRITE_BUCKET!,
              response.payload.content
            );
            const fileHref = await storage.getFileView(
              process.env.NEXT_PUBLIC_APPWRITE_BUCKET!,
              response.payload.content
            ).href;

            const file = { ...fileData, $id: response.payload.$id, fileHref, senderId: response.payload.senderId, chatType: response.payload.chatType, senderName: response.payload.senderName };
            setMessages((prevMessages) => [...prevMessages, file]);
          }

        }

        //for live delete messages

        if (response.events.includes("databases.*.collections.*.documents.*.delete") &&
          response.payload.chatroomId === chatroomId) {
          const updatedChats = messages.filter((message) => message.$id !== response.payload.$id);

          setMessages(updatedChats)
        }
      }
    );
    scroll()
    return () => {
      unsubscribe(); // Unsubscribe when leaving the chatroom
    };



  }, [messages])

  // function to scroll the message box 

  const scroll = () => {
    messageRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  //function to get current timestamp

  const formatDate = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    return `${date}, ${time}`;
  };

  //get current message

  useEffect(() => {
    if (currentMsg) {
      let newMessages: any[] = [];

      if (typeof currentMsg === "string") {
        newMessages.push(currentMsg);
      } else if (currentMsg instanceof FileList || Array.isArray(currentMsg)) {
        // Convert FileList to array and spread it
        newMessages = [...newMessages, ...Array.from(currentMsg)];
      }
      setMessages((prev) => [...prev, ...newMessages.map((msg) => ({
        message: msg,
        timestamp: formatDate(),
        senderId: loggedInUserId
      }))]);

      dispatch(setCurrentMsg(null));
    }
    scroll();
  }, [currentMsg]);

  //function to delete the msg

  async function onDeleteMsg(id: string | undefined) {
    if (!id) {
      return
    }

    const isConfirm = window.confirm("Are you sure to delete the message from both side ???")

    if (!isConfirm) {
      return
    }

    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_MESSAGES!,
        id
      );

      const updatedChats = messages.filter((message) => message.$id !== id);

      setMessages(updatedChats);
    } catch (Err) {
      console.log(Err);

    }

  }




  return (
    <div className='lg:h-[460px] h-screen w-full p-4 space-y-4 overflow-y-auto'>
      {loading && <p className='text-2xl font-extralight m-auto'>Loading...</p>}
      <div className='space-y-3'>
        <AnimatePresence>
          {messages.length !== 0 && messages.map((item, index) => (
            <motion.div
              key={item.$id}
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 1 }}
            >
              <MsgBox key={`sender-${index}`} type={item.senderId === loggedInUserId ? 'sender' : 'receiver'} message={item} onDelete={onDeleteMsg} />

            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div ref={messageRef} />
    </div>
  );
};

export default ChatBoxMsg;

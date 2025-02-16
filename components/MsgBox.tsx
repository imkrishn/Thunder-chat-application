'use client'

import { account, databases } from '@/app/(root)/appwrite';
import { Query } from 'appwrite';
import React, { useEffect, useState } from 'react';


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
  message?: string | { name: string };
  timestamp?: string;
  type?: string;
  size?: number;
  lastModified?: number;
  senderName?: string;
  chatType?: 'single' | 'group';
}

interface Type {
  type: 'sender' | 'receiver';
  message: Msg;
  onDelete: (id: string | undefined) => void;
}

function formatDate(timestamp: string | undefined) {
  if (!timestamp) {
    return
  }

  const date = new Date(timestamp);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);

  return formattedDate
}

const MsgBox: React.FC<Type> = ({ type, message, onDelete }) => {

  // file previews based on file type
  const renderFilePreview = (file: any) => {

    const fileURL = file.fileHref ? file.fileHref : URL.createObjectURL(file?.message);
    const fileType = file?.message?.type || file?.mimeType;
    const fileName = file?.name || file?.message?.name


    if (fileType.startsWith("image/")) {
      // Preview image files
      return (
        <a href={fileURL} download={fileName}>
          <img
            src={fileURL}
            alt={fileName}
            className="max-w-36 h-auto rounded mt-2"
          />
        </a>
      );
    }

    if (fileType.startsWith("video/")) {
      // Preview video files
      return (
        <a href={fileURL} download={fileName}>
          <video controls className="max-w-36 rounded mt-2">
            <source src={fileURL} type={fileType} />
            Your browser does not support the video tag.
          </video>
        </a>
      );
    }

    if (fileType.startsWith("audio/")) {
      // Preview audio files
      return (
        <a href={fileURL} download={fileName}>
          <audio controls className="mt-2 max-w-36">
            <source src={fileURL} type={fileType} />
            Your browser does not support the audio tag.
          </audio>
        </a>
      );
    }

    if (fileType === "application/pdf") {
      // Preview PDF files
      return (
        <a href={fileURL} download={fileName}>
          <iframe
            src={fileURL}
            className="w-36 mt-2 border rounded"
            title={fileName}
          ></iframe>
        </a>
      );
    }

    // Provide a link for unsupported file types

    return (
      <a
        href={fileURL}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline mt-2 inline-block"
      >
        <div className='h-28 w-36 bg-slate-50'></div>
      </a>
    );
  };

  const [loggedInUserId, setLoggedInUserId] = useState('');


  async function getLoggedInUserId() {
    try {
      const result = await account.get();

      const loggedInUser = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
        [Query.equal("mobile", result.phone.slice(1))]
      );

      setLoggedInUserId(loggedInUser.documents[0].$id)
    } catch (Err) {
      console.log(Err);

    }
  }

  useEffect(() => {
    if (message.messageType === 'status') {
      getLoggedInUserId()
    }
  }, [message])


  function containsEmoji(text: any) {
    const emojiRegex = /[\p{Emoji}]/u;
    return emojiRegex.test(text);
  }



  return (
    <div
      className={`relative w-full flex ${type === 'sender' ? 'justify-end' : 'justify-start'}`}
    >
      {message.messageType === 'status' && message.senderId === loggedInUserId && <div className='border flex flex-col items-end m-auto w-max rounded-xl bg-slate-600 bg-opacity-50 p-2'>
        <div className='text-sm text-red-500'>{message?.content}</div>
        <p className='text-xs  font-mono font-extralight '>{formatDate(message?.$createdAt)}</p>
      </div>}
      {(message.messageType !== 'status') && <div
        className={`max-w-[75%] p-3 rounded-lg border bg-opacity-30 ${type === 'sender' ? 'bg-gray-800 text-white' : 'bg-black'
          }`}
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {message.chatType === 'group' && <p className='font-bold text-sm my-2 shadow-2xl rounded-md text-green-500'>{message.senderName}</p>}
        {type === 'sender' && (
          <div className="flex justify-end pb-2">
            <svg
              className="h-4 cursor-pointer active:scale-95 w-max"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              onClick={() => onDelete(message?.$id)}
            >
              <path
                fill="#e01b24"
                d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"
              />
            </svg>
          </div>
        )}
        {(typeof message.message === 'string' || message.messageType === 'text') ? (<p className={` w-max ${containsEmoji(message?.message || message?.content) ? "text-5xl m-auto" : "text-sm"}`}>{message?.message as string || message?.content}</p>)
          : (
            <div key={message?.$id || message?.timestamp} className=" border rounded m-2 p-2">
              <p className="font-bold text-sm w-36 max-h-20 overflow-clip">{message.message?.name as string || message?.name}</p>
              {renderFilePreview(message)}
            </div>
          )
        }

        <p className="text-[11px] text-gray-500 mt-2">
          {message.timestamp || formatDate(message?.$createdAt)}
        </p>
      </div>}
    </div>
  );
};

export default MsgBox;

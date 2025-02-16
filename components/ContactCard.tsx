'use client';

import { client } from '@/app/(root)/appwrite';
import useLoggedInUser from '@/hooks/useLoggedInUser';
import clsx from 'clsx';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

interface Props {
  id: string;
  notification: boolean;
  name?: string;
  logo?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  group: boolean;
  imageUrl?: string;
  onDelete?: (id: string) => void
}

const ContactCard: React.FC<Props> = ({ id, notification, onDelete, name, onClick, className, group, imageUrl }) => {
  const [notificationMsgs, setNotificationMsgs] = useState<number>(0);
  const [isDelete, setIsDelete] = useState(false)
  const { loggedInUserId } = useLoggedInUser();

  useEffect(() => {
    if (!loggedInUserId) return;

    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE}.collections.${process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_MESSAGES}.documents`,
      (response: any) => {
        if (!response || !response.payload) return;

        const { senderId, chatroomId, chatType } = response.payload;

        // Determine the correct chat ID based on chat type
        const chatId = chatType === 'group' ? chatroomId : senderId;



        // Only update notification count if message is for this specific chat
        if (
          response?.events?.includes("databases.*.collections.*.documents.*.create") &&
          chatId === id &&
          senderId !== loggedInUserId &&
          response.payload.messageType !== 'status'
        ) {
          console.log('New message received for this contact:',);
          setNotificationMsgs((prev) => prev + 1);
        }
      }
    );

    return () => {
      unsubscribe(); // Unsubscribe when component unmounts
    };
  }, [id, loggedInUserId]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setNotificationMsgs(0); // Clear notifications when chat is opened
    if (onClick) onClick(event);
  };

  function handleDelete(id: string) {
    if (onDelete) {
      onDelete(id)
      setIsDelete(false)
    }

  }

  return (
    <div className='flex items-center'>
      <div
        onClick={handleClick}
        className={clsx(
          'w-full my-1 p-3 flex select-none cursor-pointer hover:bg-slate-500 active:text-black',
          className
        )}
      >
        {!group ? (
          imageUrl ? (
            <Image src={imageUrl} width={60} height={100} alt="logo" className="h-14 border rounded-full z-10" />
          ) : (
            <svg className="h-14 border rounded-full p-2 z-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path
                fill="#deddda"
                d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"
              />
            </svg>
          )
        ) : (
          <svg className="h-14 border rounded-full p-2 z-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
            <path
              fill="#deddda"
              d="M72 88a56 56 0 1 1 112 0A56 56 0 1 1 72 88zM64 245.7C54 256.9 48 271.8 48 288s6 31.1 16 42.3l0-84.7zm144.4-49.3C178.7 222.7 160 261.2 160 304c0 34.3 12 65.8 32 90.5l0 21.5c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-26.8C26.2 371.2 0 332.7 0 288c0-61.9 50.1-112 112-112l32 0c24 0 46.2 7.5 64.4 20.3zM448 416l0-21.5c20-24.7 32-56.2 32-90.5c0-42.8-18.7-81.3-48.4-107.7C449.8 183.5 472 176 496 176l32 0c61.9 0 112 50.1 112 112c0 44.7-26.2 83.2-64 101.2l0 26.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32zm8-328a56 56 0 1 1 112 0A56 56 0 1 1 456 88zM576 245.7l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM320 32a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM240 304c0 16.2 6 31 16 42.3l0-84.7c-10 11.3-16 26.1-16 42.3zm144-42.3l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM448 304c0 44.7-26.2 83.2-64 101.2l0 42.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-42.8c-37.8-18-64-56.5-64-101.2c0-61.9 50.1-112 112-112l32 0c61.9 0 112 50.1 112 112z"
            />
          </svg>
        )}
        <div className="relative w-full border-b flex p-2">
          <p className="font-bold ml-3 w-full text-xl">{name || 'Unknown'}</p>
          {notification && notificationMsgs > 0 && (
            <p className="absolute text-sm rounded-full py-1 px-2 mx-5 bg-green-500 font-bold right-0">
              {notificationMsgs}
            </p>
          )}
        </div>
      </div>
      <div className='relative'>
        {onDelete && <svg className='h-4 mx-2 cursor-pointer active:scale-95' onClick={() => setIsDelete((prev) => !prev)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="#deddda" d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z" /></svg>}
        {isDelete && <button onClick={() => handleDelete(id)} className='text-red-500 absolute right-0 border rounded bg-black p-2'>Remove</button>}
      </div>
    </div>
  );
};

export default ContactCard;

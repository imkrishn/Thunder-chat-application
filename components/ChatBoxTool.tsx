'use client'

import { databases, storage } from '@/app/(root)/appwrite';
import useLoggedInUser from '@/hooks/useLoggedInUser';
import { setCurrentMsg } from '@/redux/slices/currentMsg';
import { AppDispatch, RootState } from '@/redux/store';
import { Permission, Role } from 'appwrite';
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import EmojiPicker from "emoji-picker-react";
import { setMsgNotification } from '@/redux/slices/msgNotification';



const ChatBoxTool = () => {
  const [msg, setMsg] = useState<string>('');
  const [emojis, setEmojis] = useState<boolean>(false)
  const { loggedInUserId, loggedInUserName } = useLoggedInUser();
  const chatroom = useSelector((state: RootState) => state.chatRoom);
  const notification = useSelector((state: RootState) => state.msgNotification)
  const chatroomId = chatroom.$id

  const dispatch = useDispatch<AppDispatch>()


  //on file submit

  const onFileSubmit = async (files: File[]) => {

    try {
      if (loggedInUserId && files.length > 0 && chatroomId) {



        Array.from(files).map(async (file) => {
          const storedFile = await storage.createFile(
            process.env.NEXT_PUBLIC_APPWRITE_BUCKET!,
            'unique()',
            file
          );

          await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_MESSAGES!,
            'unique()',
            { content: storedFile.$id, senderId: loggedInUserId, chatroomId: chatroomId, messageType: 'file', senderName: loggedInUserName, chatType: chatroom.chatType },
            [
              Permission.read(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any()),
            ]
          )
        })

      }


    } catch (err: any) {
      console.log(err.message);

    }
  }

  // on file change

  function handleFileChange(e: any) {
    if (e.target.files) {
      dispatch(setCurrentMsg(Array.from(e.target.files)));
      onFileSubmit(e.target.files)
    }

  }

  // on text submit

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (msg === null) {
      return
    }

    dispatch(setCurrentMsg(msg));


    if (loggedInUserId && msg && chatroomId) {

      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_MESSAGES!,
        'unique()',
        { content: msg, senderId: loggedInUserId, chatroomId: chatroomId, senderName: loggedInUserName, chatType: chatroom.chatType },
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ]
      )
      setMsg('')
    }
  }

  // on  emoji submit

  function handleEmojiClick(emojiObject: any) {
    setMsg((prev) => prev + emojiObject.emoji);
    setEmojis(false)
  }

  //update status of chat notification

  useEffect(() => {
    async function updateNotificationStatus() {

      if (loggedInUserId && notification.message && chatroomId) {

        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_MESSAGES!,
          'unique()',
          { content: notification.message, senderId: loggedInUserId, chatroomId: chatroomId, senderName: loggedInUserName, chatType: chatroom.chatType, messageType: 'status' },
          [
            Permission.read(Role.any()),
            Permission.update(Role.any()),
            Permission.delete(Role.any()),
          ]
        )
        dispatch(setMsgNotification({ message: '', timestamp: '' }))
      }
    }

    updateNotificationStatus()
  }, [notification.message])

  return (
    <form onSubmit={onSubmit} className='max-h-14 w-full  absolute bottom-0 flex text-black border-t'>
      {emojis && <EmojiPicker className='absolute -top-96  ' onEmojiClick={handleEmojiClick} />}

      <div className='flex  items-center justify-center px-3 gap-3'>
        <label className='cursor-pointer active:scale-95'>
          <svg className='h-7 ' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#f6f5f4" d="M64 480H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H288c-10.1 0-19.6-4.7-25.6-12.8L243.2 57.6C231.1 41.5 212.1 32 192 32H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64z" /></svg>
          <input onChange={handleFileChange} type='file' className='hidden' multiple />
        </label>
        <label className='cursor-pointer active:scale-95'>
          <svg className='h-7' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#f6f5f4" d="M149.1 64.8L138.7 96 64 96C28.7 96 0 124.7 0 160L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64l-74.7 0L362.9 64.8C356.4 45.2 338.1 32 317.4 32L194.6 32c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z" /></svg>
          <input onChange={handleFileChange} type='file' capture='environment' className='hidden' />
        </label>
        <svg onClick={() => setEmojis((prev) => !prev)} className='h-7 cursor-pointer active:scale-95' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#FFD43B" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM164.1 325.5C182 346.2 212.6 368 256 368s74-21.8 91.9-42.5c5.8-6.7 15.9-7.4 22.6-1.6s7.4 15.9 1.6 22.6C349.8 372.1 311.1 400 256 400s-93.8-27.9-116.1-53.5c-5.8-6.7-5.1-16.8 1.6-22.6s16.8-5.1 22.6 1.6zM144.4 208a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>
      </div>

      <input value={msg} onChange={(e) => setMsg(e.target.value)} type='text' placeholder='Enter Your Message' className='w-full font-mono min-h-14 px-4 py-2 outline-none' />
      <button type='submit' className='w-20 flex items-center justify-center'>
        <svg className='h-7 m-auto  cursor-pointer active:scale-95' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill='#fff' d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z" /></svg>
      </button>
    </form>
  )

}

export default ChatBoxTool
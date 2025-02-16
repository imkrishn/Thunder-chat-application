'use client'

import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { databases } from '@/app/(root)/appwrite';
import { Query } from 'appwrite';
import useLoggedInUser from '@/hooks/useLoggedInUser';
import Spinner from './ui/Spinner';
import { setMsgNotification } from '@/redux/slices/msgNotification';

interface Member {
  $id: string
  fullName?: string;
  mobile?: string;
  logoUrl?: string;
}

const formatDate = () => {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  return `${date}, ${time}`;
};


const ChatBoxInfo = ({ setInfoBox }: { setInfoBox: (opr: boolean) => void }) => {
  const recieverData = useSelector((state: RootState) => state.reciever);
  const [mobile, setMobile] = useState('Loading...')
  const [blockedChat, setBlockedChat] = useState<boolean>(false)
  const [members, setMembers] = useState<Member[]>([]);
  const [adminId, setAdminId] = useState('');
  const chatRoom = useSelector((state: RootState) => state.chatRoom);
  const chatRoomId = chatRoom.$id
  const { loggedInUserId } = useLoggedInUser();
  const [loading, setLoading] = useState(false);
  const [membersId, setMembersId] = useState([]);

  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    async function getMembers() {
      try {
        if (!recieverData.membersId) {
          return
        }
        setLoading(true)

        const chatroom = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
          recieverData.$id
        )

        setMembersId(chatroom.membersId)

        const members = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
          [
            Query.equal('$id', chatroom.membersId)
          ]
        );


        if (members.total > 0) {
          setMembers(members.documents);
        }


      } catch (Err: any) {
        console.error(Err.message);

      } finally {
        setLoading(false)
      }
    }

    async function getReciever() {
      try {
        const reciever = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
          recieverData.$id
        );

        if (reciever) {
          setMobile(reciever.mobile)
        }
      } catch (err) {
        console.log(err);

      }
    }

    if (recieverData.chatType === 'group' && recieverData.membersId) {
      getMembers()
      setAdminId(recieverData.membersId[recieverData.membersId?.length - 1])
    }

    if (!recieverData.chatType && recieverData.chatType !== 'group') {
      getReciever()
    }

    setBlockedChat(chatRoom.blockedIds?.some((user) => user.endsWith(loggedInUserId)) || false);

  }, [recieverData])




  async function memberRemovedByAdmin(id: string) {
    try {
      const isConfirm = window.confirm("Are you confirm to remove the member??")

      if (!isConfirm) {
        return
      }

      if (!loggedInUserId) {
        return alert("You cannot remove the member")
      }



      const updatedMembers = membersId.filter((member: string) => member !== id);
      setMembersId(updatedMembers)


      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        recieverData.$id,
        { membersId: updatedMembers }
      )

      setMembers((prev) => prev.filter((member: Member) => member.$id !== id))

    } catch (Err) {
      console.log(Err);

    }
  }

  async function leaveGroup() {
    try {
      const isConfirm = window.confirm("Are you sure to leave from the Group ?? ")

      if (!isConfirm) {
        return
      }



      if (!chatRoomId || !loggedInUserId) {
        alert("You are not loggedIn or in a Group");
        return
      }

      const chatRoom = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        chatRoomId,
      )

      const updatedChatRoomMembers = chatRoom.membersId.filter((member: unknown) => member !== loggedInUserId)

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        chatRoomId,
        { membersId: updatedChatRoomMembers }
      );

      setMembers((prev) => prev.filter((user) => user.$id !== loggedInUserId))
      dispatch(setMsgNotification({
        message: 'You had exit from the Group ',
        timestamp: formatDate()
      }))
    } catch (Err) {
      console.log(Err);

    }
  }

  async function blockUser() {
    try {
      const isConfirm = window.confirm("Are you confirm to block the chat??")

      if (!isConfirm) {
        return
      }

      if (!chatRoomId || !loggedInUserId) {
        return alert("You cannot block the chat")
      }

      const chatRoom = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        chatRoomId,
      )

      const convertISTToUTC = () => {
        const now = new Date();
        now.setHours(now.getHours());
        now.setMinutes(now.getMinutes());
        return now.getTime();
      };

      const blockedUserId = `${convertISTToUTC()}-${loggedInUserId}`;

      const updatedBlockedUserList = [...chatRoom.blocked_ids, blockedUserId]

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        chatRoomId,
        { blocked_ids: updatedBlockedUserList }
      )

      setBlockedChat(true)
      dispatch(setMsgNotification({
        message: 'You had blocked the chat',
        timestamp: formatDate()
      }))
    } catch (Err) {
      console.log(Err);

    }
  }

  async function unblockUser() {
    try {
      const isConfirm = window.confirm("Are you confirm to unblock the chat??")

      if (!isConfirm) {
        return
      }

      if (!chatRoomId || !loggedInUserId) {
        return alert("You cannot unblock the chat")
      }

      const chatRoom = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        chatRoomId,
      )

      const updatedBlockedUserList = chatRoom.blocked_ids.filter((user: any) => !user.endsWith(loggedInUserId))


      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        chatRoomId,
        { blocked_ids: updatedBlockedUserList }
      )

      setBlockedChat(false)
      dispatch(setMsgNotification({
        message: 'You had unblocked the chat',
        timestamp: formatDate()
      }))
    } catch (Err) {
      console.log(Err);

    }
  }


  async function deleteChat() {
    try {
      const isConfirm = window.confirm("Are you confirm to delete the chat??")

      if (!isConfirm) {
        return
      }

      if (!chatRoomId || !loggedInUserId) {
        return alert("You cannot delete the chats")
      }

      const chatRoom = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        chatRoomId,
      )

      const convertISTToUTC = () => {
        const now = new Date();
        now.setHours(now.getHours());
        now.setMinutes(now.getMinutes());
        return now.getTime();
      };

      const deletedChatUserId = `${convertISTToUTC()}-${loggedInUserId}`;


      const deletedChatUserList = chatRoom.delete_chats_ids.filter((user: any) => !user.endsWith(loggedInUserId))
      const updatedDeletedChatUserList = [...deletedChatUserList, deletedChatUserId]

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        chatRoomId,
        { delete_chats_ids: updatedDeletedChatUserList }
      )

      dispatch(setMsgNotification({
        message: 'You had deleted the messages of this chat',
        timestamp: formatDate()
      }))

    } catch (Err) {
      console.log(Err);

    }
  }



  return (
    <div className=' h-full  bg-black bg-opacity-55 p-3 lg:h-[475px] overflow-y-auto'>
      <svg onClick={() => setInfoBox(false)} className='h-8 m-6 cursor-pointer active:scale-95' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill='#deddda' d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>

      {recieverData.chatType === 'group' ? <svg className="h-14 border rounded-full p-2 m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="#deddda" d="M72 88a56 56 0 1 1 112 0A56 56 0 1 1 72 88zM64 245.7C54 256.9 48 271.8 48 288s6 31.1 16 42.3l0-84.7zm144.4-49.3C178.7 222.7 160 261.2 160 304c0 34.3 12 65.8 32 90.5l0 21.5c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-26.8C26.2 371.2 0 332.7 0 288c0-61.9 50.1-112 112-112l32 0c24 0 46.2 7.5 64.4 20.3zM448 416l0-21.5c20-24.7 32-56.2 32-90.5c0-42.8-18.7-81.3-48.4-107.7C449.8 183.5 472 176 496 176l32 0c61.9 0 112 50.1 112 112c0 44.7-26.2 83.2-64 101.2l0 26.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32zm8-328a56 56 0 1 1 112 0A56 56 0 1 1 456 88zM576 245.7l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM320 32a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM240 304c0 16.2 6 31 16 42.3l0-84.7c-10 11.3-16 26.1-16 42.3zm144-42.3l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM448 304c0 44.7-26.2 83.2-64 101.2l0 42.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-42.8c-37.8-18-64-56.5-64-101.2c0-61.9 50.1-112 112-112l32 0c61.9 0 112 50.1 112 112z" /></svg>
        : (recieverData.logoUrl ? <Image src={recieverData.logoUrl} width={60} height={100} alt='logo' className='h-14 border rounded-full m-auto  z-10' /> : <svg
          className="h-14 border rounded-full p-2 z-10 m-auto"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
        >
          <path
            fill="#deddda"
            d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"
          />
        </svg>)}
      <h1 className='text-2xl mt-5'>About {recieverData.chatType !== 'group' ? 'User' : 'Group'}</h1>

      <div className='p-3 my-2 shadow-lg w-full'>
        <p className='text-2xl font-bold'>{recieverData.fullName}</p>
        {!recieverData.chatType && <p className='font-extralight mx-3'>+{mobile}</p>}
      </div>

      {recieverData.chatType === 'group' && members.length > 0 && <div>
        <p className='my-2'>Participants</p>

        <div className='w-full'>
          <hr />
          {loading && <Spinner size={20} />}
          {!loading && members.map((member) => (<div key={member.$id} className='flex items-center gap-3 p-2'>
            {member.logoUrl ? <Image src={member.logoUrl} width={60} height={100} alt='logo' className='h-14 border rounded-full  z-10' /> : <svg
              className="h-14 border rounded-full p-2 z-10"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
            >
              <path
                fill="#deddda"
                d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"
              />
            </svg>}

            <div className='w-full '>
              <p className='fond-bold'>{member.fullName}</p>
              <p className='text-sm font-extralight mx-3'>+{member.mobile}</p>
            </div>
            {adminId === member.$id ? <p className='text-green-600'>Admin</p>
              : (loggedInUserId === adminId && <svg onClick={() => memberRemovedByAdmin(member.$id)} className='h-4 cursor-pointer active:scale-95' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#c0bfbc" d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224 192 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l210.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128zM160 96c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 32C43 32 0 75 0 128L0 384c0 53 43 96 96 96l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l64 0z" /></svg>)}

          </div>))}
          <hr />
        </div>
      </div>}

      {recieverData.chatType === 'group' && <div className='flex items-center cursor-pointer active:scale-95 select-none text-green-500 p-3 gap-6 text-xl mt-3 shadow-sm'>
        <svg className='h-5' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="#9a9996" d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM504 312l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" /></svg>
        <p>Add Member +</p>
      </div>}

      {!blockedChat ? <div onClick={blockUser} className='flex items-center cursor-pointer active:scale-95 select-none text-red-600 p-3 gap-6 text-xl  shadow-sm'>
        <svg className='h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#e01b24" d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z" /></svg>
        <p>Block Chat</p>
      </div> :
        <div onClick={unblockUser} className='flex items-center cursor-pointer active:scale-95 select-none text-red-600 p-3 gap-6 text-xl  shadow-sm'>
          <svg className='h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#e01b24" d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z" /></svg>
          <p>Unblock Chat</p>
        </div>}
      {recieverData.chatType === 'group' && <div onClick={leaveGroup} className='flex items-center cursor-pointer active:scale-95 select-none text-red-600 p-3 gap-6 text-xl  shadow-sm'>
        <svg className='h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#e01b24" d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224 192 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l210.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128zM160 96c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 32C43 32 0 75 0 128L0 384c0 53 43 96 96 96l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l64 0z" /></svg>
        <p>Leave Group</p>
      </div>}
      <div onClick={deleteChat} className='flex items-center cursor-pointer active:scale-95 select-none text-red-600 p-3 gap-6 text-xl mb-3 shadow-sm'>
        <svg className='h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#e01b24" d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
        <p>Delete Chat</p>
      </div>

    </div>
  )
}

export default ChatBoxInfo
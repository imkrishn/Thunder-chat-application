'use client'

import { useEffect, useRef, useState } from "react";
import AddContact from "./AddContact";
import ContactCard from "./ContactCard";
import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input"
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import AddGroup from "./AddGroup";
import NewContact from "./NewContact";
import { client, databases } from "@/app/(root)/appwrite";
import useLoggedInUser from "@/hooks/useLoggedInUser";
import { Permission, Query, Role } from "appwrite";
import { setChatRoom } from "@/redux/slices/chatRoom";
import { setReciever } from "@/redux/slices/reciever";
import { motion, AnimatePresence } from "framer-motion";

interface Contact {
  $id: string;
  fullName?: string;
  membersId?: string[];
  chatType?: string;
  logoUrl?: string;
}

type Type = "newContact" | "newGroup" | "newChat" | "";
type Menu = 'All' | 'Groups';

const SideBarBody = ({ sideBarType, setSideBarType }: { sideBarType: Type, setSideBarType: (opr: Type) => void }) => {
  const currentChat = useSelector((state: RootState) => state.addContacts);
  const [chats, setChats] = useState<Contact[]>(() => {
    const storedChats = localStorage.getItem('chats');
    return storedChats ? JSON.parse(storedChats) : [];
  });
  const [menu, setMenu] = useState<Menu>('All');
  const [groupChats, setGroupChats] = useState<Contact[]>([])


  const { loggedInUserId } = useLoggedInUser()
  const loggedInUserIdRef = useRef(loggedInUserId)

  const dispatch = useDispatch<AppDispatch>()
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const query = e.target.value.toLowerCase();
    if (query.trim() !== '') {

      setChats(chats.filter((item) => item.fullName?.toLowerCase().includes(query)))
    } else {
      setChats(() => {
        const localChats = localStorage.getItem('chats');
        return localChats ? JSON.parse(localChats) : []
      })
    }

  }

  useEffect(() => {
    loggedInUserIdRef.current = loggedInUserId
  }, [loggedInUserId])

  //get all groups

  useEffect(() => {
    async function getAllGroups() {
      if (!loggedInUserId) {
        console.log("User is not logged in");
        return
      }

      const groups = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        [
          Query.equal('chatroomtype', 'group'),
          Query.equal('membersId', loggedInUserIdRef.current)
        ]
      )


      if (groups.total > 0) {

        const newGroups = groups.documents.map((group) => (
          {
            $id: group.$id,
            fullName: group.name,
            membersId: group.membersId,
            chatType: group.chatroomtype
          }))
        setChats((prev) => {
          const newChats = newGroups.filter((member) => !prev.some((chat) => chat.$id === member.$id));
          return [...prev, ...newChats]
        });
        setGroupChats(newGroups)
      }
    }

    getAllGroups()
  }, [loggedInUserId])



  useEffect(() => {
    if (
      currentChat.$id &&
      !chats.some((item) => item.$id === currentChat.$id)
    ) {
      setChats((prevChats) => {
        const updatedChats = [...prevChats, currentChat];
        localStorage.setItem('chats', JSON.stringify(updatedChats));
        return updatedChats;
      });
    }

    setSideBarType("");
  }, [currentChat]);

  // get live group creation

  useEffect(() => {
    async function fetchLiveGroups() {
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE!;
      const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!;

      if (!databaseId || !collectionId) {
        console.error("Appwrite database or collection ID is missing.");
        return;
      }


      try {
        const unsubscribe = client.subscribe(
          `databases.${databaseId}.collections.${collectionId}.documents`,
          (response: any) => {


            if (
              response?.events?.includes("databases.*.collections.*.documents.*.create") &&
              response?.payload?.name?.length < 48 &&
              response?.payload?.membersId?.includes(loggedInUserIdRef.current)
            ) {
              console.log('send');

              setChats((prev) => {
                if (prev.some((chat) => chat.$id === response.payload.$id)) return prev; // Avoid duplicates
                const updatedGroupChats = [
                  ...prev,
                  {
                    $id: response.payload.$id,
                    fullName: response.payload.name,
                    membersId: response.payload.membersId,
                    chatType: "group",
                  },
                ];

                localStorage.setItem('chats', JSON.stringify([...updatedGroupChats]))
                return updatedGroupChats
              });
              setGroupChats((prev) => ([...prev, {
                $id: response.payload.$id,
                fullName: response.payload.name,
                membersId: response.payload.membersId,
                chatType: "group",
              }]))
            }
          }
        );

        return () => {
          if (unsubscribe) unsubscribe();
        };
      } catch (error: any) {
        console.error("Error subscribing to chat updates:", error.message);
      }
    }

    fetchLiveGroups()

  }, []);





  /* async function onClickContacts(chat: Contact) {

    if (!loggedInUserId) {
      console.error("User is not logged in");
      return
    }

    const { $id, membersId, chatType } = chat


    const queries = membersId?.map((member) => Query.equal('membersId', member)) || [];

    const singleQuery = [
      Query.equal('membersId', loggedInUserId),
      Query.equal('membersId', $id),
      Query.equal('chatroomtype', 'single')
    ];

    const groupQuery = [...queries, Query.equal('chatroomtype', 'group')];

    const query = chatType === 'group' ? groupQuery : singleQuery;

    try {
      const chatroom = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        query
      );


      if (chatroom.total <= 0 && !chatType && chatType !== 'group') {

        const newChatroom = await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
          'unique()',
          {
            name: `Chatroom between ${loggedInUserId} and ${$id}`,
            membersId: [loggedInUserId, $id],
          },
          [
            Permission.read(Role.any()),
            Permission.update(Role.any()),
            Permission.delete(Role.any()),
          ]
        );

        dispatch(setChatRoom({
          $id: newChatroom.$id,
          name: newChatroom.name,
          chatType: newChatroom.chatroomtype,
          blockedIds: newChatroom.blocked_ids,
          memberIds: newChatroom.membersId,
          deleteChatIds: newChatroom.delete_chats_ids
        }))


      } else {
        dispatch(setChatRoom({
          $id: chatroom.documents[0].$id,
          name: chatroom.documents[0].name,
          chatType: chatroom.documents[0].chatroomtype,
          blockedIds: chatroom.documents[0].blocked_ids,
          memberIds: chatroom.documents[0].membersId,
          deleteChatIds: chatroom.documents[0].delete_chats_ids
        }))




      }
    } catch (err: any) {
      console.error("Error fetching/creating chatroom:", err.message);
    }

    dispatch(setReciever(chat))
  } */

  async function onClickContacts(chat: Contact) {
    if (!loggedInUserId) {
      console.error("User is not logged in");
      return;
    }

    const { $id, membersId, chatType } = chat;

    // Construct Queries
    const queries = membersId?.map((member) => Query.equal("membersId", member)) || [];
    const singleQuery = [
      Query.equal("membersId", loggedInUserId),
      Query.equal("membersId", $id),
      Query.equal("chatroomtype", "single"),
    ];
    const groupQuery = [...queries, Query.equal("chatroomtype", "group")];

    const query = chatType === "group" ? groupQuery : singleQuery;

    try {
      const chatroom = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
        query
      );

      if (!chatroom.documents.length) {
        // If no chatroom exists, create a new one (for single chats only)
        if (chatType !== "group") {
          const newChatroom = await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
            "unique()",
            {
              name: `Chatroom between ${loggedInUserId} and ${$id}`,
              membersId: [loggedInUserId, $id],
            },
            [
              Permission.read(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any()),
            ]
          );

          dispatch(
            setChatRoom({
              $id: newChatroom.$id,
              name: newChatroom.name,
              chatType: newChatroom.chatroomtype,
              blockedIds: newChatroom.blocked_ids,
              memberIds: newChatroom.membersId,
              deleteChatIds: newChatroom.delete_chats_ids,
            })
          );
        }
      } else {
        // Use existing chatroom
        const existingChatroom = chatroom.documents[0];

        dispatch(
          setChatRoom({
            $id: existingChatroom.$id,
            name: existingChatroom.name,
            chatType: existingChatroom.chatroomtype,
            blockedIds: existingChatroom.blocked_ids,
            memberIds: existingChatroom.membersId,
            deleteChatIds: existingChatroom.delete_chats_ids,
          })
        );
      }
    } catch (err: any) {
      console.error("Error fetching/creating chatroom:", err);
    }

    dispatch(setReciever(chat));
  }

  // get live chats 

  useEffect(() => {
    if (!loggedInUserId) return;

    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE}.collections.${process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_MESSAGES}.documents`,
      async (response: any) => {
        if (!response || !response.payload) return;

        const { chatroomId, senderId, chatType } = response.payload;

        // Ignore self-messages
        if (senderId === loggedInUserId) return;

        // Return if chat already exists
        if (chats.some(chat => chat.$id === senderId)) {
          const specificChat = chats.filter((chat) => chat.$id === senderId);
          const otherChats = chats.filter((chat) => chat.$id !== senderId);
          const finalChats = [...specificChat, ...otherChats]
          setChats(finalChats)
          localStorage.setItem('chats', JSON.stringify(finalChats))
          return;
        }

        try {
          // Fetch chatroom details
          const chatroom = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
            chatroomId
          );

          if (!chatroom) return;

          // Ensure the logged-in user is the receiver
          const isReceiver = chatroom.membersId.includes(loggedInUserId);
          if (!isReceiver || chatType !== 'single') return;

          console.log('New message received for this contact:');

          // Fetch sender details
          const user = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
            senderId
          );

          const newChat = {
            $id: user.$id,
            fullName: user.fullName,
            logoUrl: user.logoUrl,
            chatType: 'single',
          };

          const updatedChats = [newChat, ...chats];

          setChats(updatedChats);
          localStorage.setItem('chats', JSON.stringify(updatedChats));
        } catch (error) {
          console.error("Error fetching chatroom or user data:", error);
        }
      }
    );

    return () => {
      unsubscribe(); // Unsubscribe when component unmounts
    };
  }, [loggedInUserId, chats]);


  //menu handle

  function handleMenu(menu: string) {
    if (menu === 'All') {
      setMenu('All')
      const storedChats = localStorage.getItem('chats');
      const updatedChats = storedChats ? JSON.parse(storedChats) : chats
      setChats(updatedChats);

    } else if (menu === 'Groups') {

      setMenu('Groups')
      setChats(groupChats)

    }
  }

  function onDeleteChat(id: string) {

    const filteredChats = chats.filter((chat) => chat.$id !== id);
    setChats(filteredChats);
    localStorage.setItem('chats', JSON.stringify(filteredChats))
  }

  return (
    <>
      {sideBarType === "" &&
        <div className='relative h-full w-full p-3 '>
          <PlaceholdersAndVanishInput
            placeholders={['Search Your Chats', 'Search Your Group Chats', 'Search Your Loved Ones']}
            onChange={handleOnChange}
            onSubmit={() => handleOnChange}
          />
          <div className="flex items-center gap-3 my-3 select-none">
            {["All", "Groups"].map((item) => (
              <div onClick={() => handleMenu(item)} key={item} className={`border rounded-2xl bg-slate-600 font-bold border-none px-3 py-1 cursor-pointer active:scale-95 active:bg-slate-300 active:text-black ${menu === item && 'text-black bg-green-400'}`}>{item}</div>
            ))}
          </div>
          <div className="h-[70vh]  overflow-y-auto ">
            {chats.length > 0 ? (<>
              {chats.map((chat) => (
                <ContactCard onClick={() => onClickContacts(chat)} imageUrl={chat.logoUrl} notification={true} group={chat.chatType === 'group' ? true : false} name={chat.fullName} key={chat.$id} id={chat.$id} onDelete={onDeleteChat} />
              ))}
            </>) : <p className="m-auto font-mono text-center">No Chat History</p>}
          </div>
        </div>}
      <AnimatePresence mode="wait">
        {sideBarType === "newChat" && (
          <motion.div
            key="box"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 1 }}

          >
            <AddContact setSideBarType={setSideBarType} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {sideBarType === "newGroup" && (
          <motion.div
            key="box"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 1 }}

          >
            <AddGroup setSideBarType={setSideBarType} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {sideBarType === "newContact" && (
          <motion.div
            key="box"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 1 }}

          >
            <NewContact setSideBarType={setSideBarType} />
          </motion.div>
        )}
      </AnimatePresence>



    </>
  )
}

export default SideBarBody
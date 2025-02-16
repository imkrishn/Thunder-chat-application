'use client';

import { databases } from '@/app/(root)/appwrite';
import { Permission, Query, Role } from 'appwrite';
import React, { useEffect, useState } from 'react';
import ContactCard from './ContactCard';
import useLoggedInUser from '@/hooks/useLoggedInUser';

interface Contact {
  $id: string;
  fullName?: string;
  membersId?: string[];
  logoUrl?: string
}

type Type = "newContact" | "newGroup" | "newChat" | "";

const AddGroup = ({ setSideBarType }: { setSideBarType: (opr: Type) => void }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [members, setMembers] = useState<Contact[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  const { loggedInUserId } = useLoggedInUser();


  // Fetch contacts function
  async function getContacts(limit: number = 20, query?: string) {
    try {
      setLoading(true);
      const queries = [Query.limit(limit), Query.select(['$id', 'fullName', 'logoUrl'])];
      if (query) queries.push(Query.contains('fullName', query));

      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
        queries
      );
      setContacts(response.documents);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getContacts(); // Fetch initial contacts
  }, []);

  // Handle click on a contact to add or remove group members

  function onClickContact(id: string, fullName: string | undefined) {
    if (!id || !fullName) {
      return alert('Member unable to add');
    }

    const alreadyExists = members.some((member) => member.$id === id);
    if (!alreadyExists) {
      setMembers((prev) => [...prev, { $id: id, fullName }]);
    } else {
      setMembers((prev) => prev.filter((member) => member.$id !== id));
    }
  }

  // Search function 
  async function onSearch(query: string) {
    if (searchTimeout) clearTimeout(searchTimeout);

    setSearchTimeout(
      setTimeout(async () => {
        if (query.trim() !== '') {
          await getContacts(20, query);
        } else {
          await getContacts();
        }
      }, 300)
    );
  }

  // Handle group creation

  async function handleCreateGroup() {
    if (members.length === 0) {
      alert('Add at least one member to create a group!');
      return;
    }

    if (groupName === '') {
      return alert('Group Name is Required')
    }

    const membersId = members.map((member) => member.$id);

    if (groupName && membersId.length > 0) {
      try {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CHATROOM!,
          'unique()',
          {
            name: groupName,
            membersId: [...membersId, loggedInUserId],
            chatroomtype: 'group'
          },
          [
            Permission.read(Role.any()),
            Permission.update(Role.any()),
            Permission.delete(Role.any()),
          ]
        );


      } catch (err: any) {
        console.error(err.message);

      }


    }



    console.log('Group created with members');
    alert(`${groupName} had created successfully`);
    setSideBarType('')
  }

  return (
    <div className='w-full p-3'>
      <div className='flex w-full items-center'>
        <svg
          onClick={() => setSideBarType('')}
          className='h-10 p-2 cursor-pointer active:scale-95'
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
        >
          <path
            fill="#f6f5f4"
            d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
          />
        </svg>
        <p className='text-2xl font-bold mx-2'>Create Group</p>
      </div>
      <input
        type="text"
        onChange={(e) => onSearch(e.target.value)}
        placeholder='Search Contacts on Thunder'
        className='px-3 py-1 text-black outline-none my-2 w-full rounded-3xl'
      />
      <div className='flex items-center gap-2'>
        <input
          onChange={(e) => setGroupName(e.target.value)}
          type='text'
          placeholder='Group Name'
          className='rounded px-4 py-2 w-full outline-none bg-gray-600 bg-opacity-35 font-bold my-1'
          required
        />
        <button
          onClick={handleCreateGroup}
          className='px-2 h-max py-1 border border-blue-50 text-white rounded-lg font-bold transform hover:translate-x-1 transition duration-400'
        >
          Create
        </button>
      </div>
      <div className='h-96 overflow-y-auto'>
        {loading ? (
          <p className='m-auto'>Loading...</p>
        ) : contacts.length === 0 ? (
          <p className='text-center text-gray-500'>No contacts found.</p>
        ) : (
          contacts.map((item) => (
            item.$id !== loggedInUserId && <ContactCard
              id={item.$id}
              onClick={() => onClickContact(item.$id, item.fullName)}
              key={item.$id}
              notification={false}
              name={item.fullName}
              group={false}
              imageUrl={item.logoUrl}
              className={members.some((member) => member.$id === item.$id) ? 'bg-slate-700' : 'bg-none'}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AddGroup;

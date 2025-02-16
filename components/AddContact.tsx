'use client'

import React, { useEffect, useState } from 'react'
import ContactCard from './ContactCard'
import { databases } from '@/app/(root)/appwrite'
import { Query } from 'appwrite'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/redux/store'
import { setContact } from '@/redux/slices/addContact'
import useLoggedInUser from '@/hooks/useLoggedInUser'

interface Contact {
  $id: string;
  fullName?: string;
  logoUrl?: string
}

type Type = "newContact" | "newGroup" | "newChat" | "";

const AddContact = ({ setSideBarType }: { setSideBarType: (opr: Type) => void }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const { loggedInUserId } = useLoggedInUser();

  const dispatch = useDispatch<AppDispatch>()

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

  function onClickContact(id: string, fullName: string | undefined, logoUrl: string | undefined) {
    dispatch(setContact({ $id: id, fullName, logoUrl }))
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




  return (
    <div className='z-10 border-t-2'>
      <div className='flex gap-2 pr-4 items-center'>
        <svg onClick={() => setSideBarType("")} className='h-11 p-2 cursor-pointer active:Scale-95' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#f6f5f4" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" /></svg>

        <input
          type="text"
          onChange={(e) => onSearch(e.target.value)}
          placeholder='Search Contacts on Thunder'
          className='px-3 py-1 text-black outline-none my-2 w-full rounded-3xl'
        />
      </div>
      <div className='overflow-y-auto lg:h-[475px] h-screen'>
        <div className='py-2 z-10'>
          <div onClick={() => setSideBarType("newContact")} className='flex  gap-3 items-center cursor-pointer active:scale-95 z-10 hover:bg-slate-400 p-2'>
            <svg className='h-9 rounded-full p-2 bg-slate-50 ' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="#2ec27e" d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM504 312l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" /></svg>
            <p className='text-2xl font-bold w-full'>New Contact</p>
          </div>
          <div onClick={() => setSideBarType("newGroup")} className='flex gap-3  items-center cursor-pointer active:scale-95 hover:bg-slate-400 p-2'>
            <svg className='h-9 rounded-full p-2 bg-slate-50' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="#2ec27e" d="M72 88a56 56 0 1 1 112 0A56 56 0 1 1 72 88zM64 245.7C54 256.9 48 271.8 48 288s6 31.1 16 42.3l0-84.7zm144.4-49.3C178.7 222.7 160 261.2 160 304c0 34.3 12 65.8 32 90.5l0 21.5c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-26.8C26.2 371.2 0 332.7 0 288c0-61.9 50.1-112 112-112l32 0c24 0 46.2 7.5 64.4 20.3zM448 416l0-21.5c20-24.7 32-56.2 32-90.5c0-42.8-18.7-81.3-48.4-107.7C449.8 183.5 472 176 496 176l32 0c61.9 0 112 50.1 112 112c0 44.7-26.2 83.2-64 101.2l0 26.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32zm8-328a56 56 0 1 1 112 0A56 56 0 1 1 456 88zM576 245.7l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM320 32a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM240 304c0 16.2 6 31 16 42.3l0-84.7c-10 11.3-16 26.1-16 42.3zm144-42.3l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM448 304c0 44.7-26.2 83.2-64 101.2l0 42.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-42.8c-37.8-18-64-56.5-64-101.2c0-61.9 50.1-112 112-112l32 0c61.9 0 112 50.1 112 112z" /></svg>
            <p className='text-2xl font-bold w-full'>New Group</p>
          </div>

          <p className='px-4  font-extralight  text-green-600 text-2xl'>Contacts on Thunder</p>

        </div>
        {loading ? (<p className='m-auto'>Loading ...</p>) : (<div>
          {
            contacts.map((item) => (
              (item.$id !== loggedInUserId) && (<ContactCard group={false} onClick={() => onClickContact(item.$id, item.fullName, item.logoUrl)} key={item.$id} notification={false} name={item.fullName} imageUrl={item.logoUrl} id={item.$id} />)
            ))
          }
        </div>)}
      </div>
    </div>
  )
}

export default AddContact
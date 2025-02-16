'use client'

import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import logo from '@/public/images/image.png'
import { account, databases, storage } from '../appwrite'
import useLoggedInUser from '@/hooks/useLoggedInUser'
import { redirect, useRouter } from 'next/navigation'
import { getAuthUser } from '@/lib/getAuthUser'

const user = await getAuthUser()

if (!user) {
  redirect('/auth/login')
}

const Profile = () => {
  const { loggedInUserId } = useLoggedInUser();
  const [userMobile, setUserMobile] = useState('');
  const [userName, setUserName] = useState('');
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [onChangeNameClick, setOnChangeNameClick] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)

  const router = useRouter()

  async function onImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files;

    if (file && file[0]) {
      if (!file[0].type.startsWith('image/')) {
        alert('Only image files can be uploaded');
        return;
      }
      setLoading(true)
      try {
        const upload = await storage.createFile(
          process.env.NEXT_PUBLIC_APPWRITE_BUCKET!,
          'unique()',
          file[0]
        );

        const imageUrl = await storage.getFileView(
          process.env.NEXT_PUBLIC_APPWRITE_BUCKET!,
          upload.$id
        ).href;


        if (imageUrl) {
          setUserImageUrl(imageUrl);
        }

        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
          loggedInUserId,
          { logoUrl: imageUrl }
        );

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false)
      }
    }
  }

  async function onChangeName(name: string) {
    try {
      if (!loggedInUserId) {
        return
      }

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
        loggedInUserId,
        { fullName: name }
      )

      setOnChangeNameClick(false)
    } catch (err) {
      console.log(err);

    }
  }

  async function onSignOut() {
    try {
      setSignOutLoading(true)
      await account.deleteSession("current")
      console.log('session deleted');
      router.push('/auth/login')
      localStorage.removeItem('chats')
      window.location.reload()

    } catch (err) {
      console.log(err);

    } finally {
      setSignOutLoading(false)
    }
  }

  async function onDeleteAccount() {
    try {
      setDeleteLoading(true)
      if (!loggedInUserId) {
        return
      }

      const isConfirm = window.confirm('Are you sure to delete your account??');

      if (!isConfirm) {
        return
      }

      await account.deleteSessions()

      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
        loggedInUserId,
      );

      console.log('account deleted');
      localStorage.removeItem('chats')
      router.push('/auth/login')

    } catch (Err) {
      console.log(Err);

    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    async function getImage() {
      try {
        const user = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
          loggedInUserId
        );

        if (user) {
          setUserName(user?.fullName);
          setUserMobile(user?.mobile);
        }

        if (user?.logoUrl) {
          setUserImageUrl(user?.logoUrl);
        }

      } catch (err) {
        console.error(err);
      }
    }

    getImage();
  }, [loggedInUserId]);

  return (
    <main className='h-screen flex opacity-75'>
      <Image src={logo} className='h-screen lg:w-1/3' alt='logo' />
      <span className='m-auto border p-11 rounded bg-black'>
        <span className='flex items-end'>
          {userImageUrl ? (
            <Image
              src={userImageUrl}
              alt='#me'
              className='rounded-full border h-56 w-56 p-3 bg-slate-50'
              width={200}
              height={100}
            />
          ) : (
            <svg className='h-48 w-48 m-auto border p-3 bg-slate-50 rounded-full' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" /></svg>
          )}
          <label>
            <input onChange={onImageUpload} type='file' className='hidden' />
            <svg className='h-4 cursor-pointer active:scale-95' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#1c71d8" d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z" /></svg>
          </label>
        </span>
        {loading && <p className='text-sm my-5 font-bold m-auto w-max'>Uploading ...</p>}
        <div className='p-3'>
          <h1 className='text-xl font-bold'>Name</h1>
          <div className='flex items-center'>
            <input onChange={(e) => setUserName(e.target.value)} type='text' value={userName || 'Loading...'} className='bg-transparent outline-none font-extralight' disabled={!onChangeNameClick} />
            {!onChangeNameClick ? <svg onClick={() => setOnChangeNameClick(true)} className='h-4 cursor-pointer active:scale-95' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#deddda" d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z" /></svg>
              : <svg onClick={() => onChangeName(userName)} className='h-4 cursor-pointer active:scale-95' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#2ec27e" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" /></svg>}
          </div>
          <hr />
          <h1 className='text-xl font-bold mt-3'>Mobile Number</h1>
          <div className='flex items-center'>
            <input type='text' value={`+${userMobile}` || 'Loading ...'} className='bg-transparent font-extralight' disabled />
          </div>
          <hr />
          <div className='flex justify-between mt-8 text-sm'>
            <button onClick={onSignOut} className='rounded cursor-pointer active:scale-95 bg-blue-500 px-3 py-2'>{signOutLoading ? 'Signing out' : 'Sign Out'}</button>
            <button onClick={onDeleteAccount} className='rounded cursor-pointer active:scale-95 bg-red-500 px-3 py-2'>{deleteLoading ? 'Deleting' : 'Delete Account'}</button>
          </div>
        </div>
      </span>
    </main>
  )
}

export default Profile;

'use client'

import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import logo from '@/public/images/sidebar-bg.png'
import SideBarNav from './SideBarNav'
import SideBarBody from './SideBarBody'
import useLoggedInUser from '@/hooks/useLoggedInUser'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/redux/store'
import { setLoggedInUser } from '@/redux/slices/loggedInUser'

type Type = "newContact" | "newGroup" | "newChat" | "";


const SideBar = () => {
  const dispatch = useDispatch<AppDispatch>()
  const [sideBarType, setSideBarType] = useState<Type>("");
  const { loggedInUserId, loggedInUserName } = useLoggedInUser();

  useEffect(() => {
    dispatch(setLoggedInUser({ loggedInUserId, loggedInUserName }))
  }, [])

  return (
    <div className='relative h-screen'>
      <Image src={logo} alt='sideBar Bg' fill className='absolute -z-10 opacity-40' />

      <SideBarNav setSideBarType={setSideBarType} />
      <SideBarBody sideBarType={sideBarType} setSideBarType={setSideBarType} />
    </div>
  )
}

export default SideBar
'use client'

import ChatBox from "@/components/ChatBox";
import SideBar from "@/components/SideBar";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { RootState } from "@/redux/store";
import Image from "next/image";
import Thunder from '@/public/images/thunder.png'
import { useSelector } from "react-redux";
import { getAuthUser } from "@/lib/getAuthUser";
import { redirect } from "next/navigation";

const user = await getAuthUser()

if (!user) {
  redirect('/auth/login')
}

export default function Home() {
  const reciever = useSelector((state: RootState) => state.reciever.$id)
  return (
    <main className="lg:grid grid-cols-[30%_70%] h-full overflow-clip relative">
      <BackgroundBeams className='absolute inset-0 -z-10' />
      <SideBar />
      {reciever ? <ChatBox /> : <Image src={Thunder} alt="Thunder" className="lg:h-screen w-full" />}

    </main>
  );
}

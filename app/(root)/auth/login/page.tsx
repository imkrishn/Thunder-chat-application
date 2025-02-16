'use client'

import Image from 'next/image';
import React, { useState } from 'react';
import bg from '@/public/images/image.png';
import bgLogo from '@/public/images/image copy.png';
import { Spotlight } from '@/components/ui/spotlight';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { redirect, useRouter } from 'next/navigation';
import PhoneInput from 'react-phone-input-2'
import { account, ID, databases } from "@/app/(root)/appwrite";
import 'react-phone-input-2/lib/style.css'
import { Query } from 'appwrite';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/getAuthUser';

const user = await getAuthUser()

if (user) {
  redirect('/')
}

const Login = () => {


  const router = useRouter();
  const [error, setError] = useState<string>("")
  const [mobile, setMobile] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [verification, setVerification] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false)

  const handleOtpComplete = async (value: string) => {
    try {
      setLoading(true)
      const trimmedValue = value.trim();
      const otp = Number(trimmedValue);
      if (isNaN(otp)) {
        setError("Invalid OTP format");
        return;
      }

      const verified = await account.updatePhoneSession(userId, trimmedValue);
      if (!verified) {
        throw new Error("Phone verification failed");
      }

      router.push('/');

    } catch (err: any) {
      console.error(err.message);
      setError(err.message || "OTP is Invalid");
    } finally {
      setLoading(false)
    }
  };


  async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true)
      const user = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
        [
          Query.equal('mobile', [`${mobile}`])
        ]
      );

      if (user.total === 0) {
        setError("User is not registered");
        return;
      }


      if (!(await bcrypt.compare(password, user.documents[0].password))) {
        setError("Password is Incorrect");
        return;
      }

      // Create OTP verification
      const token = await account.createPhoneToken(
        ID.unique(),
        `+${mobile}`
      );

      setUserId(token.userId);
      setVerification(true);
      setError("")

    } catch (err: any) {
      console.log(err);
      setError(err.message);
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="h-screen w-full lg:overflow-clip flex lg:flex-row flex-col">
      <div className="h-full ">
        <Image
          src={bg}
          alt="Login Background"
          className="h-full w-full object-cover opacity-55"
          placeholder="blur"
          priority
        />
        <div className="flex-1">
          <Spotlight
            className="-top-40 -left-10 md:-left-32 md:-top-20 h-screen"
            fill="blue"
          />
          <Spotlight
            className="h-[80vh] w-[50vw] top-10 left-1/2"
            fill="white"
          />
          <Spotlight
            className="left-80 top-28 h-[80vh] w-[50vw]"
            fill="purple"
          />
        </div>
      </div>


      <div className='flex flex-col justify-center items-center py-3 px-5 relative select-none w-full'>
        <Image src={bgLogo} alt='logo' className='absolute -z-10 object-cover opacity-45' />
        <form onSubmit={handleOnSubmit} className='flex flex-col gap-3 justify-center items-center  bg-blue-500 rounded-lg bg-opacity-30 w-max mb-3  p-7'>
          <h1 className='text-4xl font-extrabold'>Login</h1>
          {error && <p className='font-bold text-red-500'>{error}</p>}
          {!verification ? (<>
            <PhoneInput
              disabled={loading}
              placeholder="Mobile Number"
              country="us"
              containerStyle={{
                display: 'grid',
                gridTemplateColumns: '10% 90%',
                alignItems: 'center',
                width: '16rem',
                borderRadius: '8px',
                backgroundColor: 'rgb(15 23 42 / var(--tw-bg-opacity, 1))',
              }}
              inputStyle={{
                gridColumn: '2 / 3',
                color: '#fff',
                outline: 'none',
                padding: '10px',
                fontSize: '16px',
                width: '100%',
                border: 'none',
                backgroundColor: 'rgb(15 23 42 / var(--tw-bg-opacity, 1))',
              }}
              buttonStyle={{
                gridColumn: '1 / 2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                border: 'none',
                padding: '0',
              }}
              dropdownStyle={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              onChange={(value) => {
                setMobile(value);
              }}
            />
            <input disabled={loading} name='password' onChange={(e) => setPassword(e.target.value)} type='password' placeholder='Password ' className='outline-none w-64 px-4 py-2 rounded bg-slate-900 font-bold' required />
            <div className='w-full relative my-3'>
              <button disabled={loading} className="w-full cursor-pointer active:scale-95 inline-flex h-10 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                {loading ? 'Logging ' : 'Login'}
              </button>
              <p className='absolute right-0 text-red-400  font-bold w-max  cursor-pointer active:scale-95 text-right'>Forgot Password</p>
            </div>
          </>) :
            (<InputOTP disabled={loading} maxLength={6} onComplete={handleOtpComplete}>
              <InputOTPGroup className='bg-white rounded text-black font-bold' >
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className='bg-white rounded text-black font-bold'>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>)}

          <p className='font-bold '>Are You New Here??</p>
          <div onClick={() => router.push('/auth/signup')} className="cursor-pointer active:scale-95 my-3 shadow-[0_4px_14px_0_rgb(0,118,255,39%)] hover:shadow-[0_6px_20px_rgba(0,118,255,23%)] hover:bg-[rgba(0,118,255,0.9)] px-8 py-2 bg-[#0070f3] rounded-md text-white font-light transition duration-200 ease-linear">
            Register
          </div>
        </form>
        <TextGenerateEffect words='Stay close, no matter the distance' />

      </div>
    </main>
  );
};

export default Login;

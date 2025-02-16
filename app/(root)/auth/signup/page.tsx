'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import bg from '@/public/images/image.png';
import bgLogo from '@/public/images/image copy.png';
import { Spotlight } from '@/components/ui/spotlight';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { useForm } from 'react-hook-form';
import PhoneInput from 'react-phone-input-2'
import { databases } from "@/app/(root)/appwrite";
import 'react-phone-input-2/lib/style.css'
import { redirect, useRouter } from 'next/navigation';
import { Permission, Role } from 'appwrite';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/getAuthUser';

const user = await getAuthUser()

if (user) {
  redirect('/')
}

interface USER {
  fullName: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

const Signup = () => {
  const {
    handleSubmit,
    reset,
    getValues,
    setValue,
    register,
    formState: { errors, isSubmitting },
  } = useForm<USER>();

  const [error, setError] = useState("")
  const router = useRouter()

  const onSubmit = async (data: USER) => {
    try {
      if (data.password !== data.confirmPassword) {
        return alert('Password and Confirm password should match')
      }

      const { fullName, mobile, password } = data

      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)


      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
        'unique()',
        { fullName, mobile, password: hashedPassword },
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ]
      );

      router.push('/auth/login');

    } catch (err: any) {
      console.log(err);
      setError(err.message)
    }

  };

  return (
    <main className="h-screen w-full lg:overflow-clip flex lg:flex-row flex-col">
      <div className="h-full">
        <Image
          src={bg}
          alt="Signup Background"
          className="h-full w-full object-cover opacity-55"
          placeholder="blur"
          priority
        />
        <div className="flex-1">
          <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20 h-screen" fill="blue" />
          <Spotlight className="h-[80vh] w-[50vw] top-10 left-1/2" fill="white" />
          <Spotlight className="left-80 top-28 h-[80vh] w-[50vw]" fill="purple" />
        </div>
      </div>

      <div className="flex flex-col justify-center items-center py-3 px-5 relative select-none">
        <Image src={bgLogo} alt="logo" className="absolute -z-10 object-cover opacity-45" />
        <form
          className="flex flex-col gap-3 justify-center items-center p-3 bg-blue-500 bg-opacity-20 rounded py-3"
          onSubmit={handleSubmit(onSubmit)}
        >
          <h1 className="text-4xl font-extrabold">Create Your Account</h1>
          <p className='my-2 text-red-500 font-bold'>{error}</p>
          <input
            disabled={isSubmitting}
            type="text"
            placeholder="Full Name"
            className="outline-none px-4 py-2 z-10 rounded bg-slate-800 font-bold w-64"
            {...register('fullName', {
              required: 'Full name is required',
              maxLength: {
                value: 20,
                message: 'Full name should be maximum 20 characters',
              },
            })}
          />
          {errors.fullName && <p className="text-red-500">{errors.fullName.message}</p>}

          <div>
            <PhoneInput
              disabled={isSubmitting}
              placeholder="Mobile Number"
              country="us"
              value={getValues('mobile')}
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
              onChange={(value) => setValue('mobile', value || '', { shouldValidate: true })}
            />

            {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>}
          </div>


          <input
            disabled={isSubmitting}
            type="password"
            placeholder="Password"
            className="outline-none px-4 py-2 rounded bg-slate-900 font-bold w-64"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password should be at least 8 characters',
              },
            })}
          />
          {errors.password && <p className="text-red-500">{errors.password.message}</p>}

          <input
            disabled={isSubmitting}
            type="password"
            placeholder="Confirm Password"
            className="outline-none px-4 py-2  rounded bg-slate-900 font-bold w-64"
            {...register('confirmPassword', {
              required: 'Confirm Password is required',
              validate: (value) =>
                value === getValues('password') || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && (
            <p className="text-red-500">{errors.confirmPassword.message}</p>
          )}

          <div className="flex justify-between gap-3">
            <button disabled={isSubmitting} type='reset' onClick={() => reset()} className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                Reset
              </span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-blue-500 cursor-pointer ${isSubmitting && 'opacity-50 cursor-not-allowed'
                } active:scale-95 px-8 py-2 rounded-full text-white`}
            >
              {isSubmitting ? 'Submitting' : 'Submit'}
            </button>
          </div>
        </form>
        <TextGenerateEffect className="dark uppercase" words="Dive into the world of endless conversations" />
      </div>
    </main>
  );
};

export default Signup;

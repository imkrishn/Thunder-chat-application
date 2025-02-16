import React from 'react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

type Type = "newContact" | "newGroup" | "newChat" | "";

const NewContact = ({ setSideBarType }: { setSideBarType: (opr: Type) => void }) => {
  return (
    <div className='w-full  p-3 flex flex-col justify-center items-center'>
      <div className='flex w-full'>
        <svg onClick={() => setSideBarType("")} className='h-11  p-2 cursor-pointer active:Scale-95' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#f6f5f4" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" /></svg>

        <p className='text-3xl font-bold w-max m-auto'>Invite a Friend</p>
      </div>
      <form className='flex flex-col gap-5 w-full my-3'>
        <PhoneInput

          placeholder="Mobile Number"
          country="us"
          containerStyle={{
            display: 'grid',
            gridTemplateColumns: '10% 90%',
            alignItems: 'center',
            width: '100%',
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

        />

        <textarea
          className="w-full p-2 rounded h-64 resize-none outline-none bg-slate-500 font-mono break-words"
          placeholder="Invitation content"
          defaultValue={`🌩️ You're Invited to Thunder! 🌩️
Your friend invites you to join them in Thunder, a moment to cherish and create unforgettable memories together.

🎉 Let’s celebrate friendship, laughter, and joy! 🎉
Come along and make these moments truly precious with your presence.`}
        />

        <div className='flex justify-between'>
          <button type="reset" className="px-4 py-2 rounded-md border border-black bg-white text-black text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200">
            Reset
          </button>
          <button type='submit' className="px-12 py-4 rounded-full bg-[#1ED760] font-bold text-white tracking-widest uppercase transform hover:scale-105 hover:bg-[#21e065] transition-colors duration-200">
            Invite
          </button>
        </div>

      </form>
    </div>
  )
}

export default NewContact
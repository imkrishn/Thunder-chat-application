'use client'

import React, { useState } from 'react'
import ChatBoxNav from './ChatBoxNav'
import ChatBoxMsg from './ChatBoxMsg'
import ChatBoxTool from './ChatBoxTool'
import ChatBoxInfo from './ChatBoxInfo'
import { motion, AnimatePresence } from "framer-motion";


const ChatBox = () => {
  const [infoBox, setInfoBox] = useState(false);
  return (
    <div className='h-screen  overflow-clip relative'>
      <ChatBoxNav setInfoBox={setInfoBox} />

      <div className='flex'>
        <div className='w-full'>
          <ChatBoxMsg />
          <ChatBoxTool />
        </div>
        <AnimatePresence mode="wait">
          {infoBox && (
            <motion.div
              key="box"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.5 }}
              className="w-1/2"
            >
              <ChatBoxInfo setInfoBox={setInfoBox} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ChatBox